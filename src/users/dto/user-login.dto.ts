import { IsEmail, MinLength, IsString } from 'class-validator';

export class UserLoginDto {
	@IsEmail({}, { message: 'Неверно указан email' })
	email: string;

	@MinLength(8, { message: 'Минимальная длина пароля – 8 символов' })
	@IsString({ message: 'Не указан пароль' })
	password: string;
}
