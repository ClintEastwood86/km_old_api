import { inject, injectable } from 'inversify';
import { PrismaClient } from '../../prisma/generated/movies';
import { ILoggerService } from '../logger/logger.service.interface';
import { TYPES } from '../types';
import { IDatabaseService } from './database.service.interface';
import 'reflect-metadata';

@injectable()
export class MoviesDatabase implements IDatabaseService<PrismaClient> {
	client: PrismaClient;

	constructor(@inject(TYPES.ILoggerService) private logger: ILoggerService) {
		this.client = new PrismaClient();
	}

	async connect(): Promise<void> {
		try {
			await this.client.$connect();
			this.logger.log('[MoviesDatabase] Успешное подключение к базе данных');
		} catch (error) {
			error instanceof Error && this.logger.fatal(`[MoviesDatabase] Ошибка при подключении базы данных ${error.message}`);
		}
	}
	async disconnect(): Promise<void> {
		await this.client.$disconnect();
	}
}
