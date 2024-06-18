import { FileElementResponse } from './dto/files-element.response';

export interface IFilesService {
	saveFile(file: Express.Multer.File): Promise<FileElementResponse>;
	deleteDir(pathToDir: string): Promise<void>;
	deleteFile(pathToFile: string): Promise<void>;
}
