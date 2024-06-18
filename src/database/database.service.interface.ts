import { PrismaClient as CommonPrismaClient } from '.prisma/client';
import { PrismaClient as MoviesPrismaClient } from '../../prisma/generated/movies';

export interface IDatabaseService<T extends CommonPrismaClient | MoviesPrismaClient> {
	client: T;
	connect(): Promise<void>;
	disconnect(): Promise<void>;
}
