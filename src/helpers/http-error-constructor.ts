import { HTTPError } from '../errors/http-error';
import { HttpStatus } from './http-status';

export class HTTPErrorConstructor {
	private constructor() {}

	static userNotFoundError(email: string): HTTPError {
		return new HTTPError(HttpStatus.NOT_FOUND, 'errorContructor', 'Не найден', {
			error: `Пользователь с почтой ${email} не найден`
		});
	}
}
