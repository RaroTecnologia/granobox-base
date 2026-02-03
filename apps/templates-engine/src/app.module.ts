import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TemplatesModule } from './templates/templates.module';
import { HealthController } from './controllers/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TemplatesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
