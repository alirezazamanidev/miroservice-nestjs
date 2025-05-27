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
   
  }
}