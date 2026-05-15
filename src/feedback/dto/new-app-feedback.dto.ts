import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class NewAppFeedbackDto {
	@IsArray({ message: '[keepFeatures] Должен быть массив' })
	@ArrayMaxSize(20, { message: '[keepFeatures] Максимум 20 элементов' })
	@IsString({ each: true, message: '[keepFeatures] Каждый элемент должен быть строкой' })
	keepFeatures: string[];

	@IsOptional()
	@IsString({ message: '[wishes] Должна быть строка' })
	@MaxLength(2000, { message: '[wishes] Максимум 2000 символов' })
	wishes?: string;

	@IsOptional()
	@IsString({ message: '[username] Должна быть строка' })
	@MaxLength(100, { message: '[username] Максимум 100 символов' })
	username?: string;
}
