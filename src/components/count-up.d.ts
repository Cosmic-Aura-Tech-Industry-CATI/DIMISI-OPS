import type { CSSProperties, ReactElement } from "react";

export default function CountUp(props: {
  to: number;
  from?: number;
  direction?: "up" | "down";
  delay?: number;
  duration?: number;
  className?: string;
  style?: CSSProperties;
  startWhen?: boolean;
  separator?: string;
  prefix?: string;
  suffix?: string;
  mode?: "count" | "roll";
  easing?: "easeOut" | "linear" | "expo" | "spring";
  decimals?: number;
  format?: "standard" | "compact";
  trigger?: "view" | "load";
  replayOnHover?: boolean;
  formatNumber?: (value: number) => string;
  onStart?: () => void;
  onEnd?: () => void;
}): ReactElement;
