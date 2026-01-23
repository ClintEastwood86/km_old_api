import { Request, Response, NextFunction } from 'express';
import { BaseMiddleware } from '../common/base.middleware';
import { httpRequestsTotal, httpRequestDuration } from '../common/metrics';

export class MetricsMiddleware extends BaseMiddleware {
	execute(req: Request, res: Response, next: NextFunction): void {
		const start = Date.now();

		res.on('finish', () => {
			const duration = Date.now() - start;

			const route = req.route?.path ?? req.originalUrl.split('?')[0] ?? 'unknown';

			httpRequestsTotal.inc({
				method: req.method,
				route,
				status: res.statusCode.toString()
			});

			httpRequestDuration.observe(
				{
					method: req.method,
					route,
					status: res.statusCode.toString()
				},
				duration
			);
		});

		next();
	}
}
