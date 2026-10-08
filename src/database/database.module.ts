import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig, type DatabaseConfig } from '../config/configuration.js';
import { buildTypeOrmOptions } from './typeorm-options.factory.js';

/** Wires the platform (public schema) Postgres connection. */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule.forFeature(databaseConfig)],
      inject: [databaseConfig.KEY],
      useFactory: (db: DatabaseConfig) => buildTypeOrmOptions(db),
    }),
  ],
})
export class DatabaseModule {}
