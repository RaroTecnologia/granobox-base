// Type definitions for aedes
declare module 'aedes' {
  import { EventEmitter } from 'events';
  import { Duplex } from 'stream';

  export interface AedesOptions {
    id?: string;
    concurrency?: number;
    heartbeatInterval?: number;
    connectTimeout?: number;
    preConnect?: (
      client: Client,
      packet: any,
      callback: (error: Error | null, success: boolean) => void,
    ) => void;
    authenticate?: (
      client: Client,
      username: string,
      password: Buffer,
      callback: (error: Error | null, success: boolean) => void,
    ) => void;
    authorizePublish?: (
      client: Client,
      packet: PublishPacket,
      callback: (error?: Error | null) => void,
    ) => void;
    authorizeSubscribe?: (
      client: Client,
      subscription: Subscription,
      callback: (error: Error | null, subscription?: Subscription) => void,
    ) => void;
    authorizeForward?: (
      client: Client,
      packet: PublishPacket,
    ) => PublishPacket | null | void;
    published?: (
      packet: PublishPacket,
      client: Client,
      callback: (error?: Error | null) => void,
    ) => void;
  }

  export interface Client {
    id: string;
    clean: boolean;
    version?: number;
    connecting: boolean;
    connected: boolean;
    disconnected: boolean;
    conn?: Duplex;
    req?: any;
  }

  export interface PublishPacket {
    cmd: 'publish';
    topic: string;
    payload: Buffer;
    qos: 0 | 1 | 2;
    retain: boolean;
    dup?: boolean;
    messageId?: number;
  }

  export interface Subscription {
    topic: string;
    qos: 0 | 1 | 2;
  }

  export interface Aedes extends EventEmitter {
    id: string;
    clients: { [id: string]: Client };
    subscriptions: any;

    handle: (stream: Duplex, req?: any) => Client;

    publish(
      packet: PublishPacket,
      callback?: (error?: Error | null) => void,
    ): void;

    subscribe(
      topic: string,
      func: (packet: PublishPacket, callback: () => void) => void,
      callback?: () => void,
    ): void;

    unsubscribe(
      topic: string,
      func: (packet: PublishPacket, callback: () => void) => void,
      callback?: () => void,
    ): void;

    close(callback?: () => void): void;

    authenticate?: (
      client: Client,
      username: string,
      password: Buffer,
      callback: (error: Error | null, success: boolean) => void,
    ) => void;
    authorizePublish?: (
      client: Client,
      packet: PublishPacket,
      callback: (error?: Error | null) => void,
    ) => void;
    authorizeSubscribe?: (
      client: Client,
      subscription: Subscription,
      callback: (error: Error | null, subscription?: Subscription) => void,
    ) => void;

    on(event: 'client', listener: (client: Client) => void): this;
    on(event: 'clientReady', listener: (client: Client) => void): this;
    on(event: 'clientDisconnect', listener: (client: Client) => void): this;
    on(
      event: 'clientError',
      listener: (client: Client, error: Error) => void,
    ): this;
    on(
      event: 'connectionError',
      listener: (client: Client, error: Error) => void,
    ): this;
    on(event: 'keepaliveTimeout', listener: (client: Client) => void): this;
    on(
      event: 'publish',
      listener: (packet: PublishPacket, client: Client | null) => void,
    ): this;
    on(
      event: 'subscribe',
      listener: (subscriptions: Subscription[], client: Client) => void,
    ): this;
    on(
      event: 'unsubscribe',
      listener: (unsubscriptions: string[], client: Client) => void,
    ): this;
  }

  function createAedes(options?: AedesOptions): Aedes;

  export default createAedes;
}
