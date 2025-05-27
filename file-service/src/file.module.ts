import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmDbConfig } from './configs/typeOrm.config';
import { Client } from 'minio';
import { FileService } from './services/file.service';
import { FileController } from './controllers/file.controller';
export const MINIO_CLIENT_TOKEN='MINIO_CLIENT'
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // TypeOrmModule.forRootAsync({
    //   useClass:TypeOrmDbConfig,
    //   inject:[TypeOrmDbConfig]
    // })

  ],
  controllers: [FileController],
  providers: [FileService,{
    provide:MINIO_CLIENT_TOKEN,
    useFactory: async () => {

      return new Client({
        endPoint: process.env.MINIO_ENDPOINT,
        port: process.env.MINIO_PORT || 9000,
        useSSL: process.env.MINIO_USE_SSL === 'true',
        accessKey: process.env.MINIO_ACCESS_KEY,
        secretKey: process.env.MINIO_SECRET_KEY,
      })
    }
  }],
})
export class FileModule {}
