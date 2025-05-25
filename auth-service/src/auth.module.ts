import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { config } from 'process';
import { AuthController } from './controllers/auth.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    })
  ],
  controllers:[AuthController]
})
export class AuthModule {}
