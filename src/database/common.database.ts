import { PrismaClient } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { IDatabaseService } from './database.service.interface';
import 'reflect-metadata';
import { TYPES } from '../types';
import { ILoggerService } from '../logger/logger.service.interface';

@injectable()
export class CommonDatabase implements IDatabaseService<PrismaClient> {
	client: PrismaClient;

	constructor(@inject(TYPES.ILoggerService) private logger: ILoggerService) {
		this.client = new PrismaClient();
	}

	async connect(): Promise<void> {
		try {
			await this.client.$connect();
			this.logger.log('[CommonDatabase] Успешное подключение к базе данных');
		} catch (error) {
			this.logger.fatal('[CommonDatabase] Не удалось подключиться к базе данных. Ошибка: ' + error);
		}
	}
	async disconnect(): Promise<void> {
		await this.client.$disconnect();
	}
}
