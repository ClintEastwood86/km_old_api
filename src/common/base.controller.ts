import { Response, Router } from 'express';
import { injectable } from 'inversify';
import { ILoggerService } from '../logger/logger.service.interface';
import { HttpReturnType, JwtResponse } from './controller.types';
import { IRoute } from './route.interface';
import 'reflect-metadata';
import { HttpStatus } from '../helpers/http-status';
import { cookieConfig } from '../configs/cookie.config';

@injectable()
export abstract class BaseController {
	private readonly _router: Router;
	constructor(private loggerService: ILoggerService) {
		this._router = Router();
	}

	get router(): typeof this._router {
		return this._router;
	}

	ok<T>(res: Response, msg: T): HttpReturnType {
		return this.send(res, HttpStatus.OK, msg);
	}

	create<T>(res: Response, msg: T): HttpReturnType {
		return this.send(res, HttpStatus.CREATED, msg);
	}

	send<T>(res: Response, code: number, msg: T): HttpReturnType {
		return res.status(code).send(typeof msg == 'number' ? msg.toString() : msg);
	}

	clearCookie(res: Response, names: string[]): void;
	clearCookie(res: Response, name: string): void;
	clearCookie(res: Response, nameOrNames: string | string[]): void {
		if (typeof nameOrNames == 'string') {
			res.clearCookie(nameOrNames);
		} else {
			nameOrNames.forEach((name) => res.clearCookie(name));
		}
	}

	setJwtTokens(res: Response, tokens: JwtResponse): void {
		res.cookie('refreshToken', tokens.jwtRefresh, cookieConfig.refresh);
		res.cookie('accessToken', tokens.jwtAccess, cookieConfig.access);
	}

	protected bindRoutes(name: string, routes: IRoute[]): void {
		routes.forEach(({ method, path, func, middlewares }: IRoute) => {
			const updateMiddlewares = middlewares?.map((m) => m.execute.bind(m));
			const handler = func.bind(this);

			const pipeline = updateMiddlewares ? [...updateMiddlewares, handler] : handler;

			this.router[method](path, pipeline);
			this.loggerService.log(`[${method.toUpperCase()}] ${name + path}`);
		});
	}
}
