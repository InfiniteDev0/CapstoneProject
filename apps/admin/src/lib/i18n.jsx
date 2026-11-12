"use client";;
import { createContext, useCallback, useContext, useMemo } from "react";

const NO_MESSAGES = {};

const LocaleContext = createContext({ messages: NO_MESSAGES });

/** Without a locale, digits stay plain so server and client render the same text. */
export function formatNumber(value, locale) {
  return locale ? new Intl.NumberFormat(locale).format(value) : String(value);
}

export function LocaleProvider({
  locale,
  messages = NO_MESSAGES,
  children
}) {
  const value = useMemo(() => ({ locale, messages }), [locale, messages]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return { locale: useContext(LocaleContext).locale };
}

/**
 * Resolves a component's strings: `labels` prop, then the provider's
 * messages for `namespace`, then the component's English `defaults`.
 * Numbers passed as values are formatted for the provider's locale.
 */
export function useMessages(namespace, defaults, labels) {
  const { locale, messages } = useContext(LocaleContext);
  const provided = messages[namespace];
  // Inline `labels={{ … }}` is a new object every render. Keying it by content
  // keeps `t` one identity until a label changes, so effects and memos that
  // depend on `t` don't re-run per render, and render-time reads never lag.
  const labelsKey = labels ? JSON.stringify(labels) : "";
  const stableLabels = useMemo(
    () => (labelsKey ? (JSON.parse(labelsKey)) : undefined),
    [labelsKey],
  );

  return useCallback(
    (key, values) => {
      const template = stableLabels?.[key] ?? provided?.[key] ?? defaults[key];
      if (!values) return template;
      return template.replace(/\{(\w+)\}/g, (match, name) => {
        const value = values[name];
        if (value === undefined) return match;
        return typeof value === "number" ? formatNumber(value, locale) : value;
      });
    },
    [defaults, stableLabels, locale, provided],
  );
}
