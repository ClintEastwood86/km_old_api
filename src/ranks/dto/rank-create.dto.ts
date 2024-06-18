import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class RankCreateDto {
	@MaxLength(15, { message: `[name] Максимальная длина – 15 символов` })
	@MinLength(2, { message: `[name] Минимальная длина – 2 символа` })
	@IsString({ message: '[name] Укажите строку' })
	name: string;

	@Min(0, { message: '[points] Минимальное значение – 0' })
	@IsInt({ message: '[points] Укажите число' })
	points: number;

	@IsInt({ message: '[awardId] Укажите число' })
	@IsOptional()
	awardId: number | null;
}
