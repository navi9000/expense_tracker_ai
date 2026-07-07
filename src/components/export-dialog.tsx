"use client";

import { useMemo, useState } from "react";
import {
  categories,
  type Expense,
  type ExpenseCategory,
} from "@/lib/expenses";
import {
  createExportBlob,
  downloadBlob,
  filterExpensesForExport,
  normalizeFilename,
  type ExportFormat,
} from "@/lib/exporters";
import { formatCurrency, formatDate } from "@/lib/format";

type ExportDialogProps = {
  expenses: Expense[];
  isOpen: boolean;
  onClose: () => void;
  onExportComplete: (message: string) => void;
};

const formatOptions: Array<{ label: string; value: ExportFormat }> = [
  { label: "CSV", value: "csv" },
  { label: "JSON", value: "json" },
  { label: "PDF", value: "pdf" },
];

export function ExportDialog({
  expenses,
  isOpen,
  onClose,
  onExportComplete,
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<
    ExpenseCategory[]
  >([...categories]);
  const [filename, setFilename] = useState("expense-export");
  const [isExporting, setIsExporting] = useState(false);

  const exportRows = useMemo(
    () =>
      filterExpensesForExport(expenses, {
        categories: selectedCategories,
        endDate,
        startDate,
      }),
    [expenses, selectedCategories, endDate, startDate],
  );
  const previewRows = exportRows.slice(0, 6);
  const exportTotal = exportRows.reduce(
    (total, expense) => total + expense.amount,
    0,
  );
  const canExport = exportRows.length > 0 && selectedCategories.length > 0;

  if (!isOpen) {
    return null;
  }

  function toggleCategory(category: ExpenseCategory) {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  }

  function handleExport() {
    if (!canExport || isExporting) {
      return;
    }

    setIsExporting(true);
    window.setTimeout(() => {
      const blob = createExportBlob(exportRows, format);
      const safeFilename = normalizeFilename(filename, format);
      downloadBlob(blob, safeFilename);
      setIsExporting(false);
      onExportComplete(
        `Exported ${exportRows.length} ${exportRows.length === 1 ? "record" : "records"} as ${format.toUpperCase()}.`,
      );
      onClose();
    }, 450);
  }

  return (
    <div
      aria-labelledby="export-dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm"
      role="dialog"
    >
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              Data export
            </p>
            <h2 className="mt-1 text-xl font-semibold" id="export-dialog-title">
              Configure export package
            </h2>
          </div>
          <button className="button ghost" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="grid max-h-[calc(92vh-78px)] overflow-y-auto lg:grid-cols-[360px_1fr]">
          <section className="grid gap-5 border-b border-slate-200 p-5 lg:border-b-0 lg:border-r">
            <div className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">
                Format
              </span>
              <div className="grid grid-cols-3 gap-2">
                {formatOptions.map((option) => (
                  <button
                    className={`export-format-button ${
                      format === option.value ? "selected" : ""
                    }`}
                    key={option.value}
                    onClick={() => setFormat(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Start date
                </span>
                <input
                  className="input"
                  onChange={(event) => setStartDate(event.target.value)}
                  type="date"
                  value={startDate}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  End date
                </span>
                <input
                  className="input"
                  onChange={(event) => setEndDate(event.target.value)}
                  type="date"
                  value={endDate}
                />
              </label>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-700">
                  Categories
                </span>
                <button
                  className="text-sm font-semibold text-teal-700"
                  onClick={() =>
                    setSelectedCategories(
                      selectedCategories.length === categories.length
                        ? []
                        : [...categories],
                    )
                  }
                >
                  {selectedCategories.length === categories.length
                    ? "Clear all"
                    : "Select all"}
                </button>
              </div>
              <div className="grid gap-2">
                {categories.map((category) => (
                  <label
                    className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium"
                    key={category}
                  >
                    <input
                      checked={selectedCategories.includes(category)}
                      onChange={() => toggleCategory(category)}
                      type="checkbox"
                    />
                    {category}
                  </label>
                ))}
              </div>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">
                Filename
              </span>
              <input
                className="input"
                onChange={(event) => setFilename(event.target.value)}
                placeholder="expense-export"
                type="text"
                value={filename}
              />
            </label>
          </section>

          <section className="grid gap-5 p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <ExportMetric label="Records" value={String(exportRows.length)} />
              <ExportMetric label="Total" value={formatCurrency(exportTotal)} />
              <ExportMetric
                label="File"
                value={normalizeFilename(filename, format)}
              />
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold">Preview</h3>
                  <p className="text-sm text-slate-500">
                    Showing up to 6 records from the export set.
                  </p>
                </div>
              </div>

              {previewRows.length ? (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="px-3 py-3">Date</th>
                        <th className="px-3 py-3">Category</th>
                        <th className="px-3 py-3 text-right">Amount</th>
                        <th className="px-3 py-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewRows.map((expense) => (
                        <tr key={expense.id}>
                          <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                            {formatDate(expense.date)}
                          </td>
                          <td className="px-3 py-3 font-medium">
                            {expense.category}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-right font-semibold">
                            {formatCurrency(expense.amount)}
                          </td>
                          <td className="min-w-48 px-3 py-3">
                            {expense.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
                  <h3 className="font-semibold">No records match</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Adjust the date range or category selection.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                {canExport
                  ? `${exportRows.length} records are ready for export.`
                  : "Choose at least one matching record to export."}
              </p>
              <button
                className="button primary min-w-36"
                disabled={!canExport || isExporting}
                onClick={handleExport}
              >
                {isExporting ? "Preparing..." : "Export file"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function ExportMetric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-lg font-semibold">{value}</p>
    </article>
  );
}
