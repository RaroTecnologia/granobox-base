import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, Length, IsUUID } from 'class-validator';
import { CreateOperatorDto } from './create-operator.dto';

export class UpdateOperatorDto extends PartialType(CreateOperatorDto) {
  @IsOptional()
  @IsString()
  @Length(4, 4)
  pin?: string;
}
