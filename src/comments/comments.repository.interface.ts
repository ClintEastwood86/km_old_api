import { Comment, StatusComment } from '@prisma/client';
import { CommentCreateDto } from './dto/comment-create.dto';
import { AttachedAliasInComment } from './comments.types';

export interface ICommentRepository {
	findComment(id: number): Promise<Comment | null>;
	createComment(dto: CommentCreateDto, userId: number): Promise<Comment | null>;
	publish(id: number): Promise<Comment | null>;
	reject(id: number): Promise<Comment | null>;
	getCommentsByMovie(movieId: number, take: number, skip: number): Promise<Comment[]>;
	getChildrenComments(parentId: number, take: number, skip: number): Promise<Comment[]>;
	getCount(movieId: number): Promise<number>;
	likeComment(email: string, id: number): Promise<ReturnTypeActionComment | null>;
	dislikeComment(email: string, id: number): Promise<ReturnTypeActionComment | null>;
	removeLike(email: string, id: number): Promise<ReturnTypeActionComment | null>;
	getLastCommentDate(userId: number, publishedCommentId: number): Promise<Date | null>;
	getForAdminPanel(status: StatusComment, take: number, skip: number): Promise<AttachedAliasInComment[]>;
}

export interface ReturnTypeActionComment {
	likes: number[];
	dislikes: number[];
}
