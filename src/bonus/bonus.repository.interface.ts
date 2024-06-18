import { Bonus, Holidays } from '@prisma/client';
import { BonusCreateDto } from './dto/bonus-create.dto';

export interface IBonusRepository {
	create(dto: BonusCreateDto, adminId: number): Promise<Bonus | null>;
	getActiveBonuses(userId: number): Promise<Bonus[]>;
	getCommonMultiplier(userId: number): Promise<number | null>;
	getCommonMultiplier(email: string): Promise<number | null>;
	getHolidays(): Promise<Holidays[]>;
}
