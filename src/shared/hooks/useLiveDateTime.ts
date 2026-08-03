import { useEffect, useMemo, useState } from "react";

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function useLiveDateTime() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(intervalId);
  }, []);

  return useMemo(
    () => ({
      dateTime: now.toISOString(),
      label: `${DATE_TIME_FORMATTER.format(now)} 기준`,
    }),
    [now],
  );
}
