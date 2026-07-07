export const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

export function formatDate(date: string) {
  return dateFormatter.format(new Date(`${date}T00:00:00`));
}
