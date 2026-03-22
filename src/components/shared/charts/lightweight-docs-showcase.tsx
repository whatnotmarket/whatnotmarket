"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AreaSeries,
  ColorType,
  HistogramSeries,
  LineSeries,
  LineStyle,
  CandlestickSeries,
  createChart,
  createImageWatermark,
  createTextWatermark,
  type CandlestickData,
  type ChartOptions,
  type DeepPartial,
  type HistogramData,
  type IChartApi,
  type LogicalRange,
  type MouseEventParams,
  type SingleValueData,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/ui/card";

type ShowcaseRealtimeConfig = {
  enabled: boolean;
  barTimeStepSeconds: number;
  updateIntervalMs?: number;
};

type LightweightDocsShowcaseProps = {
  realtime: ShowcaseRealtimeConfig;
};

const BASE_CHART_OPTIONS: DeepPartial<ChartOptions> = {
  layout: {
    background: { type: ColorType.Solid, color: "#0f1420" },
    textColor: "#cbd5e1",
    attributionLogo: false,
  },
  grid: {
    vertLines: { color: "rgba(148,163,184,0.08)" },
    horzLines: { color: "rgba(148,163,184,0.08)" },
  },
  rightPriceScale: {
    borderColor: "rgba(148,163,184,0.25)",
  },
  timeScale: {
    borderColor: "rgba(148,163,184,0.25)",
    timeVisible: true,
    secondsVisible: false,
    rightOffset: 8,
    barSpacing: 7,
  },
};

const DEFAULT_UPDATE_INTERVAL_MS = 1000;

function toUnixSeconds(time: Time): number {
  if (typeof time === "number") return time;
  if (typeof time === "string") return Math.floor(new Date(time).getTime() / 1000);
  return Math.floor(Date.UTC(time.year, time.month - 1, time.day) / 1000);
}

function formatPrice(value: number): number {
  return Number(value.toFixed(2));
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function generateLineData(
  points: number,
  startTimeSeconds: number,
  stepSeconds: number,
  startValue: number,
  drift = 0
): SingleValueData<Time>[] {
  const data: SingleValueData<Time>[] = [];
  let value = startValue;
  for (let i = 0; i < points; i += 1) {
    value = Math.max(1, value + randomRange(-2.2, 2.2) + drift);
    data.push({
      time: (startTimeSeconds + i * stepSeconds) as UTCTimestamp,
      value: formatPrice(value),
    });
  }
  return data;
}

function generateCandlestickData(
  points: number,
  startTimeSeconds: number,
  stepSeconds: number,
  startPrice: number
): CandlestickData<Time>[] {
  const data: CandlestickData<Time>[] = [];
  let lastClose = startPrice;

  for (let i = 0; i < points; i += 1) {
    const time = (startTimeSeconds + i * stepSeconds) as UTCTimestamp;
    const open = lastClose;
    const close = formatPrice(Math.max(1, open + randomRange(-3.2, 3.2)));
    const high = formatPrice(Math.max(open, close) + Math.abs(randomRange(0.1, 2.8)));
    const low = formatPrice(Math.max(0.5, Math.min(open, close) - Math.abs(randomRange(0.1, 2.8))));

    data.push({ time, open: formatPrice(open), high, low, close });
    lastClose = close;
  }

  return data;
}

function attachResizeObserver(container: HTMLDivElement, chart: IChartApi, height: number): () => void {
  const resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;
    const width = Math.floor(entry.contentRect.width);
    if (width <= 0) return;
    chart.applyOptions({ width, height });
  });

  resizeObserver.observe(container);
  return () => resizeObserver.disconnect();
}

function RangeSwitcherDemo({ realtime }: { realtime: ShowcaseRealtimeConfig }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedRange, setSelectedRange] = useState<"1D" | "1W" | "1M" | "1Y">("1D");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const now = Math.floor(Date.now() / 1000);
    const seriesData = new Map<"1D" | "1W" | "1M" | "1Y", SingleValueData<Time>[]>([
      ["1D", generateLineData(180, now - 180 * 300, 300, 145)],
      ["1W", generateLineData(180, now - 180 * 3600, 3600, 140)],
      ["1M", generateLineData(180, now - 180 * 86400, 86400, 132)],
      ["1Y", generateLineData(180, now - 180 * 86400 * 7, 86400 * 7, 120)],
    ]);

    const intervalColors: Record<"1D" | "1W" | "1M" | "1Y", string> = {
      "1D": "#2962FF",
      "1W": "rgb(225, 87, 90)",
      "1M": "rgb(242, 142, 44)",
      "1Y": "rgb(164, 89, 209)",
    };

    const chart = createChart(container, {
      ...BASE_CHART_OPTIONS,
      width: container.clientWidth || 1,
      height: 340,
    });

    const lineSeries = chart.addSeries(LineSeries, {
      color: intervalColors[selectedRange],
      lineWidth: 2,
    });

    const setChartInterval = (interval: "1D" | "1W" | "1M" | "1Y") => {
      const nextData = seriesData.get(interval) ?? [];
      lineSeries.setData(nextData);
      lineSeries.applyOptions({ color: intervalColors[interval] });
      chart.timeScale().fitContent();
    };

    setChartInterval(selectedRange);

    let realtimeTimer: ReturnType<typeof setInterval> | null = null;
    if (realtime.enabled) {
      const updateMs = realtime.updateIntervalMs ?? DEFAULT_UPDATE_INTERVAL_MS;
      realtimeTimer = setInterval(() => {
        const currentData = seriesData.get(selectedRange);
        if (!currentData || currentData.length === 0) return;

        const lastPoint = currentData[currentData.length - 1];
        if (typeof lastPoint.value !== "number") return;

        const nextPoint: SingleValueData<Time> = {
          time: (toUnixSeconds(lastPoint.time) + realtime.barTimeStepSeconds) as UTCTimestamp,
          value: formatPrice(Math.max(1, lastPoint.value + randomRange(-1.6, 1.6))),
        };

        currentData.push(nextPoint);
        lineSeries.update(nextPoint);
      }, updateMs);
    }

    const detachResize = attachResizeObserver(container, chart, 340);

    return () => {
      if (realtimeTimer) clearInterval(realtimeTimer);
      detachResize();
      chart.remove();
    };
  }, [selectedRange, realtime.enabled, realtime.barTimeStepSeconds, realtime.updateIntervalMs]);

  return (
    <Card className="border border-slate-800 bg-slate-900/70">
      <CardHeader>
        <CardTitle>Range Switcher</CardTitle>
        <CardDescription>Switch 1D / 1W / 1M / 1Y con cambio dataset e colore serie</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex flex-wrap gap-2">
          {(["1D", "1W", "1M", "1Y"] as const).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setSelectedRange(range)}
              className={`rounded-md border px-2.5 py-1 text-sm transition ${
                selectedRange === range
                  ? "border-sky-500 bg-sky-500/20 text-sky-200"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
        <div ref={containerRef} className="h-[340px] w-full" />
      </CardContent>
    </Card>
  );
}

function LegendAndFloatingTooltipDemo({ realtime }: { realtime: ShowcaseRealtimeConfig }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const now = Math.floor(Date.now() / 1000);
    const data = generateLineData(160, now - 160 * 900, 900, 210);

    const chart = createChart(container, {
      ...BASE_CHART_OPTIONS,
      width: container.clientWidth || 1,
      height: 360,
      rightPriceScale: {
        ...BASE_CHART_OPTIONS.rightPriceScale,
        scaleMargins: { top: 0.3, bottom: 0.25 },
      },
      crosshair: {
        horzLine: { visible: false, labelVisible: false },
        vertLine: { labelVisible: false },
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      topColor: "rgba(41, 98, 255, 0.35)",
      bottomColor: "rgba(41, 98, 255, 0.08)",
      lineColor: "#2962FF",
      lineWidth: 2,
      crosshairMarkerVisible: false,
    });

    areaSeries.setData(data);
    chart.timeScale().fitContent();

    const symbolName = "OPENLY / DEMO";
    const legend = document.createElement("div");
    legend.style.cssText =
      "position:absolute;left:12px;top:10px;z-index:10;font-size:12px;line-height:18px;font-weight:500;color:#e2e8f0;pointer-events:none;";
    legend.innerHTML = `${symbolName} <strong>${data[data.length - 1]?.value ?? ""}</strong>`;
    container.appendChild(legend);

    const toolTip = document.createElement("div");
    toolTip.style.cssText =
      "width:110px;height:auto;position:absolute;display:none;padding:8px;box-sizing:border-box;font-size:12px;text-align:left;z-index:1000;pointer-events:none;border:1px solid #2962FF;border-radius:8px;background:#111827;color:#f8fafc;";
    container.appendChild(toolTip);

    chart.subscribeCrosshairMove((param: MouseEventParams<Time>) => {
      const pointData = param.seriesData.get(areaSeries) as { value?: number; close?: number } | undefined;

      if (
        !param.time ||
        !param.point ||
        param.point.x < 0 ||
        param.point.x > container.clientWidth ||
        param.point.y < 0 ||
        param.point.y > container.clientHeight
      ) {
        toolTip.style.display = "none";
        return;
      }

      const value = pointData?.value ?? pointData?.close;
      if (typeof value !== "number") return;

      legend.innerHTML = `${symbolName} <strong>${value.toFixed(2)}</strong>`;
      toolTip.style.display = "block";
      toolTip.innerHTML = `<div style="color:#93c5fd">${symbolName}</div><div style="font-size:20px;margin:4px 0">${value.toFixed(
        2
      )}</div><div>${String(param.time)}</div>`;

      const coordinateY = areaSeries.priceToCoordinate(value);
      if (coordinateY === null) return;

      const toolTipWidth = 110;
      const toolTipHeight = 88;
      const margin = 14;
      const left = Math.max(0, Math.min(container.clientWidth - toolTipWidth, param.point.x - toolTipWidth / 2));
      const top =
        coordinateY - toolTipHeight - margin > 0
          ? coordinateY - toolTipHeight - margin
          : Math.max(0, Math.min(container.clientHeight - toolTipHeight, coordinateY + margin));

      toolTip.style.left = `${left}px`;
      toolTip.style.top = `${top}px`;
    });

    let realtimeTimer: ReturnType<typeof setInterval> | null = null;
    if (realtime.enabled) {
      const updateMs = realtime.updateIntervalMs ?? DEFAULT_UPDATE_INTERVAL_MS;
      let lastPoint = data[data.length - 1];
      realtimeTimer = setInterval(() => {
        if (!lastPoint || typeof lastPoint.value !== "number") return;
        const nextPoint: SingleValueData<Time> = {
          time: (toUnixSeconds(lastPoint.time) + realtime.barTimeStepSeconds) as UTCTimestamp,
          value: formatPrice(Math.max(1, lastPoint.value + randomRange(-2.1, 2.1))),
        };
        areaSeries.update(nextPoint);
        lastPoint = nextPoint;
        legend.innerHTML = `${symbolName} <strong>${nextPoint.value.toFixed(2)}</strong>`;
      }, updateMs);
    }

    const detachResize = attachResizeObserver(container, chart, 360);

    return () => {
      if (realtimeTimer) clearInterval(realtimeTimer);
      detachResize();
      legend.remove();
      toolTip.remove();
      chart.remove();
    };
  }, [realtime.enabled, realtime.barTimeStepSeconds, realtime.updateIntervalMs]);

  return (
    <Card className="border border-slate-800 bg-slate-900/70">
      <CardHeader>
        <CardTitle>Legend + Floating Tooltip</CardTitle>
        <CardDescription>Legenda HTML custom e tooltip fluttuante su crosshairMove</CardDescription>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="relative h-[360px] w-full" />
      </CardContent>
    </Card>
  );
}

function CompareMultipleSeriesDemo({ realtime }: { realtime: ShowcaseRealtimeConfig }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const now = Math.floor(Date.now() / 1000);
    const oneData = generateLineData(150, now - 150 * 900, 900, 180, 0.05);
    const twoData = generateLineData(150, now - 150 * 900, 900, 140, -0.02);
    const threeData = generateLineData(150, now - 150 * 900, 900, 220, 0);

    const chart = createChart(container, {
      ...BASE_CHART_OPTIONS,
      width: container.clientWidth || 1,
      height: 340,
    });

    const seriesOne = chart.addSeries(LineSeries, { color: "#2962FF", lineWidth: 2 });
    const seriesTwo = chart.addSeries(LineSeries, { color: "rgb(225,87,90)", lineWidth: 2 });
    const seriesThree = chart.addSeries(LineSeries, { color: "rgb(242,142,44)", lineWidth: 2 });

    seriesOne.setData(oneData);
    seriesTwo.setData(twoData);
    seriesThree.setData(threeData);
    chart.timeScale().fitContent();

    let realtimeTimer: ReturnType<typeof setInterval> | null = null;
    if (realtime.enabled) {
      const updateMs = realtime.updateIntervalMs ?? DEFAULT_UPDATE_INTERVAL_MS;
      let lastOne = oneData[oneData.length - 1];
      let lastTwo = twoData[twoData.length - 1];
      let lastThree = threeData[threeData.length - 1];

      realtimeTimer = setInterval(() => {
        if (!lastOne || !lastTwo || !lastThree) return;
        if (typeof lastOne.value !== "number" || typeof lastTwo.value !== "number" || typeof lastThree.value !== "number") return;

        const nextTime = (toUnixSeconds(lastOne.time) + realtime.barTimeStepSeconds) as UTCTimestamp;
        const marketDrift = randomRange(-1.4, 1.4);

        const nextOne: SingleValueData<Time> = {
          time: nextTime,
          value: formatPrice(Math.max(1, lastOne.value + marketDrift + randomRange(-0.5, 0.5))),
        };
        const nextTwo: SingleValueData<Time> = {
          time: nextTime,
          value: formatPrice(Math.max(1, lastTwo.value + marketDrift * 0.7 + randomRange(-0.8, 0.8))),
        };
        const nextThree: SingleValueData<Time> = {
          time: nextTime,
          value: formatPrice(Math.max(1, lastThree.value + marketDrift * 1.2 + randomRange(-1.1, 1.1))),
        };

        seriesOne.update(nextOne);
        seriesTwo.update(nextTwo);
        seriesThree.update(nextThree);

        lastOne = nextOne;
        lastTwo = nextTwo;
        lastThree = nextThree;
      }, updateMs);
    }

    const detachResize = attachResizeObserver(container, chart, 340);
    return () => {
      if (realtimeTimer) clearInterval(realtimeTimer);
      detachResize();
      chart.remove();
    };
  }, [realtime.enabled, realtime.barTimeStepSeconds, realtime.updateIntervalMs]);

  return (
    <Card className="border border-slate-800 bg-slate-900/70">
      <CardHeader>
        <CardTitle>Compare Multiple Series</CardTitle>
        <CardDescription>3 serie line nello stesso chart per confronto diretto</CardDescription>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="h-[340px] w-full" />
      </CardContent>
    </Card>
  );
}

function WatermarkDemo({ realtime }: { realtime: ShowcaseRealtimeConfig }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const now = Math.floor(Date.now() / 1000);
    const data = generateLineData(140, now - 140 * 900, 900, 90);
    const chart = createChart(container, {
      ...BASE_CHART_OPTIONS,
      width: container.clientWidth || 1,
      height: 340,
    });

    createTextWatermark(chart.panes()[0], {
      horzAlign: "center",
      vertAlign: "center",
      lines: [{ text: "OPENLY DEV", color: "rgba(56,189,248,0.25)", fontSize: 24 }],
    });

    const imageSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="80" viewBox="0 0 220 80"><rect width="220" height="80" fill="none"/><text x="50%" y="54%" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="rgba(148,163,184,0.35)">OPENLY</text></svg>`;
    const imageDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(imageSvg)}`;
    createImageWatermark(chart.panes()[0], imageDataUrl, { alpha: 0.6, padding: 14 });

    const areaSeries = chart.addSeries(AreaSeries, {
      topColor: "rgba(14,165,233,0.35)",
      bottomColor: "rgba(14,165,233,0.05)",
      lineColor: "#0ea5e9",
      lineWidth: 2,
    });
    areaSeries.setData(data);
    chart.timeScale().fitContent();

    let realtimeTimer: ReturnType<typeof setInterval> | null = null;
    if (realtime.enabled) {
      const updateMs = realtime.updateIntervalMs ?? DEFAULT_UPDATE_INTERVAL_MS;
      let lastPoint = data[data.length - 1];
      realtimeTimer = setInterval(() => {
        if (!lastPoint || typeof lastPoint.value !== "number") return;
        const nextPoint: SingleValueData<Time> = {
          time: (toUnixSeconds(lastPoint.time) + realtime.barTimeStepSeconds) as UTCTimestamp,
          value: formatPrice(Math.max(1, lastPoint.value + randomRange(-1.2, 1.2))),
        };
        areaSeries.update(nextPoint);
        lastPoint = nextPoint;
      }, updateMs);
    }

    const detachResize = attachResizeObserver(container, chart, 340);
    return () => {
      if (realtimeTimer) clearInterval(realtimeTimer);
      detachResize();
      chart.remove();
    };
  }, [realtime.enabled, realtime.barTimeStepSeconds, realtime.updateIntervalMs]);

  return (
    <Card className="border border-slate-800 bg-slate-900/70">
      <CardHeader>
        <CardTitle>Custom Watermark</CardTitle>
        <CardDescription>Text watermark + image watermark su pane primario</CardDescription>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="h-[340px] w-full" />
      </CardContent>
    </Card>
  );
}

function PriceLinesDemo({ realtime }: { realtime: ShowcaseRealtimeConfig }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const now = Math.floor(Date.now() / 1000);
    const data = generateLineData(130, now - 130 * 900, 900, 74);
    const chart = createChart(container, {
      ...BASE_CHART_OPTIONS,
      width: container.clientWidth || 1,
      height: 340,
    });

    const lineSeries = chart.addSeries(LineSeries, {
      color: "#38bdf8",
      lineWidth: 2,
      lastValueVisible: false,
      priceLineVisible: false,
    });
    lineSeries.setData(data);

    let minPrice = Math.min(...data.map((point) => point.value ?? Number.POSITIVE_INFINITY));
    let maxPrice = Math.max(...data.map((point) => point.value ?? Number.NEGATIVE_INFINITY));
    let avgPrice = (minPrice + maxPrice) / 2;

    const minPriceLine = lineSeries.createPriceLine({
      price: minPrice,
      color: "#ef4444",
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: "min",
    });
    const avgPriceLine = lineSeries.createPriceLine({
      price: avgPrice,
      color: "#f8fafc",
      lineWidth: 2,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: true,
      title: "avg",
    });
    const maxPriceLine = lineSeries.createPriceLine({
      price: maxPrice,
      color: "#22c55e",
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: "max",
    });

    chart.timeScale().fitContent();

    let realtimeTimer: ReturnType<typeof setInterval> | null = null;
    if (realtime.enabled) {
      const updateMs = realtime.updateIntervalMs ?? DEFAULT_UPDATE_INTERVAL_MS;
      let lastPoint = data[data.length - 1];

      realtimeTimer = setInterval(() => {
        if (!lastPoint || typeof lastPoint.value !== "number") return;

        const nextPoint: SingleValueData<Time> = {
          time: (toUnixSeconds(lastPoint.time) + realtime.barTimeStepSeconds) as UTCTimestamp,
          value: formatPrice(Math.max(1, lastPoint.value + randomRange(-1.8, 1.8))),
        };

        lineSeries.update(nextPoint);
        lastPoint = nextPoint;

        minPrice = Math.min(minPrice, nextPoint.value);
        maxPrice = Math.max(maxPrice, nextPoint.value);
        avgPrice = (minPrice + maxPrice) / 2;

        minPriceLine.applyOptions({ price: minPrice });
        avgPriceLine.applyOptions({ price: avgPrice });
        maxPriceLine.applyOptions({ price: maxPrice });
      }, updateMs);
    }

    const detachResize = attachResizeObserver(container, chart, 340);
    return () => {
      if (realtimeTimer) clearInterval(realtimeTimer);
      detachResize();
      chart.remove();
    };
  }, [realtime.enabled, realtime.barTimeStepSeconds, realtime.updateIntervalMs]);

  return (
    <Card className="border border-slate-800 bg-slate-900/70">
      <CardHeader>
        <CardTitle>Add Price Line</CardTitle>
        <CardDescription>Linee min/avg/max con update realtime delle soglie</CardDescription>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="h-[340px] w-full" />
      </CardContent>
    </Card>
  );
}

function InfiniteHistoryDemo({ realtime }: { realtime: ShowcaseRealtimeConfig }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const step = Math.max(realtime.barTimeStepSeconds, 60);
    const now = Math.floor(Date.now() / 1000);
    const allData = generateCandlestickData(1200, now - 1200 * step, step, 210);

    let startIndex = allData.length - 220;
    let loadedData = allData.slice(startIndex);
    let isLoadingHistory = false;

    const chart = createChart(container, {
      ...BASE_CHART_OPTIONS,
      width: container.clientWidth || 1,
      height: 360,
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });
    series.setData(loadedData);
    chart.timeScale().fitContent();

    const onVisibleRangeChange = (logicalRange: LogicalRange | null) => {
      if (!logicalRange || isLoadingHistory) return;
      if (logicalRange.from >= 10 || startIndex <= 0) return;

      isLoadingHistory = true;
      const barsToLoad = Math.min(startIndex, 80);
      const nextStartIndex = startIndex - barsToLoad;

      setTimeout(() => {
        startIndex = nextStartIndex;
        loadedData = allData.slice(startIndex);
        series.setData(loadedData);
        isLoadingHistory = false;
      }, 250);
    };

    chart.timeScale().subscribeVisibleLogicalRangeChange(onVisibleRangeChange);

    let realtimeTimer: ReturnType<typeof setInterval> | null = null;
    if (realtime.enabled) {
      const updateMs = realtime.updateIntervalMs ?? DEFAULT_UPDATE_INTERVAL_MS;
      realtimeTimer = setInterval(() => {
        const lastBar = allData[allData.length - 1];
        if (!lastBar) return;

        const nextTime = (toUnixSeconds(lastBar.time) + step) as UTCTimestamp;
        const open = lastBar.close;
        const close = formatPrice(Math.max(1, open + randomRange(-2.8, 2.8)));
        const high = formatPrice(Math.max(open, close) + Math.abs(randomRange(0.1, 2.2)));
        const low = formatPrice(Math.max(0.5, Math.min(open, close) - Math.abs(randomRange(0.1, 2.2))));

        const nextBar: CandlestickData<Time> = {
          time: nextTime,
          open: formatPrice(open),
          high,
          low,
          close,
        };

        allData.push(nextBar);
        loadedData.push(nextBar);
        series.update(nextBar);
      }, updateMs);
    }

    const detachResize = attachResizeObserver(container, chart, 360);
    return () => {
      if (realtimeTimer) clearInterval(realtimeTimer);
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(onVisibleRangeChange);
      detachResize();
      chart.remove();
    };
  }, [realtime.enabled, realtime.barTimeStepSeconds, realtime.updateIntervalMs]);

  return (
    <Card className="border border-slate-800 bg-slate-900/70">
      <CardHeader>
        <CardTitle>Infinite History</CardTitle>
        <CardDescription>Caricamento progressivo storico quando scrolli a sinistra</CardDescription>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="h-[360px] w-full" />
      </CardContent>
    </Card>
  );
}

function PriceVolumeOverlayDemo({ realtime }: { realtime: ShowcaseRealtimeConfig }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const now = Math.floor(Date.now() / 1000);
    const step = Math.max(realtime.barTimeStepSeconds, 60);
    const priceData = generateLineData(160, now - 160 * step, step, 58);
    const volumeData: HistogramData<Time>[] = priceData.map((point, index) => ({
      time: point.time,
      value: Number((Math.abs(randomRange(2_000_000, 18_000_000)) * (1 + index / 280)).toFixed(2)),
      color: index % 2 === 0 ? "#26a69a" : "#ef5350",
    }));

    const chart = createChart(container, {
      ...BASE_CHART_OPTIONS,
      width: container.clientWidth || 1,
      height: 360,
      rightPriceScale: {
        borderVisible: false,
      },
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      topColor: "rgba(56, 189, 248, 0.35)",
      bottomColor: "rgba(56, 189, 248, 0.07)",
      lineColor: "#38bdf8",
      lineWidth: 2,
    });
    areaSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.1,
        bottom: 0.4,
      },
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#26a69a",
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.7,
        bottom: 0,
      },
    });

    areaSeries.setData(priceData);
    volumeSeries.setData(volumeData);
    chart.timeScale().fitContent();

    let realtimeTimer: ReturnType<typeof setInterval> | null = null;
    if (realtime.enabled) {
      const updateMs = realtime.updateIntervalMs ?? DEFAULT_UPDATE_INTERVAL_MS;
      let lastPrice = priceData[priceData.length - 1];
      realtimeTimer = setInterval(() => {
        if (!lastPrice || typeof lastPrice.value !== "number") return;

        const nextTime = (toUnixSeconds(lastPrice.time) + step) as UTCTimestamp;
        const nextValue = formatPrice(Math.max(1, lastPrice.value + randomRange(-1.4, 1.4)));
        const isUp = nextValue >= lastPrice.value;
        const nextVolume = Number(Math.abs(randomRange(3_000_000, 22_000_000)).toFixed(2));

        const nextPricePoint: SingleValueData<Time> = { time: nextTime, value: nextValue };
        const nextVolumePoint: HistogramData<Time> = {
          time: nextTime,
          value: nextVolume,
          color: isUp ? "#26a69a" : "#ef5350",
        };

        areaSeries.update(nextPricePoint);
        volumeSeries.update(nextVolumePoint);
        lastPrice = nextPricePoint;
      }, updateMs);
    }

    const detachResize = attachResizeObserver(container, chart, 360);
    return () => {
      if (realtimeTimer) clearInterval(realtimeTimer);
      detachResize();
      chart.remove();
    };
  }, [realtime.enabled, realtime.barTimeStepSeconds, realtime.updateIntervalMs]);

  return (
    <Card className="border border-slate-800 bg-slate-900/70">
      <CardHeader>
        <CardTitle>Price + Volume Overlay</CardTitle>
        <CardDescription>Prezzo e volume nello stesso chart con priceScale overlay</CardDescription>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="h-[360px] w-full" />
      </CardContent>
    </Card>
  );
}

export default function LightweightDocsShowcase({ realtime }: LightweightDocsShowcaseProps) {
  const realtimeForExamples = useMemo(
    () => ({
      enabled: realtime.enabled,
      barTimeStepSeconds: realtime.barTimeStepSeconds,
      updateIntervalMs: realtime.updateIntervalMs ?? DEFAULT_UPDATE_INTERVAL_MS,
    }),
    [realtime.enabled, realtime.barTimeStepSeconds, realtime.updateIntervalMs]
  );

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <RangeSwitcherDemo realtime={realtimeForExamples} />
      <LegendAndFloatingTooltipDemo realtime={realtimeForExamples} />
      <CompareMultipleSeriesDemo realtime={realtimeForExamples} />
      <WatermarkDemo realtime={realtimeForExamples} />
      <PriceLinesDemo realtime={realtimeForExamples} />
      <InfiniteHistoryDemo realtime={realtimeForExamples} />
      <div className="xl:col-span-2">
        <PriceVolumeOverlayDemo realtime={realtimeForExamples} />
      </div>
    </section>
  );
}

