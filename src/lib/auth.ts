import { SignJWT, jwtVerify } from "jose";

const SECRET_KEY = process.env.ADMIN_JWT_SECRET;

if (!SECRET_KEY) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_JWT_SECRET is missing in production environment");
  }
  console.warn("WARNING: ADMIN_JWT_SECRET is missing, using unsafe dev secret");
}

const key = new TextEncoder().encode(SECRET_KEY || "dev-secret-do-not-use-in-prod");

export async function signToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch (error) {
    return null;
  }
}
