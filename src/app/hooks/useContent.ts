import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

type ContentMap = Record<string, string>;

export function useContent(section: string) {
  const [data, setData] = useState<ContentMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const res = await apiRequest<ContentMap>(`/content/${section}`);
      if (!cancelled && res.success && res.data) {
        setData(res.data);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [section]);

  return { data, loading };
}
