import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import Aedes, {
  Aedes as AedesInstance,
  Client,
  PublishPacket,
  Subscription,
} from 'aedes';
import { createServer, Server as NetServer } from 'net';
import { PrintJobsService } from '../edge/services/print-jobs.service';
import { PrintJobStatus } from '../edge/entities/print-job.entity';

export interface MqttPublishOptions {
  topic: string;
  payload: any;
  qos?: 0 | 1 | 2;
  retain?: boolean;
}

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private broker: AedesInstance;
  private tcpServer: NetServer;
  private readonly mqttHost = process.env.MQTT_HOST || 'mqtt.granobox.com.br';
  private readonly mqttPort = process.env.MQTT_PORT
    ? parseInt(process.env.MQTT_PORT, 10)
    : 1883;

  constructor(private readonly printJobsService: PrintJobsService) {}

  async onModuleInit() {
    this.startBroker();
  }

  async onModuleDestroy() {
    await this.stopBroker();
  }

  private startBroker() {
    try {
      // Criar instância do broker Aedes
      this.broker = Aedes({
        id: 'granobox-mqtt-broker',
        heartbeatInterval: 30000, // 30 segundos (mais frequente para detectar desconexões)
        connectTimeout: 45000, // 45 segundos (mais tempo para conexões lentas)
        concurrency: 100, // Permitir mais conexões simultâneas
      });

      // Configurar autenticação (opcional - pode ser desabilitado para testes)
      this.broker.authenticate = this.authenticate.bind(this);

      // Configurar autorização para publicação
      this.broker.authorizePublish = this.authorizePublish.bind(this);

      // Configurar autorização para subscrição
      this.broker.authorizeSubscribe = this.authorizeSubscribe.bind(this);

      // Event handlers
      this.broker.on('client', (client) => {
        this.logger.log(`Cliente conectado: ${client.id}`);
        this.logger.debug(`  Clean session: ${client.clean}`);
      });

      this.broker.on('clientDisconnect', (client) => {
        this.logger.log(`Cliente desconectado: ${client.id}`);
      });

      this.broker.on('clientError', (client, error) => {
        this.logger.error(`Erro no cliente ${client.id}: ${error.message}`);
      });

      this.broker.on('connectionError', (client, error) => {
        this.logger.error(`Erro de conexão do cliente ${client?.id || 'unknown'}: ${error.message}`);
      });

      this.broker.on('publish', (packet, client) => {
        if (client) {
          this.logger.debug(
            `Mensagem publicada no tópico "${packet.topic}" por ${client.id}`,
          );
        }
        this.handlePublishPacket(packet).catch((error) =>
          this.logger.error(
            `Erro ao processar mensagem MQTT (${packet.topic}): ${error.message}`,
          ),
        );
      });

      this.broker.on('subscribe', (subscriptions, client) => {
        this.logger.log(
          `Cliente ${client.id} inscrito em: ${subscriptions.map((s) => s.topic).join(', ')}`,
        );
      });

      // Criar servidor TCP para MQTT
      this.tcpServer = createServer(this.broker.handle);

      this.tcpServer.listen(this.mqttPort, () => {
        this.logger.log(
          `✅ MQTT Broker rodando em ${this.mqttHost}:${this.mqttPort}`,
        );
        this.logger.log(`   Estrutura de tópicos:`);
        this.logger.log(
          `   - granobox/printer/{printer_id}/jobs       (jobs de impressão)`,
        );
        this.logger.log(
          `   - granobox/printer/{printer_id}/status     (status da impressora)`,
        );
        this.logger.log(
          `   - granobox/printer/{printer_id}/response   (respostas/confirmações)`,
        );
      });

      this.tcpServer.on('error', (error) => {
        this.logger.error(`Erro no servidor MQTT TCP: ${error.message}`);
      });
    } catch (error) {
      this.logger.error(`Erro ao iniciar broker MQTT: ${error.message}`);
      throw error;
    }
  }

  private async stopBroker() {
    if (this.tcpServer) {
      this.tcpServer.close(() => {
        this.logger.log('Servidor MQTT TCP fechado');
      });
    }

    if (this.broker) {
      await new Promise<void>((resolve) => {
        this.broker.close(() => {
          this.logger.log('Broker MQTT encerrado');
          resolve();
        });
      });
    }
  }

  // Autenticação de clientes MQTT
  private authenticate(
    client: Client,
    username: string,
    password: Buffer,
    callback: (error: Error | null, success: boolean) => void,
  ) {
    // Por enquanto, autenticação simples
    // TODO: Integrar com sistema de autenticação do GranoBox
    const validUsername = process.env.MQTT_USERNAME || 'granobox';
    const validPassword = process.env.MQTT_PASSWORD || 'granobox123';

    const isValid =
      username === validUsername && password.toString() === validPassword;

    if (isValid) {
      this.logger.log(`Cliente ${client.id} autenticado com sucesso`);
      callback(null, true);
    } else {
      this.logger.warn(`Falha na autenticação do cliente ${client.id}`);
      callback(new Error('Autenticação falhou'), false);
    }
  }

  // Autorizar publicação em tópicos
  private authorizePublish(
    client: Client,
    packet: PublishPacket,
    callback: (error?: Error | null) => void,
  ) {
    // Permitir publicação em tópicos específicos
    const allowedTopicPatterns = [
      /^granobox\/printer\/[\w-]+\/jobs$/,
      /^granobox\/printer\/[\w-]+\/status$/,
      /^granobox\/printer\/[\w-]+\/response$/,
    ];

    const isAllowed = allowedTopicPatterns.some((pattern) =>
      pattern.test(packet.topic),
    );

    if (isAllowed) {
      callback(null);
    } else {
      this.logger.warn(
        `Cliente ${client.id} tentou publicar em tópico não autorizado: ${packet.topic}`,
      );
      callback(new Error('Tópico não autorizado'));
    }
  }

  // Autorizar subscrição em tópicos
  private authorizeSubscribe(
    client: Client,
    subscription: Subscription,
    callback: (error: Error | null, subscription?: Subscription) => void,
  ) {
    // Permitir subscrição em tópicos específicos
    const allowedTopicPatterns = [
      /^granobox\/printer\/[\w-]+\/jobs$/,
      /^granobox\/printer\/[\w-]+\/status$/,
      /^granobox\/printer\/[\w-]+\/response$/,
      /^granobox\/printer\/\+\/jobs$/, // Wildcard para múltiplas impressoras
      /^granobox\/printer\/\+\/status$/,
      /^granobox\/printer\/\+\/response$/,
    ];

    const isAllowed = allowedTopicPatterns.some((pattern) =>
      pattern.test(subscription.topic),
    );

    if (isAllowed) {
      callback(null, subscription);
    } else {
      this.logger.warn(
        `Cliente ${client.id} tentou se inscrever em tópico não autorizado: ${subscription.topic}`,
      );
      callback(new Error('Tópico não autorizado'));
    }
  }

  private async handlePublishPacket(packet: PublishPacket): Promise<void> {
    const topic = packet.topic || '';
    const responseMatch = /^granobox\/printer\/([\w-]+)\/response$/.exec(topic);

    if (!responseMatch) {
      return;
    }

    const deviceId = responseMatch[1];
    const payloadBuffer = packet.payload;

    if (!payloadBuffer || payloadBuffer.length === 0) {
      this.logger.warn(
        `Resposta MQTT vazia recebida de ${deviceId} no tópico ${topic}`,
      );
      return;
    }

    try {
      const payloadString = payloadBuffer.toString('utf8');
      const data = JSON.parse(payloadString);
      const jobId = data?.jobId;

      if (!jobId) {
        this.logger.warn(
          `Resposta MQTT sem jobId recebida de ${deviceId}: ${payloadString}`,
        );
        return;
      }

      const statusRaw = (data.status ?? '').toString().toLowerCase();
      const message = data.message ?? '';

      let mappedStatus: PrintJobStatus;
      switch (statusRaw) {
        case 'success':
          mappedStatus = PrintJobStatus.SUCCESS;
          break;
        case 'processing':
        case 'received':
          mappedStatus = PrintJobStatus.PROCESSING;
          break;
        case 'timeout':
          mappedStatus = PrintJobStatus.TIMEOUT;
          break;
        case 'partial':
        case 'error':
        default:
          mappedStatus = PrintJobStatus.ERROR;
          break;
      }

      await this.printJobsService.updateJobStatus(
        jobId,
        mappedStatus,
        message,
        {
          source: 'mqtt',
          deviceId,
          payload: data,
        },
      );

      this.logger.log(
        `Job ${jobId} atualizado via MQTT (${mappedStatus}) pelo device ${deviceId}`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao processar resposta MQTT no tópico ${topic}: ${error.message}`,
      );
    }
  }

  /**
   * Publica uma mensagem em um tópico MQTT
   */
  async publish(options: MqttPublishOptions): Promise<void> {
    const { topic, payload, qos = 1, retain = false } = options;

    const payloadString =
      typeof payload === 'string' ? payload : JSON.stringify(payload);

    return new Promise((resolve, reject) => {
      this.broker.publish(
        {
          cmd: 'publish',
          topic,
          payload: Buffer.from(payloadString),
          qos,
          retain,
        },
        (error) => {
          if (error) {
            this.logger.error(`Erro ao publicar em ${topic}: ${error.message}`);
            reject(error);
          } else {
            this.logger.debug(`Mensagem publicada em ${topic}`);
            resolve();
          }
        },
      );
    });
  }

  /**
   * Publica um job de impressão para uma impressora específica
   */
  async publishPrintJob(printerId: string, jobData: any): Promise<void> {
    const topic = `granobox/printer/${printerId}/jobs`;
    await this.publish({
      topic,
      payload: jobData,
      qos: 1,
      retain: false,
    });
  }

  /**
   * Obtém estatísticas do broker
   */
  getStats() {
    return {
      clients: this.broker.clients
        ? Object.keys(this.broker.clients).length
        : 0,
      subscriptions: this.broker.subscriptions
        ? Object.keys(this.broker.subscriptions).length
        : 0,
    };
  }
}
