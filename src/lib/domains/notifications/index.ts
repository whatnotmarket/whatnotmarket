import type { ReactNode } from "react";
import { sileo, type SileoOptions, type SileoState } from "sileo";
import {
  notificationScopeDefaults,
  notificationScopePosition,
  type NotificationScope,
} from "./positions";

type ToastInput =
  | string
  | {
      title?: string;
      description?: ReactNode | string;
      duration?: number | null;
      action?: {
        label: string;
        onClick: () => void;
      };
    };

type ToastOverrides = Partial<
  Pick<SileoOptions, "description" | "duration" | "icon" | "styles" | "button" | "roundness" | "fill" | "autopilot">
>;

type ToastPromiseConfig<T> = {
  loading: ToastInput;
  success: ToastInput | ((data: T) => ToastInput);
  error: ToastInput | ((error: unknown) => ToastInput);
  action?: ToastInput | ((data: T) => ToastInput);
};

type ScopedToast = {
  show: (message: ToastInput, options?: ToastOverrides) => string;
  success: (message: ToastInput, options?: ToastOverrides) => string;
  error: (message: ToastInput, options?: ToastOverrides) => string;
  warning: (message: ToastInput, options?: ToastOverrides) => string;
  info: (message: ToastInput, options?: ToastOverrides) => string;
  action: (message: ToastInput, options?: ToastOverrides) => string;
  promise: <T>(
    promise: Promise<T> | (() => Promise<T>),
    config: ToastPromiseConfig<T>
  ) => Promise<T>;
  dismiss: (id?: string) => void;
  clear: () => void;
};

const fallbackTitleByState: Record<SileoState | "default", string> = {
  default: "Notifica",
  success: "Operazione completata",
  loading: "Operazione in corso",
  error: "Qualcosa è andato storto",
  warning: "Attenzione",
  info: "Informazione",
  action: "Azione richiesta",
};

function isBottomPosition(position: SileoOptions["position"]) {
  return typeof position === "string" && position.startsWith("bottom");
}

function normalizeToastInput(
  input: ToastInput,
  tone: SileoState | "default" = "default",
  position?: SileoOptions["position"]
) {
  const forceBottomExpandedLayout = isBottomPosition(position);

  if (typeof input === "string") {
    return {
      title: fallbackTitleByState[tone],
      description: input,
    };
  }

  if (!input.description && forceBottomExpandedLayout && input.title) {
    return {
      title: fallbackTitleByState[tone],
      description: input.title,
      duration: input.duration,
    };
  }

  return {
    title: input.title ?? fallbackTitleByState[tone],
    description: input.description,
    duration: input.duration,
    button: input.action ? {
      title: input.action.label,
      onClick: input.action.onClick
    } : undefined,
  };
}

function buildOptions(
  scope: NotificationScope,
  input: ToastInput,
  tone: SileoState | "default" = "default",
  options?: ToastOverrides
): SileoOptions {
  const position = notificationScopePosition[scope];
  const normalized = normalizeToastInput(input, tone, position);
  const defaults = notificationScopeDefaults[scope];

  return {
    ...defaults,
    ...normalized,
    ...options,
    position,
  };
}

function createScopedToast(scope: NotificationScope): ScopedToast {
  return {
    show(message, options) {
      return sileo.show(buildOptions(scope, message, "info", options));
    },
    success(message, options) {
      return sileo.success(buildOptions(scope, message, "success", options));
    },
    error(message, options) {
      return sileo.error(buildOptions(scope, message, "error", options));
    },
    warning(message, options) {
      return sileo.warning(buildOptions(scope, message, "warning", options));
    },
    info(message, options) {
      return sileo.info(buildOptions(scope, message, "info", options));
    },
    action(message, options) {
      return sileo.action(buildOptions(scope, message, "action", options));
    },
    promise<T>(
      promise: Promise<T> | (() => Promise<T>),
      config: {
        loading: ToastInput;
        success: ToastInput | ((data: T) => ToastInput);
        error: ToastInput | ((error: unknown) => ToastInput);
        action?: ToastInput | ((data: T) => ToastInput);
      }
    ) {
      return sileo.promise<T>(promise, {
        loading: buildOptions(scope, config.loading, "loading"),
        success: (data: T) => {
          const message =
            typeof config.success === "function"
              ? config.success(data)
              : config.success;
          return buildOptions(scope, message, "success");
        },
        error: (err: unknown) => {
          const message =
            typeof config.error === "function" ? config.error(err) : config.error;
          return buildOptions(scope, message, "error");
        },
        action: undefined,
      });
    },
    dismiss(id?: string) {
      if (id) {
        sileo.dismiss(id);
        return;
      }
      sileo.clear(notificationScopePosition[scope]);
    },
    clear() {
      sileo.clear(notificationScopePosition[scope]);
    },
  };
}

export const toast = createScopedToast("global");
export const authToast = createScopedToast("auth");
export const adminToast = createScopedToast("admin");
export const marketToast = createScopedToast("market");
export const paymentsToast = createScopedToast("payments");
export const profileToast = createScopedToast("profile");
export const dealsToast = createScopedToast("deals");

export type { ToastInput, ToastOverrides, ToastPromiseConfig, ScopedToast };
