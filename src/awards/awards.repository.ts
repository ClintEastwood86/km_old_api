import { Award, AwardCategory } from '@prisma/client';
import { IAwardsRepository } from './awards.repository.interface';
import { AwardCreateDto } from './dto/award-create.dto';
import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import { CommonDatabase } from '../database/common.database';
import { ILoggerService } from '../logger/logger.service.interface';

@injectable()
export class AwardsRepository implements IAwardsRepository {
	constructor(
		@inject(TYPES.CommonDatabase) private database: CommonDatabase,
		@inject(TYPES.ILoggerService) private logger: ILoggerService
	) {}

	async create({ name, icon, description, category, condition }: AwardCreateDto): Promise<null | Award> {
		try {
			return await this.database.client.award.create({ data: { name, icon, description, category, condition } });
		} catch (error) {
			return null;
		}
	}

	async update(id: number, { name, icon, description, category, condition }: AwardCreateDto): Promise<Award | null> {
		try {
			return await this.database.client.award.update({ where: { id }, data: { name, icon, description, category, condition } });
		} catch (error) {
			return null;
		}
	}

	async findAwardsByCategory(category: AwardCategory): Promise<Award[]> {
		return await this.database.client.award.findMany({ where: { category } });
	}

	async getAwardById(id: number): Promise<Award | null> {
		try {
			return await this.database.client.award.findUnique({ where: { id } });
		} catch (error) {
			return null;
		}
	}

	async removeAwardsInUsers(id: number): Promise<void> {
		try {
			await this.database.client.award.update({
				where: { id },
				data: { userModelOpen: { set: [] }, userModelSelected: { set: [] } }
			});
		} catch (error) {
			return;
		}
	}

	async isValidCondition(condition: Record<string, any>): Promise<boolean> {
		try {
			await this.database.client.userModel.findMany({ where: condition });
			return true;
		} catch (error) {
			return false;
		}
	}

	async getAllAwards(): Promise<Award[]> {
		return await this.database.client.award.findMany({ orderBy: { position: 'desc' } });
	}

	async addNewAwardUsers(awardId: number, condition: Record<string, any>): Promise<void> {
		try {
			const users = await this.database.client.userModel.findMany({
				where: condition,
				select: { id: true }
			});
			for (const user of users) {
				await this.database.client.userModel.update({
					where: { id: user.id },
					data: { awardsOpen: { connect: { id: awardId } } }
				});
			}
		} catch (error) {
			return;
		}
	}

	async deleteById(id: number): Promise<Award | null> {
		try {
			return await this.database.client.award.delete({ where: { id } });
		} catch (error) {
			return null;
		}
	}

	async updatePositions(awards: Pick<Award, 'id' | 'position'>[]): Promise<void> {
		try {
			for (const award of awards) {
				await this.database.client.award.update({ where: { id: award.id }, data: { position: award.position } });
			}
		} catch (error) {
			return;
		}
	}
}
