"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Crosshair,
  Eye,
  Layers,
  Lock,
  Magnet,
  Minus,
  Move,
  Pencil,
  Plus,
  Ruler,
  Share2,
  SlidersHorizontal,
  Smile,
  Trash2,
  Type,
  Workflow,
} from "lucide-react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  LineStyle,
  createChart,
  type BarData,
  type CandlestickData,
  type HistogramData,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type MouseEventParams,
  type SingleValueData,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";

import LightweightChart from "@/components/shared/charts/lightweight-chart";
import LightweightDocsShowcase from "@/components/shared/charts/lightweight-docs-showcase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/ui/card";

const lineLikeData: SingleValueData<Time>[] = [
  { time: "2026-01-01", value: 102 },
  { time: "2026-01-02", value: 104 },
  { time: "2026-01-03", value: 101 },
  { time: "2026-01-04", value: 109 },
  { time: "2026-01-05", value: 106 },
  { time: "2026-01-06", value: 112 },
  { time: "2026-01-07", value: 115 },
  { time: "2026-01-08", value: 111 },
  { time: "2026-01-09", value: 118 },
  { time: "2026-01-10", value: 121 },
];

const ohlcData: BarData<Time>[] = [
  { time: "2026-01-01", open: 100, high: 106, low: 98, close: 104 },
  { time: "2026-01-02", open: 104, high: 108, low: 102, close: 103 },
  { time: "2026-01-03", open: 103, high: 110, low: 101, close: 109 },
  { time: "2026-01-04", open: 109, high: 113, low: 104, close: 106 },
  { time: "2026-01-05", open: 106, high: 112, low: 103, close: 111 },
  { time: "2026-01-06", open: 111, high: 116, low: 108, close: 115 },
  { time: "2026-01-07", open: 115, high: 119, low: 112, close: 113 },
  { time: "2026-01-08", open: 113, high: 117, low: 110, close: 116 },
  { time: "2026-01-09", open: 116, high: 121, low: 114, close: 119 },
  { time: "2026-01-10", open: 119, high: 124, low: 117, close: 122 },
];

const candlestickData: CandlestickData<Time>[] = ohlcData.map((bar) => ({ ...bar }));

const histogramData: HistogramData<Time>[] = [
  { time: "2026-01-01", value: 34, color: "#22c55e" },
  { time: "2026-01-02", value: 12, color: "#22c55e" },
  { time: "2026-01-03", value: -8, color: "#ef4444" },
  { time: "2026-01-04", value: 20, color: "#22c55e" },
  { time: "2026-01-05", value: -14, color: "#ef4444" },
  { time: "2026-01-06", value: 26, color: "#22c55e" },
  { time: "2026-01-07", value: 9, color: "#22c55e" },
  { time: "2026-01-08", value: -6, color: "#ef4444" },
  { time: "2026-01-09", value: 18, color: "#22c55e" },
  { time: "2026-01-10", value: 24, color: "#22c55e" },
];

const timeframeOptions = [
  { id: "1s", label: "1 second", seconds: 1, group: "SECONDS" },
  { id: "15s", label: "15 seconds", seconds: 15, group: "SECONDS" },
  { id: "30s", label: "30 seconds", seconds: 30, group: "SECONDS" },
  { id: "1m", label: "1 minute", seconds: 60, group: "MINUTES" },
  { id: "5m", label: "5 minutes", seconds: 300, group: "MINUTES" },
  { id: "15m", label: "15 minutes", seconds: 900, group: "MINUTES" },
  { id: "30m", label: "30 minutes", seconds: 1800, group: "MINUTES" },
  { id: "1h", label: "1 hour", seconds: 3600, group: "HOURS" },
  { id: "4h", label: "4 hours", seconds: 14400, group: "HOURS" },
  { id: "6h", label: "6 hours", seconds: 21600, group: "HOURS" },
  { id: "12h", label: "12 hours", seconds: 43200, group: "HOURS" },
  { id: "24h", label: "24 hours", seconds: 86400, group: "HOURS" },
] as const;

const timeframeGroups: Array<(typeof timeframeOptions)[number]["group"]> = [
  "SECONDS",
  "MINUTES",
  "HOURS",
];

const quickBottomTimeframes = [
  { id: "1d", label: "1D", mappedTo: "1h" },
  { id: "5d", label: "5D", mappedTo: "4h" },
  { id: "1m", label: "1M", mappedTo: "24h" },
] as const;

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

function createInitialAdvancedCandles(stepSeconds: number): CandlestickData<Time>[] {
  const bars = 220;
  const now = Math.floor(Date.now() / 1000);
  const start = now - bars * stepSeconds;
  const data: CandlestickData<Time>[] = [];
  let lastClose = 212.7;

  for (let i = 0; i < bars; i += 1) {
    const time = (start + i * stepSeconds) as UTCTimestamp;
    const open = lastClose;
    const close = formatPrice(Math.max(0.5, open + randomRange(-4, 4)));
    const high = formatPrice(Math.max(open, close) + Math.abs(randomRange(0.3, 3.8)));
    const low = formatPrice(Math.max(0.2, Math.min(open, close) - Math.abs(randomRange(0.3, 3.8))));
    data.push({ time, open: formatPrice(open), high, low, close });
    lastClose = close;
  }

  return data;
}

function buildMovingAverageData(
  candles: CandlestickData<Time>[],
  period: number
): SingleValueData<Time>[] {
  const ma: SingleValueData<Time>[] = [];
  for (let i = 0; i < candles.length; i += 1) {
    if (i < period - 1) continue;
    const window = candles.slice(i - period + 1, i + 1);
    const avg = window.reduce((acc, candle) => acc + candle.close, 0) / period;
    ma.push({ time: candles[i].time, value: formatPrice(avg) });
  }
  return ma;
}

function buildVolumePoint(candle: CandlestickData<Time>): HistogramData<Time> {
  return {
    time: candle.time,
    value: Number(Math.abs(randomRange(2_500_000, 24_000_000)).toFixed(2)),
    color: candle.close >= candle.open ? "#00d6b8" : "#ff496d",
  };
}

export default function GraficiDevClient() {
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const [selectedTimeframeId, setSelectedTimeframeId] = useState<string>("24h");
  const [isTimeframeListOpen, setIsTimeframeListOpen] = useState(false);
  const timeframeMenuRef = useRef<HTMLDivElement | null>(null);
  const advancedChartContainerRef = useRef<HTMLDivElement | null>(null);

  const advancedChartRef = useRef<IChartApi | null>(null);
  const advancedCandlesSeriesRef = useRef<ISeriesApi<"Candlestick", Time> | null>(null);
  const advancedVolumeSeriesRef = useRef<ISeriesApi<"Histogram", Time> | null>(null);
  const advancedMaSeriesRef = useRef<ISeriesApi<"Line", Time> | null>(null);
  const advancedCandlesRef = useRef<CandlestickData<Time>[]>([]);
  const advancedGuideLinesRef = useRef<IPriceLine[]>([]);
  const advancedRulerAnchorPriceRef = useRef<number | null>(null);
  const advancedRulerEnabledRef = useRef(false);

  const [advancedCrosshairVisible, setAdvancedCrosshairVisible] = useState(true);
  const [advancedMagnetMode, setAdvancedMagnetMode] = useState(true);
  const [advancedLocked, setAdvancedLocked] = useState(false);
  const [advancedVolumeVisible, setAdvancedVolumeVisible] = useState(true);
  const [advancedMovingAverageVisible, setAdvancedMovingAverageVisible] = useState(true);
  const [advancedRulerEnabled, setAdvancedRulerEnabled] = useState(false);
  const [advancedRulerText, setAdvancedRulerText] = useState<string>("Ruler off");
  const [advancedTradeDisplayEnabled, setAdvancedTradeDisplayEnabled] = useState(true);
  const [advancedBubblesVisible, setAdvancedBubblesVisible] = useState(true);
  const [advancedMetricMode, setAdvancedMetricMode] = useState<"PRICE" | "MCAP">("PRICE");
  const [advancedBarSpacing, setAdvancedBarSpacing] = useState(7);

  const selectedTimeframe = useMemo(
    () => timeframeOptions.find((option) => option.id === selectedTimeframeId) ?? timeframeOptions[0],
    [selectedTimeframeId]
  );

  const realtimeConfig = useMemo(
    () => ({
      enabled: realtimeEnabled,
      updateIntervalMs: 1000,
      barTimeStepSeconds: selectedTimeframe.seconds,
      volatility: 0.015,
    }),
    [realtimeEnabled, selectedTimeframe.seconds]
  );

  useEffect(() => {
    if (!isTimeframeListOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!timeframeMenuRef.current) return;
      if (!timeframeMenuRef.current.contains(event.target as Node)) {
        setIsTimeframeListOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [isTimeframeListOpen]);

  useEffect(() => {
    advancedRulerEnabledRef.current = advancedRulerEnabled;
    if (!advancedRulerEnabled) {
      advancedRulerAnchorPriceRef.current = null;
    } else {
      const lastCandle = advancedCandlesRef.current[advancedCandlesRef.current.length - 1];
      advancedRulerAnchorPriceRef.current = lastCandle?.close ?? null;
    }
  }, [advancedRulerEnabled]);

  useEffect(() => {
    const container = advancedChartContainerRef.current;
    if (!container) return;

    const candles = createInitialAdvancedCandles(Math.max(selectedTimeframe.seconds, 1));
    advancedCandlesRef.current = candles;

    const chart = createChart(container, {
      width: container.clientWidth || 1,
      height: 600,
      layout: {
        background: { type: ColorType.Solid, color: "#0f1420" },
        textColor: "#d0d7e2",
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
      crosshair: {
        mode: CrosshairMode.Magnet,
      },
      handleScale: true,
      handleScroll: true,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#00d6b8",
      downColor: "#ff496d",
      borderVisible: false,
      wickUpColor: "#00d6b8",
      wickDownColor: "#ff496d",
      lastValueVisible: true,
      priceLineVisible: true,
    });
    candleSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.08,
        bottom: 0.3,
      },
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceScaleId: "",
      priceFormat: { type: "volume" },
      visible: true,
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.75,
        bottom: 0,
      },
    });

    const movingAverageSeries = chart.addSeries(LineSeries, {
      color: "#f8b84e",
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      lastValueVisible: false,
      priceLineVisible: false,
      visible: true,
    });

    candleSeries.setData(candles);
    volumeSeries.setData(candles.map(buildVolumePoint));
    movingAverageSeries.setData(buildMovingAverageData(candles, 12));
    chart.timeScale().fitContent();

    const handleCrosshairMove = (param: MouseEventParams<Time>) => {
      if (!advancedRulerEnabledRef.current) return;

      const pointData = param.seriesData.get(candleSeries) as
        | CandlestickData<Time>
        | undefined;

      if (!pointData) return;

      const anchorPrice = advancedRulerAnchorPriceRef.current ?? pointData.close;
      const delta = pointData.close - anchorPrice;
      const percent = anchorPrice === 0 ? 0 : (delta / anchorPrice) * 100;
      setAdvancedRulerText(
        `Ruler Î” ${delta.toFixed(2)} (${percent.toFixed(2)}%) | Close ${pointData.close.toFixed(2)}`
      );
    };

    chart.subscribeCrosshairMove(handleCrosshairMove);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const width = Math.floor(entry.contentRect.width);
      if (width <= 0) return;
      chart.applyOptions({ width, height: 600 });
    });
    resizeObserver.observe(container);

    advancedChartRef.current = chart;
    advancedCandlesSeriesRef.current = candleSeries;
    advancedVolumeSeriesRef.current = volumeSeries;
    advancedMaSeriesRef.current = movingAverageSeries;
    advancedGuideLinesRef.current = [];

    return () => {
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      resizeObserver.disconnect();
      chart.remove();
      advancedChartRef.current = null;
      advancedCandlesSeriesRef.current = null;
      advancedVolumeSeriesRef.current = null;
      advancedMaSeriesRef.current = null;
      advancedGuideLinesRef.current = [];
    };
  }, [selectedTimeframe.seconds]);

  useEffect(() => {
    const chart = advancedChartRef.current;
    const candlesSeries = advancedCandlesSeriesRef.current;
    const volumeSeries = advancedVolumeSeriesRef.current;
    const movingAverageSeries = advancedMaSeriesRef.current;
    if (!chart || !candlesSeries || !volumeSeries || !movingAverageSeries) return;
    if (!realtimeEnabled || advancedLocked) return;

    const stepSeconds = Math.max(selectedTimeframe.seconds, 1);
    const timer = setInterval(() => {
      const lastCandle = advancedCandlesRef.current[advancedCandlesRef.current.length - 1];
      if (!lastCandle) return;

      const nextTime = (toUnixSeconds(lastCandle.time) + stepSeconds) as UTCTimestamp;
      const open = lastCandle.close;
      const close = formatPrice(Math.max(0.5, open + randomRange(-4, 4)));
      const high = formatPrice(Math.max(open, close) + Math.abs(randomRange(0.2, 3.6)));
      const low = formatPrice(Math.max(0.2, Math.min(open, close) - Math.abs(randomRange(0.2, 3.6))));

      const nextCandle: CandlestickData<Time> = {
        time: nextTime,
        open: formatPrice(open),
        high,
        low,
        close,
      };

      advancedCandlesRef.current.push(nextCandle);
      candlesSeries.update(nextCandle);
      volumeSeries.update(buildVolumePoint(nextCandle));

      const maWindow = advancedCandlesRef.current.slice(-12);
      const avg = maWindow.reduce((acc, bar) => acc + bar.close, 0) / maWindow.length;
      movingAverageSeries.update({
        time: nextCandle.time,
        value: formatPrice(avg),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [realtimeEnabled, advancedLocked, selectedTimeframe.seconds]);

  useEffect(() => {
    const chart = advancedChartRef.current;
    if (!chart) return;

    chart.applyOptions({
      crosshair: {
        mode: advancedCrosshairVisible
          ? advancedMagnetMode
            ? CrosshairMode.Magnet
            : CrosshairMode.Normal
          : CrosshairMode.Hidden,
      },
      handleScroll: !advancedLocked,
      handleScale: !advancedLocked,
      timeScale: {
        barSpacing: advancedBarSpacing,
      },
    });
  }, [advancedCrosshairVisible, advancedMagnetMode, advancedLocked, advancedBarSpacing]);

  useEffect(() => {
    advancedVolumeSeriesRef.current?.applyOptions({ visible: advancedVolumeVisible });
  }, [advancedVolumeVisible]);

  useEffect(() => {
    advancedMaSeriesRef.current?.applyOptions({ visible: advancedMovingAverageVisible });
  }, [advancedMovingAverageVisible]);

  const addAdvancedGuideLine = () => {
    const candleSeries = advancedCandlesSeriesRef.current;
    const latest = advancedCandlesRef.current[advancedCandlesRef.current.length - 1];
    if (!candleSeries || !latest) return;

    const line = candleSeries.createPriceLine({
      price: latest.close,
      color: "#f8b84e",
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: "guide",
    });
    advancedGuideLinesRef.current.push(line);
  };

  const clearAdvancedGuideLines = () => {
    const candleSeries = advancedCandlesSeriesRef.current;
    if (!candleSeries) return;
    for (const line of advancedGuideLinesRef.current) {
      candleSeries.removePriceLine(line);
    }
    advancedGuideLinesRef.current = [];
  };

  const zoomAdvancedChart = (delta: number) => {
    setAdvancedBarSpacing((prev) => Math.min(24, Math.max(3, prev + delta)));
  };

  type AdvancedToolbarActionId =
    | "crosshair"
    | "move"
    | "pencil"
    | "sliders"
    | "workflow"
    | "share"
    | "type"
    | "smile"
    | "ruler"
    | "plus"
    | "magnet"
    | "lock"
    | "eye"
    | "trash"
    | "layers";

  const handleAdvancedToolbarAction = (actionId: AdvancedToolbarActionId) => {
    switch (actionId) {
      case "crosshair":
        setAdvancedCrosshairVisible((prev) => !prev);
        return;
      case "move":
        setAdvancedLocked(false);
        return;
      case "pencil":
        addAdvancedGuideLine();
        return;
      case "sliders":
        setAdvancedTradeDisplayEnabled((prev) => !prev);
        return;
      case "workflow":
        setAdvancedMetricMode((prev) => (prev === "PRICE" ? "MCAP" : "PRICE"));
        return;
      case "share":
        setAdvancedBubblesVisible((prev) => !prev);
        return;
      case "type":
        setAdvancedMovingAverageVisible((prev) => !prev);
        return;
      case "smile":
        setAdvancedVolumeVisible((prev) => !prev);
        return;
      case "ruler":
        setAdvancedRulerEnabled((prev) => !prev);
        return;
      case "plus":
        zoomAdvancedChart(1);
        return;
      case "magnet":
        setAdvancedMagnetMode((prev) => !prev);
        return;
      case "lock":
        setAdvancedLocked((prev) => !prev);
        return;
      case "eye":
        setAdvancedVolumeVisible((prev) => !prev);
        return;
      case "trash":
        clearAdvancedGuideLines();
        return;
      case "layers":
        setAdvancedMovingAverageVisible((prev) => !prev);
        setAdvancedVolumeVisible((prev) => !prev);
        return;
      default:
        return;
    }
  };

  const advancedToolbarItems = [
    { id: "crosshair", icon: Crosshair, label: "Crosshair", active: advancedCrosshairVisible },
    { id: "move", icon: Move, label: "Move", active: !advancedLocked },
    { id: "pencil", icon: Pencil, label: "Add Guide Line", active: false },
    { id: "sliders", icon: SlidersHorizontal, label: "Trade Display", active: advancedTradeDisplayEnabled },
    { id: "workflow", icon: Workflow, label: "Metric Mode", active: advancedMetricMode === "MCAP" },
    { id: "share", icon: Share2, label: "Toggle Bubbles", active: advancedBubblesVisible },
    { id: "type", icon: Type, label: "Toggle MA", active: advancedMovingAverageVisible },
    { id: "smile", icon: Smile, label: "Volume Layer", active: advancedVolumeVisible },
    { id: "ruler", icon: Ruler, label: "Ruler", active: advancedRulerEnabled },
    { id: "plus", icon: Plus, label: "Zoom In", active: false },
    { id: "magnet", icon: Magnet, label: "Magnet", active: advancedMagnetMode },
    { id: "lock", icon: Lock, label: "Lock", active: advancedLocked },
    { id: "eye", icon: Eye, label: "Hide Volume", active: advancedVolumeVisible },
    { id: "trash", icon: Trash2, label: "Clear Guides", active: false },
    { id: "layers", icon: Layers, label: "Layers", active: advancedMovingAverageVisible || advancedVolumeVisible },
  ] as const;

  const chartCards = (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="border border-slate-800 bg-slate-900/70">
        <CardHeader>
          <CardTitle>Line Series</CardTitle>
          <CardDescription>Trend lineare pulito per overview</CardDescription>
        </CardHeader>
        <CardContent className="h-[320px]">
          <LightweightChart
            kind="line"
            data={lineLikeData}
            height={320}
            realtime={realtimeConfig}
            seriesOptions={{ color: "#38bdf8", lineWidth: 2 }}
          />
        </CardContent>
      </Card>

      <Card className="border border-slate-800 bg-slate-900/70">
        <CardHeader>
          <CardTitle>Area Series</CardTitle>
          <CardDescription>Area fill per leggere momentum</CardDescription>
        </CardHeader>
        <CardContent className="h-[320px]">
          <LightweightChart
            kind="area"
            data={lineLikeData}
            height={320}
            realtime={realtimeConfig}
            seriesOptions={{
              lineColor: "#22c55e",
              topColor: "rgba(34,197,94,0.45)",
              bottomColor: "rgba(34,197,94,0.05)",
            }}
          />
        </CardContent>
      </Card>

      <Card className="border border-slate-800 bg-slate-900/70">
        <CardHeader>
          <CardTitle>Baseline Series</CardTitle>
          <CardDescription>Confronto sopra/sotto valore base</CardDescription>
        </CardHeader>
        <CardContent className="h-[320px]">
          <LightweightChart
            kind="baseline"
            data={lineLikeData}
            height={320}
            realtime={realtimeConfig}
            seriesOptions={{
              baseValue: { type: "price", price: 110 },
              topLineColor: "#22c55e",
              topFillColor1: "rgba(34,197,94,0.35)",
              topFillColor2: "rgba(34,197,94,0.06)",
              bottomLineColor: "#ef4444",
              bottomFillColor1: "rgba(239,68,68,0.06)",
              bottomFillColor2: "rgba(239,68,68,0.3)",
            }}
          />
        </CardContent>
      </Card>

      <Card className="border border-slate-800 bg-slate-900/70">
        <CardHeader>
          <CardTitle>Histogram Series</CardTitle>
          <CardDescription>Volumi/istogrammi o delta custom</CardDescription>
        </CardHeader>
        <CardContent className="h-[320px]">
          <LightweightChart
            kind="histogram"
            data={histogramData}
            height={320}
            realtime={realtimeConfig}
            seriesOptions={{ base: 0 }}
          />
        </CardContent>
      </Card>

      <Card className="border border-slate-800 bg-slate-900/70">
        <CardHeader>
          <CardTitle>Bar Series</CardTitle>
          <CardDescription>OHLC con barre classiche</CardDescription>
        </CardHeader>
        <CardContent className="h-[320px]">
          <LightweightChart
            kind="bar"
            data={ohlcData}
            height={320}
            realtime={realtimeConfig}
            seriesOptions={{ upColor: "#22c55e", downColor: "#ef4444" }}
          />
        </CardContent>
      </Card>

      <Card className="border border-slate-800 bg-slate-900/70">
        <CardHeader>
          <CardTitle>Candlestick Series</CardTitle>
          <CardDescription>Candele complete con wick</CardDescription>
        </CardHeader>
        <CardContent className="h-[320px]">
          <LightweightChart
            kind="candlestick"
            data={candlestickData}
            height={320}
            realtime={realtimeConfig}
            seriesOptions={{
              upColor: "#22c55e",
              downColor: "#ef4444",
              borderVisible: false,
              wickUpColor: "#22c55e",
              wickDownColor: "#ef4444",
            }}
          />
        </CardContent>
      </Card>
    </section>
  );

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">Grafici Dev</h1>
          <p className="max-w-4xl text-sm text-slate-300">
            Playground per integrare Lightweight Charts di TradingView in tutto il progetto.
            Tutti i grafici sotto usano aggiornamento realtime e condividono la stessa timeframe list.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setRealtimeEnabled((prev) => !prev)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                realtimeEnabled
                  ? "border-emerald-500/70 bg-emerald-500/20 text-emerald-200"
                  : "border-slate-700 bg-slate-900 text-slate-300"
              }`}
            >
              Realtime: {realtimeEnabled ? "ON" : "OFF"}
            </button>
            <span className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-300">
              Timeframe attiva: {selectedTimeframe.label}
            </span>
          </div>
        </header>

        {chartCards}

        <Card className="border border-slate-800 bg-slate-900/70">
          <CardHeader>
            <CardTitle>Advanced Trading Layout (Dev)</CardTitle>
            <CardDescription>
              Nuovo grafico sotto gli altri, con barra strumenti laterale e controlli stile trading desk.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="relative h-[680px] overflow-hidden rounded-xl border border-slate-800 bg-[#0d111a]">
              <div className="absolute inset-y-0 left-0 z-30 flex w-14 flex-col items-center border-r border-slate-800 bg-[#0a0f17] py-3">
                <div className="mb-3 text-sm font-medium text-slate-300">{selectedTimeframeId}</div>
                <div className="flex flex-1 flex-col items-center gap-2">
                  {advancedToolbarItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      title={item.label}
                      onClick={() => handleAdvancedToolbarAction(item.id)}
                      className={`grid h-8 w-8 place-items-center rounded-md transition ${
                        item.active
                          ? "bg-slate-700/60 text-slate-100"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="absolute left-14 right-0 top-0 z-40 flex h-12 items-center gap-2 border-b border-slate-800 bg-[#0f1420] px-3">
                <div ref={timeframeMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsTimeframeListOpen((prev) => !prev)}
                    className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-100"
                  >
                    {selectedTimeframeId}
                  </button>

                  {isTimeframeListOpen ? (
                    <div className="absolute left-0 top-full mt-2 w-52 rounded-lg border border-slate-700 bg-[#161b23] p-2 shadow-xl">
                      {timeframeGroups.map((group) => (
                        <div key={group} className="mb-2 last:mb-0">
                          <p className="px-2 pb-1 text-[10px] tracking-wide text-slate-500">{group}</p>
                          <div className="space-y-1">
                            {timeframeOptions
                              .filter((option) => option.group === group)
                              .map((option) => (
                                <button
                                  key={option.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedTimeframeId(option.id);
                                    setIsTimeframeListOpen(false);
                                  }}
                                  className={`w-full rounded px-2 py-1 text-left text-sm transition ${
                                    option.id === selectedTimeframeId
                                      ? "bg-slate-200 text-slate-900"
                                      : "text-slate-200 hover:bg-slate-800"
                                  }`}
                                >
                                  {option.label}
                                </button>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => setAdvancedTradeDisplayEnabled((prev) => !prev)}
                  className={`rounded-md border px-3 py-1 text-sm ${
                    advancedTradeDisplayEnabled
                      ? "border-sky-500/70 bg-sky-500/20 text-sky-200"
                      : "border-slate-700 bg-slate-900 text-slate-200"
                  }`}
                >
                  Trade Display
                </button>
                <button
                  type="button"
                  onClick={() => setAdvancedBubblesVisible((prev) => !prev)}
                  className={`rounded-md border px-3 py-1 text-sm ${
                    advancedBubblesVisible
                      ? "border-slate-700 bg-slate-900 text-slate-200"
                      : "border-amber-500/70 bg-amber-500/20 text-amber-200"
                  }`}
                >
                  {advancedBubblesVisible ? "Hide All Bubbles" : "Show Bubbles"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setAdvancedMetricMode((prev) => (prev === "PRICE" ? "MCAP" : "PRICE"))
                  }
                  className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-200"
                >
                  {advancedMetricMode === "PRICE" ? "Price/MCAP" : "MCAP/Price"}
                </button>
                <button
                  type="button"
                  onClick={() => setRealtimeEnabled((prev) => !prev)}
                  className={`rounded-md border px-3 py-1 text-sm font-medium ${
                    realtimeEnabled
                      ? "border-emerald-500/80 bg-emerald-500/20 text-emerald-200"
                      : "border-slate-700 bg-slate-900 text-slate-300"
                  }`}
                >
                  Realtime {realtimeEnabled ? "ON" : "OFF"}
                </button>
              </div>

              <div className="absolute left-14 right-0 bottom-0 z-40 flex h-12 items-center justify-between border-t border-slate-800 bg-[#0f1420] px-3">
                <div className="flex items-center gap-2">
                  {quickBottomTimeframes.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedTimeframeId(item.mappedTo)}
                      className="rounded-md px-2 py-1 text-sm text-slate-200 transition hover:bg-slate-800"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <span>{selectedTimeframe.label}</span>
                  <button
                    type="button"
                    onClick={() => zoomAdvancedChart(-1)}
                    className="rounded p-1 hover:bg-slate-800"
                    title="Zoom out"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => zoomAdvancedChart(1)}
                    className="rounded p-1 hover:bg-slate-800"
                    title="Zoom in"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="absolute left-14 right-0 bottom-12 top-12">
                {advancedBubblesVisible ? (
                  <div className="pointer-events-none absolute left-3 top-2 z-20 rounded-md bg-black/30 px-2 py-1 text-xs text-slate-200">
                    openly/SOL {advancedMetricMode} | {selectedTimeframe.label} | realtime{" "}
                    {realtimeEnabled && !advancedLocked ? "ON" : "OFF"}
                  </div>
                ) : null}
                {advancedTradeDisplayEnabled ? (
                  <div className="pointer-events-none absolute right-3 top-2 z-20 rounded-md bg-black/30 px-2 py-1 text-xs text-slate-200">
                    {advancedRulerEnabled ? advancedRulerText : "Ruler off"}
                  </div>
                ) : null}
                <div ref={advancedChartContainerRef} className="h-full w-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-800 bg-slate-900/70">
          <CardHeader>
            <CardTitle>Lightweight Docs Features</CardTitle>
            <CardDescription>
              Range switcher, legends, floating tooltip, compare multiple series, watermark custom,
              price lines, infinite history, e price+volume overlay.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LightweightDocsShowcase
              realtime={{
                enabled: realtimeEnabled,
                barTimeStepSeconds: selectedTimeframe.seconds,
                updateIntervalMs: 1000,
              }}
            />
          </CardContent>
        </Card>

        <footer className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-300">
          <p>
            Charts powered by TradingView Lightweight Charts (TM). TradingView is the product creator.
            <a
              className="ml-1 text-sky-300 underline underline-offset-2 hover:text-sky-200"
              href="https://www.tradingview.com/"
              target="_blank"
              rel="noreferrer"
            >
              https://www.tradingview.com/
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}

