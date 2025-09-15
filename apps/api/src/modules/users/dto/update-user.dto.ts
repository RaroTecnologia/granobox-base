import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { CreateUserDto } from './create-user.dto';
import { UserStatus } from '../entities/user.entity';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {
  @ApiProperty({
    description: 'Status do usuário',
    enum: UserStatus,
    required: false,
    example: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus, { message: 'Status deve ser um valor válido' })
  status?: UserStatus;
}
