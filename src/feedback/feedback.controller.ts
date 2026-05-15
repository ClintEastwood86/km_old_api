import { inject, injectable } from 'inversify';
import { BaseController } from '../common/base.controller';
import 'reflect-metadata';
import { TYPES } from '../types';
import { ILoggerService } from '../logger/logger.service.interface';
import { Request, Response, NextFunction } from 'express';
import { ValidateMiddleware } from '../middlewares/validate.middleware';
import { NewAppFeedbackDto } from './dto/new-app-feedback.dto';
import { IFeedbackService } from './feedback.service.interface';

@injectable()
export class FeedbackController extends BaseController {
	constructor(
		@inject(TYPES.ILoggerService) logger: ILoggerService,
		@inject(TYPES.IFeedbackService) private feedbackService: IFeedbackService
	) {
		super(logger);
		this.bindRoutes('feedback', [
			{
				path: '/new-app',
				method: 'post',
				func: this.submitNewAppForm,
				middlewares: [new ValidateMiddleware(NewAppFeedbackDto)]
			}
		]);
	}

	async submitNewAppForm({ body }: Request<{}, {}, NewAppFeedbackDto>, res: Response, next: NextFunction): Promise<void> {
		const result = await this.feedbackService.submitNewAppForm(body);
		if (result instanceof Error) {
			return next(result);
		}
		this.create(res, { ok: true });
	}
}
