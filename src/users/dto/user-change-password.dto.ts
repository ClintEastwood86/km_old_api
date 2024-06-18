import { Matches, MinLength, MaxLength, IsString } from 'class-validator';

export class UserChangePasswordDto {
	@Matches(/^[0-9a-zA-Z!@#.$%^&*()_+|\-=]{1,}$/, { message: 'Пароль должен содержать только цифры, буквы и специальные символы' })
	@MinLength(8, { message: 'Минимальная длина пароля – 8 символов' })
	@MaxLength(21, { message: 'Максимальная длина пароля – 21 символ' })
	@IsString({ message: 'Не указан пароль' })
	oldPassword: string;

	@Matches(/^[0-9a-zA-Z!@#.$%^&*()_+|\-=]{1,}$/, { message: 'Пароль должен содержать только цифры, буквы и специальные символы' })
	@MinLength(8, { message: 'Минимальная длина пароля – 8 символов' })
	@MaxLength(21, { message: 'Максимальная длина пароля – 21 символ' })
	@IsString({ message: 'Не указан пароль' })
	newPassword: string;
}
