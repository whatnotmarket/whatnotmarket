"use client";

import dynamic from "next/dynamic";

const DevHomeClientNoSSR = dynamic(
  () => import("./DevHomeClient").then((module) => module.DevHomeClient),
  {
    ssr: false,
    loading: () => <main className="h-screen w-full overflow-hidden bg-[#111111]" />,
  },
);

export default function DevHomeNoSSR() {
  return <DevHomeClientNoSSR />;
}
