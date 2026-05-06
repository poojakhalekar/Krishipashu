import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { animalsTable } from "./animals";

export const milkEntriesTable = pgTable("milk_entries", {
  id: serial("id").primaryKey(),
  animalId: integer("animal_id").notNull().references(() => animalsTable.id),
  quantityLiters: real("quantity_liters").notNull(),
  date: text("date").notNull(),
  session: text("session").notNull().default("morning"),
  notes: text("notes"),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMilkEntrySchema = createInsertSchema(milkEntriesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertMilkEntry = z.infer<typeof insertMilkEntrySchema>;
export type MilkEntry = typeof milkEntriesTable.$inferSelect;
