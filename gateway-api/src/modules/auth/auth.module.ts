import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from './strategies/google.strategy';
import { ClientModule } from '../shared/clients.module';

@Module({
  imports:[
    PassportModule.register({ defaultStrategy: 'google' }),ClientModule],
  controllers: [AuthController],
  providers: [AuthService,GoogleStrategy],
})
export class AuthModule {}
