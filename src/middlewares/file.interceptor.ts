import { Request, Response, NextFunction } from 'express';
import { BaseMiddleware } from '../common/base.middleware';
import { fileConfig } from '../configs/file.config';

export class FileInterceptor extends BaseMiddleware {
	execute(req: Request, res: Response, next: NextFunction): void {
		fileConfig.single('uploadFile')(req, res, next);
	}
}
