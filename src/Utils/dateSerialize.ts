import type { Dayjs } from "dayjs";

export const toLocalIso = (d: Dayjs | null): string | null =>
  d ? d.format("YYYY-MM-DDTHH:mm:ss") : null;
