/** Shared chart palette + axis/tooltip styling for the admin reports module. */
export const CHART_COLORS = [
  "oklch(0.72 0.19 45)",
  "oklch(0.68 0.16 265)",
  "oklch(0.72 0.16 165)",
  "oklch(0.78 0.16 85)",
  "oklch(0.68 0.18 320)",
  "oklch(0.7 0.15 200)",
];

export const ACCENT = "oklch(0.72 0.19 45)";
export const GRID_STROKE = "oklch(0.28 0 0)";

export const tooltipStyle = {
  background: "oklch(0.18 0 0)",
  border: "1px solid oklch(0.28 0 0)",
  borderRadius: 12,
  fontSize: 12,
};

export const axisStyle = { stroke: "oklch(0.65 0 0)", fontSize: 11 };

export const chartColorAt = (index: number) =>
  CHART_COLORS[index % CHART_COLORS.length];
