"use client";

import { useEffect, useRef } from "react";
import {
  AreaSeries,
  BarSeries,
  BaselineSeries,
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  LineSeries,
  createChart,
  type AreaSeriesPartialOptions,
  type BarData,
  type BarSeriesPartialOptions,
  type BaselineSeriesPartialOptions,
  type CandlestickData,
  type CandlestickSeriesPartialOptions,
  type ChartOptions,
  type DeepPartial,
  type HistogramData,
  type HistogramSeriesPartialOptions,
  type ISeriesApi,
  type SingleValueData,
  type Time,
  type UTCTimestamp,
  type LineSeriesPartialOptions,
} from "lightweight-charts";

import { cn } from "@/lib/utils";

type BaseChartProps = {
  className?: string;
  height?: number;
  autoFitContent?: boolean;
  fullWidthAtMaxZoom?: boolean;
  chartOptions?: DeepPartial<ChartOptions>;
  trackingTooltip?: {
    enabled: boolean;
    mode?: "tracking" | "floating";
    title?: string;
    subtitleBuilder?: (params: { time: Time; value: number }) => { label: string; value: string } | null;
    widthPx?: number;
    minHeightPx?: number;
    offsetPx?: number;
    borderRadiusPx?: number;
    fontSizePx?: number;
    priceDecimals?: number;
    locale?: string;
    backgroundColor?: string;
    borderColor?: string;
    titleColor?: string;
    valueColor?: string;
    dateColor?: string;
  };
  realtime?: {
    enabled: boolean;
    updateIntervalMs?: number;
    barTimeStepSeconds?: number;
    volatility?: number;
  };
};

type LineChartProps = BaseChartProps & {
  kind: "line";
  data: SingleValueData<Time>[];
  seriesOptions?: LineSeriesPartialOptions;
};

type AreaChartProps = BaseChartProps & {
  kind: "area";
  data: SingleValueData<Time>[];
  seriesOptions?: AreaSeriesPartialOptions;
};

type BaselineChartProps = BaseChartProps & {
  kind: "baseline";
  data: SingleValueData<Time>[];
  seriesOptions?: BaselineSeriesPartialOptions;
};

type BarChartProps = BaseChartProps & {
  kind: "bar";
  data: BarData<Time>[];
  seriesOptions?: BarSeriesPartialOptions;
};

type CandlestickChartProps = BaseChartProps & {
  kind: "candlestick";
  data: CandlestickData<Time>[];
  seriesOptions?: CandlestickSeriesPartialOptions;
};

type HistogramChartProps = BaseChartProps & {
  kind: "histogram";
  data: HistogramData<Time>[];
  seriesOptions?: HistogramSeriesPartialOptions;
};

export type LightweightChartProps =
  | LineChartProps
  | AreaChartProps
  | BaselineChartProps
  | BarChartProps
  | CandlestickChartProps
  | HistogramChartProps;

const DEFAULT_CHART_HEIGHT = 300;

const DEFAULT_CHART_OPTIONS: DeepPartial<ChartOptions> = {
  layout: {
    background: { type: ColorType.Solid, color: "#0b1220" },
    textColor: "#cbd5e1",
    attributionLogo: false,
  },
  grid: {
    vertLines: { color: "rgba(148,163,184,0.08)" },
    horzLines: { color: "rgba(148,163,184,0.08)" },
  },
  rightPriceScale: {
    borderColor: "rgba(148,163,184,0.24)",
  },
  timeScale: {
    borderColor: "rgba(148,163,184,0.24)",
    timeVisible: true,
    secondsVisible: false,
    rightOffset: 8,
    barSpacing: 7,
  },
};

function timeToUnixSeconds(time: Time): number {
  if (typeof time === "number") return time;
  if (typeof time === "string") return Math.floor(new Date(time).getTime() / 1000);
  return Math.floor(Date.UTC(time.year, time.month - 1, time.day) / 1000);
}

function formatPrice(value: number): number {
  return Number(value.toFixed(2));
}

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function sanitizeSingleValueSeriesData<T extends SingleValueData<Time>>(rows: T[]): T[] {
  const byTime = new Map<number, T>();

  for (const row of rows) {
    const unixTime = timeToUnixSeconds(row.time);
    if (!Number.isFinite(unixTime)) continue;
    byTime.set(unixTime, { ...row, time: unixTime as Time } as T);
  }

  return Array.from(byTime.entries())
    .sort((left, right) => left[0] - right[0])
    .map(([, row]) => row);
}

function sanitizeOhlcSeriesData<T extends BarData<Time> | CandlestickData<Time>>(rows: T[]): T[] {
  const byTime = new Map<number, T>();

  for (const row of rows) {
    const unixTime = timeToUnixSeconds(row.time);
    if (!Number.isFinite(unixTime)) continue;
    byTime.set(unixTime, { ...row, time: unixTime as Time } as T);
  }

  return Array.from(byTime.entries())
    .sort((left, right) => left[0] - right[0])
    .map(([, row]) => row);
}

function formatTooltipDate(time: Time, locale: string): string {
  if (typeof time === "number") {
    return new Date(time * 1000).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  }
  if (typeof time === "string") {
    const parsed = new Date(time);
    if (Number.isFinite(parsed.getTime())) {
      return parsed.toLocaleDateString(locale, { year: "numeric", month: "short", day: "2-digit" });
    }
    return time;
  }
  return new Date(Date.UTC(time.year, time.month - 1, time.day)).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function readTooltipValue(data: unknown): number | null {
  if (!data || typeof data !== "object") return null;
  if ("value" in data && typeof (data as { value?: unknown }).value === "number") {
    return (data as { value: number }).value;
  }
  if ("close" in data && typeof (data as { close?: unknown }).close === "number") {
    return (data as { close: number }).close;
  }
  return null;
}

function LightweightChart(props: LightweightChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const {
    className,
    kind,
    data,
    seriesOptions,
    height = DEFAULT_CHART_HEIGHT,
    autoFitContent = true,
    fullWidthAtMaxZoom = false,
    chartOptions,
    trackingTooltip,
    realtime,
  } = props;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      ...DEFAULT_CHART_OPTIONS,
      ...chartOptions,
      width: container.clientWidth || 1,
      height,
    });

    let intervalId: ReturnType<typeof setInterval> | null = null;
    const stepSeconds = realtime?.barTimeStepSeconds ?? 60;
    const volatility = realtime?.volatility ?? 0.015;
    const updateEveryMs = realtime?.updateIntervalMs ?? 1000;

    const startRealtimeSingleSeries = (
      series: ISeriesApi<"Line" | "Area" | "Baseline" | "Histogram", Time>,
      seedData: SingleValueData<Time>[],
      histogramMode: boolean
    ) => {
      const lastPoint = seedData[seedData.length - 1];
      if (!lastPoint || typeof lastPoint.value !== "number") return;

      let lastTime = timeToUnixSeconds(lastPoint.time);
      let lastValue = lastPoint.value;

      intervalId = setInterval(() => {
        const nextTime = (lastTime + stepSeconds) as UTCTimestamp;
        const swing = Math.max(Math.abs(lastValue), 1) * volatility;

        const nextValue = histogramMode
          ? formatPrice(randomInRange(-swing * 2, swing * 2))
          : formatPrice(lastValue + randomInRange(-swing, swing));

        series.update({
          time: nextTime as Time,
          value: nextValue,
        });

        lastTime += stepSeconds;
        lastValue = nextValue;
      }, updateEveryMs);
    };

    const startRealtimeOhlcSeries = (
      series: ISeriesApi<"Bar" | "Candlestick", Time>,
      seedData: BarData<Time>[] | CandlestickData<Time>[]
    ) => {
      const lastBar = seedData[seedData.length - 1];
      if (!lastBar) return;

      let lastTime = timeToUnixSeconds(lastBar.time);
      let lastClose = lastBar.close;

      intervalId = setInterval(() => {
        const nextTime = (lastTime + stepSeconds) as UTCTimestamp;
        const open = lastClose;
        const bodySwing = Math.max(Math.abs(open), 1) * volatility;
        const close = formatPrice(open + randomInRange(-bodySwing, bodySwing));
        const wickUp = Math.abs(randomInRange(0, bodySwing * 0.9));
        const wickDown = Math.abs(randomInRange(0, bodySwing * 0.9));
        const high = formatPrice(Math.max(open, close) + wickUp);
        const low = formatPrice(Math.min(open, close) - wickDown);

        series.update({
          time: nextTime as Time,
          open: formatPrice(open),
          high,
          low,
          close,
        });

        lastTime += stepSeconds;
        lastClose = close;
      }, updateEveryMs);
    };

    let primarySeries:
      | ISeriesApi<"Line", Time>
      | ISeriesApi<"Area", Time>
      | ISeriesApi<"Baseline", Time>
      | ISeriesApi<"Bar", Time>
      | ISeriesApi<"Candlestick", Time>
      | ISeriesApi<"Histogram", Time>
      | null = null;

    let dataPointCount = 0;

    if (kind === "line") {
      const safeData = sanitizeSingleValueSeriesData(data);
      const series = chart.addSeries(LineSeries, seriesOptions);
      series.setData(safeData);
      primarySeries = series;
      dataPointCount = safeData.length;
      if (realtime?.enabled) {
        startRealtimeSingleSeries(series, safeData, false);
      }
    } else if (kind === "area") {
      const safeData = sanitizeSingleValueSeriesData(data);
      const series = chart.addSeries(AreaSeries, seriesOptions);
      series.setData(safeData);
      primarySeries = series;
      dataPointCount = safeData.length;
      if (realtime?.enabled) {
        startRealtimeSingleSeries(series, safeData, false);
      }
    } else if (kind === "baseline") {
      const safeData = sanitizeSingleValueSeriesData(data);
      const series = chart.addSeries(BaselineSeries, seriesOptions);
      series.setData(safeData);
      primarySeries = series;
      dataPointCount = safeData.length;
      if (realtime?.enabled) {
        startRealtimeSingleSeries(series, safeData, false);
      }
    } else if (kind === "bar") {
      const safeData = sanitizeOhlcSeriesData(data);
      const series = chart.addSeries(BarSeries, seriesOptions);
      series.setData(safeData);
      primarySeries = series;
      dataPointCount = safeData.length;
      if (realtime?.enabled) {
        startRealtimeOhlcSeries(series, safeData);
      }
    } else if (kind === "candlestick") {
      const safeData = sanitizeOhlcSeriesData(data);
      const series = chart.addSeries(CandlestickSeries, seriesOptions);
      series.setData(safeData);
      primarySeries = series;
      dataPointCount = safeData.length;
      if (realtime?.enabled) {
        startRealtimeOhlcSeries(series, safeData);
      }
    } else if (kind === "histogram") {
      const safeData = sanitizeSingleValueSeriesData(data);
      const series = chart.addSeries(HistogramSeries, seriesOptions);
      series.setData(safeData);
      primarySeries = series;
      dataPointCount = safeData.length;
      if (realtime?.enabled) {
        startRealtimeSingleSeries(series, safeData, true);
      }
    }

    const applyFullWidthAtMaxZoom = (widthPx: number) => {
      if (!fullWidthAtMaxZoom || dataPointCount < 2 || widthPx <= 0) return;
      try {
        chart.timeScale().applyOptions({
          rightOffset: 0,
          rightOffsetPixels: 0,
          fixLeftEdge: true,
          fixRightEdge: true,
        });
      } catch {
        // Avoid crashing UI if chart library rejects transient timescale states.
      }
    };

    let tooltipEl: HTMLDivElement | null = null;
    let crosshairHandler:
      | ((param: {
          time?: Time;
          point?: { x: number; y: number };
          seriesData: Map<unknown, unknown>;
        }) => void)
      | null = null;

    if (trackingTooltip?.enabled && primarySeries) {
      const mode = trackingTooltip.mode ?? "tracking";
      const locale = trackingTooltip.locale || "en-US";
      const width = trackingTooltip.widthPx ?? 126;
      const minHeight = trackingTooltip.minHeightPx ?? 86;
      const offset = trackingTooltip.offsetPx ?? 12;
      const borderRadius = trackingTooltip.borderRadiusPx ?? 8;
      const fontSize = trackingTooltip.fontSizePx ?? 12;
      const decimals = trackingTooltip.priceDecimals ?? 2;
      const title = trackingTooltip.title || "Data";
      const subtitleBuilder = trackingTooltip.subtitleBuilder;
      const bg = trackingTooltip.backgroundColor || "#0f1317";
      const border = trackingTooltip.borderColor || "rgba(0,210,168,0.72)";
      const titleColor = trackingTooltip.titleColor || "#9bf6cf";
      const valueColor = trackingTooltip.valueColor || "#ffffff";
      const dateColor = trackingTooltip.dateColor || "#a9b4c2";

      const computedPosition = window.getComputedStyle(container).position;
      if (computedPosition === "static") {
        container.style.position = "relative";
      }

      tooltipEl = document.createElement("div");
      tooltipEl.style.position = "absolute";
      tooltipEl.style.display = "none";
      tooltipEl.style.width = `${width}px`;
      tooltipEl.style.minHeight = `${minHeight}px`;
      tooltipEl.style.pointerEvents = "none";
      tooltipEl.style.zIndex = "5";
      tooltipEl.style.padding = "8px 10px";
      tooltipEl.style.boxSizing = "border-box";
      tooltipEl.style.border = `1px solid ${border}`;
      tooltipEl.style.borderRadius = `${borderRadius}px`;
      tooltipEl.style.background = bg;
      tooltipEl.style.fontSize = `${fontSize}px`;
      tooltipEl.style.fontFamily =
        "-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif";
      tooltipEl.style.backdropFilter = "blur(4px)";
      container.appendChild(tooltipEl);

      crosshairHandler = (param) => {
        if (!tooltipEl || !primarySeries) return;
        const point = param.point;
        if (!point || !param.time || point.x < 0 || point.y < 0 || point.x > container.clientWidth || point.y > container.clientHeight) {
          tooltipEl.style.display = "none";
          return;
        }

        const rowData = param.seriesData.get(primarySeries);
        const value = readTooltipValue(rowData);
        if (value === null) {
          tooltipEl.style.display = "none";
          return;
        }

        const price = value.toFixed(decimals);
        const dateLabel = formatTooltipDate(param.time, locale);
        const subtitle = subtitleBuilder ? subtitleBuilder({ time: param.time, value }) : null;
        const subtitleHtml = subtitle
          ? `<div style="color:${dateColor};margin-top:4px;">${subtitle.label}: ${subtitle.value}</div>`
          : "";
        tooltipEl.innerHTML = `<div style="color:${titleColor};font-weight:600;">${title}</div>
<div style="color:${valueColor};font-size:${fontSize + 10}px;line-height:1.2;margin-top:4px;">${price}</div>
${subtitleHtml}
<div style="color:${dateColor};margin-top:4px;">${dateLabel}</div>`;
        tooltipEl.style.display = "block";

        const renderedHeight = tooltipEl.offsetHeight || minHeight;
        let left = 0;
        let top = 0;

        if (mode === "floating") {
          const coordinate = primarySeries.priceToCoordinate(value);
          if (coordinate === null) {
            tooltipEl.style.display = "none";
            return;
          }

          left = point.x - width / 2;
          if (left < 0) left = 0;
          if (left > container.clientWidth - width) left = container.clientWidth - width;

          if (coordinate - renderedHeight - offset > 0) {
            top = coordinate - renderedHeight - offset;
          } else {
            top = coordinate + offset;
          }
          if (top < 0) top = 0;
          if (top > container.clientHeight - renderedHeight) {
            top = container.clientHeight - renderedHeight;
          }
        } else {
          left = point.x + offset;
          if (left > container.clientWidth - width) {
            left = point.x - offset - width;
          }
          top = point.y + offset;
          if (top > container.clientHeight - renderedHeight) {
            top = point.y - renderedHeight - offset;
          }
        }
        tooltipEl.style.left = `${Math.max(0, left)}px`;
        tooltipEl.style.top = `${Math.max(0, top)}px`;
      };

      chart.subscribeCrosshairMove(crosshairHandler);
    }

    if (autoFitContent && dataPointCount > 0) {
      try {
        chart.timeScale().fitContent();
      } catch {
        // Avoid crashing UI during transient empty/invalid logical range states.
      }
    }
    applyFullWidthAtMaxZoom(container.clientWidth || 1);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const nextWidth = Math.floor(entry.contentRect.width);
      if (!Number.isFinite(nextWidth) || nextWidth <= 0) return;

      chart.applyOptions({ width: nextWidth, height });
      applyFullWidthAtMaxZoom(nextWidth);
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
      if (crosshairHandler) {
        chart.unsubscribeCrosshairMove(crosshairHandler);
      }
      if (tooltipEl && tooltipEl.parentElement === container) {
        container.removeChild(tooltipEl);
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
      chart.remove();
    };
  }, [
    kind,
    data,
    seriesOptions,
    height,
    autoFitContent,
    fullWidthAtMaxZoom,
    chartOptions,
    trackingTooltip?.enabled,
    trackingTooltip?.mode,
    trackingTooltip?.title,
    trackingTooltip?.subtitleBuilder,
    trackingTooltip?.widthPx,
    trackingTooltip?.minHeightPx,
    trackingTooltip?.offsetPx,
    trackingTooltip?.borderRadiusPx,
    trackingTooltip?.fontSizePx,
    trackingTooltip?.priceDecimals,
    trackingTooltip?.locale,
    trackingTooltip?.backgroundColor,
    trackingTooltip?.borderColor,
    trackingTooltip?.titleColor,
    trackingTooltip?.valueColor,
    trackingTooltip?.dateColor,
    realtime?.enabled,
    realtime?.updateIntervalMs,
    realtime?.barTimeStepSeconds,
    realtime?.volatility,
  ]);

  return <div ref={containerRef} className={cn("h-full w-full min-w-0", className)} />;
}

export default LightweightChart;
