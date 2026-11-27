import CountUp from "./count-up";

interface MetricValueProps {
  value: string | number;
  formatNumber?: (value: number) => string;
}

export function MetricValue({ value, formatNumber }: MetricValueProps) {
  if (formatNumber) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return <>{formatNumber(numeric)}</>;
    return <CountUp to={numeric} duration={1} formatNumber={formatNumber} />;
  }

  if (typeof value === "number") {
    return Number.isFinite(value)
      ? <CountUp to={value} duration={1} />
      : <>{String(value)}</>;
  }

  const ratio = /^(\d+) \/ (\d+)$/.exec(value);
  if (ratio) {
    return <><MetricValue value={ratio[1]} /> / <MetricValue value={ratio[2]} /></>;
  }

  // Shared cards also display status labels and loading placeholders.
  const match = /^([+#]?)(-?(?:0|[1-9]\d*|[1-9]\d{0,2}(?:,\d{3})+))(\.\d+)?(%|×| (?:d|day|days|pts|tasks)|)$/.exec(value);
  if (!match) return <>{value}</>;

  const [, prefix, integer, fraction = "", suffix] = match;
  const to = Number(integer.replaceAll(",", "") + fraction);
  const decimals = Math.max(0, fraction.length - 1);
  if (!Number.isSafeInteger(Math.round(to * 10 ** decimals))) return <>{value}</>;
  return <CountUp to={to} prefix={prefix} suffix={suffix} separator={integer.includes(",") ? "," : ""} decimals={decimals} duration={1} />;
}

export const localizedNumber = (value: number) => value.toLocaleString();
