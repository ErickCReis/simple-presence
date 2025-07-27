import { type PresenceConfig, SimplePresence } from "@simple-presence/core";
import { useEffect, useRef, useState } from "react";

/**
 * React hook for tracking user presence count
 * @param tag - The tag for presence tracking
 * @param options - Optional options for presence tracking
 * @param options.apiUrl - Optional API URL override
 * @param options.appKey - The app key for presence tracking
 * @returns Current online count
 */
export function usePresenceCount(
	tag: string,
	options: Omit<PresenceConfig, "tag" | "onCountChange">,
): number {
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
				presenceRef.current.destroy();
				presenceRef.current = null;
			}
		};
	}, [tag, options.apiUrl, options.appKey]);

	return count;
}
