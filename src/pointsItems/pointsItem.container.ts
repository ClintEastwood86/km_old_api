import { ContainerModule, interfaces } from 'inversify';
import { TYPES } from '../types';
import { PointsItemController } from './pointsItem.controller';
import { PointsItemRepository } from './pointsItem.repository';
import { PointsItemService } from './pointsItem.service';
import { IPointsItemsService } from './pointsItems.service.interface';

export const pointsItemContainer = new ContainerModule((bind: interfaces.Bind) => {
	bind<IPointsItemsService>(TYPES.IPointsItemService).to(PointsItemService).inSingletonScope();
	bind<PointsItemRepository>(TYPES.IPointsItemRepository).to(PointsItemRepository).inSingletonScope();
	bind<PointsItemController>(TYPES.PointsItemController).to(PointsItemController).inSingletonScope();
});
