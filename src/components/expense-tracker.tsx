"use client";

import { FormEvent, useMemo, useState } from "react";
import { useLocalExpenses } from "@/hooks/use-local-expenses";
import {
  categories,
  categoryColors,
  createExpense,
  defaultExpenseFormValues,
  exportExpensesToCsv,
  filterExpenses,
  getExpenseStats,
  sortExpensesByDate,
  validateExpense,
  type Expense,
  type ExpenseCategory,
  type ExpenseFilters,
  type ExpenseFormValues,
} from "@/lib/expenses";
import { formatCurrency, formatDate } from "@/lib/format";

const initialFilters: ExpenseFilters = {
  search: "",
  category: "All",
  startDate: "",
  endDate: "",
};

export function ExpenseTracker() {
  const { expenses, setExpenses, isLoading, error, setError } =
    useLocalExpenses();
  const [formValues, setFormValues] = useState(defaultExpenseFormValues);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof ExpenseFormValues, string>>
  >({});
  const [filters, setFilters] = useState<ExpenseFilters>(initialFilters);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("Ready to track your next expense.");

  const visibleExpenses = useMemo(
    () => sortExpensesByDate(filterExpenses(expenses, filters)),
    [expenses, filters],
  );
  const stats = useMemo(() => getExpenseStats(visibleExpenses), [visibleExpenses]);
  const maxCategorySpend = Math.max(
    ...stats.byCategory.map((item) => item.amount),
    1,
  );

  function resetForm() {
    setFormValues(defaultExpenseFormValues);
    setFormErrors({});
    setEditingId(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateExpense(formValues);
    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setNotice("Check the highlighted fields and try again.");
      return;
    }

    if (editingId) {
      setExpenses((current) =>
        current.map((expense) =>
          expense.id === editingId
            ? {
                ...expense,
                ...formValues,
                amount: Number(formValues.amount),
                description: formValues.description.trim(),
              }
            : expense,
        ),
      );
      setNotice("Expense updated.");
    } else {
      setExpenses((current) => [createExpense(formValues), ...current]);
      setNotice("Expense added.");
    }

    resetForm();
  }

  function editExpense(expense: Expense) {
    setEditingId(expense.id);
    setFormValues({
      date: expense.date,
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
    });
    setFormErrors({});
    setNotice("Editing selected expense.");
  }

  function deleteExpense(expenseId: string) {
    setExpenses((current) => current.filter((expense) => expense.id !== expenseId));
    if (editingId === expenseId) {
      resetForm();
    }
    setNotice("Expense deleted.");
  }

  function exportCsv() {
    if (!expenses.length) {
      setNotice("No expenses to export.");
      return;
    }

    const csv = exportExpensesToCsv(sortExpensesByDate(expenses));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("CSV export downloaded.");
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="h-28 animate-pulse rounded-lg bg-white shadow-sm" />
          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div
                className="h-32 animate-pulse rounded-lg bg-white shadow-sm"
                key={item}
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
              ExpenseFlow
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Personal expense tracker
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Track spending, review category trends, and export filtered records
              without sending your data off-device.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="button secondary" onClick={() => setFilters(initialFilters)}>
              Reset filters
            </button>
            <button className="button primary" onClick={exportCsv}>
              Export Data
            </button>
          </div>
        </header>

        {(error || notice) && (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
            {error && (
              <button
                className="mr-3 font-medium text-red-700"
                onClick={() => setError(null)}
              >
                {error}
              </button>
            )}
            <span className="text-slate-600">{notice}</span>
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Total spending" value={formatCurrency(stats.total)} />
          <SummaryCard
            label="This month"
            value={formatCurrency(stats.monthly)}
          />
          <SummaryCard
            label="Top category"
            value={stats.topCategory.amount ? stats.topCategory.category : "None"}
          />
          <SummaryCard
            label="Average entry"
            value={formatCurrency(stats.dailyAverage)}
          />
        </section>

        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingId ? "Edit expense" : "Add expense"}
                </h2>
                <p className="text-sm text-slate-500">
                  Required fields are validated before saving.
                </p>
              </div>
              {editingId && (
                <button className="button ghost" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>

            <form className="grid gap-4" onSubmit={handleSubmit}>
              <Field label="Date" error={formErrors.date}>
                <input
                  className="input"
                  max="9999-12-31"
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      date: event.target.value,
                    }))
                  }
                  type="date"
                  value={formValues.date}
                />
              </Field>

              <Field label="Amount" error={formErrors.amount}>
                <input
                  className="input"
                  min="0"
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      amount: Number(event.target.value),
                    }))
                  }
                  placeholder="0.00"
                  step="0.01"
                  type="number"
                  value={formValues.amount || ""}
                />
              </Field>

              <Field label="Category" error={formErrors.category}>
                <select
                  className="input"
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      category: event.target.value as ExpenseCategory,
                    }))
                  }
                  value={formValues.category}
                >
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </Field>

              <Field label="Description" error={formErrors.description}>
                <input
                  className="input"
                  maxLength={80}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Groceries, rent, train ticket..."
                  type="text"
                  value={formValues.description}
                />
              </Field>

              <button className="button primary w-full" type="submit">
                {editingId ? "Save changes" : "Add expense"}
              </button>
            </form>
          </section>

          <section className="grid gap-6">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Spending analytics</h2>
                  <p className="text-sm text-slate-500">
                    Based on the currently visible expenses.
                  </p>
                </div>
                <span className="text-sm font-medium text-slate-600">
                  {visibleExpenses.length} matching records
                </span>
              </div>
              <div className="grid gap-3">
                {stats.byCategory.map((item) => (
                  <div className="grid gap-2" key={item.category}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.category}</span>
                      <span className="text-slate-600">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(item.amount / maxCategorySpend) * 100}%`,
                          backgroundColor: categoryColors[item.category],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Expenses</h2>
                  <p className="text-sm text-slate-500">
                    Search, filter, edit, or delete saved entries.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  <input
                    className="input"
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        search: event.target.value,
                      }))
                    }
                    placeholder="Search"
                    type="search"
                    value={filters.search}
                  />
                  <select
                    className="input"
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        category: event.target.value as ExpenseFilters["category"],
                      }))
                    }
                    value={filters.category}
                  >
                    <option>All</option>
                    {categories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                  <input
                    className="input"
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        startDate: event.target.value,
                      }))
                    }
                    type="date"
                    value={filters.startDate}
                  />
                  <input
                    className="input"
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        endDate: event.target.value,
                      }))
                    }
                    type="date"
                    value={filters.endDate}
                  />
                </div>
              </div>

              {visibleExpenses.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead>
                      <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="py-3 pr-4">Date</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="py-3 pl-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visibleExpenses.map((expense) => (
                        <tr key={expense.id}>
                          <td className="whitespace-nowrap py-4 pr-4 text-slate-600">
                            {formatDate(expense.date)}
                          </td>
                          <td className="min-w-48 px-4 py-4 font-medium">
                            {expense.description}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className="category-pill"
                              style={{
                                color: categoryColors[expense.category],
                                backgroundColor: `${categoryColors[expense.category]}14`,
                              }}
                            >
                              {expense.category}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-right font-semibold">
                            {formatCurrency(expense.amount)}
                          </td>
                          <td className="whitespace-nowrap py-4 pl-4 text-right">
                            <button
                              className="table-action"
                              onClick={() => editExpense(expense)}
                            >
                              Edit
                            </button>
                            <button
                              className="table-action text-red-700"
                              onClick={() => deleteExpense(expense.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
                  <h3 className="text-base font-semibold">No expenses found</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Adjust filters or add a new expense to start tracking.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
    </article>
  );
}

function Field({
  children,
  error,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error && <span className="text-sm font-medium text-red-700">{error}</span>}
    </label>
  );
}
