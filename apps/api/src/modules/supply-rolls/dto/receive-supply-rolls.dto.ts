import { IsArray, IsUUID, IsString, IsOptional, IsDateString } from 'class-validator';

export class ReceiveSupplyRollsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  rollIds: string[];

  @IsString()
  supplierInvoice: string;

  @IsOptional()
  @IsDateString()
  receivedAt?: string;
}
