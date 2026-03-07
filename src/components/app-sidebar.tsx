"use client"

import * as React from "react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LayoutDashboardIcon, ListIcon, ChartBarIcon, FolderIcon, UsersIcon, Settings2Icon, CircleHelpIcon, SearchIcon, DatabaseIcon, FileChartColumnIcon, FileIcon, CommandIcon } from "lucide-react"

type AppSidebarUser = {
  name: string
  email: string
  avatar: string
}

type AppSidebarItem = {
  title: string
  url: string
  icon: React.ReactNode
  isActive?: boolean
}

type AppSidebarDocument = {
  name: string
  url: string
  icon: React.ReactNode
}

const defaultData = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  } satisfies AppSidebarUser,
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: (
        <LayoutDashboardIcon
        />
      ),
    },
    {
      title: "Lifecycle",
      url: "#",
      icon: (
        <ListIcon
        />
      ),
    },
    {
      title: "Analytics",
      url: "#",
      icon: (
        <ChartBarIcon
        />
      ),
    },
    {
      title: "Projects",
      url: "#",
      icon: (
        <FolderIcon
        />
      ),
    },
    {
      title: "Team",
      url: "#",
      icon: (
        <UsersIcon
        />
      ),
    },
  ] satisfies AppSidebarItem[],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: (
        <Settings2Icon
        />
      ),
    },
    {
      title: "Get Help",
      url: "#",
      icon: (
        <CircleHelpIcon
        />
      ),
    },
    {
      title: "Search",
      url: "#",
      icon: (
        <SearchIcon
        />
      ),
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: (
        <DatabaseIcon
        />
      ),
    },
    {
      name: "Reports",
      url: "#",
      icon: (
        <FileChartColumnIcon
        />
      ),
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: (
        <FileIcon
        />
      ),
    },
  ] satisfies AppSidebarDocument[],
}

export function AppSidebar({
  navMainItems = defaultData.navMain,
  documentItems = defaultData.documents,
  navSecondaryItems = defaultData.navSecondary,
  user = defaultData.user,
  brandName = "Acme Inc.",
  brandHref = "#",
  showQuickCreate = true,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  navMainItems?: AppSidebarItem[]
  documentItems?: AppSidebarDocument[]
  navSecondaryItems?: AppSidebarItem[]
  user?: AppSidebarUser
  brandName?: string
  brandHref?: string
  showQuickCreate?: boolean
}) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href={brandHref}>
                <CommandIcon className="size-5!" />
                <span className="text-base font-semibold">{brandName}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} showQuickCreate={showQuickCreate} />
        {documentItems.length ? <NavDocuments items={documentItems} /> : null}
        <NavSecondary items={navSecondaryItems} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
