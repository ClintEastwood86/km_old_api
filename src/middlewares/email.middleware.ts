import { Request, Response, NextFunction } from 'express';
import { BaseMiddleware } from '../common/base.middleware';
import { HTTPError } from '../errors/http-error';
import { HttpStatus } from '../helpers/http-status';

export class EmailMiddleware extends BaseMiddleware {
	private correntDomains;

	constructor() {
		super();
		this.correntDomains = ['mail.ru', 'gmail.com', 'vk.com', 'yandex.ru'];
	}

	execute({ body }: Request, res: Response, next: NextFunction): void {
		if (!body.email) {
			return next();
		}
		const valid = this.validateEmail(body.email);
		if (!valid) {
			next(
				new HTTPError(
					HttpStatus.RETRY_WITH,
					`EMAIL: ${this.getDomainName(body.email)}`,
					'Используйте разрешенные почтовые сервисы',
					{
						error: `Используйте разрешенные сервисы ${this.correntDomains}`
					}
				)
			);
		}
		next();
	}

	validateEmail(email: string): boolean {
		const current = this.getDomainName(email);

		return this.correntDomains.includes(current);
	}

	getDomainName(email: string): string {
		const startPosition = email.lastIndexOf('@') + 1;
		return email.substring(startPosition);
	}
}
