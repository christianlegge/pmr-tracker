export const safeKeys = <T extends object>(o: T) =>
	Object.getOwnPropertyNames(o) as Array<keyof T>;

export function throttle<T>(
	fn: (...args: T[]) => void,
	wait: number
): (...args: T[]) => void {
	let throttled = false;
	return function (...args: T[]) {
		if (!throttled) {
			fn(...args);
			throttled = true;
			setTimeout(() => {
				throttled = false;
			}, wait);
		}
	};
}

export function getImageUrl(image: string) {
	const path = `../assets/images/${image}`;
	const url = new URL(path, import.meta.url);
	return url.href;
}
