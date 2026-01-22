import * as Sentry from '@sentry/node';
import { NextFunction, Request, Response } from 'express';

export const sentryMiddleware = (req: Request, _: Response, next: NextFunction): void => {
	if (req.id) {
		Sentry.setTag('request_id', req.id.toString());
		Sentry.setContext('request', {
			id: req.id,
			method: req.method,
			url: req.originalUrl
		});
	}
	next();
};
