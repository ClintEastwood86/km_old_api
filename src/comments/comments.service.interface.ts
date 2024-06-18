import { Comment, StatusComment } from '@prisma/client';
import { CommentCreateDto } from './dto/comment-create.dto';
import { HTTPError } from '../errors/http-error';
import { ReturnTypeActionComment } from './comments.repository.interface';
import { AttachedAliasInComment } from './comments.types';

export interface RequestCommentsByMovieId {
	take: number;
	skip: number;
	movieId: number;
}

export interface ICommentsService {
	create(dto: CommentCreateDto, email: string): Promise<Comment | HTTPError>;
	publishComment(id: number): Promise<Comment | HTTPError>;
	rejectComment(id: number, cause: string, emailAdmin: string): Promise<Comment | HTTPError>;
	getByMovieId(options: RequestCommentsByMovieId): Promise<Comment[]>;
	getChildren(parentId: number, take: number, skip: number): Promise<Comment[]>;
	setAction(email: string, id: number, action: number): Promise<ReturnTypeActionComment | HTTPError>;
	getForAdminPanel(status: StatusComment, take: number, skip: number): Promise<AttachedAliasInComment[]>;
	getCount(movieId: number): Promise<HTTPError | number>;
}
