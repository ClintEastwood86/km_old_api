import { HTTPError } from '../errors/http-error';
import { NewAppFeedbackDto } from './dto/new-app-feedback.dto';

export interface IFeedbackService {
	submitNewAppForm(dto: NewAppFeedbackDto): Promise<true | HTTPError>;
}
