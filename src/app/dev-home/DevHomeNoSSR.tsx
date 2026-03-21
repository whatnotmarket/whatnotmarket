"use client";

import dynamic from "next/dynamic";

const DevHomeClientNoSSR = dynamic(
  () => import("./DevHomeClient").then((module) => module.DevHomeClient),
  {
    ssr: false,
    loading: () => <main className="h-dvh w-full bg-[#131111]" />,
  },
);

export default function DevHomeNoSSR() {
  return <DevHomeClientNoSSR />;
}
