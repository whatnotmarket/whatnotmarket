"use client";

import { useState } from "react";
import { Bell, Package, Tag, MessageCircle, AlertCircle } from "lucide-react";
import { NavPopup } from "./NavPopup";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "offer" | "shipping" | "price" | "system";
  read: boolean;
  link: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "New Offer Received",
    message: "Buyer sent an offer of $3,200 for MacBook Pro M3",
    time: "2m ago",
    type: "offer",
    read: false,
    link: "/deal/demo-seller"
  },
  {
    id: "2",
    title: "Item Shipped",
    message: "Your order #8392 has been shipped via DHL",
    time: "1h ago",
    type: "shipping",
    read: false,
    link: "/orders/8392"
  },
  {
    id: "3",
    title: "Price Drop Alert",
    message: "Leica Q2 is now available for $3,800 (was $4,200)",
    time: "5h ago",
    type: "price",
    read: true,
    link: "/market/leica-q2"
  },
  {
    id: "4",
    title: "System Update",
    message: "Maintenance scheduled for tonight at 2:00 AM UTC",
    time: "1d ago",
    type: "system",
    read: true,
    link: "/support"
  }
];

export function NotificationsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "offer": return <Tag className="h-4 w-4 text-emerald-400" />;
      case "shipping": return <Package className="h-4 w-4 text-blue-400" />;
      case "price": return <Tag className="h-4 w-4 text-amber-400" />;
      case "system": return <AlertCircle className="h-4 w-4 text-zinc-400" />;
      default: return <MessageCircle className="h-4 w-4 text-zinc-400" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) {
            // Optional: mark as read when opening? 
            // For now, let's keep the dot until manually cleared or clicked
          }
        }}
        className="relative flex items-center justify-center px-4 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-all"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-3 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#1C1C1E]" />
        )}
      </button>

      <NavPopup 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        align="center" 
        className="w-[380px]" 
        title="Notifications"
      >
        <div className="bg-[#222222] rounded-[16px] overflow-hidden flex flex-col max-h-[480px]">
          {/* Header Actions */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <span className="text-xs font-medium text-zinc-400">
              {unreadCount} unread
            </span>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <Link 
                  key={notification.id}
                  href={notification.link}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-start gap-4 p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 relative group",
                    !notification.read && "bg-white/[0.02]"
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center shrink-0 border border-white/5",
                    "bg-zinc-800/50"
                  )}>
                    {getIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className={cn(
                        "text-sm font-semibold truncate pr-2",
                        notification.read ? "text-zinc-300" : "text-white"
                      )}>
                        {notification.title}
                      </h4>
                      <span className="text-[11px] text-zinc-500 whitespace-nowrap shrink-0">
                        {notification.time}
                      </span>
                    </div>
                    <p className="text-[13px] text-zinc-400 leading-snug line-clamp-2">
                      {notification.message}
                    </p>
                  </div>

                  {/* Unread Indicator */}
                  {!notification.read && (
                    <div className="absolute top-5 right-4 h-2 w-2 rounded-full bg-indigo-500" />
                  )}
                </Link>
              ))
            )}
          </div>
          
          {/* Footer */}
          <div className="p-2 border-t border-white/5 bg-zinc-900/50">
            <Link 
              href="/notifications" 
              className="flex items-center justify-center w-full py-2.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              View All Notifications
            </Link>
          </div>
        </div>
      </NavPopup>
    </div>
  );
}
