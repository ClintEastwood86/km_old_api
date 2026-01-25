import { inject, injectable } from 'inversify';
import { PrismaClient } from '../../prisma/generated/movies';
import { ILoggerService } from '../logger/logger.service.interface';
import { TYPES } from '../types';
import { IDatabaseService } from './database.service.interface';
import 'reflect-metadata';
import { onPrismaError, onPrismaWarn, onSlowPrismaQuery } from './database.handlers';
import { prismaQueryDuration } from '../common/metrics';

@injectable()
export class MoviesDatabase implements IDatabaseService<PrismaClient> {
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

		this.client = client.$extends({
			query: {
				$allModels: {
					async $allOperations({ args, query }) {
						const end = prismaQueryDuration.startTimer();
						try {
							return await query(args);
						} finally {
							end();
						}
					}
				}
			}
		}) as PrismaClient;
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
