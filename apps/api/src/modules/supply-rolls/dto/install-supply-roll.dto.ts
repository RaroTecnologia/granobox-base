import { IsUUID, IsOptional } from 'class-validator';

export class InstallSupplyRollDto {
  @IsUUID()
  printerId: string;

  @IsOptional()
  @IsUUID()
  operationId?: string;
}
