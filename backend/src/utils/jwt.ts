import jwt, { SignOptions, Secret } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-prod";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "1h";

export function signJwt(payload: object): string {
  const opts = { expiresIn: JWT_EXPIRES } as any;
  return jwt.sign(payload, JWT_SECRET as Secret, opts as SignOptions);
}

export function verifyJwt<T = any>(token: string): T | null {
  try {
    return jwt.verify(token, JWT_SECRET) as T;
  } catch (err) {
    return null;
  }
}
