"use client";

import { TwicInstall } from "@twicpics/components/react";

export function TwicProvider() {
  // Initializes TwicPics once at app root.
  return <TwicInstall domain="https://example.twic.pics" />;
}

