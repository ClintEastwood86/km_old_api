import { IsEmail } from 'class-validator';

export class UserForgotPasswordDto {
	@IsEmail({}, { message: 'Неверно указан email' })
	email: string;
}
