import { Request, Response, NextFunction } from 'express';
import { JwtPayload, verify } from 'jsonwebtoken';
import { BaseMiddleware } from '../common/base.middleware';
import { IConfigService } from '../configs/config.service.interface';
import { HTTPError } from '../errors/http-error';
import { HttpStatus } from '../helpers/http-status';

export class AuthMiddleware extends BaseMiddleware {
	constructor(private configService: IConfigService) {
		super();
	}
	execute(req: Request, res: Response, next: NextFunction): void {
		if (!req.cookies.accessToken) {
			return next();
		}
		try {
			const payloadToken = verify(req.cookies.accessToken, this.configService.get('ACCESS_TOKEN_SECRET')) as JwtPayload;
			req.user = payloadToken.email;
		} catch (error) {
			next(
				new HTTPError(HttpStatus.UNAUTHORIZED, 'authMiddleware', 'Не авторизован', {
					error: 'Не прошел авторизацию'
				})
			);
		}
		next();
	}
}
