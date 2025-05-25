
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // App 
      APP_PORT: string;
    }
  }
}