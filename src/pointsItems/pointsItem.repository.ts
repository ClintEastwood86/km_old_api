import { PointsItem } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import { PointsItemCreateDto } from './dto/pointItem-create.dto';
import { IPointsItemRepository } from './pointsItem.repository.interface';
import { CommonDatabase } from '../database/common.database';

@injectable()
export class PointsItemRepository implements IPointsItemRepository {
	constructor(@inject(TYPES.CommonDatabase) private database: CommonDatabase) {}

	async create(dto: PointsItemCreateDto): Promise<PointsItem | null> {
		try {
			return await this.database.client.pointsItem.create({ data: dto });
		} catch (e) {
			return null;
		}
	}

	async getAll(): Promise<PointsItem[]> {
		return await this.database.client.pointsItem.findMany({ orderBy: { id: 'asc' } });
	}

	async getById(id: number): Promise<null | PointsItem> {
		try {
			return await this.database.client.pointsItem.findUnique({ where: { id } });
		} catch (error) {
			return null;
		}
	}
}
