import { IsBoolean, IsDate, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { MovieType } from '../../../prisma/generated/movies';
import { SortMoviesEnumId } from '../../enums/sort.enum';

export class MoviesSearchDto {
	@Type(() => Date)
	@IsDate({ message: '[date_start] Указана не дата' })
	@IsOptional()
	date_start?: Date;

	@Type(() => Date)
	@IsDate({ message: '[date_end] Указана не дата' })
	@IsOptional()
	date_end?: Date;

	@IsInt({ message: '[genre] Указан не массив чисел', each: true })
	@IsOptional()
	genre?: number[];

	@IsInt({ message: '[country] Указан не массив чисел', each: true })
	@IsOptional()
	country?: number[];

	@IsEnum(MovieType, { message: '[type] Enum, "Film", "Serial"' })
	@IsOptional()
	type?: (typeof MovieType)[keyof typeof MovieType];

	@IsString({ message: '[q] Указана не строка' })
	@IsOptional()
	q?: string;

	@IsEnum(SortMoviesEnumId, { message: '[sort] Enum' })
	@IsOptional()
	sort?: SortMoviesEnumId;

	@IsBoolean()
	@IsOptional()
	skipAdultContent?: boolean = false;
}
