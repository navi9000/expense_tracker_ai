"use client";

import { useEffect, useMemo, useState } from "react";
import { demoExpenses, type Expense } from "@/lib/expenses";

const storageKey = "expense-flow.expenses";

function defer(callback: () => void) {
  window.setTimeout(callback, 0);
}

export function useLocalExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      const loadedExpenses = stored ? JSON.parse(stored) : demoExpenses;
      defer(() => {
        setExpenses(loadedExpenses);
        setIsLoading(false);
      });
    } catch {
      defer(() => {
        setError("Unable to load saved expenses. Demo data is shown instead.");
        setExpenses(demoExpenses);
        setIsLoading(false);
      });
    }
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(expenses));
    } catch {
      defer(() => setError("Unable to save changes in this browser session."));
    }
  }, [expenses, isLoading]);

  return useMemo(
    () => ({
      expenses,
      setExpenses,
      isLoading,
      error,
      setError,
    }),
    [expenses, isLoading, error],
  );
}
