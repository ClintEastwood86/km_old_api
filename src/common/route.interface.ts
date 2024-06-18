import { Express, NextFunction, Request, Response } from 'express';
import { BaseMiddleware } from './base.middleware';

export interface IRoute {
	path: string;
	method: keyof Pick<Express, 'get' | 'post' | 'delete' | 'patch' | 'put'>;
	func: (req: Request, res: Response, next: NextFunction) => void;
	middlewares?: BaseMiddleware[];
}
