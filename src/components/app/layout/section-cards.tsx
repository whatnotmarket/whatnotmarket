"use client"

import { Badge } from "@/components/shared/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/shared/ui/card"
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react"

type SectionMetrics = {
  totalUsers?: number
  dau?: number
  wau?: number
  gmv?: number
  feesGenerated?: number
}

type CardItem = {
  description: string
  value: string
  trend: string
  trendDirection: "up" | "down"
  footerTitle: string
  footerSubtitle: string
}

const numberFormatter = new Intl.NumberFormat("en-US")
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const defaultItems: CardItem[] = [
  {
    description: "Total Revenue",
    value: "$1,250.00",
    trend: "+12.5%",
    trendDirection: "up",
    footerTitle: "Trending up this month",
    footerSubtitle: "Visitors for the last 6 months",
  },
  {
    description: "New Customers",
    value: "1,234",
    trend: "-20%",
    trendDirection: "down",
    footerTitle: "Down 20% this period",
    footerSubtitle: "Acquisition needs attention",
  },
  {
    description: "Active Accounts",
    value: "45,678",
    trend: "+12.5%",
    trendDirection: "up",
    footerTitle: "Strong user retention",
    footerSubtitle: "Engagement exceed targets",
  },
  {
    description: "Growth Rate",
    value: "4.5%",
    trend: "+4.5%",
    trendDirection: "up",
    footerTitle: "Steady performance increase",
    footerSubtitle: "Meets growth projections",
  },
]

function normalizeNumber(value: number | undefined) {
  return Number.isFinite(value) ? Number(value) : 0
}

export function SectionCards({ metrics }: { metrics?: SectionMetrics }) {
  const items: CardItem[] = metrics
    ? [
        {
          description: "Total Users",
          value: numberFormatter.format(normalizeNumber(metrics.totalUsers)),
          trend: `DAU ${numberFormatter.format(normalizeNumber(metrics.dau))}`,
          trendDirection: "up",
          footerTitle: "Live active base",
          footerSubtitle: "Sourced from admin overview",
        },
        {
          description: "Daily / Weekly Active",
          value: `${numberFormatter.format(normalizeNumber(metrics.dau))} / ${numberFormatter.format(
            normalizeNumber(metrics.wau)
          )}`,
          trend: `WAU ${numberFormatter.format(normalizeNumber(metrics.wau))}`,
          trendDirection: "up",
          footerTitle: "Daily and weekly engagement",
          footerSubtitle: "Current authenticated activity",
        },
        {
          description: "GMV",
          value: currencyFormatter.format(normalizeNumber(metrics.gmv)),
          trend: currencyFormatter.format(normalizeNumber(metrics.gmv)),
          trendDirection: "up",
          footerTitle: "Escrow and released volume",
          footerSubtitle: "Marketplace gross volume",
        },
        {
          description: "Fees Generated",
          value: currencyFormatter.format(normalizeNumber(metrics.feesGenerated)),
          trend: currencyFormatter.format(normalizeNumber(metrics.feesGenerated)),
          trendDirection: "up",
          footerTitle: "Ledger fee production",
          footerSubtitle: "Current fee aggregation",
        },
      ]
    : defaultItems

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {items.map((item) => {
        const TrendIcon =
          item.trendDirection === "down" ? TrendingDownIcon : TrendingUpIcon

        return (
          <Card key={item.description} className="@container/card">
            <CardHeader>
              <CardDescription>{item.description}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {item.value}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <TrendIcon />
                  {item.trend}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {item.footerTitle} <TrendIcon className="size-4" />
              </div>
              <div className="text-muted-foreground">{item.footerSubtitle}</div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}

