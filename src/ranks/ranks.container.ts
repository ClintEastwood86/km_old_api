import { ContainerModule, interfaces } from 'inversify';
import { TYPES } from '../types';
import { RanksController } from './ranks.controller';
import { RanksRepository } from './ranks.repository';
import { IRanksRepository } from './ranks.repository.interface';
import { RanksService } from './ranks.service';
import { IRanksService } from './ranks.service.interface';

export const ranksContainer = new ContainerModule((bind: interfaces.Bind) => {
	bind<IRanksService>(TYPES.IRanksService).to(RanksService).inSingletonScope();
	bind<IRanksRepository>(TYPES.IRanksRepository).to(RanksRepository).inSingletonScope();
	bind<RanksController>(TYPES.RanksController).to(RanksController).inSingletonScope();
});
