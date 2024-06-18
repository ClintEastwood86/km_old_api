import { ContainerModule, interfaces } from 'inversify';
import { CollectionsController } from './collections.controller';
import { TYPES } from '../types';
import { ICollectionsService } from './collections.service.interface';
import { CollectionsService } from './collections.service';
import { ICollectionsRepository } from './collections.repository.interface';
import { CollectionsRepository } from './collections.repository';

export const collectionsContainer = new ContainerModule((bind: interfaces.Bind) => {
	bind<CollectionsController>(TYPES.CollectionsController).to(CollectionsController).inSingletonScope();
	bind<ICollectionsService>(TYPES.ICollectionsService).to(CollectionsService).inSingletonScope();
	bind<ICollectionsRepository>(TYPES.ICollectionsRepository).to(CollectionsRepository).inSingletonScope();
});
