import { Award } from '@prisma/client';
import { IsArray } from 'class-validator';

export class UpdatePositionsDto {
	@IsArray({ message: '[awards] Указан не массив' })
	awards: Pick<Award, 'id' | 'position'>[];
}
