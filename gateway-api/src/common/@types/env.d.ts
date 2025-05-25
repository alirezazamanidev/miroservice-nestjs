declare namespace NodeJS {
  interface ProcessEnv {
    // Node
    NODE_ENV: string;
    // RabbitMq
    RABBITMQ_HOST: string;
    RABBITMQ_PORT: number;
    // Google
    GOOGLE_CALLBACK_URL: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
  }
}