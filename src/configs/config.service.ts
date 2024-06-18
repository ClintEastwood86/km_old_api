import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { config, DotenvConfigOutput, DotenvParseOutput } from 'dotenv';
import { TYPES } from '../types';
import { ILoggerService } from '../logger/logger.service.interface';
import { IConfigService } from './config.service.interface';

@injectable()
export class ConfigService implements IConfigService {
	private config: DotenvParseOutput;

	constructor(@inject(TYPES.ILoggerService) private logger: ILoggerService) {
		const { parsed, error }: DotenvConfigOutput = config({
			path: '.env'
		});

		if (error) {
			this.logger.fatal('[ConfigService] Ошибка при подключении .env файла');
		}

		if (!parsed) {
			this.logger.warn('[ConfigService] .env файл пустой');
		}

		if (parsed) {
			this.config = parsed;
			this.logger.log('[ConfigService] .env успешно подключен');
		}
	}

	get(key: string): string {
		const res = this.config[key];
		if (!res) {
			this.logger.error(`[ConfigService] Значение с ключом ${key} не удалось найти`);
		}
		return res;
	}
}
