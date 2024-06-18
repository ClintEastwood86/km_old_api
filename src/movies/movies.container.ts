import { ContainerModule, interfaces } from 'inversify';
import { IMoviesService } from './movies.service.interface';
import { TYPES } from '../types';
import { MoviesService } from './movies.service';
import { MoviesController } from './movies.controller';
import { MoviesRepository } from './movies.repository';
import { IMoviesRepository } from './movies.repository.interface';
import { MoviesWebSocketController } from './movies.websocket.controller';

export const moviesContainer = new ContainerModule((bind: interfaces.Bind) => {
	bind<IMoviesService>(TYPES.IMoviesService).to(MoviesService).inSingletonScope();
	bind<MoviesController>(TYPES.MoviesController).to(MoviesController).inSingletonScope();
	bind<IMoviesRepository>(TYPES.IMoviesRepository).to(MoviesRepository).inSingletonScope();
	bind<MoviesWebSocketController>(TYPES.MoviesWebSocketController).to(MoviesWebSocketController).inSingletonScope();
});
