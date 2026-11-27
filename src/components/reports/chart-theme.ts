/** Shared chart palette + axis/tooltip styling for the admin reports module. */
export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

export const ACCENT = "var(--chart-1)";
export const GRID_STROKE = "var(--border)";

export const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
};

export const axisStyle = { stroke: "var(--muted-foreground)", fontSize: 11 };

export const chartColorAt = (index: number) =>
  CHART_COLORS[index % CHART_COLORS.length];
