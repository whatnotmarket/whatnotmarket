declare module "ackee-tracker" {
  export function create(
    server: string,
    options: {
      detailed?: boolean;
      ignoreLocalhost?: boolean;
      ignoreOwnVisits?: boolean;
    },
    attributes: { key: string }
  ): {
    record(payload: { siteLocation: string; siteReferrer?: string }): void;
  };
}
