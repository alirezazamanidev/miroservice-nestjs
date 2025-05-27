import {
  Controller,
  HttpException,
  Inject,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { memoryStorage } from 'multer';
import { Services } from 'src/common/enums/nameService.enum';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, lastValueFrom } from 'rxjs';
import { PatternNameEnum } from 'src/common/enums/pattern.enum';
import { UploadFileDto } from './dtos/upload-file.dto';
import { Auth } from '../auth/decorators/auth.decorator';

@ApiTags('File Upload')
@Auth()
@Controller('file')
export class UploadController {
  constructor(
    @Inject(Services.FILE_SERVICE) private readonly fileClient: ClientProxy,
  ) {}

  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({type:UploadFileDto})
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  @Post('upload')
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const filePayload = {
      originalname: file.originalname,
      mimetype: file.mimetype,
      buffer: file.buffer.toString(),
      size: file.size,
    };
    const result = await lastValueFrom(
      this.fileClient
        .send(PatternNameEnum.UPLOAD_FILE, {
          user: req.user,
          file: filePayload,
        })
        .pipe(
          catchError((error) => {
            throw new HttpException(
              {
                status: error.status || 500,
                message: error.message || 'Internal Server Error',
              },
              error.status || 500,
            );
          }),
        ),
    );
    return result
  
  }
}

