// IMPORTANTE: Importar polyfill ANTES de qualquer outro módulo
import './crypto-polyfill';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Configuração global de validação
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove propriedades não definidas no DTO
      forbidNonWhitelisted: true, // Retorna erro se propriedades extras forem enviadas
      transform: true, // Transforma automaticamente os tipos
    }),
  );

  // CORS
  const corsOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',')
    : [
        'http://localhost:5174', 
        'http://localhost:5173', 
        'http://localhost:5175',
        'https://granobox.com',
        'https://www.granobox.com',
        'https://app.granobox.com'
      ];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('GranoBox API')
    .setDescription('API para gerenciamento do sistema GranoBox')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'Endpoints de autenticação')
    .addTag('Users', 'Gerenciamento de usuários')
    .addTag('Clients', 'Gerenciamento de clientes')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get('PORT') || 3001;
  await app.listen(port);
  
  console.log(`🚀 GranoBox API rodando em http://localhost:${port}`);
  console.log(`📚 Documentação disponível em http://localhost:${port}/api/docs`);
}
bootstrap();
