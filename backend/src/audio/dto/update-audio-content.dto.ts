import { PartialType } from '@nestjs/mapped-types';
import { CreateAudioContentDto } from './create-audio-content.dto';

export class UpdateAudioContentDto extends PartialType(CreateAudioContentDto) {}