"use client"

import { SidebarInset,SidebarProvider } from "@/components/shared/ui/sidebar"
import { TooltipProvider } from "@/components/shared/ui/tooltip"
import dynamic from "next/dynamic"

import data from "./data.json"

const AppSidebar = dynamic(() => import("@/components/app/navigation/app-sidebar").then((mod) => mod.AppSidebar), { ssr: false })
const SiteHeader = dynamic(() => import("@/components/app/navigation/site-header").then((mod) => mod.SiteHeader), { ssr: false })
const SectionCards = dynamic(() => import("@/components/app/layout/section-cards").then((mod) => mod.SectionCards), {
  ssr: false,
})
const ChartAreaInteractive = dynamic(() =>
  import("@/components/shared/charts/chart-area-interactive").then((mod) => mod.ChartAreaInteractive)
, { ssr: false }
)
const DataTable = dynamic(
  () => import("@/components/shared/ui/data-table").then((mod) => mod.DataTable),
  { ssr: false }
)

export default function Page() {
  return (
    <TooltipProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <SectionCards />
                <div className="px-4 lg:px-6">
                  <ChartAreaInteractive />
                </div>
                <DataTable data={data} />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}

