import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// Configurações
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

// Módulos
import { UsersModule } from './modules/users/users.module';
import { DevicesModule } from './modules/devices/devices.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuditModule } from './modules/audit/audit.module';
import { ConfigModule as AppConfigModule } from './modules/config/config.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { ProductsModule } from './modules/products/products.module';
import { LimitsModule } from './modules/limits/limits.module';
import { PrintersModule } from './modules/printers/printers.module';
import { OperatorsModule } from './modules/operators/operators.module';
import { StorageLocationsModule } from './modules/storage-locations/storage-locations.module';
import { TemplateProcessingModule } from './modules/template-processing/template-processing.module';
import { HealthModule } from './modules/health/health.module';
import { BatchesModule } from './modules/batches/batches.module';
import { LabelTemplatesModule } from './modules/label-templates/label-templates.module';
import { LabelItemsModule } from './modules/label-items/label-items.module';
import { LabelsModule } from './modules/labels/labels.module';
import { RastreabilidadeModule } from './modules/rastreabilidade/rastreabilidade.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { BrandsModule } from './modules/brands/brands.module';
import { EdgeModule } from './modules/edge/edge.module';
import { EdgeGoWebSocketModule } from './modules/websocket/websocket.module';
import { PrintingModule } from './modules/printing/printing.module';
import { V15Module } from './modules/v1-5/v1-5.module';
import { LabelOrdersModule } from './modules/label-orders/label-orders.module';
import { ShippingCompaniesModule } from './modules/shipping-companies/shipping-companies.module';
import { AsaasModule } from './modules/asaas/asaas.module';
import { BillingModule } from './modules/billing/billing.module';
import { CrmModule } from './modules/crm/crm.module';
import { BroadcastEmailModule } from './modules/broadcast-email/broadcast-email.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { ImagesModule } from './modules/images/images.module';
import { FontsModule } from './modules/fonts/fonts.module';
import { V2Module } from './modules/v2/v2.module';

@Module({
  imports: [
    // Configuração global
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Banco de dados
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = configService.get('database');
        if (!config) {
          throw new Error('Database configuration not found');
        }
        return config;
      },
    }),

    ScheduleModule.forRoot(),
    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minuto
        limit: 100, // 100 requests por minuto
      },
    ]),

    // Módulos da aplicação
    AuditModule,
    AuthModule,
    UsersModule,
    DevicesModule,
    ClientsModule,
    ContactsModule,
    EquipmentModule,
    SubscriptionsModule,
    ProductsModule,
    LimitsModule,
    PrintersModule,
    OperatorsModule,
    StorageLocationsModule,
    TemplateProcessingModule,
    AppConfigModule,
    HealthModule,
    BatchesModule,
    LabelTemplatesModule,
    LabelItemsModule,
    LabelsModule,
    RastreabilidadeModule,
    SuppliersModule,
    BrandsModule,
    EdgeModule,
    EdgeGoWebSocketModule, // WebSocket para Edge-Go (renomeado de MqttModule)
    PrintingModule, // ⭐ NOVO: WebSocket printing apenas
    V15Module, // ⭐ v1.5: Endpoint simplificado de impressão
    LabelOrdersModule, // ⭐ Pedidos de etiquetas
    ShippingCompaniesModule, // ⭐ Cadastro de transportadoras (URL de rastreio)
    AsaasModule, // ⭐ Cobranças Asaas (clientes + pagamentos)
    BillingModule, // ⭐ Faturas/cobranças + webhook Asaas
    CrmModule, // ⭐ CRM: leads, propostas, atividades (venda de planos)
    BroadcastEmailModule, // ⭐ Envio de emails em broadcast para clientes
    TemplatesModule, // ⭐ Studio: CRUD de templates (Canvas / Elements)
    ImagesModule, // ⭐ Studio: biblioteca de imagens (lista vazia até implementar storage)
    FontsModule, // ⭐ Studio: gerenciador de fontes (lista vazia até implementar storage)
    V2Module, // ⭐ v2: Engine ZPL Granobox + controle de suprimentos
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
