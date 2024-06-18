import { IsAlphanumeric, IsString, MaxLength, MinLength } from 'class-validator';

export class UserChangeLoginDto {
	@IsAlphanumeric('en-US', { message: 'Разрешено использовать только латинские буквы и цифры' })
	@MaxLength(14, { message: 'Максимальная длина логина – 14 символов' })
	@MinLength(4, { message: 'Минимальная длина логина – 4 символа' })
	@IsString({ message: 'Не указан логин' })
	login: string;
}
