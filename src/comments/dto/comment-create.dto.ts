import { IsInt, IsOptional, IsString } from 'class-validator';

export class CommentCreateDto {
	@IsString({ message: '[content] Не строка' })
	content: string;

	@IsInt({ message: '[movieId] Указано не число' })
	movieId: number;

	@IsInt({ message: '[parentId] Указано не число' })
	@IsOptional()
	parentId?: number;
}
