import { asc,eq } from "drizzle-orm"; // Import sorting utility
import { db } from "../index.js";
import { NewChirp, chirps } from "../schema.js";

export async function createChirp(chirp: NewChirp) {
  const [result] = await db
    .insert(chirps)
    .values(chirp)
    .returning();
  return result;
}

export async function getAllChirps() {
  return await db
    .select()
    .from(chirps)
    .orderBy(asc(chirps.createdAt));
}


// Assignment Query: Retrieves a single chirp matching the provided ID
export async function getChirpById(id:string){
  const [result] = await db.select().from(chirps).where(eq(chirps.id,id));
  return result;
}
