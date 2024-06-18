import { PointsItem } from '@prisma/client';
import { HTTPError } from '../errors/http-error';
import { PointsItemCreateDto } from './dto/pointItem-create.dto';

export interface IPointsItemsService {
	getPointsItemById(id: number): Promise<HTTPError | PointsItem>;
	createPointsItem(dto: PointsItemCreateDto): Promise<PointsItem | HTTPError>;
	get(): Promise<PointsItem[] | HTTPError>;
}
