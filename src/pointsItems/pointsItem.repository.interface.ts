import { PointsItem } from '@prisma/client';
import { PointsItemCreateDto } from './dto/pointItem-create.dto';

export interface IPointsItemRepository {
	getById(id: number): Promise<null | PointsItem>;
	getAll(): Promise<PointsItem[]>;
	create(dto: PointsItemCreateDto): Promise<null | PointsItem>;
}
