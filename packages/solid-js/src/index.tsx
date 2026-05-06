import { type CountSnapshot, type PresenceConfig, SimplePresence } from "@simple-presence/core";
import { createSignal, onCleanup, onMount } from "solid-js";

type PresenceOptions = Omit<PresenceConfig, "tag" | "onCountChange">;

const HISTORY_POLL_INTERVAL_MS = 10_000;

export function createPresenceCount(
  tag: () => string,
  options: () => PresenceOptions,
): () => number {
  const [count, setCount] = createSignal(0);
  let instance: SimplePresence | undefined;

  onMount(() => {
    const opts = options();
    instance = new SimplePresence({
      tag: tag(),
      onCountChange: setCount,
      apiUrl: opts.apiUrl,
      appKey: opts.appKey,
    });
    setCount(instance.getCount());
  });

  onCleanup(() => {
    if (instance) {
      void instance.destroy();
      instance = undefined;
    }
  });

  return count;
}

export type PresenceState = {
  count: () => number;
  history: () => CountSnapshot[];
  peak: () => number;
  peakAt: () => string | null;
  refresh: () => Promise<void>;
};

export function createPresence(tag: () => string, options: () => PresenceOptions): PresenceState {
  const [count, setCount] = createSignal(0);
  const [history, setHistory] = createSignal<CountSnapshot[]>([]);
  const [peak, setPeak] = createSignal(0);
  const [peakAt, setPeakAt] = createSignal<string | null>(null);
  let instance: SimplePresence | undefined;
  let pollTimer: ReturnType<typeof setTimeout> | undefined;

  async function fetchExtras() {
    if (!instance) return;
    const [h, s] = await Promise.all([instance.getHistory(), instance.getStats()]);
    setHistory(h);
    setPeak(s.peak);
    setPeakAt(s.peakAt);
  }

  let cancelled = false;

  onMount(() => {
    const opts = options();
    instance = new SimplePresence({
      tag: tag(),
      onCountChange: setCount,
      apiUrl: opts.apiUrl,
      appKey: opts.appKey,
    });
    setCount(instance.getCount());

    pollTimer = setTimeout(async function poll() {
      await fetchExtras();
      if (!cancelled) {
        pollTimer = setTimeout(poll, HISTORY_POLL_INTERVAL_MS);
      }
    }, 500);
  });

  onCleanup(() => {
    cancelled = true;
    if (pollTimer) clearTimeout(pollTimer);
    if (instance) {
      void instance.destroy();
      instance = undefined;
    }
  });

  return {
    count,
    history,
    peak,
    peakAt,
    refresh: fetchExtras,
  };
}

export type { CountSnapshot, PresenceConfig, TagPeak } from "@simple-presence/core";
