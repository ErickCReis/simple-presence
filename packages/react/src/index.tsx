import {
  type CountSnapshot,
  type PresenceConfig,
  SimplePresence,
  type TagPeak,
} from "@simple-presence/core";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

type PresenceOptions = Omit<PresenceConfig, "tag" | "onCountChange">;

const HISTORY_POLL_INTERVAL_MS = 10_000;

export function usePresenceCount(tag: string, options: PresenceOptions): number {
  const [count, setCount] = useState<number>(0);
  const presenceRef = useRef<SimplePresence | null>(null);

  useEffect(() => {
    const presence = new SimplePresence({
      tag,
      onCountChange: setCount,
      apiUrl: options.apiUrl,
      appKey: options.appKey,
    });

    presenceRef.current = presence;
    setCount(presence.getCount());

    return () => {
      if (presenceRef.current) {
        void presenceRef.current.destroy();
        presenceRef.current = null;
      }
    };
  }, [tag, options.apiUrl, options.appKey]);

  return count;
}

export type PresenceState = {
  count: number;
  history: CountSnapshot[];
  peak: number;
  peakAt: string | null;
  refresh: () => Promise<void>;
};

export function usePresence(tag: string, options: PresenceOptions): PresenceState {
  const [count, setCount] = useState<number>(0);
  const [history, setHistory] = useState<CountSnapshot[]>([]);
  const [stats, setStats] = useState<TagPeak>({ peak: 0, peakAt: null });
  const presenceRef = useRef<SimplePresence | null>(null);

  const fetchExtras = useCallback(async () => {
    const presence = presenceRef.current;
    if (!presence) return;

    const [h, s] = await Promise.all([presence.getHistory(), presence.getStats()]);
    setHistory(h);
    setStats(s);
  }, []);

  const cancelledRef: RefObject<boolean> = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    const presence = new SimplePresence({
      tag,
      onCountChange: setCount,
      apiUrl: options.apiUrl,
      appKey: options.appKey,
    });

    presenceRef.current = presence;
    setCount(presence.getCount());

    const timer = setTimeout(async function poll() {
      await fetchExtras();
      if (!cancelledRef.current) {
        pollTimer = setTimeout(poll, HISTORY_POLL_INTERVAL_MS);
      }
    }, 500);
    let pollTimer: ReturnType<typeof setTimeout> = timer;

    return () => {
      cancelledRef.current = true;
      clearTimeout(pollTimer);
      if (presenceRef.current) {
        void presenceRef.current.destroy();
        presenceRef.current = null;
      }
    };
  }, [tag, options.apiUrl, options.appKey, fetchExtras]);

  return {
    count,
    history,
    peak: stats.peak,
    peakAt: stats.peakAt,
    refresh: fetchExtras,
  };
}

export type { CountSnapshot, TagPeak } from "@simple-presence/core";
