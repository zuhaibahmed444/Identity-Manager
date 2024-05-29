import { Options } from '@mikro-orm/core';
import { Contact } from '../entities/Contact';
import * as dotenv from 'dotenv';
import { defineConfig } from '@mikro-orm/mysql';

dotenv.config();

const config: Options = defineConfig({
  entities: [Contact],
  dbName: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  debug: true,
  discovery : { disableDynamicFileAccess: true}
});

export default config;
