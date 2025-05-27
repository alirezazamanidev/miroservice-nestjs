import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { ClientModule } from '../shared/clients.module';

@Module({
  imports:[ClientModule],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
