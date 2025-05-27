import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmDbConfig } from './configs/typeOrm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useClass:TypeOrmDbConfig,
      inject:[TypeOrmDbConfig]
    })

  ],
  controllers: [],
  providers: [],
})
export class FileModule {}
