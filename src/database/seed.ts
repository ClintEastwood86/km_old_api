import { PrismaClient } from '@prisma/client';
import { ConfigService } from '../configs/config.service';
import { LoggerService } from '../logger/logger.service';

const configService = new ConfigService(new LoggerService());

const prisma = new PrismaClient();
const seed = async (): Promise<void> => {
	await prisma.$connect();
	try {
		if (!(await prisma.rank.findFirst())) {
			await prisma.rank.create({ data: { name: 'Новичок', points: 0 } });
		}
		if (!(await prisma.pointsItem.findFirst())) {
			await prisma.pointsItem.createMany({
				data: [
					{
						name: `Просмотр (${configService.get('TICK_TIME')} минут)`,
						addPoints: +configService.get('POINTS_FOR_VIEW')
					},
					{
						name: 'Комментарий (1 в сутки)',
						addPoints: +configService.get('POINTS_FOR_COMMENT')
					},
					{
						name: 'Включённая рассылка',
						addPoints: +configService.get('POINTS_FOR_NOTIFICATION')
					}
				]
			});
		}
	} catch (error) {
		return;
	} finally {
		await prisma.$disconnect();
	}
};

seed();
