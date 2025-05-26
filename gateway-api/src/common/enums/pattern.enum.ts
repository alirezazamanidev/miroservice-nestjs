export enum PatternNameEnum {
  // Auth Service
  GOOGLE_LOGIN = 'auth/google-login',
  VALIDATE_USER = 'auth/validate-user',
  GET_USER_INFO = 'auth/get-user-info',
  REFRESH_TOKEN = 'auth/refresh-token',
  VERIFY_ACCESS_TOKEN= 'auth/verify-access-token',
  // File Service
  UPLOAD_FILE = 'file/upload',
  GET_FILE_URL = 'file/get-url',
  DELETE_FILE = 'file/delete',
  LIST_FILES = 'file/list',

  // General
  HEALTH_CHECK = 'service/health-check',
}
