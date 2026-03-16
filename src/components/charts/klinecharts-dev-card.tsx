"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Layers, Minus, Plus, Ruler, Trash2 } from "lucide-react";
import {
  dispose,
  init,
  type Chart,
  type KLineData,
  type Period,
} from "klinecharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type KLineChartsDevCardProps = {
  realtimeEnabled: boolean;
  timeframeLabel: string;
  timeframeSeconds: number;
};

const overlayButtons = [
  { id: "priceLine", label: "Price Line" },
  { id: "horizontalStraightLine", label: "Horizontal Line" },
  { id: "segment", label: "Segment" },
  { id: "rayLine", label: "Ray Line" },
  { id: "simpleAnnotation", label: "Annotation" },
] as const;

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function formatPrice(value: number): number {
  return Number(value.toFixed(2));
}

function timeframeToPeriod(seconds: number): Period {
  if (seconds < 60) return { span: Math.max(1, seconds), type: "second" };
  if (seconds < 3600) return { span: Math.max(1, Math.round(seconds / 60)), type: "minute" };
  if (seconds < 86400) return { span: Math.max(1, Math.round(seconds / 3600)), type: "hour" };
  if (seconds < 604800) return { span: Math.max(1, Math.round(seconds / 86400)), type: "day" };
  return { span: Math.max(1, Math.round(seconds / 604800)), type: "week" };
}

function generateSeedData(stepMs: number, count = 220): KLineData[] {
  const now = Date.now();
  const start = now - count * stepMs;
  const data: KLineData[] = [];
  let lastClose = 210;

  for (let i = 0; i < count; i += 1) {
    const timestamp = start + i * stepMs;
    const open = lastClose;
    const close = formatPrice(Math.max(0.5, open + randomRange(-3.2, 3.2)));
    const high = formatPrice(Math.max(open, close) + Math.abs(randomRange(0.2, 2.6)));
    const low = formatPrice(Math.max(0.2, Math.min(open, close) - Math.abs(randomRange(0.2, 2.6))));

    data.push({
      timestamp,
      open: formatPrice(open),
      high,
      low,
      close,
      volume: Math.floor(Math.abs(randomRange(100_000, 2_000_000))),
    });
    lastClose = close;
  }

  return data;
}

export default function KLineChartsDevCard({
  realtimeEnabled,
  timeframeLabel,
  timeframeSeconds,
}: KLineChartsDevCardProps) {
  const chartId = "klinecharts-dev-container";
  const chartRef = useRef<Chart | null>(null);
  const dataRef = useRef<KLineData[]>([]);
  const subscribeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [overlayHint, setOverlayHint] = useState("Click one overlay button, then place it on chart");

  const period = useMemo(() => timeframeToPeriod(timeframeSeconds), [timeframeSeconds]);
  const stepMs = useMemo(() => Math.max(1, timeframeSeconds) * 1000, [timeframeSeconds]);

  const clearRealtimeTimer = () => {
    if (subscribeTimerRef.current) {
      clearInterval(subscribeTimerRef.current);
      subscribeTimerRef.current = null;
    }
  };

  useEffect(() => {
    const chart = init(chartId, {
      locale: "en-US",
      timezone: "Etc/UTC",
    });
    if (!chart) return;

    chartRef.current = chart;
    chart.setSymbol({ ticker: "OPENLY/KLINE", pricePrecision: 2, volumePrecision: 0 });
    chart.setStyles({
      grid: {
        horizontal: { color: "rgba(148,163,184,0.16)", style: "dashed" },
        vertical: { color: "rgba(148,163,184,0.12)", style: "dashed" },
      },
      candle: {
        type: "candle_solid",
        bar: {
          upColor: "#00d6b8",
          downColor: "#ff496d",
          upBorderColor: "#00d6b8",
          downBorderColor: "#ff496d",
          upWickColor: "#00d6b8",
          downWickColor: "#ff496d",
        },
        tooltip: {
          showRule: "follow_cross",
        },
      },
      xAxis: {
        axisLine: { color: "rgba(148,163,184,0.3)" },
        tickText: { color: "#94a3b8" },
      },
      yAxis: {
        axisLine: { color: "rgba(148,163,184,0.3)" },
        tickText: { color: "#94a3b8" },
      },
      crosshair: {
        horizontal: {
          line: { color: "#64748b", style: "dashed" },
          text: { backgroundColor: "#0f172a" },
        },
        vertical: {
          line: { color: "#64748b", style: "dashed" },
          text: { backgroundColor: "#0f172a" },
        },
      },
      separator: {
        color: "rgba(148,163,184,0.25)",
      },
    });

    return () => {
      clearRealtimeTimer();
      dispose(chart);
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    clearRealtimeTimer();
    dataRef.current = generateSeedData(stepMs, 220);

    chart.setPeriod(period);
    chart.setDataLoader({
      getBars: ({ callback }) => {
        callback(dataRef.current, { backward: false, forward: true });
      },
      subscribeBar: ({ callback }) => {
        if (!realtimeEnabled) return;

        subscribeTimerRef.current = setInterval(() => {
          const lastBar = dataRef.current[dataRef.current.length - 1];
          if (!lastBar) return;

          const open = lastBar.close;
          const close = formatPrice(Math.max(0.5, open + randomRange(-3.2, 3.2)));
          const high = formatPrice(Math.max(open, close) + Math.abs(randomRange(0.2, 2.6)));
          const low = formatPrice(Math.max(0.2, Math.min(open, close) - Math.abs(randomRange(0.2, 2.6))));

          const nextBar: KLineData = {
            timestamp: lastBar.timestamp + stepMs,
            open: formatPrice(open),
            high,
            low,
            close,
            volume: Math.floor(Math.abs(randomRange(100_000, 2_000_000))),
          };

          dataRef.current = [...dataRef.current, nextBar];
          callback(nextBar);
        }, 1000);
      },
      unsubscribeBar: () => {
        clearRealtimeTimer();
      },
    });

    chart.resetData();
    chart.scrollToRealTime();

    return () => {
      clearRealtimeTimer();
    };
  }, [period, realtimeEnabled, stepMs]);

  const applyOverlay = (name: (typeof overlayButtons)[number]["id"]) => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.createOverlay(name);
    setOverlayHint(`Overlay "${name}" active: click chart to place points`);
  };

  const clearOverlays = () => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.removeOverlay();
    setOverlayHint("All overlays removed");
  };

  const zoom = (delta: number) => {
    const chart = chartRef.current;
    if (!chart) return;
    const current = chart.getBarSpace().bar;
    chart.setBarSpace(Math.max(2, Math.min(40, current + delta)));
  };

  return (
    <Card className="border border-slate-800 bg-slate-900/70">
      <CardHeader>
        <CardTitle>KLineChart (Nuova Libreria)</CardTitle>
        <CardDescription>
          Integrazione klinecharts con styles custom, realtime via dataLoader e overlay tools.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300">
            Realtime: {realtimeEnabled ? "ON" : "OFF"}
          </span>
          <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300">
            Timeframe: {timeframeLabel}
          </span>
          <button
            type="button"
            onClick={() => zoom(-1)}
            className="rounded-md border border-slate-700 bg-slate-900 p-1 text-slate-200 hover:bg-slate-800"
            title="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => zoom(1)}
            className="rounded-md border border-slate-700 bg-slate-900 p-1 text-slate-200 hover:bg-slate-800"
            title="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={clearOverlays}
            className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
          >
            <span className="inline-flex items-center gap-1">
              <Trash2 className="h-3.5 w-3.5" />
              Clear overlays
            </span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {overlayButtons.map((button) => (
            <button
              key={button.id}
              type="button"
              onClick={() => applyOverlay(button.id)}
              className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
            >
              <span className="inline-flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" />
                {button.label}
              </span>
            </button>
          ))}
          <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300">
            <Ruler className="h-3.5 w-3.5" />
            {overlayHint}
          </span>
        </div>

        <div id={chartId} className="h-[620px] w-full rounded-lg border border-slate-800" />
      </CardContent>
    </Card>
  );
}
