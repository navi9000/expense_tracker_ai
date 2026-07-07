export const categories = [
  "Food",
  "Transportation",
  "Entertainment",
  "Shopping",
  "Bills",
  "Other",
] as const;

export type ExpenseCategory = (typeof categories)[number];

export type Expense = {
  id: string;
  date: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
};

export type ExpenseFormValues = Omit<Expense, "id">;

export type ExpenseFilters = {
  search: string;
  category: "All" | ExpenseCategory;
  startDate: string;
  endDate: string;
};

export const categoryColors: Record<ExpenseCategory, string> = {
  Food: "#0f766e",
  Transportation: "#2563eb",
  Entertainment: "#7c3aed",
  Shopping: "#db2777",
  Bills: "#c2410c",
  Other: "#475569",
};

export const defaultExpenseFormValues: ExpenseFormValues = {
  date: new Date().toISOString().slice(0, 10),
  amount: 0,
  category: "Food",
  description: "",
};

export const demoExpenses: Expense[] = [
  {
    id: "demo-1",
    date: new Date().toISOString().slice(0, 10),
    amount: 34.8,
    category: "Food",
    description: "Lunch and coffee",
  },
  {
    id: "demo-2",
    date: new Date(new Date().setDate(new Date().getDate() - 2))
      .toISOString()
      .slice(0, 10),
    amount: 68,
    category: "Transportation",
    description: "Fuel refill",
  },
  {
    id: "demo-3",
    date: new Date(new Date().setDate(new Date().getDate() - 7))
      .toISOString()
      .slice(0, 10),
    amount: 126.45,
    category: "Bills",
    description: "Internet and utilities",
  },
  {
    id: "demo-4",
    date: new Date(new Date().setDate(new Date().getDate() - 12))
      .toISOString()
      .slice(0, 10),
    amount: 89.99,
    category: "Shopping",
    description: "Workspace supplies",
  },
];

export function createExpense(values: ExpenseFormValues): Expense {
  return {
    ...values,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    amount: Number(values.amount),
    description: values.description.trim(),
  };
}

export function filterExpenses(expenses: Expense[], filters: ExpenseFilters) {
  const normalizedSearch = filters.search.trim().toLowerCase();

  return expenses.filter((expense) => {
    const matchesSearch =
      !normalizedSearch ||
      expense.description.toLowerCase().includes(normalizedSearch) ||
      expense.category.toLowerCase().includes(normalizedSearch);
    const matchesCategory =
      filters.category === "All" || expense.category === filters.category;
    const matchesStart = !filters.startDate || expense.date >= filters.startDate;
    const matchesEnd = !filters.endDate || expense.date <= filters.endDate;

    return matchesSearch && matchesCategory && matchesStart && matchesEnd;
  });
}

export function sortExpensesByDate(expenses: Expense[]) {
  return [...expenses].sort((a, b) => b.date.localeCompare(a.date));
}

export function getExpenseStats(expenses: Expense[]) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const monthly = expenses
    .filter((expense) => expense.date.startsWith(currentMonth))
    .reduce((sum, expense) => sum + expense.amount, 0);
  const byCategory = categories.map((category) => {
    const amount = expenses
      .filter((expense) => expense.category === category)
      .reduce((sum, expense) => sum + expense.amount, 0);

    return { category, amount };
  });
  const topCategory = [...byCategory].sort((a, b) => b.amount - a.amount)[0];
  const dailyAverage = expenses.length ? total / expenses.length : 0;

  return {
    total,
    monthly,
    byCategory,
    topCategory,
    dailyAverage,
  };
}

export function exportExpensesToCsv(expenses: Expense[]) {
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

export function validateExpense(values: ExpenseFormValues) {
  const errors: Partial<Record<keyof ExpenseFormValues, string>> = {};

  if (!values.date) {
    errors.date = "Choose a date.";
  }

  if (!Number.isFinite(Number(values.amount)) || Number(values.amount) <= 0) {
    errors.amount = "Enter an amount greater than zero.";
  }

  if (!categories.includes(values.category)) {
    errors.category = "Choose a valid category.";
  }

  if (!values.description.trim()) {
    errors.description = "Add a short description.";
  }

  if (values.description.trim().length > 80) {
    errors.description = "Keep descriptions under 80 characters.";
  }

  return errors;
}
