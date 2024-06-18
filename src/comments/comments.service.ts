import { Comment, StatusComment } from '@prisma/client';
import { ICommentsService, RequestCommentsByMovieId } from './comments.service.interface';
import { CommentCreateDto } from './dto/comment-create.dto';
import { inject, injectable } from 'inversify';
import { IMoviesRepository } from '../movies/movies.repository.interface';
import { TYPES } from '../types';
import { HTTPError } from '../errors/http-error';
import { HttpStatus } from '../helpers/http-status';
import { ICommentRepository, ReturnTypeActionComment } from './comments.repository.interface';
import { IUsersService } from '../users/users.service.interface';
import { regExpEmoji } from './comments.constants';
import { ILoggerService } from '../logger/logger.service.interface';
import { CommentActions } from '../enums/action.enum';
import { CommentsRepository } from './comments.repository';
import { IRanksService } from '../ranks/ranks.service.interface';
import { PointsItemCategory } from '../pointsItems/pointsItem.enum';
import { IUsersRepository } from '../users/users.repository.interface';
import { AttachedAliasInComment } from './comments.types';
import { UserRole } from '../enums/role.enum';

@injectable()
export class CommentsService implements ICommentsService {
	constructor(
		@inject(TYPES.IMoviesRepository) private moviesRepository: IMoviesRepository,
		@inject(TYPES.IUsersService) private usersService: IUsersService,
		@inject(TYPES.IRanksService) private ranksService: IRanksService,
		@inject(TYPES.ICommentsRepository) private commentsRepository: ICommentRepository,
		@inject(TYPES.IUsersRepository) private usersRepository: IUsersRepository,
		@inject(TYPES.ILoggerService) private logger: ILoggerService
	) {}

	async create({ content, movieId, parentId }: CommentCreateDto, email: string): Promise<Comment | HTTPError> {
		const isMovieExist = await this.moviesRepository.isMovieExist(movieId);
		if (!isMovieExist) {
			return new HTTPError(HttpStatus.BAD_REQUEST, 'createComment', 'Фильм не найден', {
				error: `Фильм с id ${movieId} не найден`
			});
		}

		const parsedComment = content.replace(regExpEmoji, ' ');
		if (parsedComment.length < 6 || parsedComment.length > 720) {
			return new HTTPError(HttpStatus.FORBIDDEN, 'createComment', 'Слишком короткий или длинный комментарий', {
				error: 'Комментарий должен быть длинее 5 и короче 720 символов'
			});
		}

		const user = await this.usersService.searchUser(email, { context: 'createComment' });
		if (user instanceof Error) {
			return user;
		}

		const parentComment = parentId && (await this.commentsRepository.findComment(parentId));
		if (parentComment && parentComment.parentId) {
			parentId = parentComment.parentId;
		}
		if (parentId && (!parentComment || parentComment.status !== StatusComment.PUBLISHED || parentComment.movieId !== movieId)) {
			parentId = undefined;
		}

		const createdComment = await this.commentsRepository.createComment({ content, movieId, parentId }, user.id);
		if (!createdComment) {
			return new HTTPError(HttpStatus.INTERNAL_SERVER_ERROR, 'createComment', 'Ошибка на сервере', {
				error: 'Не удалось отправить комментарий в базу данных'
			});
		}

		return createdComment;
	}

	async publishComment(id: number): Promise<Comment | HTTPError> {
		const comment = await this.commentsRepository.publish(id);
		if (!comment) {
			return new HTTPError(HttpStatus.BAD_REQUEST, 'publishComment', 'Передан неверный id', {
				error: `Комментарий с id ${id} не найден`
			});
		}
		const lastCommentInUser = await this.commentsRepository.getLastCommentDate(comment.userId, id);
		if (!lastCommentInUser || (lastCommentInUser && lastCommentInUser.getDate() !== new Date().getDate())) {
			const user = await this.usersRepository.findUserAndSelect('email', { id: comment.userId });
			if (!user) return comment;
			await this.ranksService.addPoints({
				category: PointsItemCategory.Comment,
				useMultiplier: true,
				email: user.email
			});
		}
		return comment;
	}

	async rejectComment(id: number, cause: string, email: string): Promise<Comment | HTTPError> {
		const notFoundCommentError = new HTTPError(HttpStatus.BAD_REQUEST, 'rejectComment', 'Передан неверный id', {
			error: `Комментарий с id ${id} не найден`
		});
		const user = await this.usersService.findUserByEmail(email);
		const foundComment = await this.commentsRepository.findComment(id);
		if (!foundComment) {
			return notFoundCommentError;
		}
		if (!user) {
			return new HTTPError(HttpStatus.NOT_FOUND, 'rejectComment', 'Не найден', {
				error: `Пользователь с email ${email} не найден`
			});
		}
		if (foundComment.status == StatusComment.REJECTED) {
			return new HTTPError(HttpStatus.BAD_REQUEST, 'rejectComment', 'Удалено', {
				error: `Комментарий уже удален`
			});
		}
		if (foundComment.userId !== user.id && UserRole.MODERATOR > UserRole[user.role]) {
			return new HTTPError(HttpStatus.FORBIDDEN, 'rejectComment', 'Запрещено', {
				error: 'Разрешено удалять только свои комментарии'
			});
		}
		const comment = await this.commentsRepository.reject(id);
		if (!comment) {
			return notFoundCommentError;
		}
		this.logger.log(`[${email}] Комментарий с id ${id} был удален по причине: ${cause}`);
		return comment;
	}

	async getByMovieId({ skip, take, movieId }: RequestCommentsByMovieId): Promise<Comment[]> {
		return await this.commentsRepository.getCommentsByMovie(movieId, take, skip);
	}

	async getChildren(parentId: number, take: number, skip: number): Promise<Comment[]> {
		return await this.commentsRepository.getChildrenComments(parentId, take, skip);
	}

	async setAction(email: string, id: number, action: number): Promise<ReturnTypeActionComment | HTTPError> {
		const comment = await this.commentsRepository.findComment(id);
		if (!comment) {
			return new HTTPError(HttpStatus.INTERNAL_SERVER_ERROR, 'setAction', 'Ошибка в базе данных', {
				error: `Проверьте существует ли комментарий с id, который вы передали, или попробуйте позже`
			});
		}
		if (comment.status !== StatusComment.PUBLISHED) {
			return new HTTPError(HttpStatus.FORBIDDEN, 'setAction', 'Временно недоступно', {
				error: 'Повторите, когда комментарий будет опубликован'
			});
		}
		let result: Awaited<ReturnType<CommentsRepository['likeComment']>>;
		switch (action) {
			case CommentActions.Empty:
				result = await this.commentsRepository.removeLike(email, id);
				break;
			case CommentActions.Like:
				result = await this.commentsRepository.likeComment(email, id);
				break;
			case CommentActions.Dislike:
				result = await this.commentsRepository.dislikeComment(email, id);
				break;
			default:
				return new HTTPError(HttpStatus.BAD_REQUEST, 'setAction', 'Не найдено действие', {
					error: `Действие с id ${action} невыполнимо`
				});
		}
		if (!result) {
			return new HTTPError(HttpStatus.INTERNAL_SERVER_ERROR, 'setAction', 'Ошибка в базе данных', {
				error: `Проверьте существует ли комментарий с id, который вы передали, или попробуйте позже`
			});
		}
		return result;
	}

	async getForAdminPanel(status: StatusComment, take: number, skip: number): Promise<AttachedAliasInComment[]> {
		return await this.commentsRepository.getForAdminPanel(status, take, skip);
	}

	async getCount(movieId: number): Promise<number | HTTPError> {
		return await this.commentsRepository.getCount(movieId);
	}
}
