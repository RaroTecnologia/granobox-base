import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST || '69.62.93.36',
    port: parseInt(process.env.DB_PORT || '5482', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '37b981ba868ace4338cf',
    database: process.env.DB_NAME || 'granoboxtag',
    entities: [join(process.cwd(), 'dist/modules/**/*.entity.js')],
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  }),
);
