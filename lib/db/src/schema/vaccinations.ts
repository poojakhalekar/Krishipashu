import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { animalsTable } from "./animals";

export const vaccinationsTable = pgTable("vaccinations", {
  id: serial("id").primaryKey(),
  animalId: integer("animal_id").notNull().references(() => animalsTable.id),
  vaccineName: text("vaccine_name").notNull(),
  dateAdministered: text("date_administered").notNull(),
  nextDueDate: text("next_due_date"),
  administeredBy: text("administered_by"),
  notes: text("notes"),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVaccinationSchema = createInsertSchema(vaccinationsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertVaccination = z.infer<typeof insertVaccinationSchema>;
export type Vaccination = typeof vaccinationsTable.$inferSelect;
