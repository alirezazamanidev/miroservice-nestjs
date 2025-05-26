import { Controller, HttpStatus, NotFoundException } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { PatternNameEnum } from 'src/common/enums/pattern.enum';

@Controller('auth')
export class AuthController {
  @MessagePattern(PatternNameEnum.GOOGLE_LOGIN)
  googleLogin(user: any) {
    throw new RpcException({
      status: HttpStatus.NOT_FOUND,
      message: 'user not found',
    });
    // Handle the user information received from Google
    console.log('User logged in with Google:', user);
    // You can add logic here to save the user to your database or perform other actions
    return { message: 'User logged in successfully', user };
  }

  @MessagePattern('test')
  test() {
    throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message:'test not found',
    });
    // return { message: 'Test successful' };
  }
}
