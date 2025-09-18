import { PartialType } from '@nestjs/swagger';
import { CreateTemplateAssociationDto } from './create-template-association.dto';

export class UpdateTemplateAssociationDto extends PartialType(CreateTemplateAssociationDto) {}


