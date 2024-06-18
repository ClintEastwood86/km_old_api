import { ContainerModule } from 'inversify';
import { TYPES } from '../types';
import { AwardsRepository } from './awards.repository';
import { IAwardsRepository } from './awards.repository.interface';
import { IAwardsService } from './awards.service.interface';
import { AwardsService } from './awards.service';
import { AwardsController } from './awards.controller';

export const awardsContainer = new ContainerModule((bind) => {
	bind<IAwardsRepository>(TYPES.IAwardsRepository).to(AwardsRepository).inSingletonScope();
	bind<IAwardsService>(TYPES.IAwardsService).to(AwardsService).inSingletonScope();
	bind<AwardsController>(TYPES.AwardsController).to(AwardsController).inSingletonScope();
});
