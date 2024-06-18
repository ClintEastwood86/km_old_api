import { IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class AddPointsDto {
	@MaxLength(25)
	@MinLength(1)
	@IsString({ message: '[message] Укажите строку' })
	message: string;

	@Min(0, { message: '[userId] У пользователя не может быть id отрицательным' })
	@IsInt({ message: '[userId] Указано не число' })
	userId: number;

	@Max(1000, { message: '[points] Максимальное значение – 1' })
	@Min(1, { message: '[points] Минимальное значение – 1' })
	@IsInt({ message: '[points] Указано не число' })
	points: number;
}
