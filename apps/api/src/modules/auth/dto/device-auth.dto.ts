import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class DeviceAuthDto {
  @ApiProperty({
    description: 'Device ID (MAC address ou device_id padronizado)',
    example: 'edge-go-d7e2b4',
    minLength: 6,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Device ID deve ter no mínimo 6 caracteres' })
  @MaxLength(50, { message: 'Device ID deve ter no máximo 50 caracteres' })
  device_id: string;

  @ApiProperty({
    description: 'API Key do dispositivo',
    example: 'edg_80B54ED7_1762182405123_abc123',
    minLength: 20,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(20, { message: 'API Key deve ter no mínimo 20 caracteres' })
  @MaxLength(100, { message: 'API Key deve ter no máximo 100 caracteres' })
  api_key: string;
}

export class DeviceAuthResponse {
  @ApiProperty({
    description: 'JWT Token para autenticação de API',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Informações do dispositivo',
    type: 'object',
    properties: {
      id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
      deviceId: { type: 'string', example: '88:13:BF:02:A7:A2' },
      name: { type: 'string', example: 'Dot Principal', nullable: true },
      status: { type: 'string', example: 'active' },
    },
  })
  device: {
    id: string;
    deviceId: string;
    name?: string;
    status: string;
  };
}
