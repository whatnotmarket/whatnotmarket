"use client";

import type { CSSProperties } from "react";
import { TwicImg } from "@twicpics/components/react";

type CssVars = CSSProperties & {
  "--twic-ratio"?: string;
};

export default function ImageExample() {
  return (
    <section className="twic-example-grid">
      {/* Basic TwicImg example with fixed 16/9 ratio. */}
      <TwicImg
        src="images/sample.jpg"
        alt="TwicPics sample image"
        ratio="16/9"
        mode="cover"
        className="twic-example-basic"
      />

      {/* Responsive ratio via CSS variable + breakpoint overrides. */}
      <div className="twic-ratio-responsive" style={{ "--twic-ratio": "4/5" } as CssVars}>
        <TwicImg
          src="images/sample.jpg"
          alt="TwicPics responsive sample image"
          ratio="var(--twic-ratio)"
          mode="cover"
          className="twic-example-responsive"
        />
      </div>
    </section>
  );
}

