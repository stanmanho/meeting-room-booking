try {
  process.loadEnvFile();
} catch {
  // 沒有 .env（例如在容器裡）就直接讀環境變數
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`缺少環境變數 ${name}`);
  return value;
}

const isTest = process.env.NODE_ENV === 'test';

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required(isTest ? 'TEST_DATABASE_URL' : 'DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
};
