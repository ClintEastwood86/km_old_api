export const objectToSearchParams = (obj: Record<string, any>): string => {
	return Object.keys(obj)
		.sort()
		.map((key) => {
			const value = obj[key];
			if (value === undefined || value === null) return null;
			return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
		})
		.filter(Boolean)
		.join('&');
};
