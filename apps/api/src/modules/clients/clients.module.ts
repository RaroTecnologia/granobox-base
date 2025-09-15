import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { Client } from './entities/client.entity';
import { ClientUser } from './entities/client-user.entity';
import { ClientsController } from './clients.controller';
import { ClientUsersController } from './client-users.controller';
import { ClientsService } from './clients.service';
import { ClientUsersService } from './client-users.service';
import { EmailModule } from '../../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client, ClientUser]),
    EmailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [ClientsController, ClientUsersController],
  providers: [ClientsService, ClientUsersService],
  exports: [ClientsService, ClientUsersService],
})
export class ClientsModule {}
