import { Container } from 'inversify';
import { IFilesService } from './files.service.interface';
import 'reflect-metadata';
import { ILoggerService } from '../logger/logger.service.interface';
import { IConfigService } from '../configs/config.service.interface';
import { TYPES } from '../types';
import { FilesService } from './files.service';
import { Readable } from 'stream';
import { mkdir } from 'fs/promises';
import { path } from 'app-root-path';

const loggerServiceMock: ILoggerService = {
	log: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
	fatal: jest.fn()
};

const configServiceMock: IConfigService = {
	get: jest.fn()
};

const fileMock: Express.Multer.File = {
	buffer: Buffer.from('Test SUCCESS', 'utf-8'),
	originalname: 'test.txt',
	destination: '',
	fieldname: '',
	encoding: '',
	mimetype: '',
	size: 0,
	stream: new Readable(),
	filename: '',
	path: ''
};

const container = new Container();
let fileService: IFilesService;
let configService: IConfigService;
let loggerService: ILoggerService;

let pathToCreatedFile: string;

beforeAll(() => {
	container.bind<IFilesService>(TYPES.IFilesService).to(FilesService).inSingletonScope();
	container.bind<IConfigService>(TYPES.IConfigService).toConstantValue(configServiceMock);
	container.bind<ILoggerService>(TYPES.ILoggerService).toConstantValue(loggerServiceMock);

	fileService = container.get(TYPES.IFilesService);
	configService = container.get(TYPES.IConfigService);
	loggerService = container.get(TYPES.ILoggerService);
});

describe('Files Service', () => {
	it('Save File [SUCCESS]', async () => {
		const file: Express.Multer.File = fileMock;
		configService.get = jest.fn().mockReturnValueOnce(1);
		const result = await fileService.saveFile(file);
		pathToCreatedFile = result.url;
		expect(result.name).not.toBeUndefined();
	});

	it('Delete File [SUCCESS]', async () => {
		expect(await fileService.deleteFile(pathToCreatedFile)).toBeUndefined();
	});

	it('Delete File [FAIL]', async () => {
		loggerService.error = jest.fn().mockImplementationOnce(() => {
			throw new Error();
		});

		const deleteFile = async (): Promise<void> => {
			await fileService.deleteFile('/sdasd.sfaewe/sad.23asd.2dss');
		};

		await expect(deleteFile).rejects.toThrow();
	});

	it('Delete Dir [SUCCESS]', async () => {
		const pathToDir = path + '/upload/' + 'test';
		await mkdir(pathToDir);
		expect(await fileService.deleteDir(pathToDir));
	});

	it('Delete Dir [FAIL]', async () => {
		loggerService.error = jest.fn().mockImplementationOnce(() => {
			throw new Error();
		});

		const deleteDir = async (): Promise<void> => {
			await fileService.deleteDir('/test/test.test');
		};

		await expect(deleteDir).rejects.toThrow();
	});
});
