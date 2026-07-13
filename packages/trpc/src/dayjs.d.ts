import type { PluginFunc } from "dayjs";

declare module "dayjs" {
  interface Dayjs {
    utc(keepLocalTime?: boolean): Dayjs;
    tz(timezone?: string, keepLocalTime?: boolean): Dayjs;
  }

  interface DayjsStatic {
    utc(
      config?: string | number | Date | import("dayjs").Dayjs,
      format?: string,
      strict?: boolean,
    ): import("dayjs").Dayjs;
    tz(
      config?: string | number | Date | import("dayjs").Dayjs,
      timezone?: string,
      keepLocalTime?: boolean,
    ): import("dayjs").Dayjs;
  }
}

export {};
