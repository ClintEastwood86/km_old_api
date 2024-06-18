import multer from 'multer';

export const fileConfig = multer({
	dest: 'storage',
	storage: multer.memoryStorage()
});
