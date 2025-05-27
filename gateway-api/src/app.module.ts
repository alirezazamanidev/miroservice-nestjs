import { Module } from '@nestjs/common';
import { appExternalImports } from './app/imports/external.imports';
import { appInternalImports } from './app/imports/internal.imports';
import { UploadModule } from './modules/upload/upload.module';

@Module({
  imports: [
    ...appExternalImports,
    ...appInternalImports,
    UploadModule,

  ],
  
})
export class AppModule {}
