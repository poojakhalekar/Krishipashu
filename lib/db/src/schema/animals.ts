import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const animalsTable = pgTable("animals", {
  id: serial("id").primaryKey(),
  animalId: text("animal_id").notNull().unique(),
  name: text("name").notNull(),
  species: text("species").notNull(),
  breed: text("breed").notNull(),
  age: real("age").notNull(),
  healthStatus: text("health_status").notNull().default("healthy"),
  imageUrl: text("image_url"),
  notes: text("notes"),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAnimalSchema = createInsertSchema(animalsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAnimal = z.infer<typeof insertAnimalSchema>;
export type Animal = typeof animalsTable.$inferSelect;
