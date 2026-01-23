import { Award, AwardCategory } from '@prisma/client';
import { HTTPError } from '../errors/http-error';
import { AwardCreateDto } from './dto/award-create.dto';
import { Logger } from 'pino';

export interface IAwardsService {
	create(dto: AwardCreateDto, logger: Logger): Promise<Award | HTTPError>;
	update(id: number, dto: AwardCreateDto): Promise<Award | HTTPError>;
	selectUnopenedAwards(openedAwardsId: number[], category: AwardCategory): Promise<Award[]>;
	updateOpenAwardsInUser(userId: number, category: AwardCategory, logger: Logger): Promise<void>;
	getAllAwards(): Promise<Award[] | HTTPError>;
	getById(id: number): Promise<Award | HTTPError>;
	deleteById(id: number, logger: Logger): Promise<Award | HTTPError>;
	updatePositions(awards: Pick<Award, 'id' | 'position'>[]): Promise<void>;
}
