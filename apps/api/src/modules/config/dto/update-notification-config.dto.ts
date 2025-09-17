import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsNumber, Min, Max } from 'class-validator';

export class UpdateNotificationConfigDto {
  @ApiProperty({ description: 'Notificações por email', required: false })
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @ApiProperty({ description: 'Notificações push', required: false })
  @IsOptional()
  @IsBoolean()
  push?: boolean;

  @ApiProperty({ description: 'Som de notificação', required: false })
  @IsOptional()
  @IsBoolean()
  sound?: boolean;

  @ApiProperty({ description: 'Dias para alerta de vencimento', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  expirationDays?: number;
}




