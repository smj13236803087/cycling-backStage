import { JWTPayload, SignJWT, jwtVerify } from 'jose';

// 秘钥可以通过环境变量来配置
const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

// 生成 JWT
export async function generateJwt(payload: object, expiresIn: string = '180d'): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(expiresIn)
    .sign(SECRET_KEY);
    console.log(token)
  return token;
}

// 验证 JWT
export async function verifyJwt(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}
