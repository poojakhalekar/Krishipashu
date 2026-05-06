import { Router, type IRouter } from "express";
import { db, animalsTable, usersTable, vaccinationsTable, milkEntriesTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { GetPublicAnimalParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/public/animals/:animalId", async (req, res): Promise<void> => {
  const params = GetPublicAnimalParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [animal] = await db
    .select()
    .from(animalsTable)
    .where(eq(animalsTable.animalId, params.data.animalId));

  if (!animal) {
    res.status(404).json({ error: "Animal not found" });
    return;
  }

  const [owner] = await db.select().from(usersTable).where(eq(usersTable.id, animal.userId));

  const vaccinations = await db
    .select()
    .from(vaccinationsTable)
    .where(eq(vaccinationsTable.animalId, animal.id))
    .orderBy(desc(vaccinationsTable.dateAdministered));

  const recentMilk = await db
    .select()
    .from(milkEntriesTable)
    .where(eq(milkEntriesTable.animalId, animal.id))
    .orderBy(desc(milkEntriesTable.date));

  res.json({
    animal: {
      animalId: animal.animalId,
      name: animal.name,
      species: animal.species,
      breed: animal.breed,
      age: animal.age,
      healthStatus: animal.healthStatus,
      imageUrl: animal.imageUrl,
      notes: animal.notes,
    },
    owner: owner
      ? {
          name: owner.name,
          phone: owner.phone,
        }
      : null,
    vaccinations: vaccinations.map((v) => ({
      vaccineName: v.vaccineName,
      dateAdministered: v.dateAdministered,
      nextDueDate: v.nextDueDate,
      administeredBy: v.administeredBy,
    })),
    recentMilk: recentMilk.map((m) => ({
      date: m.date,
      session: m.session,
      quantityLiters: m.quantityLiters,
    })),
  });
});

export default router;
