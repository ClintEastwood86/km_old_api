import { ContainerModule, interfaces } from 'inversify';
import { TYPES } from '../types';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { IFeedbackService } from './feedback.service.interface';

export const feedbackContainer = new ContainerModule((bind: interfaces.Bind) => {
	bind<FeedbackController>(TYPES.FeedbackController).to(FeedbackController);
	bind<IFeedbackService>(TYPES.IFeedbackService).to(FeedbackService);
});
