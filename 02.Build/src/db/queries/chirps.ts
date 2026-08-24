import { asc,eq } from "drizzle-orm"; // Import sorting utility
import { db } from "../index.js";
import { NewChirp, chirps, users } from "../schema.js";

export async function createChirp(chirp: NewChirp) {
  const [result] = await db
    .insert(chirps)
    .values(chirp)
    .returning();
  return result;
}

// export async function getAllChirps() {
//   return await db
//     .select()
//     .from(chirps)
//     .orderBy(asc(chirps.createdAt));
// }


// Refactored Query: Optionally accepts an authorId parameter string to filter records
export async function getAllChirps(authorId?: string) {
  let query = db.select().from(chirps);

  // If a specific author filter is requested, build a condition boundary line
  if (authorId) {
    query = query.where(eq(chirps.userId, authorId)) as any;
  }

  // Always enforce ascending chronological ordering list constraints
  return await query.orderBy(asc(chirps.createdAt));
}

// Assignment Query: Retrieves a single chirp matching the provided ID
export async function getChirpById(id:string){
  const [result] = await db.select().from(chirps).where(eq(chirps.id,id));
  return result;
}


// export async function deleteChirpById(id:string) {
//   const [result] = await db.delete(chirps).where(eq(chirps.id,id)).returning();
//   return result;
// }

export async function deleteChirpById(id: string) {
  await db
    .delete(chirps)
    .where(eq(chirps.id, id));
}