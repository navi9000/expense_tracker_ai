import { type Expense, type ExpenseCategory } from "@/lib/expenses";

export type ExportFormat = "csv" | "json" | "pdf";

export type ExportOptions = {
  categories: ExpenseCategory[];
  endDate: string;
  filename: string;
  format: ExportFormat;
  startDate: string;
};

export function filterExpensesForExport(
  expenses: Expense[],
  options: Pick<ExportOptions, "categories" | "endDate" | "startDate">,
) {
  return expenses.filter((expense) => {
    const matchesStart = !options.startDate || expense.date >= options.startDate;
    const matchesEnd = !options.endDate || expense.date <= options.endDate;
    const matchesCategory = options.categories.includes(expense.category);

    return matchesStart && matchesEnd && matchesCategory;
  });
}

export function normalizeFilename(filename: string, format: ExportFormat) {
  const fallback = `expense-export-${new Date().toISOString().slice(0, 10)}`;
  const cleaned = filename
    .trim()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "");

  return `${cleaned || fallback}.${format}`;
}

export function createExportBlob(expenses: Expense[], format: ExportFormat) {
  if (format === "json") {
    return new Blob([JSON.stringify(expenses, null, 2)], {
      type: "application/json;charset=utf-8",
    });
  }

  if (format === "pdf") {
    return new Blob([createPdf(expenses)], { type: "application/pdf" });
  }

  return new Blob([createCsv(expenses)], { type: "text/csv;charset=utf-8" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function createCsv(expenses: Expense[]) {
  const header = ["Date", "Category", "Amount", "Description"];
  const rows = expenses.map((expense) => [
    expense.date,
    expense.category,
    expense.amount.toFixed(2),
    expense.description,
  ]);

  return [header, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");
}

function createPdf(expenses: Expense[]) {
  const baseLines = [
    "Expense Export",
    `Generated: ${new Date().toLocaleDateString("en-US")}`,
    `Records: ${expenses.length}`,
    "",
    "Date        Category          Amount       Description",
    "------------------------------------------------------",
    ...expenses.map(
      (expense) =>
        `${expense.date.padEnd(11)} ${expense.category.padEnd(17)} $${expense.amount
          .toFixed(2)
          .padStart(9)}   ${expense.description}`,
    ),
  ];

  const chunks = chunkLines(baseLines, 42);
  const pageIds = chunks.map((_, index) => 4 + index * 2);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${chunks.length} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  chunks.forEach((chunk, index) => {
    const pageId = pageIds[index];
    const contentId = pageId + 1;
    const content = chunk
      .map((line, lineIndex) => {
        const y = 760 - lineIndex * 16;
        return `BT /F1 10 Tf 48 ${y} Td (${escapePdfText(line)}) Tj ET`;
      })
      .join("\n");
    const stream = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`,
      stream,
    );
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}

function escapePdfText(value: string) {
  return value
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function chunkLines(lines: string[], size: number) {
  const chunks: string[][] = [];

  for (let index = 0; index < lines.length; index += size) {
    chunks.push(lines.slice(index, index + size));
  }

  return chunks.length ? chunks : [[]];
}
