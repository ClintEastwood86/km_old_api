import { NextFunction, Request, Response } from 'express';
import { HTTPError } from './http-error';

export interface IExeptionFilter {
	catch(error: Error | HTTPError, req: Request, res: Response, next: NextFunction): void;
}
