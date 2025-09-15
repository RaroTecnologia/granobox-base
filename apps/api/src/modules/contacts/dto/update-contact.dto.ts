import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateContactDto } from './create-contact.dto';

export class UpdateContactDto extends PartialType(CreateContactDto) {
  @ApiProperty({
    description: 'Se o contato está ativo',
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive deve ser um valor booleano' })
  isActive?: boolean;
}
