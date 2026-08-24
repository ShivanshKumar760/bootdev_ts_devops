import {pgTable,timestamp,varchar,uuid,text,boolean} from "drizzle-orm/pg-core";

export const users = pgTable("users",{
    id : uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt:  timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(()=> new Date()),
    email: varchar("email",{length:256}).unique().notNull(),
    hashedPassword: varchar("hashed_password").default("unset").notNull(),// added  column for hashed password
    isChirpyRed: boolean("is_chirpy_red").default(false).notNull(), 
});

export const chirps = pgTable("chirps",{
    id: uuid("id").primaryKey().defaultRandom(),
    body: text("body").notNull(),
    userId: uuid("user_id").notNull().references(()=>users.id,{onDelete:"cascade"}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(()=> new Date()),

});

// Assignment Table: Create refresh_tokens table schema layout
export const refreshTokens = pgTable("refresh_tokens",{
    token: text("token").primaryKey(),
    userId:uuid("user_id").notNull().references(()=>users.id,{onDelete:"cascade"}),
    expiresAt:timestamp("expires_at").notNull(),
    revokedAt:timestamp("revoked_at"),//nullable by default
    createdAt:timestamp("created_at").defaultNow().notNull(),
    updatedAt:timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Chirp = typeof chirps.$inferSelect;
export type NewChirp = typeof chirps.$inferInsert;


export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;