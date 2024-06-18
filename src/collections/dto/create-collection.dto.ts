import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { collectionsColors } from '../collections.constants';

export class CreateCollectionDto {
	@IsIn(collectionsColors, { message: `Используйте доступные цвета ${collectionsColors}` })
	color: string;

	@MinLength(5, { message: '[name] Минимальная длина – 5 символов' })
	@MaxLength(44, { message: '[name] Максимальная длина – 44 символа' })
	@IsString({ message: '[name] Укажите число' })
	name: string;

	@MaxLength(1500, { message: '[description] Максимальная длина – 1500 символов' })
	@MinLength(15, { message: '[description] Минимальная длина – 15 символов' })
	@IsString({ message: '[description] Укажите строку' })
	description: string;

	@IsBoolean({ message: '[private] Укажите булевое значение' })
	@IsOptional()
	private = false;
}
