"use client"

import { AreaSeries, ColorType, createChart } from "lightweight-charts"
import { useEffect, useMemo, useRef } from "react"

export type DualAreaPoint = { time: string; a: number; b: number }

export function LwcDualAreaChart({
  data,
  colorA,
  colorB,
  labelA = "A",
  labelB = "B",
  height = 250,
  className,
}: {
  data: DualAreaPoint[]
  colorA: string
  colorB: string
  labelA?: string
  labelB?: string
  height?: number
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dataKey = useMemo(() => JSON.stringify(data), [data])

  useEffect(() => {
    const el = containerRef.current
    if (!el || data.length === 0) return

    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(148, 163, 184, 0.95)",
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.12)" },
        horzLines: { color: "rgba(148, 163, 184, 0.12)" },
      },
      width: el.clientWidth,
      height,
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
    })

    const s1 = chart.addSeries(AreaSeries, {
      lineColor: colorA,
      topColor: `${colorA}99`,
      bottomColor: `${colorA}18`,
      lineWidth: 2,
      title: labelA,
    })
    s1.setData(data.map((d) => ({ time: d.time, value: d.a })))

    const s2 = chart.addSeries(AreaSeries, {
      lineColor: colorB,
      topColor: `${colorB}99`,
      bottomColor: `${colorB}18`,
      lineWidth: 2,
      title: labelB,
    })
    s2.setData(data.map((d) => ({ time: d.time, value: d.b })))

    chart.timeScale().fitContent()

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    })
    ro.observe(el)

    return () => {
      ro.disconnect()
      chart.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dataKey mirrors serialized data
  }, [dataKey, colorA, colorB, labelA, labelB, height])

  return <div ref={containerRef} className={className} style={{ height }} />
}
