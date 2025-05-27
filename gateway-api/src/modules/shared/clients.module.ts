import { Module } from '@nestjs/common';
import { AuthClientProvider, FileClientProvider } from './client.provider';
import { Services } from 'src/common/enums/nameService.enum';

@Module({
    providers: [AuthClientProvider,FileClientProvider],
    exports: [Services.AUTH_SERVICE,Services.FILE_SERVICE],
})
export class ClientModule {}
