import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client } from 'minio';

@Injectable()
export class FileService implements OnModuleInit {
  private readonly logger = new Logger(FileService.name);
  constructor(@Inject('MINIO_CLIENT') private readonly minioCleint: Client) {}
  async onModuleInit() {
    try {
      const exists = await this.minioCleint.bucketExists(
        process.env.MINIO_BUCKET_NAME,
      );
      console.log('bucket', exists);

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
}
