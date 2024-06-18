import { IsEmail } from 'class-validator';

export class UserChangeEmailDto {
	@IsEmail()
	email: string;
}
