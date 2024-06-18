import { NextFunction, Request, Response } from 'express';

export abstract class BaseMiddleware {
	abstract execute(req: Request, res: Response, next: NextFunction): Promise<void> | void;
}
