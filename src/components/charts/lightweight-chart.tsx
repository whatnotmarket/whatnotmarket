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
  chartOptions?: DeepPartial<ChartOptions>;
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

function LightweightChart(props: LightweightChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const {
    className,
    kind,
    data,
    seriesOptions,
    height = DEFAULT_CHART_HEIGHT,
    autoFitContent = true,
    chartOptions,
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

    if (kind === "line") {
      const series = chart.addSeries(LineSeries, seriesOptions);
      series.setData(data);
      if (realtime?.enabled) {
        startRealtimeSingleSeries(series, data, false);
      }
    } else if (kind === "area") {
      const series = chart.addSeries(AreaSeries, seriesOptions);
      series.setData(data);
      if (realtime?.enabled) {
        startRealtimeSingleSeries(series, data, false);
      }
    } else if (kind === "baseline") {
      const series = chart.addSeries(BaselineSeries, seriesOptions);
      series.setData(data);
      if (realtime?.enabled) {
        startRealtimeSingleSeries(series, data, false);
      }
    } else if (kind === "bar") {
      const series = chart.addSeries(BarSeries, seriesOptions);
      series.setData(data);
      if (realtime?.enabled) {
        startRealtimeOhlcSeries(series, data);
      }
    } else if (kind === "candlestick") {
      const series = chart.addSeries(CandlestickSeries, seriesOptions);
      series.setData(data);
      if (realtime?.enabled) {
        startRealtimeOhlcSeries(series, data);
      }
    } else if (kind === "histogram") {
      const series = chart.addSeries(HistogramSeries, seriesOptions);
      series.setData(data);
      if (realtime?.enabled) {
        startRealtimeSingleSeries(series, data, true);
      }
    }

    if (autoFitContent) {
      chart.timeScale().fitContent();
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const nextWidth = Math.floor(entry.contentRect.width);
      if (!Number.isFinite(nextWidth) || nextWidth <= 0) return;

      chart.applyOptions({ width: nextWidth, height });
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
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
    chartOptions,
    realtime?.enabled,
    realtime?.updateIntervalMs,
    realtime?.barTimeStepSeconds,
    realtime?.volatility,
  ]);

  return <div ref={containerRef} className={cn("h-full w-full min-w-0", className)} />;
}

export default LightweightChart;
