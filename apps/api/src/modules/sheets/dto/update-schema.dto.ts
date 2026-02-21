import { PartialType } from '@nestjs/mapped-types';
import { CreateSchemaDto } from './create-schema.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateSchemaDto extends PartialType(CreateSchemaDto) {
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
