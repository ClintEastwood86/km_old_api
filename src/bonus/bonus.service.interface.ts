import { Bonus, Holidays } from '@prisma/client';
import { HTTPError } from '../errors/http-error';
import { BonusCreateDto } from './dto/bonus-create.dto';

export interface IBonusService {
	create(dto: BonusCreateDto, email: string): Promise<Bonus | HTTPError>;
	getCommonMultiplier(userId: number): Promise<number | null>;
	getCommonMultiplier(email: string): Promise<number | null>;
	getHolidays(): Promise<Holidays[]>;
}
