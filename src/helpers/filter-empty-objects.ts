export const filterEmptyObjects = <T>(m: T): m is T => {
	try {
		if (JSON.stringify(m) == '{}') {
			return false;
		}
		return true;
	} catch (error) {
		return true;
	}
};
