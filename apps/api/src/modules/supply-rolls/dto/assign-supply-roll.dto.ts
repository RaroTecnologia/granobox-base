import { IsUUID, IsOptional } from 'class-validator';

export class AssignSupplyRollDto {
  @IsUUID()
  clientId: string;

  @IsOptional()
  @IsUUID()
  orderId?: string;
}
