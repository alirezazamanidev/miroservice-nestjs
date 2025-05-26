import {
  Controller,
  Get,
  HttpException,
  Inject,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { Services } from 'src/common/enums/nameService.enum';
import { ClientProxy } from '@nestjs/microservices';
import { PatternNameEnum } from 'src/common/enums/pattern.enum';
import { catchError, firstValueFrom, lastValueFrom } from 'rxjs';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(Services.AUTH_SERVICE) private readonly authClient: ClientProxy,
  ) {}

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
      this.authClient.send(PatternNameEnum.GOOGLE_LOGIN, req.user).pipe(),
    );
    // const response=await this.authClient.send(PatternNameEnum.GOOGLE_LOGIN, req.user)
    // return {MESSAGES: 'User logged in successfully', user };
    return { message: 'ok' };
  }
  @Get('test')
  async test() {
    
      await lastValueFrom(this.authClient.send('test', {}).pipe(
        catchError((err) => {
          throw new HttpException(
            {
              status: err?.status || 500,
              message: err.message || 'Internal Server Error',
            },
            err.status,
          );
        }),
      ));
        
      
   
  }
}
