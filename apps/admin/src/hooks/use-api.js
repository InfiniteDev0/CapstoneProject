"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

/**
 * Load data for an admin page with loading / error / data states:
 *   const { data, loading, error, reload, setData } = useApi("/api/admin/dashboard/stats");
 * Errors are silent (the page shows its own error state). Pass null to wait.
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
  const setData = useCallback((next) => setState((s) => ({ ...s, data: typeof next === "function" ? next(s.data) : next })), []);
  return { ...state, reload, setData };
}
