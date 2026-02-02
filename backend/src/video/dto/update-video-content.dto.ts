import { PartialType } from '@nestjs/mapped-types';
import { CreateVideoContentDto } from './create-video-content.dto';

export class UpdateVideoContentDto extends PartialType(CreateVideoContentDto) {}