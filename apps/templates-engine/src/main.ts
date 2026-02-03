import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { json, urlencoded } from 'express';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS: usar CORS_ORIGINS (separado por vírgula) ou fallback
  const corsOriginsEnv = configService.get('CORS_ORIGINS');
  const apiUrl = configService.get('API_URL') || 'http://localhost:3000';
  
  let corsOrigins: string[];
  if (corsOriginsEnv) {
    corsOrigins = corsOriginsEnv.split(',').map((o: string) => o.trim());
  } else {
    corsOrigins = [apiUrl, 'http://localhost:3000', 'http://granobox-api:3001'];
  }
  
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  });
  
  console.log(`🔒 CORS permitido para: ${corsOrigins.join(', ')}`);

  const config = new DocumentBuilder()
    .setTitle('Granobox Templates Engine')
    .setDescription('Serviço de processamento de templates (ZPL, Studio) - v2')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('PORT') || 3002;
  await app.listen(port);

  console.log(`🎨 Granobox Templates Engine rodando em http://localhost:${port}`);
  console.log(`📚 Docs: http://localhost:${port}/api/docs`);
}

bootstrap();
