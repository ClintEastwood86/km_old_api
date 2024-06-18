import { IsString, IsUUID } from 'class-validator';

export class SeeMovieDto {
	@IsUUID(4)
	@IsString({ message: '[alias] Укажите строку' })
	token: string;
}
