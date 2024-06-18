import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { SortMoviesEnumId } from '../../enums/sort.enum';

export class GetMoviesByArrayDto {
	@Max(25, { message: '[take] Значение не должно превышать 25' })
	@Min(0)
	@IsInt({ message: '[take] Укажите число' })
	take: number;

	@Min(0)
	@IsInt({ message: '[skip] Укажите число' })
	skip: number;

	@IsOptional()
	sort?: SortMoviesEnumId;

	@IsInt({ each: true, message: '[movies] Укажите массив чисел' })
	movies: number[] | number;
}
