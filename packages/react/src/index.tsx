import { type PresenceConfig, SimplePresence } from "@simple-presence/core";
import { useEffect, useRef, useState } from "react";

/**
 * React hook for tracking user presence count
 * @param appKey - The app key for presence tracking
 * @param options - Optional options for presence tracking
 * @param options.apiUrl - Optional API URL override
 * @param options.heartbeatInterval - Optional heartbeat interval
 * @param options.debounceDelay - Optional debounce delay
 * @returns Current online count
 */
export function usePresenceCount(
	appKey: string,
	options: Omit<PresenceConfig, "appKey" | "onCountChange"> = {},
): number {
	const [count, setCount] = useState<number>(0);
	const presenceRef = useRef<SimplePresence | null>(null);

	useEffect(() => {
		const presence = new SimplePresence({
			appKey,
			onCountChange: setCount,
			apiUrl: options.apiUrl,
			heartbeatInterval: options.heartbeatInterval,
			debounceDelay: options.debounceDelay,
		});

		presenceRef.current = presence;
		setCount(presence.getCount());

		return () => {
			if (presenceRef.current) {
				presenceRef.current.destroy();
				presenceRef.current = null;
			}
		};
	}, [
		appKey,
		options.apiUrl,
		options.heartbeatInterval,
		options.debounceDelay,
	]);

	return count;
}
