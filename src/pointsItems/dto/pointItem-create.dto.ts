import { IsInt, IsString } from 'class-validator';

export class PointsItemCreateDto {
	@IsString({ message: 'Поле name не является строкой' })
	name: string;

	@IsInt({ message: 'Поле addPoints не является числом' })
	addPoints: number;
}
