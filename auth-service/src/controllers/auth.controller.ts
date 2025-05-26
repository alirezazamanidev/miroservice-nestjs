import { Controller, HttpStatus, NotFoundException } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { UserType } from 'src/common/@types/user.type';
import { PatternNameEnum } from 'src/common/enums/pattern.enum';
import { AuthService } from 'src/services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @MessagePattern(PatternNameEnum.GOOGLE_LOGIN)
  googleLogin(@Payload() user: UserType) {
    return this.authService.generateJwtTokens(user);
  }
  @MessagePattern(PatternNameEnum.REFRESH_TOKEN)
  async refreshTokens(@Payload() { refreshToken }: { refreshToken: string }) {
    const tokens=await this.authService.refreshTokens(refreshToken);
  
    return tokens
  }
}
