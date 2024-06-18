import { ContainerModule, interfaces } from 'inversify';
import { TYPES } from '../types';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { IUsersRepository } from './users.repository.interface';
import { UsersService } from './users.service';
import { IUsersService } from './users.service.interface';

export const usersContainer = new ContainerModule((bind: interfaces.Bind) => {
	bind<IUsersRepository>(TYPES.IUsersRepository).to(UsersRepository).inSingletonScope();
	bind<IUsersService>(TYPES.IUsersService).to(UsersService).inSingletonScope();
	bind<UsersController>(TYPES.UserController).to(UsersController).inSingletonScope();
});
