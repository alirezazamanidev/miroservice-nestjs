import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { BucketItem, Client } from 'minio';
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
    const safeEmail = user.email.replace(/@/g, '_at_').replace(/\./g, '_dot_');
    const objectName = `${safeEmail}/${Date.now()}-${file.originalname}`;
    try {
      await this.minioCleint.putObject(
        process.env.MINIO_BUCKET_NAME,
        objectName,
        Buffer.from(file.buffer),
        file.size,
        // { 'Content-Type': file.mimetype },
      );
      this.logger.log(
        `File ${objectName} uploaded successfully by user ${user.email}.`,
      );
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
  async getUserFiles(user: { email: string }) {
    const safeEmail = user.email.replace(/@/g, '_at_').replace(/\./g, '_dot_');
    const files: any[] = [];
    const prifix = `${safeEmail}/`;
    const stream = await this.minioCleint.listObjectsV2(
      process.env.MINIO_BUCKET_NAME,
      prifix,
      true,
    );
    for await (const obj of stream as AsyncIterable<BucketItem>) {
      if (obj.name && !obj.name?.endsWith('/')) {
        try {
          const expiry = parseInt(process.env.MINIO_FILE_EXPIRES,10)
          
          const presignedUrl = await this.minioCleint.presignedGetObject(
            process.env.MINIO_BUCKET_NAME,
            obj.name,
            expiry
          );
        
          files.push({
            filename: obj.name.substring(prifix.length),
            expiresAt: new Date(Date.now() + expiry * 1000).toISOString(),
            expiresIn: `${expiry} sec`,
            url: presignedUrl,
            size: obj.size,
            lastModified: obj.lastModified,
          });
        } catch (error) {}
      }
    }
    return files;
  }
}
