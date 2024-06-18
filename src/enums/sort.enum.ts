import { Prisma as PrismaMovies } from '../../prisma/generated/movies';
import { Prisma as PrismaCommon } from '@prisma/client';

export enum SortMoviesEnumId {
	PremiereAsc,
	PremiereDesc,
	RatingKpAsc,
	RatingKpDesc,
	RatingImdbAsc,
	RatingImdbDesc,
	AgeRestrictionAsc,
	AgeRestrictionDesc,
	TimeMinutesAsc,
	TimeMinutesDesc
}

export enum SortUsersForAdminPanelEnumId {
	New,
	Login,
	Avatar
}

type IEnumSort<T, EnumItem> = { id: EnumItem; condition: T }[];

export const movieSorting: IEnumSort<PrismaMovies.MovieOrderByWithRelationInput, SortMoviesEnumId> = [
	{
		id: SortMoviesEnumId.PremiereAsc,
		condition: {
			premiere: {
				sort: 'asc',
				nulls: 'last'
			}
		}
	},
	{
		id: SortMoviesEnumId.PremiereDesc,
		condition: {
			premiere: {
				sort: 'desc',
				nulls: 'last'
			}
		}
	},
	{
		id: SortMoviesEnumId.RatingKpAsc,
		condition: {
			ratingKp: {
				sort: 'asc',
				nulls: 'last'
			}
		}
	},
	{
		id: SortMoviesEnumId.RatingKpDesc,
		condition: {
			ratingKp: {
				sort: 'desc',
				nulls: 'last'
			}
		}
	},
	{
		id: SortMoviesEnumId.RatingImdbAsc,
		condition: {
			ratingImdb: {
				sort: 'asc',
				nulls: 'last'
			}
		}
	},
	{
		id: SortMoviesEnumId.RatingImdbDesc,
		condition: {
			ratingImdb: {
				sort: 'desc',
				nulls: 'last'
			}
		}
	},
	{
		id: SortMoviesEnumId.AgeRestrictionAsc,
		condition: {
			ageRestriction: 'asc'
		}
	},
	{
		id: SortMoviesEnumId.AgeRestrictionDesc,
		condition: {
			ageRestriction: 'desc'
		}
	},
	{
		id: SortMoviesEnumId.TimeMinutesAsc,
		condition: {
			timeMinutes: {
				sort: 'asc',
				nulls: 'last'
			}
		}
	},
	{
		id: SortMoviesEnumId.TimeMinutesDesc,
		condition: {
			timeMinutes: {
				sort: 'desc',
				nulls: 'last'
			}
		}
	}
];

export const usersSorting: IEnumSort<PrismaCommon.UserModelOrderByWithRelationInput, SortUsersForAdminPanelEnumId> = [
	{
		id: SortUsersForAdminPanelEnumId.New,
		condition: {
			createdAt: 'desc'
		}
	},
	{
		id: SortUsersForAdminPanelEnumId.Login,
		condition: {
			updatedLoginAt: {
				sort: 'desc',
				nulls: 'last'
			}
		}
	},
	{
		id: SortUsersForAdminPanelEnumId.Avatar,
		condition: {
			updatedAvatarAt: {
				sort: 'desc',
				nulls: 'last'
			}
		}
	}
];
