import type { Dayjs } from "dayjs";

/**
 * Serialises a Dayjs value so that *the clock digits stay exactly
 * as the user chose* – no implicit timezone, no “Z”.
 *
 *  • 2025‑04‑15 00:00 LT  →  "2025-04-15T00:00:00"
 *  • 2025‑04‑18 14:30 LT  →  "2025-04-18T14:30:00"
 */
export const toLocalIso = (d: Dayjs | null): string | null =>
  d ? d.format("YYYY-MM-DDTHH:mm:ss") : null;
