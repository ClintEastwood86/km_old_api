import { Comment } from '@prisma/client';

export type AttachedAliasInComment = Comment & {
	alias: string;
};
