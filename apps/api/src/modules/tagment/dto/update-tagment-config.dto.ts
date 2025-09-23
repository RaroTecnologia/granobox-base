import { PartialType } from '@nestjs/swagger';
import { CreateTagmentConfigDto } from './create-tagment-config.dto';

export class UpdateTagmentConfigDto extends PartialType(CreateTagmentConfigDto) {}




