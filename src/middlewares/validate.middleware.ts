import { NextFunction, Request, Response } from 'express';
import { ClassConstructor, plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { BaseMiddleware } from '../common/base.middleware';
import { HTTPError } from '../errors/http-error';
import { HttpStatus } from '../helpers/http-status';

export class ValidateMiddleware extends BaseMiddleware {
	constructor(private classToValidate: ClassConstructor<object>) {
		super();
	}

	override execute({ body }: Request, res: Response, next: NextFunction): void {
		const instance = plainToClass(this.classToValidate, body);
		validate(instance).then((errors) => {
			if (errors.length > 0) {
				next(
					new HTTPError(HttpStatus.BAD_REQUEST, 'validator', 'Не прошёл валидацию', {
						error: 'Данные не прошли проверку',
						data: errors[0].constraints
					})
				);
			} else {
				next();
			}
		});
	}
}
