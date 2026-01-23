import dayjs from 'dayjs';
import { inject, injectable } from 'inversify';
import { IFilesService } from './files.service.interface';
import 'reflect-metadata';
import { path } from 'app-root-path';
import { ensureDir, writeFile } from 'fs-extra';
import { readdir, rmdir, rm } from 'fs/promises';
import { FileElementResponse } from './dto/files-element.response';
import { hash } from 'bcryptjs';
import { TYPES } from '../types';
import { ILoggerService } from '../logger/logger.service.interface';
import { formatsFile } from './files.constants';
import sharp from 'sharp';
import { IConfigService } from '../configs/config.service.interface';

@injectable()
export class FilesService implements IFilesService {
	constructor(
		@inject(TYPES.IConfigService) private configService: IConfigService,
		@inject(TYPES.ILoggerService) private logger: ILoggerService
	) {}

	async saveFile(file: Express.Multer.File): Promise<FileElementResponse> {
		const dateFolder = dayjs(new Date()).format('YYYY-MM-DD');
		const uploadFolder = `${path}/upload/${dateFolder}`;

		const salt = Number(this.configService.get('SALT'));

		const fileNameCrypt = (await hash(file.originalname, salt)).replace(/[\\|/]/g, '');
		let fileFormat: string = file.originalname.substring(file.originalname.lastIndexOf('.'));
		let fileBuffer: Buffer = file.buffer;

		if (formatsFile.images.includes(fileFormat) && fileFormat !== '.webp') {
			fileBuffer = await this.convertToWebp(fileBuffer);
			fileFormat = '.webp';
		}

		const pathToFile = `${uploadFolder}/${fileNameCrypt}${fileFormat}`;

		await ensureDir(uploadFolder);
		await writeFile(pathToFile, fileBuffer as unknown as DataView);

		this.logger.log(`[FilesService] Файл ${fileNameCrypt + fileFormat} записан без ошибок`);

		return {
			url: `/upload/${dateFolder}/${fileNameCrypt}${fileFormat}`,
			name: fileNameCrypt + fileFormat
		};
	}

	async deleteDir(pathToDir: string): Promise<void> {
		try {
			await rmdir(pathToDir);
			this.logger.log(`[FilesService] Директория ${pathToDir} удалена успешно`);
		} catch (error) {
			this.logger.error(`[FilesService] Произошла ошибка при удалении директории. Ошибка: ${pathToDir}`);
		}
	}

	private async convertToWebp(fileBuffer: Buffer): Promise<Buffer> {
		return await sharp(fileBuffer).webp().toBuffer();
	}

	async deleteFile(pathToFile: string): Promise<void> {
		const fullPathToFile = path + pathToFile;
		try {
			await rm(fullPathToFile);
			this.logger.log(`[FilesService] Файл по пути ${fullPathToFile} успешно удалён`);

			const pathToDir = fullPathToFile.substring(0, fullPathToFile.lastIndexOf(`/`));
			const countFiles = (await readdir(pathToDir)).length;

			if (countFiles == 0) {
				await this.deleteDir(pathToDir);
			}
		} catch (error) {
			this.logger.error(`[FilesService] Произошла ошибка при удалении файла ${fullPathToFile}. Ошибка: ${error}`);
		}
	}
}
