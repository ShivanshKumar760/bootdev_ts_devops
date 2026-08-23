import { eq } from "drizzle-orm";
import { db } from "../index.js";
import { refreshTokens } from "../schema.js";

export async function saveRefreshToken(token:string , userId:string , expiresAt:Date){
    await db.insert(refreshTokens).values({
        token,
        userId,
        expiresAt,
    });
}


export async function getRefreshTokenRecord(token: string) {
  const [result] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.token, token));
  return result;
}

export async function revokeRefreshTokenRecord(token: string) {
  await db
    .update(refreshTokens)
    .set({
      revokedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(refreshTokens.token, token));
}