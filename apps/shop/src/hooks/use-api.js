"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

/**
 * Load data for a page through the order tablet, with the three states every page needs:
 *
 *   const { data, loading, error, reload } = useApi("/api/store/categories");
 *   if (loading) return <Skeleton />;   if (error) return <ErrorState onRetry={reload} />;
 *
 * Errors are silent here (no toast): the page shows its own error state instead.
 * Pass null as the path to wait (e.g. until the user is known).
 */
export function useApi(path) {
  const [state, setState] = useState({ data: null, error: null, loading: Boolean(path) });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!path) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    api(path, { silent: true, signal: controller.signal })
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => {
        if (error?.name !== "AbortError") setState({ data: null, error, loading: false });
      });
    return () => controller.abort();
  }, [path, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const setData = useCallback(
    (next) => setState((s) => ({ ...s, data: typeof next === "function" ? next(s.data) : next })),
    [],
  );
  return { ...state, reload, setData };
}
