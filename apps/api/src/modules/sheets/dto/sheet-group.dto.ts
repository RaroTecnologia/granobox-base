import { IsString, IsOptional, IsNumber, Min, MaxLength } from 'class-validator';

export class CreateSheetGroupDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;
}

export class UpdateSheetGroupDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;
}
