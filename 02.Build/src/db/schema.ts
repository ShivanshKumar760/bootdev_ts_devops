import {pgTable,timestamp,varchar,uuid,text} from "drizzle-orm/pg-core";

export const users = pgTable("users",{
    id : uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt:  timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(()=> new Date()),
    email: varchar("email",{length:256}).unique().notNull(),
    hashedPassword: varchar("hashed_password").default("unset").notNull(),// added  column for hashed password
});

export const chirps = pgTable("chirps",{
    id: uuid("id").primaryKey().defaultRandom(),
    body: text("body").notNull(),
    userId: uuid("user_id").notNull().references(()=>users.id,{onDelete:"cascade"}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(()=> new Date()),

})
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Chirp = typeof chirps.$inferSelect;
export type NewChirp = typeof chirps.$inferInsert;
