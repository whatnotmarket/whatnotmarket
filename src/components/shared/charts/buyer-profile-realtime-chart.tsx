"use client";

import LightweightChart from "@/components/shared/charts/lightweight-chart";
import { profileChartTheme } from "@/components/shared/charts/profile-chart-theme";
import { cn } from "@/lib/core/utils/utils";
import { createClient } from "@/lib/infra/supabase/supabase";
import {
ColorType,
LineStyle,
TickMarkType,
type SingleValueData,
type Time,
type UTCTimestamp,
} from "lightweight-charts";
import { useCallback,useEffect,useMemo,useRef,useState } from "react";

type BuyerProfileRealtimeChartProps = {
  userId: string;
  memberSince: string | null;
  roleRatingTitle?: string;
  className?: string;
  height?: number;
};

type MetricEventType = "purchase" | "dispute" | "follower" | "review" | "message" | "message_ciao";

type MetricEvent = {
  type: MetricEventType;
  atMs: number;
};

type BuyerProfileChartApiResponse = {
  ok: boolean;
  events?: {
    purchases?: string[];
    disputes?: string[];
    followers?: string[];
    reviews?: string[];
    messagesUp?: string[];
    messagesDown?: string[];
    ratingsHistory?: Array<{ time: string; rating: number }>;
  };
  error?: string;
};

type RealtimePayload<T extends Record<string, unknown>> = {
  eventType?: "INSERT" | "UPDATE" | "DELETE";
  new?: T;
  old?: T;
};

const CHART_UPDATE_DEBOUNCE_MS = 450;
const CHART_POLLING_MS = 45_000;
const MESSAGE_ALERT_DURATION_MS = 2_200;
const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_PROFILE_RATING = 1;
const MAX_PROFILE_RATING = 5;
const DEFAULT_PROFILE_RATING = 2.5;
const ITALIAN_DATE_LOCALE = "it-IT";

function toUtcDateFromChartTime(time: Time): Date | null {
  if (typeof time === "number") {
    const date = new Date(time * 1000);
    return Number.isFinite(date.getTime()) ? date : null;
  }
  if (typeof time === "string") {
    const date = new Date(time);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  const date = new Date(Date.UTC(time.year, time.month - 1, time.day));
  return Number.isFinite(date.getTime()) ? date : null;
}

function formatTimeAxisTickLabel(time: Time, tickMarkType: TickMarkType) {
  const date = toUtcDateFromChartTime(time);
  if (!date) return "";

  if (tickMarkType === TickMarkType.Month) {
    return date.toLocaleDateString(ITALIAN_DATE_LOCALE, { month: "short", timeZone: "UTC" });
  }

  if (tickMarkType === TickMarkType.Year) {
    return String(date.getUTCFullYear());
  }

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

function pulseDeltaByMetric(metric: MetricEventType) {
  if (metric === "purchase") return 0.18;
  if (metric === "review") return 0.14;
  if (metric === "follower") return 0.1;
  if (metric === "message") return 0.09;
  if (metric === "message_ciao") return 0.22;
  return -0.24; // dispute
}

function parseIsoToMs(value: string | null | undefined) {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function dayStartMs(valueMs: number) {
  const date = new Date(valueMs);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function dayDiff(startMs: number, endMs: number) {
  const startDay = dayStartMs(startMs);
  const endDay = dayStartMs(endMs);
  return Math.max(0, Math.floor((endDay - startDay) / DAY_MS));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function statusToMetric(status: string | null | undefined): MetricEventType | null {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "completed") return "purchase";
  if (normalized === "dispute") return "dispute";
  return null;
}

function isCiaoMessage(value: string | null | undefined) {
  const text = String(value || "").trim();
  if (!text) return false;
  return /\bciao\b/i.test(text);
}

function rankingWeight(totalPurchases: number) {
  if (totalPurchases >= 20) return 0.34;
  if (totalPurchases >= 5) return 0.2;
  if (totalPurchases >= 1) return 0.12;
  return 0;
}

function computeRoleRatingScore(input: {
  purchases: number;
  disputes: number;
  followers: number;
  reviews: number;
  messagesUp: number;
  messagesDown: number;
  activeDays: number;
  averageReviewRating: number | null;
}) {
  const baseFromReviews = input.averageReviewRating ?? DEFAULT_PROFILE_RATING;
  const purchaseScore = Math.min(input.purchases * 0.05, 0.82);
  const followersScore = Math.min(input.followers * 0.014, 0.4);
  const reviewsScore = Math.min(input.reviews * 0.03, 0.52);
  const messageBoost = Math.min(input.messagesUp * 0.012, 0.38);
  const ciaoPenalty = Math.min(input.messagesDown * 0.03, 0.95);
  const activityScore = Math.min((input.activeDays / 365) * 0.35, 0.35);
  const disputesPenalty = Math.min(input.disputes * 0.13, 1.15);
  const score =
    baseFromReviews +
    purchaseScore +
    followersScore +
    reviewsScore +
    messageBoost +
    activityScore +
    rankingWeight(input.purchases) -
    ciaoPenalty -
    disputesPenalty;

  return Number(clamp(score, MIN_PROFILE_RATING, MAX_PROFILE_RATING).toFixed(2));
}

function buildSeriesFromEvents(
  events: MetricEvent[],
  memberSince: string | null,
  ratingsHistory: Array<{ atMs: number; rating: number }>
): SingleValueData<Time>[] {
  const nowMs = Date.now();
  const memberSinceMs = parseIsoToMs(memberSince);
  const firstEventMs = events.length > 0 ? Math.min(...events.map((event) => event.atMs)) : null;
  const fallbackStartMs = nowMs - 120 * DAY_MS;
  const startMs = memberSinceMs ?? firstEventMs ?? fallbackStartMs;
  const startDay = dayStartMs(startMs);
  const endDay = dayStartMs(nowMs);

  if (events.length === 0) {
    const flatEndDay = endDay === startDay ? startDay + DAY_MS : endDay;
    return [
      {
        time: Math.floor(startDay / 1000) as UTCTimestamp,
        value: DEFAULT_PROFILE_RATING,
      },
      {
        time: Math.floor(flatEndDay / 1000) as UTCTimestamp,
        value: DEFAULT_PROFILE_RATING,
      },
    ];
  }

  const sortedEvents = [...events].sort((left, right) => left.atMs - right.atMs);
  const sortedRatings = [...ratingsHistory].sort((left, right) => left.atMs - right.atMs);

  let eventIndex = 0;
  let ratingIndex = 0;
  let purchases = 0;
  let disputes = 0;
  let followers = 0;
  let reviews = 0;
  let messagesUp = 0;
  let messagesDown = 0;
  let ratingSum = 0;
  let ratingCount = 0;

  const points: SingleValueData<Time>[] = [];

  const totalDays = dayDiff(startDay, endDay);
  for (let dayOffset = 0; dayOffset <= totalDays; dayOffset += 1) {
    const bucketStartMs = startDay + dayOffset * DAY_MS;
    const bucketEndMs = bucketStartMs + DAY_MS - 1;

    while (eventIndex < sortedEvents.length && sortedEvents[eventIndex]!.atMs <= bucketEndMs) {
      const event = sortedEvents[eventIndex]!;
      if (event.type === "purchase") purchases += 1;
      if (event.type === "dispute") disputes += 1;
      if (event.type === "follower") followers += 1;
      if (event.type === "review") reviews += 1;
      if (event.type === "message") messagesUp += 1;
      if (event.type === "message_ciao") messagesDown += 1;
      eventIndex += 1;
    }

    while (ratingIndex < sortedRatings.length && sortedRatings[ratingIndex]!.atMs <= bucketEndMs) {
      const rating = sortedRatings[ratingIndex]!;
      ratingSum += rating.rating;
      ratingCount += 1;
      ratingIndex += 1;
    }

    const averageReviewRating = ratingCount > 0 ? ratingSum / ratingCount : null;
    const activeDays = Math.max(1, dayOffset + 1);
    const rawScore = computeRoleRatingScore({
      purchases,
      disputes,
      followers,
      reviews,
      messagesUp,
      messagesDown,
      activeDays,
      averageReviewRating,
    });

    points.push({
      time: Math.floor(bucketStartMs / 1000) as UTCTimestamp,
      value: Number(rawScore.toFixed(2)),
    });
  }

  if (points.length === 0) {
    points.push({
      time: Math.floor(nowMs / 1000) as UTCTimestamp,
      value: DEFAULT_PROFILE_RATING,
    });
  }

  // Hard guard: Lightweight Charts requires strictly ascending, unique timestamps.
  // Keep the latest value for duplicated timestamps, then return sorted asc.
  const dedupedByTime = new Map<number, number>();
  for (const point of points) {
    const unixTime = Number(point.time);
    const value = Number(point.value);
    if (!Number.isFinite(unixTime) || !Number.isFinite(value)) continue;
    dedupedByTime.set(unixTime, value);
  }

  const normalized = Array.from(dedupedByTime.entries())
    .sort((left, right) => left[0] - right[0])
    .map(([time, value]) => ({
      time: time as UTCTimestamp,
      value,
    }));

  if (normalized.length === 0) {
    return [
      {
        time: Math.floor(nowMs / 1000) as UTCTimestamp,
        value: DEFAULT_PROFILE_RATING,
      },
    ];
  }

  if (normalized.length === 1) {
    const single = normalized[0]!;
    return [
      single,
      {
        time: (Number(single.time) + Math.floor(DAY_MS / 1000)) as UTCTimestamp,
        value: single.value,
      },
    ];
  }

  return normalized;
}

function buildRatingByTime(points: SingleValueData<Time>[], history: Array<{ atMs: number; rating: number }>) {
  const sortedHistory = [...history].sort((left, right) => left.atMs - right.atMs);
  const result = new Map<number, number>();

  let index = 0;
  let count = 0;
  let sum = 0;

  for (const point of points) {
    const pointMs = Number(point.time) * 1000;
    while (index < sortedHistory.length && sortedHistory[index]!.atMs <= pointMs) {
      const item = sortedHistory[index]!;
      sum += item.rating;
      count += 1;
      index += 1;
    }

    if (count > 0) {
      result.set(Number(point.time), Number((sum / count).toFixed(2)));
    }
  }

  return result;
}

export default function BuyerProfileRealtimeChart({
  userId,
  memberSince,
  roleRatingTitle,
  className,
  height,
}: BuyerProfileRealtimeChartProps) {
  const supabase = useMemo(() => createClient(), []);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const refreshDebounceRef = useRef<number | null>(null);
  const messageAlertTimeoutRef = useRef<number | null>(null);
  const [dynamicHeight, setDynamicHeight] = useState<number>(profileChartTheme.buyerProfileChartFallbackHeightPx);

  const [seriesData, setSeriesData] = useState<SingleValueData<Time>[]>([]);
  const [ratingByTime, setRatingByTime] = useState<Map<number, number>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isMessageAlertActive, setIsMessageAlertActive] = useState(false);
  const chartColors = profileChartTheme.colors;
  const chartHeight =
    typeof height === "number" && height > profileChartTheme.buyerProfileChartMinHeightPx ? height : dynamicHeight;

  const applyRealtimePulse = useCallback((metric: MetricEventType, direction: 1 | -1 = 1) => {
    setSeriesData((previous) => {
      if (!previous.length) return previous;

      const next = [...previous];
      const lastIndex = next.length - 1;
      const lastPoint = next[lastIndex];
      if (!lastPoint) return previous;

      const delta = pulseDeltaByMetric(metric) * direction;
      const nextValue = Number(
        clamp(Number(lastPoint.value) + delta, MIN_PROFILE_RATING, MAX_PROFILE_RATING).toFixed(2)
      );

      next[lastIndex] = {
        ...lastPoint,
        value: nextValue,
      };
      return next;
    });
  }, []);

  const triggerMessageAlert = useCallback(() => {
    if (messageAlertTimeoutRef.current !== null) {
      window.clearTimeout(messageAlertTimeoutRef.current);
      messageAlertTimeoutRef.current = null;
    }

    setIsMessageAlertActive(true);
    messageAlertTimeoutRef.current = window.setTimeout(() => {
      setIsMessageAlertActive(false);
      messageAlertTimeoutRef.current = null;
    }, MESSAGE_ALERT_DURATION_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (messageAlertTimeoutRef.current !== null) {
        window.clearTimeout(messageAlertTimeoutRef.current);
        messageAlertTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof height === "number" && height > profileChartTheme.buyerProfileChartMinHeightPx) return;
    const node = rootRef.current;
    if (!node) return;

    const updateHeight = () => {
      const measured = Math.floor(node.clientHeight);
      if (Number.isFinite(measured) && measured > profileChartTheme.buyerProfileChartMinHeightPx) {
        setDynamicHeight(measured);
      }
    };

    updateHeight();
    const observer = new ResizeObserver(() => updateHeight());
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [height]);

  const loadChartData = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/new-home/buyer-profile-chart?userId=${encodeURIComponent(userId)}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Buyer chart fetch failed (${response.status})`);
      }

      const payload = (await response.json()) as BuyerProfileChartApiResponse;
      if (!payload.ok || !payload.events) {
        throw new Error(payload.error || "Buyer chart payload is invalid");
      }

      const purchaseEvents: MetricEvent[] = (payload.events.purchases || [])
        .map((timestamp) => parseIsoToMs(timestamp))
        .filter((value): value is number => value !== null)
        .map((atMs) => ({ type: "purchase", atMs }));

      const disputeEvents: MetricEvent[] = (payload.events.disputes || [])
        .map((timestamp) => parseIsoToMs(timestamp))
        .filter((value): value is number => value !== null)
        .map((atMs) => ({ type: "dispute", atMs }));

      const followerEvents: MetricEvent[] = (payload.events.followers || [])
        .map((timestamp) => parseIsoToMs(timestamp))
        .filter((value): value is number => value !== null)
        .map((atMs) => ({ type: "follower", atMs }));

      const reviewEvents: MetricEvent[] = (payload.events.reviews || [])
        .map((timestamp) => parseIsoToMs(timestamp))
        .filter((value): value is number => value !== null)
        .map((atMs) => ({ type: "review", atMs }));

      const messageUpEvents: MetricEvent[] = (payload.events.messagesUp || [])
        .map((timestamp) => parseIsoToMs(timestamp))
        .filter((value): value is number => value !== null)
        .map((atMs) => ({ type: "message", atMs }));

      const messageDownEvents: MetricEvent[] = (payload.events.messagesDown || [])
        .map((timestamp) => parseIsoToMs(timestamp))
        .filter((value): value is number => value !== null)
        .map((atMs) => ({ type: "message_ciao", atMs }));

      const ratingsHistory = (payload.events.ratingsHistory || [])
        .map((item) => ({
          atMs: parseIsoToMs(item.time),
          rating: item.rating,
        }))
        .filter((item): item is { atMs: number; rating: number } => {
          return item.atMs !== null && Number.isFinite(item.rating);
        });

      const allEvents = [
        ...purchaseEvents,
        ...disputeEvents,
        ...followerEvents,
        ...reviewEvents,
        ...messageUpEvents,
        ...messageDownEvents,
      ];
      const nextSeriesData = buildSeriesFromEvents(allEvents, memberSince, ratingsHistory);

      setSeriesData(nextSeriesData);
      setRatingByTime(buildRatingByTime(nextSeriesData, ratingsHistory));
      setErrorText(null);
    } catch {
      setErrorText("Unable to load buyer chart");
    } finally {
      setIsLoading(false);
    }
  }, [memberSince, userId]);

  useEffect(() => {
    if (!userId) return;

    const scheduleRefresh = () => {
      if (refreshDebounceRef.current !== null) return;

      refreshDebounceRef.current = window.setTimeout(() => {
        refreshDebounceRef.current = null;
        void loadChartData();
      }, CHART_UPDATE_DEBOUNCE_MS);
    };

    const triggerRealtimeUpdate = (metric: MetricEventType, direction: 1 | -1 = 1) => {
      applyRealtimePulse(metric, direction);
      scheduleRefresh();
    };

    void loadChartData();

    const pollingId = window.setInterval(() => {
      void loadChartData();
    }, CHART_POLLING_MS);

    const channel = supabase
      .channel(`buyer-profile-chart:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deals",
          filter: `buyer_id=eq.${userId}`,
        },
        (payload: RealtimePayload<{ status?: string | null }>) => {
          const eventType = payload.eventType || "UPDATE";
          const previousMetric = statusToMetric(payload.old?.status);
          const nextMetric = statusToMetric(payload.new?.status);

          if (eventType === "INSERT") {
            if (nextMetric) triggerRealtimeUpdate(nextMetric, 1);
            else scheduleRefresh();
            return;
          }

          if (eventType === "DELETE") {
            if (previousMetric) triggerRealtimeUpdate(previousMetric, -1);
            else scheduleRefresh();
            return;
          }

          if (previousMetric && previousMetric !== nextMetric) {
            triggerRealtimeUpdate(previousMetric, -1);
          }
          if (nextMetric && nextMetric !== previousMetric) {
            triggerRealtimeUpdate(nextMetric, 1);
            return;
          }
          scheduleRefresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "follows",
          filter: `following_id=eq.${userId}`,
        },
        (payload: RealtimePayload<Record<string, unknown>>) => {
          const eventType = payload.eventType || "UPDATE";
          if (eventType === "DELETE") {
            triggerRealtimeUpdate("follower", -1);
            return;
          }
          triggerRealtimeUpdate("follower", 1);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_reviews",
          filter: `reviewee_id=eq.${userId}`,
        },
        (payload: RealtimePayload<Record<string, unknown>>) => {
          const eventType = payload.eventType || "UPDATE";
          if (eventType === "DELETE") {
            triggerRealtimeUpdate("review", -1);
            return;
          }
          triggerRealtimeUpdate("review", 1);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "global_chat_messages",
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePayload<{ is_deleted?: boolean | null; message?: string | null }>) => {
          const eventType = payload.eventType || "UPDATE";
          const nextDeleted = payload.new?.is_deleted === true;
          const nextMessageText = String(payload.new?.message || "").trim();
          const hasTextMessage = nextMessageText.length > 0;

          // Rule: text message goes up, but "ciao" goes down.
          if (eventType === "INSERT" && !nextDeleted && hasTextMessage) {
            triggerMessageAlert();
            if (isCiaoMessage(nextMessageText)) {
              triggerRealtimeUpdate("message_ciao", -1);
            } else {
              triggerRealtimeUpdate("message", 1);
            }
            return;
          }

          scheduleRefresh();
        }
      )
      .subscribe();

    return () => {
      if (refreshDebounceRef.current !== null) {
        window.clearTimeout(refreshDebounceRef.current);
        refreshDebounceRef.current = null;
      }
      window.clearInterval(pollingId);
      void supabase.removeChannel(channel);
    };
  }, [applyRealtimePulse, loadChartData, supabase, triggerMessageAlert, userId]);

  const chartPalette = isMessageAlertActive ? chartColors.alert : chartColors.normal;
  const resolveTooltipRating = useCallback(
    (time: Time) => {
      const key = Number(time);
      if (Number.isFinite(key) && ratingByTime.has(key)) {
        return ratingByTime.get(key) ?? null;
      }

      const orderedKeys = Array.from(ratingByTime.keys()).sort((left, right) => left - right);
      let fallback: number | null = null;
      for (const unix of orderedKeys) {
        if (unix > key) break;
        fallback = ratingByTime.get(unix) ?? null;
      }
      return fallback;
    },
    [ratingByTime]
  );
  const containerStyle =
    typeof height === "number" && height > profileChartTheme.buyerProfileChartMinHeightPx
      ? { height: `${height}px`, backgroundColor: chartColors.containerBackground }
      : { backgroundColor: chartColors.containerBackground };

  return (
    <div
      ref={rootRef}
      className={cn("relative w-full overflow-hidden rounded-[14px]", className)}
      style={containerStyle}
    >
      <LightweightChart
        kind="area"
        height={chartHeight}
        data={seriesData}
        autoFitContent
        trackingTooltip={{
          enabled: profileChartTheme.tooltip.enabled,
          mode: profileChartTheme.tooltip.mode,
          title: roleRatingTitle || profileChartTheme.tooltip.title,
          subtitleBuilder: ({ time }) => {
            const rating = resolveTooltipRating(time);
            if (rating === null) return null;
            return {
              label: profileChartTheme.tooltip.ratingLabel,
              value: rating.toFixed(2),
            };
          },
          widthPx: profileChartTheme.tooltip.widthPx,
          minHeightPx: profileChartTheme.tooltip.minHeightPx,
          offsetPx: profileChartTheme.tooltip.offsetPx,
          borderRadiusPx: profileChartTheme.tooltip.borderRadiusPx,
          fontSizePx: profileChartTheme.tooltip.fontSizePx,
          priceDecimals: profileChartTheme.tooltip.priceDecimals,
          locale: profileChartTheme.tooltip.locale,
          backgroundColor: profileChartTheme.tooltip.backgroundColor,
          borderColor: isMessageAlertActive ? chartPalette.priceLineColor : profileChartTheme.tooltip.borderColor,
          titleColor: profileChartTheme.tooltip.titleColor,
          valueColor: profileChartTheme.tooltip.valueColor,
          dateColor: profileChartTheme.tooltip.dateColor,
        }}
        chartOptions={{
          layout: {
            background: { type: ColorType.Solid, color: chartColors.containerBackground },
            textColor: "rgba(205, 218, 227, 0.86)",
            attributionLogo: false,
          },
          grid: {
            vertLines: { visible: true, color: chartColors.gridLine },
            horzLines: { visible: true, color: chartColors.gridLine },
          },
          rightPriceScale: {
            visible: true,
            borderVisible: false,
            scaleMargins: { top: 0.12, bottom: 0.08 },
          },
          leftPriceScale: {
            visible: false,
            scaleMargins: { top: 0.12, bottom: 0.08 },
          },
          timeScale: {
            visible: true,
            borderVisible: false,
            rightOffset: profileChartTheme.timeScale.rightOffset,
            rightOffsetPixels: profileChartTheme.timeScale.rightOffsetPixels,
            barSpacing: profileChartTheme.timeScale.barSpacing,
            fixLeftEdge: profileChartTheme.timeScale.fixLeftEdge,
            fixRightEdge: profileChartTheme.timeScale.fixRightEdge,
            timeVisible: true,
            secondsVisible: false,
            tickMarkFormatter: (time: Time, tickMarkType: TickMarkType) =>
              formatTimeAxisTickLabel(time, tickMarkType),
          },
          handleScroll: {
            mouseWheel: true,
            pressedMouseMove: true,
            horzTouchDrag: true,
            vertTouchDrag: false,
          },
          handleScale: {
            mouseWheel: true,
            pinch: true,
            axisPressedMouseMove: true,
            axisDoubleClickReset: true,
          },
          crosshair: {
            vertLine: { visible: false, labelVisible: false },
            horzLine: { visible: false, labelVisible: false },
          },
        }}
        seriesOptions={{
          lineColor: chartPalette.lineColor,
          topColor: chartPalette.topColor,
          bottomColor: chartPalette.bottomColor,
          lineWidth: 3,
          priceFormat: {
            type: "custom",
            minMove: 0.01,
            formatter: (value: number) => `${value.toFixed(2)} \u2605`,
          },
          priceLineVisible: true,
          priceLineStyle: LineStyle.Dotted,
          priceLineColor: chartPalette.priceLineColor,
          crosshairMarkerVisible: false,
        }}
      />

      {isLoading ? (
        <div
          className="absolute inset-0 flex items-center justify-center text-[12px]"
          style={{
            backgroundColor: chartColors.loadingOverlayBackground,
            color: chartColors.loadingText,
          }}
        >
          Loading chart...
        </div>
      ) : null}

      {errorText ? (
        <div
          className="absolute inset-0 flex items-center justify-center px-4 text-center text-[12px]"
          style={{
            backgroundColor: chartColors.errorOverlayBackground,
            color: chartColors.errorText,
          }}
        >
          {errorText}
        </div>
      ) : null}
    </div>
  );
}


