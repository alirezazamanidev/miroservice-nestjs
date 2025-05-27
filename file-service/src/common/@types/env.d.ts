declare namespace NodeJS {
  interface ProcessEnv {
    // Node
    NODE_ENV: string;
    // RabbitMq
    RABBITMQ_HOST: string;
    RABBITMQ_PORT: number;
    // Postgres
    POSTGRES_HOST: string;
    POSTGRES_PORT: number;
    POSTGRES_USERNAME: string;
    POSTGRES_PASSWORD: string;
    POSTGRES_DATABASE: string;
   //minio
   MINIO_ENDPOINT:string
   MINIO_ACCESS_KEY:string
   MINIO_SECRET_KEY:string
   MINIO_USE_SSL:string
   MINIO_BUCKET_NAME:string
   MINIO_PORT:number
   MINIO_FILE_EXPIRES:string

  }
}