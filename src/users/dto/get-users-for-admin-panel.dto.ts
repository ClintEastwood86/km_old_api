import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength } from 'class-validator';
import { SortUsersForAdminPanelEnumId } from '../../enums/sort.enum';

export class GetUsersForAdminPanelDto {
	@MaxLength(30)
	@IsString({ message: '[q] Укажите строку' })
	@IsOptional()
	q?: string;

	@Max(15, { message: '[take] Максимальное значение – 15' })
	@IsInt({ message: '[take] Укажите число' })
	take: number;

	@IsInt({ message: '[skip] Укажите число' })
	skip: number;

	@IsEnum(SortUsersForAdminPanelEnumId, { message: '[sort] Используйте одно из значений enum' })
	sort: SortUsersForAdminPanelEnumId;
}
