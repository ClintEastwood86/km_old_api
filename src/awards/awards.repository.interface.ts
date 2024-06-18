import { Award, AwardCategory } from '@prisma/client';
import { AwardCreateDto } from './dto/award-create.dto';

export interface IAwardsRepository {
	create(dto: AwardCreateDto): Promise<null | Award>;
	update(id: number, dto: AwardCreateDto): Promise<null | Award>;
	removeAwardsInUsers(id: number): Promise<void>;
	findAwardsByCategory(category: AwardCategory): Promise<Award[]>;
	getAwardById(id: number): Promise<Award | null>;
	getAllAwards(): Promise<Award[]>;
	deleteById(id: number): Promise<Award | null>;
	isValidCondition(condition: Record<string, any>): Promise<boolean>;
	addNewAwardUsers(awardId: number, condition: Record<string, any>): Promise<void>;
	updatePositions(awards: Pick<Award, 'id' | 'position'>[]): Promise<void>;
}
