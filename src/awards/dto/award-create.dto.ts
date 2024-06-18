import { AwardCategory } from '@prisma/client';
import { IsEnum, IsJSON, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class AwardCreateDto {
	@MaxLength(13, { message: 'Максимальная длина name 13 символов' })
	@MinLength(2, { message: 'Минимальная длина name 2 символа' })
	@IsString({ message: 'Поле name должно иметь тип string' })
	name: string;

	@Matches(/(<svg)([^<]*|[^>]*)/, { message: 'Указан не svg' })
	@IsString({ message: 'Поле icon должно содержать svg преобразованную в строку' })
	icon: string;

	@IsString({ message: 'Поле description должно содержать тип string' })
	description: string;

	@IsJSON({ message: 'Для условия указан не json' })
	condition: string;

	@IsEnum(AwardCategory, { message: `Укажите категорию для награды ${Object.values(AwardCategory)}` })
	category: AwardCategory;
}
