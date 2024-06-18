import { Container } from 'inversify';
import { ILoggerService } from '../logger/logger.service.interface';
import { TYPES } from '../types';
import 'reflect-metadata';
import { ConfigService } from './config.service';
import { IConfigService } from './config.service.interface';

const loggerServiceMock: ILoggerService = {
	log: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
	fatal: jest.fn()
};

const container = new Container();
let configService: IConfigService;

beforeAll(() => {
	container.bind<ConfigService>(TYPES.IConfigService).to(ConfigService).inSingletonScope();
	container.bind<ILoggerService>(TYPES.ILoggerService).toConstantValue(loggerServiceMock);

	configService = container.get(TYPES.IConfigService);
});

describe('Config Service', () => {
	it('Get [SUCCESS]', () => {
		const result = configService.get('SALT');
		expect(result).not.toBeUndefined();
	});
	it('Get [FAIL]', () => {
		const result = configService.get('NOT_FOUND_TEST');
		expect(result).toBeUndefined();
	});
});
