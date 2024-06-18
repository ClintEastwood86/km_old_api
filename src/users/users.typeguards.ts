import { UserModelWithIcon } from './users.service.interface';

export const isUserModelWithIcon = (user: any): user is UserModelWithIcon => {
	if (user.awardSelected && user.awardSelected.icon && typeof user.awardSelected.icon == 'string') {
		return true;
	}
	return false;
};
