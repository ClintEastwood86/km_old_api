import { PrismaClient } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { IDatabaseService } from './database.service.interface';
import 'reflect-metadata';
import { TYPES } from '../types';
import { ILoggerService } from '../logger/logger.service.interface';
import { onPrismaError, onPrismaWarn, onSlowPrismaQuery } from './database.handlers';

@injectable()
export class CommonDatabase implements IDatabaseService<PrismaClient> {
	client: PrismaClient;

	constructor(@inject(TYPES.ILoggerService) private logger: ILoggerService) {
		const client = new PrismaClient({
			log: [
				{ level: 'query', emit: 'event' },
				{ level: 'error', emit: 'event' },
				{ level: 'warn', emit: 'event' }
			]
		});

		client.$on('error', onPrismaError(logger));
		client.$on('warn', onPrismaWarn(logger));
		client.$on('query', (e) => {
			if (e.duration >= 500) {
				onSlowPrismaQuery(e, logger);
			}
		});

		this.client = client;
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
