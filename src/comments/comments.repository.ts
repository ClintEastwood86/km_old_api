import { inject, injectable } from 'inversify';
import { ICommentRepository, ReturnTypeActionComment } from './comments.repository.interface';
import { TYPES } from '../types';
import { CommonDatabase } from '../database/common.database';
import { Comment, StatusComment } from '@prisma/client';
import { CommentCreateDto } from './dto/comment-create.dto';
import { ILoggerService } from '../logger/logger.service.interface';
import { MoviesDatabase } from '../database/movies.database';
import { AttachedAliasInComment } from './comments.types';

@injectable()
export class CommentsRepository implements ICommentRepository {
	constructor(
		@inject(TYPES.CommonDatabase) private commonDatabase: CommonDatabase,
		@inject(TYPES.MoviesDatabase) private moviesDatabase: MoviesDatabase,
		@inject(TYPES.ILoggerService) private logger: ILoggerService
	) {}

	async createComment({ content, movieId, parentId }: CommentCreateDto, userId: number): Promise<Comment | null> {
		try {
			return await this.commonDatabase.client.comment.create({ data: { content, movieId, parentId, userId } });
		} catch (error) {
			return null;
		}
	}

	async findComment(id: number): Promise<null | Comment> {
		return await this.commonDatabase.client.comment.findUnique({ where: { id } });
	}

	async publish(id: number): Promise<Comment | null> {
		try {
			return await this.commonDatabase.client.comment.update({ where: { id }, data: { status: StatusComment.PUBLISHED } });
		} catch (error) {
			return null;
		}
	}

	async reject(id: number): Promise<Comment | null> {
		try {
			return await this.commonDatabase.client.comment.update({ where: { id }, data: { status: StatusComment.REJECTED } });
		} catch (error) {
			return null;
		}
	}

	async getCommentsByMovie(movieId: number, take: number, skip: number): Promise<Comment[]> {
		try {
			return (
				await this.commonDatabase.client.comment.findMany({
					where: {
						movieId,
						parentId: null,
						status: StatusComment.PUBLISHED
					},
					orderBy: {
						createdAt: 'desc'
					},
					take,
					skip,
					include: {
						user: {
							select: {
								login: true,
								avatar: true,
								awardSelected: { select: { icon: true } }
							}
						},
						likes: { select: { id: true } },
						dislikes: { select: { id: true } },
						_count: { select: { children: true } }
					}
				})
			).map((c) => ({ ...c, likes: c.likes.map((l) => l.id), dislikes: c.dislikes.map((dl) => dl.id) }));
		} catch (error) {
			return [];
		}
	}

	async getChildrenComments(parentId: number, take: number, skip: number): Promise<Comment[]> {
		try {
			return (
				await this.commonDatabase.client.comment.findMany({
					where: {
						parentId,
						status: StatusComment.PUBLISHED
					},
					orderBy: {
						createdAt: 'desc'
					},
					take,
					skip,
					include: {
						user: {
							select: {
								login: true,
								avatar: true,
								awardSelected: { select: { icon: true } }
							}
						},
						likes: { select: { id: true } },
						dislikes: { select: { id: true } },
						_count: { select: { children: true } }
					}
				})
			).map((c) => ({ ...c, likes: c.likes.map((l) => l.id), dislikes: c.dislikes.map((dl) => dl.id) }));
		} catch (error) {
			return [];
		}
	}

	async getCount(movieId: number): Promise<number> {
		try {
			return await this.commonDatabase.client.comment.count({ where: { movieId, status: StatusComment.PUBLISHED } });
		} catch (error) {
			return 0;
		}
	}

	async likeComment(email: string, id: number): Promise<null | ReturnTypeActionComment> {
		try {
			const comment = await this.commonDatabase.client.comment.update({
				where: { id },
				data: { likes: { connect: { email } }, dislikes: { disconnect: { email } } },
				select: {
					likes: { select: { id: true } },
					dislikes: { select: { id: true } }
				}
			});
			return { likes: comment.likes.map((l) => l.id), dislikes: comment.dislikes.map((d) => d.id) };
		} catch (error) {
			this.logger.error(`[likeComment] Выпала ошибка при взаимодействии с базой данных ${error}`);
			return null;
		}
	}

	async dislikeComment(email: string, id: number): Promise<null | ReturnTypeActionComment> {
		try {
			const comment = await this.commonDatabase.client.comment.update({
				where: { id },
				data: { likes: { disconnect: { email } }, dislikes: { connect: { email } } },
				select: {
					likes: { select: { id: true } },
					dislikes: { select: { id: true } }
				}
			});
			return { likes: comment.likes.map((l) => l.id), dislikes: comment.dislikes.map((d) => d.id) };
		} catch (error) {
			this.logger.error(`[dislikeComment] Выпала ошибка при взаимодействии с базой данных ${error}`);
			return null;
		}
	}

	async removeLike(email: string, id: number): Promise<null | ReturnTypeActionComment> {
		try {
			const comment = await this.commonDatabase.client.comment.update({
				where: { id },
				data: { likes: { disconnect: { email } }, dislikes: { disconnect: { email } } },
				select: {
					likes: { select: { id: true } },
					dislikes: { select: { id: true } }
				}
			});
			return { likes: comment.likes.map((l) => l.id), dislikes: comment.dislikes.map((d) => d.id) };
		} catch (error) {
			this.logger.error(`[removeLike] Выпала ошибка при взаимодействии с базой данных ${error}`);
			return null;
		}
	}

	async getLastCommentDate(userId: number, publishedCommentId: number): Promise<Date | null> {
		const comment = await this.commonDatabase.client.comment.findFirst({
			where: { userId, id: { not: publishedCommentId }, status: 'PUBLISHED' },
			select: { createdAt: true },
			orderBy: { createdAt: 'desc' }
		});
		return comment && comment.createdAt;
	}

	async getForAdminPanel(status: StatusComment, take: number, skip: number): Promise<AttachedAliasInComment[]> {
		try {
			const comments = await this.commonDatabase.client.comment.findMany({
				where: { status },
				take,
				skip,
				orderBy: { createdAt: 'desc' },
				include: {
					user: {
						select: {
							id: true,
							login: true,
							avatar: true,
							awardSelected: { select: { icon: true } }
						}
					},
					likes: { select: { id: true } },
					dislikes: { select: { id: true } },
					_count: { select: { children: true } }
				}
			});
			const array: AttachedAliasInComment[] = [];
			for (const c of comments) {
				array.push({ ...c, alias: (await this.attachAliasToComment(c.movieId)) || '' });
			}
			return array;
		} catch (error) {
			return [];
		}
	}

	private async attachAliasToComment(movieId: number): Promise<string | void> {
		return (await this.moviesDatabase.client.movie.findUnique({ where: { id: movieId }, select: { alias: true } }))?.alias;
	}
}
