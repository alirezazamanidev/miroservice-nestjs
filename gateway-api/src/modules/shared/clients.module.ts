import { Module } from '@nestjs/common';
import { AuthClientProvider } from './client.provider';
import { Services } from 'src/common/enums/nameService.enum';

@Module({
    providers: [AuthClientProvider],
    exports: [Services.AUTH_SERVICE],
})
export class ClientModule {}
