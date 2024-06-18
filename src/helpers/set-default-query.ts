export const setDefaultQuery = (value: number, defaultValue: number): number => {
	if (Number.isNaN(value) || value > defaultValue) {
		return defaultValue;
	}
	return Math.floor(value);
};
