import { IsString, MaxLength } from 'class-validator';

export class UserBlockDto {
	@MaxLength(500, { message: '[message] Максимальная длина сообщения – 500' })
	@IsString({ message: '[message] Введите строку' })
	message: string;
}
