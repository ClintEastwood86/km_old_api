import { ContainerModule, interfaces } from 'inversify';
import { BonusController } from './bonus.controller';
import { TYPES } from '../types';
import { IBonusService } from './bonus.service.interface';
import { BonusService } from './bonus.service';
import { BonusRepository } from './bonus.repository';
import { IBonusRepository } from './bonus.repository.interface';

export const bonusContainer = new ContainerModule((bind: interfaces.Bind) => {
	bind<BonusController>(TYPES.BonusController).to(BonusController);
	bind<IBonusService>(TYPES.IBonusService).to(BonusService);
	bind<IBonusRepository>(TYPES.IBonusRepository).to(BonusRepository);
});
