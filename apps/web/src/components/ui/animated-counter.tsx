import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
	value: number;
	duration?: number;
	showCommas?: boolean;
	className?: string;
}

export function AnimatedCounter({
	value,
	duration = 800,
	showCommas = false,
	className,
}: AnimatedCounterProps) {
	const [displayValue, setDisplayValue] = useState(value);

	useEffect(() => {
		const startValue = displayValue;
		const endValue = value;
		const startTime = Date.now();

		const animate = () => {
			const currentTime = Date.now();
			const elapsed = currentTime - startTime;
			const progress = Math.min(elapsed / duration, 1);

			// Easing function for smooth animation
			const easeOutQuart = 1 - (1 - progress) ** 4;
			const currentValue = Math.round(
				startValue + (endValue - startValue) * easeOutQuart,
			);

			setDisplayValue(currentValue);

			if (progress < 1) {
				requestAnimationFrame(animate);
			}
		};

		animate();
	}, [value, duration, displayValue]);

	const formatNumber = (num: number) => {
		if (showCommas) {
			return num.toLocaleString();
		}
		return num.toString();
	};

	return (
		<span className={cn("transition-all", className)}>
			{formatNumber(displayValue)}
		</span>
	);
}
