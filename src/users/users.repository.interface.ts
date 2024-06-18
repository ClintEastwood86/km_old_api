import { UserModel, Prisma } from '@prisma/client';
import { ReturnTypeUserWithIcon, UserModelForAdmin, UserModelOther } from './users.service.interface';
import { User } from './user.entity';
import { GetUsersForAdminPanelDto } from './dto/get-users-for-admin-panel.dto';

export interface IUsersRepository {
	createUser({ email, login, password, notification }: User): Promise<UserModel | null>;
	findUnique(email: string, getIcon?: boolean): Promise<ReturnTypeUserWithIcon | null>;
	findUsersBy(where: Prisma.UserModelWhereInput): Promise<UserModel[]>;
	findUsersBy(key: keyof UserModel, value: string): Promise<UserModel[]>;
	findFirstUserBy(where: Prisma.UserModelWhereInput): Promise<UserModel | null>;
	findOtherUser(id: number): Promise<UserModelOther | null>;
	findUsersForAdminPanel(dto: GetUsersForAdminPanelDto): Promise<UserModelForAdmin[]>;
	getIdUsers(): Promise<number[]>;
	updateUser(email: string, data: Partial<UserModel>): Promise<UserModel | null>;
	findUserAndSelect<T extends keyof UserModel>(
		select: T,
		where: Prisma.UserModelWhereInput
	): Promise<{ [key: string]: UserModel[T] } | null>;
	findUsersAndSelect<T extends keyof UserModel>(
		select: T,
		where: Prisma.UserModelWhereInput
	): Promise<{ [key: string]: UserModel[T] }[]>;
	deleteUser(email: string): Promise<UserModel | null>;
	deleteUser(id: number): Promise<UserModel | null>;
	customRequest(filterOptions: Record<string, any>): Promise<UserModel[] | null>;
	addAwardByUserId(userId: number, awardId: number): Promise<void>;
	getAwardsIdByUserId(id: number): Promise<number[]>;
	setViewToken(email: string, token: string): Promise<string | null>;
	hasMarkById(email: string, movieId: number): Promise<boolean>;
	getMarks(email: string): Promise<number[]>;
	addMark(email: string, movieId: number): Promise<number | null>;
	removeMark(email: string, movieId: number): Promise<number | null>;
	deleteEmptyUsers(): Promise<void>;
	deleteBannedAccounts(): Promise<void>;
	getCountCollections(email: string): Promise<number>;
	blockUserById(id: number, newLogin: string): Promise<null | (UserModel & { oldLogin?: string })>;
	unblockUserById(id: number): Promise<null | UserModel>;
	addViewTime(email: string, minutes: number): Promise<number>;
}
