import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../../email/email.module';
import { ClientUser } from '../clients/entities/client-user.entity';
import { User } from '../users/entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { GlobalAuthGuard } from './guards/global-auth.guard';
import { SystemOnlyGuard } from './guards/system-only.guard';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    UsersModule,
    AuditModule,
    EmailModule,
    TypeOrmModule.forFeature([ClientUser, User]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: {
          expiresIn: configService.get('jwt.expiresIn'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, PermissionsGuard, GlobalAuthGuard, SystemOnlyGuard],
  exports: [AuthService, JwtAuthGuard, PermissionsGuard, GlobalAuthGuard, SystemOnlyGuard],
})
export class AuthModule {}

