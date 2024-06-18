import { Type } from 'class-transformer';
import { IsDate, IsInt, Min } from 'class-validator';

export class BonusCreateDto {
	@Min(1, { message: '[userId] Минимальное значение – 1' })
	@IsInt({ message: '[userId] Укажите число' })
	userId: number;

	@Min(2, { message: '[multiplier] Минимальное значение – 2' })
	@IsInt({ message: '[multiplier] Укажите число' })
	multiplier: number;

	@Type(() => Date)
	@IsDate({ message: '[expiries] Указана не дата' })
	expiries: string | Date;
}
