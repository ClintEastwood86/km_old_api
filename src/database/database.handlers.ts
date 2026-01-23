import { Prisma } from '@prisma/client';
import { captureException } from '@sentry/node';
import { ILoggerService } from '../logger/logger.service.interface';

export const onPrismaError =
	(logger: ILoggerService) =>
	(e: Prisma.LogEvent): void => {
		logger.error({
			level: 'error',
			msg: 'Prisma error',
			target: e.target,
			message: e.message
		});
		captureException(e, {
			tags: {
				source: 'prisma',
				target: e.target
			}
		});
	};

export const onPrismaWarn =
	(logger: ILoggerService) =>
	(e: Prisma.LogEvent): void => {
		logger.warn({
			level: 'warn',
			msg: 'Prisma warning',
			message: e.message
		});
	};

export const onSlowPrismaQuery = (e: Prisma.QueryEvent, logger: ILoggerService): void => {
	logger.warn({
		level: 'warn',
		msg: 'Slow Prisma query',
		duration: e.duration,
		query: e.query,
		params: e.params
	});
};
