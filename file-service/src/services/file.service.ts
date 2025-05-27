import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Client } from 'minio';
import { BufferedFile } from 'src/common/interfaces/file.interface';

@Injectable()
export class FileService implements OnModuleInit {
  private readonly logger = new Logger(FileService.name);
  constructor(@Inject('MINIO_CLIENT') private readonly minioCleint: Client) {}
  async onModuleInit() {
    try {
      const exists = await this.minioCleint.bucketExists(
        process.env.MINIO_BUCKET_NAME,
      );

      if (!exists) {
        await this.minioCleint.makeBucket(
          process.env.MINIO_BUCKET_NAME,
          process.env.MINIO_REGION || 'us-east-1',
        );
        this.logger.log(
          `MinIO bucket "${process.env.MINIO_BUCKET_NAME}" created successfully.`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error initializing MinIO bucket "${process.env.MINIO_BUCKET_NAME}": `,
        error,
      );
      throw new Error(`Could not initialize MinIO bucket: ${error.message}`);
    }
  }

  async uploadFile(file: BufferedFile, user: { email: string }) {
    const objectName = `${user.email}/${Date.now()}-${file.originalname}`;
    console.log(objectName);
    
    try {
      await this.minioCleint.putObject(
        process.env.MINIO_BUCKET_NAME,
        objectName,
        file.buffer,
        file.size,
      );
      this.logger.log(`File ${objectName} uploaded successfully by user ${user.email}.`);
      return {
        message: 'File uploaded successfully',
        filePath: objectName,
        size: file.size,
        mimetype: file.mimetype,
        originalname: file.originalname,
      };
    } catch (error) {
      this.logger.error(
        `MinIO upload error for ${objectName} by user ${user.email}: `,
        error,
      );
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to upload file to MinIO.',
        details: error.message,
      });
    }
  }
}
