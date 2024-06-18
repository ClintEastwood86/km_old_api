import { IsInt, IsString, Max, Min } from 'class-validator';

export class FindCollectionsDto {
	@IsString()
	q: string;

	@Max(12, { message: '[take] Максимальное значение – 12' })
	@Min(1, { message: '[take] Минимальное значение – 1' })
	@IsInt({ message: '[take] Укажите целое число' })
	take: number;
}
