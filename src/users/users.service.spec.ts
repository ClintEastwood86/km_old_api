import { Container } from 'inversify';
import { IConfigService } from '../configs/config.service.interface';
import { IFilesService } from '../files/files.service.interface';
import { ILoggerService } from '../logger/logger.service.interface';
import { TYPES } from '../types';
import { UsersRepository } from './users.repository';
import { IUsersRepository } from './users.repository.interface';
import { UsersService } from './users.service';
import { IUsersService } from './users.service.interface';
import 'reflect-metadata';
import { UserRegisterDto } from './dto/user-register.dto';
import { UserModel } from '@prisma/client';
import { HTTPError } from '../errors/http-error';

const loggerServiceMock: ILoggerService = {
	log: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
	fatal: jest.fn()
};

const fileServiceMock: IFilesService = {
	saveFile: jest.fn(),
	deleteDir: jest.fn(),
	deleteFile: jest.fn()
};

const configServiceMock: IConfigService = {
	get: jest.fn()
};

const usersRepositoryMock: IUsersRepository = {
	setViewToken: jest.fn(),
	addViewTime: jest.fn(),
	createUser: jest.fn(),
	getMarks: jest.fn(),
	findUsersForAdminPanel: jest.fn(),
	hasMarkById: jest.fn(),
	addMark: jest.fn(),
	removeMark: jest.fn(),
	deleteBannedAccounts: jest.fn(),
	deleteEmptyUsers: jest.fn(),
	getCountCollections: jest.fn(),
	blockUserById: jest.fn(),
	unblockUserById: jest.fn(),
	findOtherUser: jest.fn(),
	getIdUsers: jest.fn(),
	findUnique: jest.fn(),
	findUsersBy: jest.fn(),
	findFirstUserBy: jest.fn(),
	updateUser: jest.fn(),
	deleteUser: jest.fn(),
	findUsersAndSelect: jest.fn(),
	findUserAndSelect: jest.fn(),
	customRequest: jest.fn(),
	addAwardByUserId: jest.fn(),
	getAwardsIdByUserId: jest.fn()
};

const container = new Container();
let usersService: IUsersService;
let usersRepository: UsersRepository;
let configService: IConfigService;

const dto: UserRegisterDto = {
	email: 'test@yandex.ru',
	password: '11223344',
	notification: true,
	login: 'test'
};

const returnUserModelByDto = (user: UserRegisterDto): UserModel => ({
	avatar: null,
	createdAt: new Date(),
	updatedEmailAt: new Date(),
	updatedLoginAt: new Date(),
	updatedAvatarAt: null,
	updatedAt: new Date(),
	email: user.email,
	password: user.password,
	notification: user.notification,
	confirmToken: null,
	notificationToken: '',
	lastViewToken: '',
	blocked: false,
	marks: [],
	login: user.login,
	id: 1,
	verified: true,
	role: 'USER',
	rankId: 1,
	userPoints: 0,
	watchedMinutes: 0,
	awardId: 1
});

beforeAll(() => {
	container.bind<IUsersService>(TYPES.IUsersService).to(UsersService);
	container.bind<ILoggerService>(TYPES.ILoggerService).toConstantValue(loggerServiceMock);
	container.bind<IFilesService>(TYPES.IFilesService).toConstantValue(fileServiceMock);
	container.bind<IUsersRepository>(TYPES.IUsersRepository).toConstantValue(usersRepositoryMock);
	container.bind<IConfigService>(TYPES.IConfigService).toConstantValue(configServiceMock);

	usersService = container.get(TYPES.IUsersService);
	configService = container.get(TYPES.IConfigService);
	usersRepository = container.get(TYPES.IUsersRepository);
});

describe('Users Service', () => {
	it('Create User [SUCCESS]', async () => {
		usersRepository.findFirstUserBy = jest.fn().mockImplementationOnce((): UserModel | null => {
			return null;
		});
		configService.get = jest.fn().mockReturnValue(1);
		usersRepository.createUser = jest.fn().mockImplementationOnce((user: UserRegisterDto): UserModel => {
			return returnUserModelByDto(user);
		});

		const result = await usersService.createUser(dto);
		expect(result).not.toBeInstanceOf(HTTPError);
		expect((result as UserModel).password).not.toBe(dto.password);
	});

	it('Create User [FAIL] - user find', async () => {
		usersRepository.findFirstUserBy = jest.fn().mockImplementationOnce((): UserModel | null => {
			return returnUserModelByDto(dto);
		});

		const result = await usersService.createUser(dto);
		expect(result).toBeInstanceOf(HTTPError);
	});
});
