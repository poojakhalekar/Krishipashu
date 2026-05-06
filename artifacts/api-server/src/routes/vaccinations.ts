import { Router, type IRouter } from "express";
import { db, vaccinationsTable, animalsTable } from "@workspace/db";
import { eq, and, type SQL } from "drizzle-orm";
import { CreateVaccinationBody, DeleteVaccinationParams, ListVaccinationsQueryParams } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/vaccinations", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = ListVaccinationsQueryParams.safeParse(req.query);
  const userId = req.userId!;

  const conditions: SQL[] = [eq(vaccinationsTable.userId, userId)];
  if (params.success && params.data.animalId) {
    conditions.push(eq(vaccinationsTable.animalId, params.data.animalId));
  }

  const records = await db
    .select({
      id: vaccinationsTable.id,
      animalId: vaccinationsTable.animalId,
      animalName: animalsTable.name,
      vaccineName: vaccinationsTable.vaccineName,
      dateAdministered: vaccinationsTable.dateAdministered,
      nextDueDate: vaccinationsTable.nextDueDate,
      administeredBy: vaccinationsTable.administeredBy,
      notes: vaccinationsTable.notes,
      userId: vaccinationsTable.userId,
      createdAt: vaccinationsTable.createdAt,
    })
    .from(vaccinationsTable)
    .leftJoin(animalsTable, eq(vaccinationsTable.animalId, animalsTable.id))
    .where(and(...conditions))
    .orderBy(vaccinationsTable.dateAdministered);

  let result = records.map((v) => ({
    ...v,
    animalName: v.animalName ?? "Unknown",
    createdAt: v.createdAt.toISOString(),
  }));

  if (params.success && params.data.upcoming) {
    const today = new Date().toISOString().split("T")[0];
    const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    result = result.filter(
      (v) => v.nextDueDate && v.nextDueDate >= today && v.nextDueDate <= sevenDaysLater
    );
  }

  res.json(result);
});

router.post("/vaccinations", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateVaccinationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [animal] = await db
    .select()
    .from(animalsTable)
    .where(and(eq(animalsTable.id, parsed.data.animalId), eq(animalsTable.userId, req.userId!)));

  if (!animal) {
    res.status(400).json({ error: "Animal not found or does not belong to you" });
    return;
  }

  const [record] = await db
    .insert(vaccinationsTable)
    .values({
      ...parsed.data,
      userId: req.userId!,
    })
    .returning();

  res.status(201).json({
    ...record,
    animalName: animal.name,
    createdAt: record.createdAt.toISOString(),
  });
});

router.delete("/vaccinations/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = DeleteVaccinationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [record] = await db
    .delete(vaccinationsTable)
    .where(and(eq(vaccinationsTable.id, params.data.id), eq(vaccinationsTable.userId, req.userId!)))
    .returning();

  if (!record) {
    res.status(404).json({ error: "Vaccination record not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
