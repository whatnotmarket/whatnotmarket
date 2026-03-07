"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

type AnimationSnapshot = Record<string, string | number | undefined>;

type BlurTextProps = {
  text?: string;
  delay?: number;
  className?: string;
  animateBy?: "words" | "letters";
  direction?: "top" | "bottom";
  threshold?: number;
  rootMargin?: string;
  animationFrom?: AnimationSnapshot;
  animationTo?: AnimationSnapshot[];
  easing?: (value: number) => number;
  onAnimationComplete?: () => void;
  stepDuration?: number;
};

function buildKeyframes(from: AnimationSnapshot, steps: AnimationSnapshot[]) {
  const keys = new Set<string>([
    ...Object.keys(from),
    ...steps.flatMap((step) => Object.keys(step)),
  ]);

  const keyframes: Record<string, Array<string | number | undefined>> = {};

  keys.forEach((key) => {
    keyframes[key] = [from[key], ...steps.map((step) => step[key])];
  });

  return keyframes;
}

export default function BlurText({
  text = "",
  delay = 200,
  className = "",
  animateBy = "words",
  direction = "top",
  threshold = 0.1,
  rootMargin = "0px",
  animationFrom,
  animationTo,
  easing = (value) => value,
  onAnimationComplete,
  stepDuration = 0.35,
}: BlurTextProps) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLSpanElement | null>(null);

  const segments = useMemo(
    () => (animateBy === "words" ? text.split(" ") : text.split("")),
    [animateBy, text]
  );

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (ref.current) {
            observer.unobserve(ref.current);
          }
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const defaultFrom = useMemo(
    () =>
      direction === "top"
        ? { filter: "blur(10px)", opacity: 0, y: -50 }
        : { filter: "blur(10px)", opacity: 0, y: 50 },
    [direction]
  );

  const defaultTo = useMemo(
    () => [
      {
        filter: "blur(5px)",
        opacity: 0.5,
        y: direction === "top" ? 5 : -5,
      },
      { filter: "blur(0px)", opacity: 1, y: 0 },
    ],
    [direction]
  );

  const fromSnapshot = animationFrom ?? defaultFrom;
  const toSnapshots = animationTo ?? defaultTo;
  const animateKeyframes = useMemo(
    () => buildKeyframes(fromSnapshot, toSnapshots),
    [fromSnapshot, toSnapshots]
  );

  const stepCount = toSnapshots.length + 1;
  const totalDuration = stepDuration * (stepCount - 1);
  const times = Array.from(
    { length: stepCount },
    (_, index) => (stepCount === 1 ? 0 : index / (stepCount - 1))
  );

  return (
    <span
      ref={ref}
      className={className}
      style={{ display: "inline-flex", flexWrap: "wrap" }}
    >
      {segments.map((segment, index) => (
        <motion.span
          className="inline-block will-change-[transform,filter,opacity]"
          key={`${segment}-${index}`}
          initial={fromSnapshot as never}
          animate={inView ? (animateKeyframes as never) : (fromSnapshot as never)}
          transition={{
            duration: totalDuration,
            times,
            delay: (index * delay) / 1000,
            ease: easing,
          }}
          onAnimationComplete={
            index === segments.length - 1 ? onAnimationComplete : undefined
          }
        >
          {segment === " " ? "\u00A0" : segment}
          {animateBy === "words" && index < segments.length - 1 ? "\u00A0" : null}
        </motion.span>
      ))}
    </span>
  );
}
