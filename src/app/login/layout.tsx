import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join WhatnotMarket — The #1 Marketplace Where You Can Find Anything You Want",
};

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
