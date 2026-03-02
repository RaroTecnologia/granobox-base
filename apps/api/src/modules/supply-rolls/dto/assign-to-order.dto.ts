import { IsArray, IsUUID } from 'class-validator';

export class AssignToOrderDto {
  @IsArray()
  @IsUUID('4', { each: true })
  rollIds: string[];

  @IsUUID()
  orderId: string;
}
