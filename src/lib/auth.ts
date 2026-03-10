import { SignJWT, jwtVerify } from "jose";

const getSecretKey = () => {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ADMIN_JWT_SECRET is missing in production environment");
    }
    return "dev-secret-do-not-use-in-prod";
  }
  return secret;
};

const getKey = () => new TextEncoder().encode(getSecretKey());

export async function signToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(getKey());
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getKey());
    return payload;
  } catch (error) {
    return null;
  }
}
