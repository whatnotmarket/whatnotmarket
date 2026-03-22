"use client";

import { cn } from "@/lib/core/utils/utils";
import { Squircle as ReactSquircle } from "@squircle-js/react";
import React from "react";

type SquircleProps = {
  /** The corner radius in pixels. Defaults to 24. */
  radius?: number;
  /** The smoothing factor (0 to 1). Defaults to 0.8. */
  smoothing?: number;
  /** Additional classes for the outer wrapper. */
  className?: string;
  /** Additional classes for the inner clipped element. */
  innerClassName?: string;
  /** Optional border width in pixels. Defaults to 0 (no border). */
  borderWidth?: number;
  /** Optional border color. Defaults to var(--border). */
  borderColor?: string;
  /** Optional class applied when border is enabled. */
  borderClassName?: string;
  /** The content to be clipped. */
  children?: React.ReactNode;
  /** Whether to render as a specific HTML element. Defaults to div. */
  as?: React.ElementType;
  /** Which corners to round. Defaults to all. */
  corners?: "all" | "top" | "bottom" | "left" | "right";
} & React.HTMLAttributes<HTMLElement>;

function getCornerRadius(corners: NonNullable<SquircleProps["corners"]>, radius: number) {
  if (corners === "all") return radius;
  const tl = corners === "top" || corners === "left" ? radius : 0;
  const tr = corners === "top" || corners === "right" ? radius : 0;
  const br = corners === "bottom" || corners === "right" ? radius : 0;
  const bl = corners === "bottom" || corners === "left" ? radius : 0;
  return `${tl}px ${tr}px ${br}px ${bl}px`;
}

export const Squircle = React.memo(
  React.forwardRef<HTMLElement, SquircleProps>(
    (
      {
        radius = 24,
        smoothing = 0.8,
        className,
        innerClassName,
        borderWidth = 0,
        borderColor,
        borderClassName,
        children,
        as: Component = "div",
        corners = "all",
        style,
        ...props
      },
      forwardedRef,
    ) => {
      const borderShadow =
        borderWidth > 0 ? `inset 0 0 0 ${borderWidth}px ${borderColor || "var(--border)"}` : undefined;

      const baseInnerClass = cn("h-full w-full", innerClassName, borderWidth > 0 && borderClassName);

      return (
        <Component ref={forwardedRef} className={cn("relative", className)} style={style} {...props}>
          {corners === "all" ? (
            <ReactSquircle
              cornerRadius={radius}
              cornerSmoothing={smoothing}
              className={baseInnerClass}
              style={{ boxShadow: borderShadow }}
            >
              {children}
            </ReactSquircle>
          ) : (
            <div
              className={baseInnerClass}
              style={{
                borderRadius: getCornerRadius(corners, radius),
                overflow: "hidden",
                boxShadow: borderShadow,
              }}
            >
              {children}
            </div>
          )}
        </Component>
      );
    },
  ),
);

Squircle.displayName = "Squircle";

export const SquircleCard = React.forwardRef<HTMLElement, React.ComponentProps<typeof Squircle>>(
  ({ className, children, ...props }, ref) => {
    return (
      <Squircle
        ref={ref}
        radius={20}
        smoothing={1}
        borderWidth={1}
        borderColor="var(--border)"
        className={cn("drop-shadow-lg", className)}
        innerClassName="bg-zinc-950/40 text-card-foreground backdrop-blur-md"
        {...props}
      >
        {children}
      </Squircle>
    );
  },
);

SquircleCard.displayName = "SquircleCard";

