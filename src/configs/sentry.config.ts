import { ErrorEvent, NodeOptions } from '@sentry/node';
import { ConfigService } from './config.service';

export const getSentryConfig = (config: ConfigService): NodeOptions => ({
	dsn: config.get('SENTRY_DSN'),
	sendDefaultPii: true,
	tracesSampleRate: 0.0,
	beforeSend(event): ErrorEvent {
		if (event.request?.headers) {
			delete event.request.headers.authorization;
			delete event.request.headers.cookie;
		}
		return event;
	}
});
