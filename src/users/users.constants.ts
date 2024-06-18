import { formatsFile } from '../files/files.constants';

export const avatarUploadRequirements = [
	'В Headers указать Content-Type со значением multipart/form-data',
	`Разрешается загрузка файлов формата ${formatsFile.images}`,
	'Загружаемый файл не должен быть повреждён'
];
