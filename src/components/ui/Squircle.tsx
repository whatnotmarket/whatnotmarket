"use client";

import React, { useId, useMemo, useCallback } from "react";
import { useResizeObserver } from "@/hooks/use-resize-observer";
import { cn } from "@/lib/utils";

type SquircleProps = {
  /** The corner radius in pixels. Defaults to 24. */
  radius?: number;
  /** The smoothing factor (0 to 1). Defaults to 0.8. 0 is standard rounded corner, 1 is full squircle. */
  smoothing?: number;
  /** Additional classes for the outer wrapper. Use this for positioning, margins, and drop-shadows. */
  className?: string;
  /** Additional classes for the inner clipped element. Use this for background, padding, and text colors. */
  innerClassName?: string;
  /** Optional border width in pixels. Defaults to 0 (no border). */
  borderWidth?: number;
  /** Optional border color. Defaults to 'currentColor' or transparent. */
  borderColor?: string;
  /** Optional class for the border SVG path. */
  borderClassName?: string;
  /** The content to be clipped. */
  children?: React.ReactNode;
  /** Whether to render as a specific HTML element. Defaults to 'div'. */
  as?: React.ElementType;
  /** Which corners to round. Defaults to 'all'. */
  corners?: "all" | "top" | "bottom" | "left" | "right";
} & React.HTMLAttributes<HTMLElement>;

/**
 * Generates an SVG path for a rectangle with squircle corners.
 */
function getSquirclePath(w: number, h: number, r: number, s: number, corners: "all" | "top" | "bottom" | "left" | "right" = "all") {
  // Clamp radius to half the shortest side to avoid overlapping curves
  const maxR = Math.min(w, h) / 2;
  const radius = Math.min(r, maxR);

  if (radius <= 0) {
    return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
  }

  // Squircle constants
  const k = 1 + s * 0.6; // 0.6 is an empirical factor for iOS-like curve
  const c = radius * 0.5522847498 * k;

  const tl = (corners === "all" || corners === "top" || corners === "left") ? radius : 0;
  const tr = (corners === "all" || corners === "top" || corners === "right") ? radius : 0;
  const br = (corners === "all" || corners === "bottom" || corners === "right") ? radius : 0;
  const bl = (corners === "all" || corners === "bottom" || corners === "left") ? radius : 0;

  const c_tl = tl > 0 ? c : 0;
  const c_tr = tr > 0 ? c : 0;
  const c_br = br > 0 ? c : 0;
  const c_bl = bl > 0 ? c : 0;
  
  return `
    M 0 ${tl}
    C 0 ${tl - c_tl}, ${tl - c_tl} 0, ${tl} 0
    L ${w - tr} 0
    C ${w - tr + c_tr} 0, ${w} ${tr - c_tr}, ${w} ${tr}
    L ${w} ${h - br}
    C ${w} ${h - br + c_br}, ${w - br + c_br} ${h}, ${w - br} ${h}
    L ${bl} ${h}
    C ${bl - c_bl} ${h}, 0 ${h - bl + c_bl}, 0 ${h - bl}
    Z
  `;
}

export const Squircle = React.memo(React.forwardRef<HTMLElement, SquircleProps>(({
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
}, forwardedRef) => {
  const id = useId();
  const [internalRef, size] = useResizeObserver<HTMLElement>();
  
  // Merge refs
  const setRefs = useCallback((node: HTMLElement | null) => {
    // Set internal ref for ResizeObserver
    if (internalRef && typeof internalRef === 'object') {
      (internalRef as React.MutableRefObject<HTMLElement | null>).current = node;
    }
    
    // Set forwarded ref
    if (typeof forwardedRef === 'function') {
      forwardedRef(node);
    } else if (forwardedRef && typeof forwardedRef === 'object') {
      (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node;
    }
  }, [internalRef, forwardedRef]);

  // Fallback if size is 0 (initial render)
  const isReady = size.width > 0 && size.height > 0;
  
  const path = useMemo(() => {
    if (!isReady) return "";
    return getSquirclePath(size.width, size.height, radius, smoothing, corners);
  }, [size.width, size.height, radius, smoothing, corners, isReady]);

  const fallbackRadius = useMemo(() => {
    if (isReady) return undefined;
    if (corners === "all") return radius;
    const tl = (corners === "top" || corners === "left") ? radius : 0;
    const tr = (corners === "top" || corners === "right") ? radius : 0;
    const br = (corners === "bottom" || corners === "right") ? radius : 0;
    const bl = (corners === "bottom" || corners === "left") ? radius : 0;
    return `${tl}px ${tr}px ${br}px ${bl}px`;
  }, [isReady, corners, radius]);

  const clipPathId = `squircle-clip-${id}`;

  return (
    <Component
      ref={setRefs}
      className={cn("relative", className)}
      style={style}
      {...props}
    >
      {/* SVG Definitions for ClipPath */}
      {isReady && (
        <svg
          className="absolute pointer-events-none w-0 h-0"
          aria-hidden="true"
        >
          <defs>
            <clipPath id={clipPathId}>
              <path d={path} />
            </clipPath>
          </defs>
        </svg>
      )}

      {/* Main Content */}
      <div
        className={cn(innerClassName)}
        style={{
          // Use clip-path if ready, otherwise fallback to standard border-radius
          clipPath: isReady ? `url(#${clipPathId})` : undefined,
          borderRadius: fallbackRadius,
          width: "100%",
          height: "100%",
        }}
      >
        {children}
      </div>

      {/* Optional Border Overlay */}
      {borderWidth > 0 && isReady && (
        <svg
          className="absolute inset-0 pointer-events-none h-full w-full overflow-visible"
          style={{ zIndex: 10 }} // Ensure border is on top
        >
          <path
            d={path}
            fill="none"
            stroke={borderColor || "var(--border)"}
            strokeWidth={borderWidth}
            vectorEffect="non-scaling-stroke"
            shapeRendering="geometricPrecision"
            className={borderClassName}
          />
        </svg>
      )}
    </Component>
  );
}));

Squircle.displayName = "Squircle";

// Example Wrapper for Card
export const SquircleCard = React.forwardRef<HTMLElement, React.ComponentProps<typeof Squircle>>(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <Squircle
      ref={ref}
      radius={20}
      smoothing={1}
      borderWidth={1}
      borderColor="var(--border)"
      className={cn("drop-shadow-lg", className)} // Shadow goes on wrapper
      innerClassName="bg-zinc-950/40 text-card-foreground backdrop-blur-md"
      {...props}
    >
      {children}
    </Squircle>
  );
});

SquircleCard.displayName = "SquircleCard";
