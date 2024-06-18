import { ContainerModule, interfaces } from 'inversify';
import { TYPES } from '../types';
import { CommentsController } from './comments.controller';
import { ICommentsService } from './comments.service.interface';
import { CommentsService } from './comments.service';
import { ICommentRepository } from './comments.repository.interface';
import { CommentsRepository } from './comments.repository';

export const commentsContainer = new ContainerModule((bind: interfaces.Bind) => {
	bind<CommentsController>(TYPES.CommentsController).to(CommentsController).inSingletonScope();
	bind<ICommentsService>(TYPES.ICommentsService).to(CommentsService).inSingletonScope();
	bind<ICommentRepository>(TYPES.ICommentsRepository).to(CommentsRepository).inSingletonScope;
});
