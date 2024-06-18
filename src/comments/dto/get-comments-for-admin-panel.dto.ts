import { IsEnum, IsInt, Max, Min } from 'class-validator';
import { CommentStatusEnum } from '../../enums/comment.enum';

export class GetCommentsForAdminPanelDto {
	@IsEnum(CommentStatusEnum, { message: '[status] Не указан enum CommentStatusEnumm' })
	status: CommentStatusEnum;

	@Min(1)
	@Max(20, { message: '[take] Максимальное значение – 20' })
	@IsInt({ message: '[take] Укажите число' })
	take: number;

	@Min(0)
	@IsInt({ message: '[skip] Укажите число' })
	skip: number;
}
