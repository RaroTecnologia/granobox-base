import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { Client } from './entities/client.entity';
import { ClientUser } from './entities/client-user.entity';
import { ClientUserOperation } from './entities/client-user-operation.entity';
import { ClientsController } from './clients.controller';
import { ClientUsersController } from './client-users.controller';
import { ClientsService } from './clients.service';
import { ClientUsersService } from './client-users.service';
import { PrintConfigService } from './print-config.service';
import { EmailModule } from '../../email/email.module';
import { TemplatesModule } from '../templates/templates.module';
import { ConfigModule } from '../config/config.module';
import { TemplateProcessingModule } from '../template-processing/template-processing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client, ClientUser, ClientUserOperation]),
    EmailModule,
    TemplatesModule,
    ConfigModule,
    TemplateProcessingModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [ClientsController, ClientUsersController],
  providers: [ClientsService, ClientUsersService, PrintConfigService],
  exports: [ClientsService, ClientUsersService],
})
export class ClientsModule {}
