"use client"

import { useMemo } from "react"

type Row = Record<string, string | number | undefined | null>

function buildPath(xs: number[], tops: number[], bottoms: number[]) {
  if (xs.length === 0) return ""
  let d = `M ${xs[0]},${tops[0]}`
  for (let i = 1; i < xs.length; i++) d += ` L ${xs[i]},${tops[i]}`
  for (let i = xs.length - 1; i >= 0; i--) d += ` L ${xs[i]},${bottoms[i]}`
  return `${d} Z`
}

function computeLayers(
  data: Row[],
  keys: string[],
  mode: "absolute" | "percent"
): { layers: { top: number[]; bottom: number[] }[]; maxVal: number } {
  const n = data.length
  const layers = keys.map(() => ({ top: [] as number[], bottom: [] as number[] }))
  let maxVal = 0

  for (let i = 0; i < n; i++) {
    const row = data[i]
    const vals = keys.map((k) => Math.max(0, Number(row[k] ?? 0)))
    let normalized: number[]
    if (mode === "percent") {
      const s = vals.reduce((a, b) => a + b, 0) || 1
      normalized = vals.map((v) => v / s)
    } else {
      normalized = vals
      const rowSum = vals.reduce((a, b) => a + b, 0)
      maxVal = Math.max(maxVal, rowSum)
    }
    let cum = 0
    for (let k = 0; k < keys.length; k++) {
      const bottom = cum
      cum += normalized[k]
      layers[k].bottom.push(bottom)
      layers[k].top.push(cum)
    }
  }

  if (mode === "percent") maxVal = 1
  if (maxVal === 0) maxVal = 1

  return { layers, maxVal }
}

const VIEW_W = 800
const PAD_T = 8
const PAD_R = 12
const PAD_B = 28
const PAD_L = 12

export function SvgStackedAreaChart({
  data,
  keys,
  colors,
  height = 220,
  mode = "absolute",
  className,
  tickFormat,
}: {
  data: Row[]
  keys: string[]
  colors: string[]
  height?: number
  mode?: "absolute" | "percent"
  className?: string
  tickFormat?: (row: Row, index: number) => string
}) {
  const innerW = VIEW_W - PAD_L - PAD_R
  const innerH = height - PAD_T - PAD_B

  const effectiveData = useMemo(() => {
    if (data.length === 1) return [data[0], data[0]]
    return data
  }, [data])

  const { paths, xs, tickLabels } = useMemo(() => {
    const n = effectiveData.length
    if (n < 1 || keys.length === 0) {
      return { paths: [] as string[], xs: [] as number[], tickLabels: [] as string[] }
    }

    const { layers, maxVal } = computeLayers(effectiveData, keys, mode)

    const xs =
      n === 1
        ? [PAD_L + innerW * 0.2, PAD_L + innerW * 0.8]
        : effectiveData.map((_, i) => PAD_L + (i / (n - 1)) * innerW)

    const scaleY = (v: number) => PAD_T + innerH * (1 - v / maxVal)

    const paths = keys.map((_, k) => {
      let tops = layers[k].top.map(scaleY)
      let bottoms = layers[k].bottom.map(scaleY)
      if (n === 1) {
        tops = [tops[0], tops[0]]
        bottoms = [bottoms[0], bottoms[0]]
      }
      return buildPath(xs, tops, bottoms)
    })

    const tickLabels = data.map((row, i) =>
      tickFormat ? tickFormat(row, i) : String(row.date ?? i)
    )

    return { paths, xs, tickLabels }
  }, [effectiveData, keys, mode, innerH, innerW, tickFormat, data])

  if (data.length === 0 || keys.length === 0) {
    return (
      <div
        className={className}
        style={{ height }}
        role="img"
        aria-label="Chart"
      />
    )
  }

  const tickIndices =
    data.length <= 3
      ? data.map((_, i) => i)
      : [0, Math.floor((data.length - 1) / 2), data.length - 1]

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${height}`}
      className={className}
      style={{ height, width: "100%" }}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Stacked area chart"
    >
      {paths.map((d, k) => (
        <path
          key={keys[k]}
          d={d}
          fill={colors[k] ?? "#888"}
          fillOpacity={mode === "percent" ? 0.88 : 0.42}
          stroke={colors[k] ?? "#888"}
          strokeWidth={1}
        />
      ))}
      {tickIndices.map((i) => (
        <text
          key={i}
          x={xs[i] ?? 0}
          y={height - 6}
          textAnchor="middle"
          fill="rgb(148 163 184)"
          style={{ fontSize: 11 }}
        >
          {(tickLabels[i] ?? "").slice(0, 12)}
        </text>
      ))}
    </svg>
  )
}
