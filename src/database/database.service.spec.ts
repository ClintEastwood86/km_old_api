import { Container } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../types';
import { CommonDatabase } from './common.database';
import { ILoggerService } from '../logger/logger.service.interface';

const loggerServiceMock: ILoggerService = {
	log: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
	fatal: jest.fn()
};

const container = new Container();
let databaseService: CommonDatabase;
let loggerService: ILoggerService;

beforeAll(() => {
	container.bind<CommonDatabase>(TYPES.CommonDatabase).to(CommonDatabase).inSingletonScope();
	container.bind<ILoggerService>(TYPES.ILoggerService).toConstantValue(loggerServiceMock);

	databaseService = container.get(TYPES.CommonDatabase);
	loggerService = container.get(TYPES.ILoggerService);
});

describe('Database Service', () => {
	it('Connect [SUCCESS]', async () => {
		loggerService.fatal = jest.fn().mockImplementationOnce(() => {
			return 1;
		});
		expect(await databaseService.connect()).not.toBe(1);
	});
});
