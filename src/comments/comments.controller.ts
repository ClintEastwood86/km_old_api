import { inject, injectable } from 'inversify';
import { BaseController } from '../common/base.controller';
import 'reflect-metadata';
import { ConfigService } from '../configs/config.service';
import { ILoggerService } from '../logger/logger.service.interface';
import { IRanksService } from '../ranks/ranks.service.interface';
import { TYPES } from '../types';
import { IUsersService } from '../users/users.service.interface';
import { Request, Response, NextFunction } from 'express';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { AuthGuard } from '../middlewares/auth.guard';
import { ValidateMiddleware } from '../middlewares/validate.middleware';
import { CommentCreateDto } from './dto/comment-create.dto';
import { ICommentsService } from './comments.service.interface';
import { RoleGuard } from '../middlewares/role.guard';
import { Role, StatusComment } from '@prisma/client';
import { HTTPError } from '../errors/http-error';
import { HttpStatus } from '../helpers/http-status';
import { CommentRejectDto } from './dto/comment-reject.dto';
import { setDefaultQuery } from '../helpers/set-default-query';
import { GetCommentsForAdminPanelDto } from './dto/get-comments-for-admin-panel.dto';

@injectable()
export class CommentsController extends BaseController {
	constructor(
		@inject(TYPES.ILoggerService) private logger: ILoggerService,
		@inject(TYPES.IUsersService) private usersService: IUsersService,
		@inject(TYPES.IConfigService) private configService: ConfigService,
		@inject(TYPES.IRanksService) private ranksService: IRanksService,
		@inject(TYPES.ICommentsService) private commentsService: ICommentsService
	) {
		super(logger);
		const authMiddleware = new AuthMiddleware(configService);
		const authGuard = new AuthGuard(configService, usersService, logger);
		const moderatorRoleGuard = new RoleGuard(Role.MODERATOR, logger, usersService);
		this.bindRoutes('comments', [
			{
				path: '/create',
				method: 'post',
				func: this.createComment,
				middlewares: [authMiddleware, authGuard, new ValidateMiddleware(CommentCreateDto)]
			},
			{
				path: '/publish/:id',
				method: 'put',
				func: this.publishComment,
				middlewares: [authMiddleware, authGuard, moderatorRoleGuard]
			},
			{
				path: '/reject/:id',
				method: 'put',
				func: this.rejectComment,
				middlewares: [authMiddleware, authGuard, new ValidateMiddleware(CommentRejectDto)]
			},
			{
				path: '/get/byMovie/:id',
				method: 'get',
				func: this.getByMovieId,
				middlewares: [authMiddleware]
			},
			{
				path: '/get/children/:id',
				method: 'get',
				func: this.getChilren
			},
			{
				path: '/admin/get',
				method: 'post',
				func: this.getCommentsForAdminPanel,
				middlewares: [
					authMiddleware,
					authGuard,
					new RoleGuard('MODERATOR', logger, usersService),
					new ValidateMiddleware(GetCommentsForAdminPanelDto)
				]
			},
			{
				path: '/actions/:id/:actionId',
				method: 'put',
				func: this.setAction,
				middlewares: [authMiddleware, authGuard]
			},
			{
				path: '/get/count/:id',
				method: 'get',
				func: this.getCount
			}
		]);
	}

	async createComment({ body, user }: Request<{}, {}, CommentCreateDto>, res: Response, next: NextFunction): Promise<void> {
		const createdComment = await this.commentsService.create(body, user);
		if (createdComment instanceof Error) {
			return next(createdComment);
		}
		this.create(res, createdComment);
	}

	async publishComment({ params }: Request, res: Response, next: NextFunction): Promise<void> {
		const id = Number(params.id);
		if (Number.isNaN(id)) {
			return next(
				new HTTPError(HttpStatus.BAD_REQUEST, 'publishComment', 'Поврежденный id', {
					error: 'Параметр id должен быть числом'
				})
			);
		}
		const comment = await this.commentsService.publishComment(id);
		if (comment instanceof Error) {
			return next(comment);
		}
		this.ok(res, comment);
	}

	async rejectComment(req: Request<{ id?: string }, {}, CommentRejectDto>, res: Response, next: NextFunction): Promise<void> {
		const id = Number(req.params.id);
		if (Number.isNaN(id)) {
			return next(
				new HTTPError(HttpStatus.BAD_REQUEST, 'publishComment', 'Поврежденный id', {
					error: 'Параметр id должен быть числом'
				})
			);
		}
		const comment = await this.commentsService.rejectComment(id, req.body.cause, req.user);
		if (comment instanceof Error) {
			return next(comment);
		}
		this.ok(res, comment);
	}

	async getCommentsForAdminPanel({ body }: Request<{}, {}, GetCommentsForAdminPanelDto>, res: Response): Promise<void> {
		const status = Object.values(StatusComment)[body.status];
		this.ok(res, await this.commentsService.getForAdminPanel(status, body.take, body.skip));
	}

	async getByMovieId(req: Request, res: Response, next: NextFunction): Promise<void> {
		const take = setDefaultQuery(Number(req.query.take), Number(this.configService.get('LIMIT_COMMENTS_PER_REQUEST')) || 6);
		const skip = Number(req.query.skip) || 0;
		const movieId = Number(req.params.id);
		if (Number.isNaN(movieId)) {
			return next(
				new HTTPError(HttpStatus.BAD_REQUEST, 'getByMovieId', 'Неверно указаны данные', {
					error: 'В параметре movieId указано не число'
				})
			);
		}
		const comments = await this.commentsService.getByMovieId({ movieId: Math.floor(movieId), skip, take });
		if (comments instanceof Error) {
			return next(comments);
		}
		this.ok(res, comments);
	}

	async getChilren(req: Request, res: Response, next: NextFunction): Promise<void> {
		const take = setDefaultQuery(Number(req.query.take), Number(this.configService.get('LIMIT_COMMENTS_PER_REQUEST')) || 6);
		const skip = Number(req.query.skip) || 0;
		const parentId = Number(req.params.id);
		if (Number.isNaN(parentId)) {
			return next(
				new HTTPError(HttpStatus.BAD_REQUEST, 'getChilren', 'Неверно указаны данные', {
					error: 'В параметре parentId указано не число'
				})
			);
		}
		const comments = await this.commentsService.getChildren(Math.floor(parentId), take, skip);
		if (comments instanceof Error) {
			return next(comments);
		}
		this.ok(res, comments);
	}

	async setAction({ params, user }: Request, res: Response, next: NextFunction): Promise<void> {
		const id = Number(params.id);
		const actionId = Number(params.actionId);
		if (!id || Number.isNaN(actionId)) {
			return next(
				new HTTPError(HttpStatus.BAD_REQUEST, 'setAction', 'Параметры переданы неверно', {
					error: `В параметр id или actionId передано не число`
				})
			);
		}
		const comment = await this.commentsService.setAction(user, id, actionId);
		if (comment instanceof Error) {
			return next(comment);
		}
		this.ok(res, comment);
	}

	async getCount(req: Request, res: Response, next: NextFunction): Promise<void> {
		const id = Number(req.params.id);
		if (Number.isNaN(id)) {
			return next(
				new HTTPError(HttpStatus.BAD_REQUEST, 'getCount', 'Параметры переданы неверно', {
					error: `В параметр id передано не число`
				})
			);
		}
		const count = await this.commentsService.getCount(id);
		if (count instanceof Error) {
			return next(count);
		}
		this.ok(res, count);
	}
}
