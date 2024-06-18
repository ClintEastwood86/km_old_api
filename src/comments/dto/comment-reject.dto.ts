import { IsString, MaxLength } from 'class-validator';

export class CommentRejectDto {
	@MaxLength(300, { message: '[cause] Максимальная длина причины 300 символов' })
	@IsString({ message: '[cause] Указана не строка' })
	cause: string;
}
