import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { config } from 'process';
import { AuthController } from './controllers/auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './services/auth.service';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.register({
      global: true,
    }),
    CacheModule.registerAsync(
      {
        isGlobal:true,
        useFactory:async()=>{
          return {
            stores:[
              createKeyv(`redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`)
            ]
          }
        }
      }
    )
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
