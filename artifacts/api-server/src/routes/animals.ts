import { Router, type IRouter } from "express";
import { db, animalsTable } from "@workspace/db";
import { eq, and, ilike, type SQL } from "drizzle-orm";
import { CreateAnimalBody, UpdateAnimalBody, GetAnimalParams, UpdateAnimalParams, DeleteAnimalParams, ListAnimalsQueryParams } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.get("/animals", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = ListAnimalsQueryParams.safeParse(req.query);
  const userId = req.userId!;

  const conditions: SQL[] = [eq(animalsTable.userId, userId)];
  if (params.success && params.data.search) {
    conditions.push(ilike(animalsTable.name, `%${params.data.search}%`));
  }
  if (params.success && params.data.species) {
    conditions.push(eq(animalsTable.species, params.data.species));
  }
  if (params.success && params.data.healthStatus) {
    conditions.push(eq(animalsTable.healthStatus, params.data.healthStatus));
  }

  const animals = await db
    .select()
    .from(animalsTable)
    .where(and(...conditions))
    .orderBy(animalsTable.createdAt);

  res.json(
    animals.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }))
  );
});

router.post("/animals", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateAnimalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const animalId = `KP-${randomUUID().slice(0, 8).toUpperCase()}`;
  const [animal] = await db
    .insert(animalsTable)
    .values({
      ...parsed.data,
      animalId,
      userId: req.userId!,
    })
    .returning();

  res.status(201).json({
    ...animal,
    createdAt: animal.createdAt.toISOString(),
    updatedAt: animal.updatedAt.toISOString(),
  });
});

router.get("/animals/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = GetAnimalParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [animal] = await db
    .select()
    .from(animalsTable)
    .where(and(eq(animalsTable.id, params.data.id), eq(animalsTable.userId, req.userId!)));

  if (!animal) {
    res.status(404).json({ error: "Animal not found" });
    return;
  }

  res.json({
    ...animal,
    createdAt: animal.createdAt.toISOString(),
    updatedAt: animal.updatedAt.toISOString(),
  });
});

router.patch("/animals/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = UpdateAnimalParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateAnimalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [animal] = await db
    .update(animalsTable)
    .set(parsed.data)
    .where(and(eq(animalsTable.id, params.data.id), eq(animalsTable.userId, req.userId!)))
    .returning();

  if (!animal) {
    res.status(404).json({ error: "Animal not found" });
    return;
  }

  res.json({
    ...animal,
    createdAt: animal.createdAt.toISOString(),
    updatedAt: animal.updatedAt.toISOString(),
  });
});

router.delete("/animals/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = DeleteAnimalParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [animal] = await db
    .delete(animalsTable)
    .where(and(eq(animalsTable.id, params.data.id), eq(animalsTable.userId, req.userId!)))
    .returning();

  if (!animal) {
    res.status(404).json({ error: "Animal not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
