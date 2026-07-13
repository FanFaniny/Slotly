import type { PluginFunc } from "dayjs";

declare module "dayjs" {
  interface Dayjs {
    utc(keepLocalTime?: boolean): Dayjs;
    tz(timezone?: string, keepLocalTime?: boolean): Dayjs;
  }

  interface DayjsStatic {
    utc(
      config?: string | number | Date | Dayjs,
      format?: string,
      strict?: boolean,
    ): Dayjs;
    tz(
      config?: string | number | Date | Dayjs,
      timezone?: string,
      keepLocalTime?: boolean,
    ): Dayjs;
  }
}

export {};
