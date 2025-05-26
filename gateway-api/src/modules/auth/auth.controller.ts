import { Controller, Get, Inject, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { Services } from 'src/common/enums/nameService.enum';
import { ClientProxy } from '@nestjs/microservices';
import { PatternNameEnum } from 'src/common/enums/pattern.enum';
import { catchError, lastValueFrom } from 'rxjs';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(Services.AUTH_SERVICE) private readonly authClient: ClientProxy) {}

  @ApiOperation({ summary: 'login with Google' })
  @UseGuards(AuthGuard('google'))
  @Get('google/login')
  async googleLogin() {
    return { message: 'Redirecting to Google for authentication' };
  }

  @ApiOperation({ summary: 'Google callback' })
  @UseGuards(AuthGuard('google'))
  @Get('google/callback')
  async googleCallback(@Req() req: Request) {
    
    // Send user information to the auth service for further processing
       const response = await lastValueFrom(
      this.authClient.send(PatternNameEnum.GOOGLE_LOGIN,req.user)
    );
    // const response=await this.authClient.send(PatternNameEnum.GOOGLE_LOGIN, req.user)
    // return {MESSAGES: 'User logged in successfully', user };
    return {message:'ok'}
  }
}
