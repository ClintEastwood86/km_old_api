import { IsInt } from 'class-validator';

export class SetMoviesDto {
	@IsInt({ message: '[movies] Укажите массив id', each: true })
	movies: number[] | number;
}
