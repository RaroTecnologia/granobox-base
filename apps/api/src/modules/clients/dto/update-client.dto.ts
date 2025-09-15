import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { CreateClientDto } from './create-client.dto';
import { ClientStatus } from '../entities/client.entity';

export class UpdateClientDto extends PartialType(CreateClientDto) {
  @ApiProperty({
    description: 'Status do cliente',
    enum: ClientStatus,
    required: false,
    example: ClientStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ClientStatus, { message: 'Status deve ser um valor válido' })
  status?: ClientStatus;
}
