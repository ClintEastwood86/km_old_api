import { pinoHttp } from 'pino-http';
import { logger } from '../logger/logger';
import { randomUUID } from 'crypto';

export const loggerMiddleware = pinoHttp({
	logger,
	genReqId: () => randomUUID(),
	autoLogging: {
		ignore: (req) => {
			return req.url ? req.url.startsWith('/upload/') : false;
		}
	},
	customLogLevel: (_, res, err) => {
		if ((res.statusCode && res.statusCode >= 500) || err) return 'error';
		if (res.statusCode && res.statusCode >= 400) return 'warn';
		return 'info';
	},
	serializers: {
		req: (req) => ({
			method: req.method,
			url: req.url,
			headers: req.headers,
			request_id: req.id
		}),
		res: (res) => ({
			statusCode: res.statusCode || 0
		})
	}
});
