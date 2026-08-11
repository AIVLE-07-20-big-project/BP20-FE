import { useCallback, useEffect, useState } from "react";

interface TemporaryPersonalData {
  id: number;
  visibleUntil: string;
}

export function useTemporaryPersonalData<T extends TemporaryPersonalData>() {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    if (!data) return undefined;

    const remainingMilliseconds = new Date(data.visibleUntil).getTime() - Date.now();
    if (remainingMilliseconds <= 0) {
      setData(null);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setData(null), remainingMilliseconds);
    return () => window.clearTimeout(timeoutId);
  }, [data]);

  const hide = useCallback(() => setData(null), []);
  const getFor = useCallback((id: number) => (
    data?.id === id && new Date(data.visibleUntil).getTime() > Date.now() ? data : null
  ), [data]);

  return { reveal: setData, hide, getFor };
}
