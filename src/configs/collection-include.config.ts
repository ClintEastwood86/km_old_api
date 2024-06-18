import { Prisma } from '@prisma/client';

export const collectionIncludeConfig: Prisma.CollectionInclude = {
	_count: { select: { dislikes: true, likes: true, followers: true } },
	likes: { select: { id: true } },
	dislikes: { select: { id: true } },
	followers: { select: { id: true } },
	creator: {
		select: {
			id: true,
			email: true,
			login: true,
			avatar: true,
			role: true,
			rankId: true,
			userPoints: true,
			awardId: true,
			awardSelected: { select: { icon: true } }
		}
	}
};
