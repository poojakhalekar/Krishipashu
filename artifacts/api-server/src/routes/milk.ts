import { Router, type IRouter } from "express";
import { db, milkEntriesTable, animalsTable } from "@workspace/db";
import { eq, and, gte, lte, type SQL } from "drizzle-orm";
import { CreateMilkEntryBody, DeleteMilkEntryParams, ListMilkEntriesQueryParams } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/milk", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = ListMilkEntriesQueryParams.safeParse(req.query);
  const userId = req.userId!;

  const conditions: SQL[] = [eq(milkEntriesTable.userId, userId)];
  if (params.success && params.data.animalId) {
    conditions.push(eq(milkEntriesTable.animalId, params.data.animalId));
  }
  if (params.success && params.data.startDate) {
    conditions.push(gte(milkEntriesTable.date, params.data.startDate));
  }
  if (params.success && params.data.endDate) {
    conditions.push(lte(milkEntriesTable.date, params.data.endDate));
  }

  const entries = await db
    .select({
      id: milkEntriesTable.id,
      animalId: milkEntriesTable.animalId,
      animalName: animalsTable.name,
      quantityLiters: milkEntriesTable.quantityLiters,
      date: milkEntriesTable.date,
      session: milkEntriesTable.session,
      notes: milkEntriesTable.notes,
      userId: milkEntriesTable.userId,
      createdAt: milkEntriesTable.createdAt,
    })
    .from(milkEntriesTable)
    .leftJoin(animalsTable, eq(milkEntriesTable.animalId, animalsTable.id))
    .where(and(...conditions))
    .orderBy(milkEntriesTable.date);

  res.json(
    entries.map((e) => ({
      ...e,
      animalName: e.animalName ?? "Unknown",
      createdAt: e.createdAt.toISOString(),
    }))
  );
});

router.post("/milk", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateMilkEntryBody.safeParse(req.body);
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

  const [entry] = await db
    .insert(milkEntriesTable)
    .values({
      ...parsed.data,
      userId: req.userId!,
    })
    .returning();

  res.status(201).json({
    ...entry,
    animalName: animal.name,
    createdAt: entry.createdAt.toISOString(),
  });
});

router.delete("/milk/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = DeleteMilkEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [entry] = await db
    .delete(milkEntriesTable)
    .where(and(eq(milkEntriesTable.id, params.data.id), eq(milkEntriesTable.userId, req.userId!)))
    .returning();

  if (!entry) {
    res.status(404).json({ error: "Milk entry not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
