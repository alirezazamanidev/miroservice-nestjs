import { Test, TestingModule } from '@nestjs/testing';
import { FileService } from './file.service'; // Adjust path if your service is elsewhere
import { MINIO_CLIENT_TOKEN } from 'src/file.module'; // Adjust path to your FileModule
import { Client, BucketItem } from 'minio';
import { RpcException } from '@nestjs/microservices';
import { HttpStatus } from '@nestjs/common';
import { BufferedFile } from 'src/common/interfaces/file.interface'; // Adjust path

// Mock MINIO_CLIENT
const mockMinioClient = {
  bucketExists: jest.fn(),
  makeBucket: jest.fn(),
  putObject: jest.fn(),
  presignedGetObject: jest.fn(),
  listObjectsV2: jest.fn(),
};

const mockUser = { email: 'test@example.com', id: 'user-123' };
const mockBucketName = 'test-bucket';
const mockRegion = 'us-east-1';
const mockFileExpires = '3600'; // As a string, like process.env would provide

describe('FileService', () => {
  let service: FileService;
  let minioClient: Client;

  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = {
      ...originalEnv,
      MINIO_BUCKET_NAME: mockBucketName,
      MINIO_REGION: mockRegion,
      MINIO_FILE_EXPIRES: mockFileExpires,
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileService,
        {
          provide: 'MINIO_CLIENT', // Matches the @Inject token in user's code
          useValue: mockMinioClient,
        },
      ],
    }).compile();

    service = module.get<FileService>(FileService);
    minioClient = module.get<Client>('MINIO_CLIENT');
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should create bucket if it does not exist', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(false);
      mockMinioClient.makeBucket.mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(mockMinioClient.bucketExists).toHaveBeenCalledWith(mockBucketName);
      expect(mockMinioClient.makeBucket).toHaveBeenCalledWith(mockBucketName, mockRegion);
    });

    it('should not create bucket if it already exists', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(true);

      await service.onModuleInit();

      expect(mockMinioClient.bucketExists).toHaveBeenCalledWith(mockBucketName);
      expect(mockMinioClient.makeBucket).not.toHaveBeenCalled();
    });

    it('should throw error if bucket initialization fails', async () => {
      mockMinioClient.bucketExists.mockRejectedValue(new Error('MinIO down'));
      await expect(service.onModuleInit()).rejects.toThrow('Could not initialize MinIO bucket: MinIO down');
    });
  });

  describe('uploadFile', () => {
    const mockFile: BufferedFile = {
      fieldname: 'file',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('test'),
      size: 4,
    };

    it('should upload a file successfully', async () => {
      mockMinioClient.putObject.mockResolvedValue({ etag: 'test-etag', versionId: null }); // versionId can be null

      const result = await service.uploadFile(mockFile, mockUser);
      
      const safeEmail = mockUser.email.replace(/@/g, '_at_').replace(/\./g, '_dot_');
      const expectedObjectNamePattern = new RegExp(`^${safeEmail}/\\d+-${mockFile.originalname}$`);


      expect(mockMinioClient.putObject).toHaveBeenCalledWith(
        mockBucketName,
        expect.stringMatching(expectedObjectNamePattern),
        mockFile.buffer,
        mockFile.size,
        // Since metadata is commented out in user's code, we don't check for it.
        // If it were active: expect.objectContaining({ 'Content-Type': mockFile.mimetype })
      );
      expect(result).toHaveProperty('message', 'File uploaded successfully');
      expect(result).toHaveProperty('filePath');
      expect(result.filePath).toMatch(expectedObjectNamePattern);
      expect(result).toHaveProperty('size', mockFile.size);
      expect(result).toHaveProperty('mimetype', mockFile.mimetype);
    });

    it('should throw RpcException if MinIO upload fails', async () => {
      mockMinioClient.putObject.mockRejectedValue(new Error('MinIO putObject error'));
      const safeEmail = mockUser.email.replace(/@/g, '_at_').replace(/\./g, '_dot_');
      const expectedObjectNamePattern = new RegExp(`^${safeEmail}/\\d+-${mockFile.originalname}$`);


      await expect(service.uploadFile(mockFile, mockUser)).rejects.toThrow(RpcException);
      await expect(service.uploadFile(mockFile, mockUser)).rejects.toMatchObject({
        error: {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Failed to upload file to MinIO.',
            details: 'MinIO putObject error',
        }
      });
    });
  });

  describe('generatePresignedUrlForFile', () => {
    const filePath = `${mockUser.email.replace(/@/g, '_at_').replace(/\./g, '_dot_')}/test.jpg`;

    it('should generate a presigned URL successfully', async () => {
      const mockUrl = 'http://minio/presigned-url';
      mockMinioClient.presignedGetObject.mockResolvedValue(mockUrl);

      const result = await service.generatePresignedUrlForFile(mockUser, filePath);

      expect(mockMinioClient.presignedGetObject).toHaveBeenCalledWith(
        mockBucketName,
        filePath,
        parseInt(mockFileExpires, 10),
      );
      expect(result).toEqual({ url: mockUrl, expires_in_seconds: parseInt(mockFileExpires, 10) });
    });

    it('should throw RpcException if user is not authorized (path mismatch)', async () => {
      const unauthorizedFilePath = `anotheruser@example.com/test.jpg`;
      await expect(service.generatePresignedUrlForFile(mockUser, unauthorizedFilePath)).rejects.toThrow(RpcException);
      await expect(service.generatePresignedUrlForFile(mockUser, unauthorizedFilePath)).rejects.toMatchObject({
        error: {
            status: HttpStatus.FORBIDDEN,
            message: 'Access Denied',
        }
      });
    });

    it('should throw RpcException if presigned URL generation fails', async () => {
      mockMinioClient.presignedGetObject.mockRejectedValue(new Error('MinIO presign error'));

      await expect(service.generatePresignedUrlForFile(mockUser, filePath)).rejects.toThrow(RpcException);
      await expect(service.generatePresignedUrlForFile(mockUser, filePath)).rejects.toMatchObject({
        error: {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Failed to generate file access URL.',
            details: 'MinIO presign error'
        }
      });
    });
  });

  describe('getUserFiles', () => {
    const safeEmail = mockUser.email.replace(/@/g, '_at_').replace(/\./g, '_dot_');
    const prefix = `${safeEmail}/`;
    const mockStreamItems: BucketItem[] = [
      { name: `${prefix}file1.jpg`, size: 100, lastModified: new Date(), etag: 'etag1',},
      { name: `${prefix}file2.png`, size: 200, lastModified: new Date(), etag: 'etag2' },
      { name: `${prefix}folder/`, size: 0, lastModified: new Date(), etag: 'etag3',}, // Should be ignored
    ];

    const mockAsyncIterable = {
      async *[Symbol.asyncIterator]() {
        for (const item of mockStreamItems) {
          yield item;
        }
      },
    };

    it('should list files and generate presigned URLs for them', async () => {
      mockMinioClient.listObjectsV2.mockReturnValue(mockAsyncIterable as any);
      mockMinioClient.presignedGetObject
        .mockResolvedValueOnce('http://presigned/file1.jpg')
        .mockResolvedValueOnce('http://presigned/file2.png');

      const result = await service.getUserFiles(mockUser);

      expect(mockMinioClient.listObjectsV2).toHaveBeenCalledWith(mockBucketName, prefix, true);
      expect(mockMinioClient.presignedGetObject).toHaveBeenCalledTimes(2);
      expect(mockMinioClient.presignedGetObject).toHaveBeenNthCalledWith(1, mockBucketName, mockStreamItems[0].name, parseInt(mockFileExpires, 10));
      expect(mockMinioClient.presignedGetObject).toHaveBeenNthCalledWith(2, mockBucketName, mockStreamItems[1].name, parseInt(mockFileExpires, 10));
      
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('filename', 'file1.jpg');
      expect(result[0]).toHaveProperty('url', 'http://presigned/file1.jpg');
      expect(result[1]).toHaveProperty('filename', 'file2.png');
      expect(result[1]).toHaveProperty('url', 'http://presigned/file2.png');
      expect(result[0]).toHaveProperty('expires_in_seconds', parseInt(mockFileExpires, 10));
    });

    it('should return an empty array if no files are found', async () => {
        const emptyStream = { async *[Symbol.asyncIterator]() { yield* []; } };
        mockMinioClient.listObjectsV2.mockReturnValue(emptyStream as any);
  
        const result = await service.getUserFiles(mockUser);
        expect(result).toEqual([]);
        expect(mockMinioClient.presignedGetObject).not.toHaveBeenCalled();
    });

    it('should skip files for which presigned URL generation fails (due to silent catch)', async () => {
        mockMinioClient.listObjectsV2.mockReturnValue(mockAsyncIterable as any);
        mockMinioClient.presignedGetObject
          .mockResolvedValueOnce('http://presigned/file1.jpg')
          .mockRejectedValueOnce(new Error('Presign failed for file2')); // Fail for the second file
  
        const result = await service.getUserFiles(mockUser);
  
        expect(result).toHaveLength(1); // Only the first file should be included
        expect(result[0].filename).toBe('file1.jpg');
        expect(mockMinioClient.presignedGetObject).toHaveBeenCalledTimes(2);
      });



  });
});