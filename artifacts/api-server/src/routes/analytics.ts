import { Router, type IRouter } from "express";
import { db, animalsTable, milkEntriesTable, vaccinationsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/analytics/dashboard", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [animalCounts] = await db
    .select({
      total: sql<number>`count(*)::int`,
      healthy: sql<number>`count(*) filter (where health_status = 'healthy')::int`,
      sick: sql<number>`count(*) filter (where health_status = 'sick' or health_status = 'injured')::int`,
    })
    .from(animalsTable)
    .where(eq(animalsTable.userId, userId));

  const [milkToday] = await db
    .select({ total: sql<number>`coalesce(sum(quantity_liters), 0)::real` })
    .from(milkEntriesTable)
    .where(and(eq(milkEntriesTable.userId, userId), eq(milkEntriesTable.date, today)));

  const [milkWeek] = await db
    .select({ total: sql<number>`coalesce(sum(quantity_liters), 0)::real` })
    .from(milkEntriesTable)
    .where(and(eq(milkEntriesTable.userId, userId), sql`date >= ${sevenDaysAgo}`));

  const upcomingVaxRecords = await db
    .select()
    .from(vaccinationsTable)
    .where(
      and(
        eq(vaccinationsTable.userId, userId),
        sql`next_due_date is not null and next_due_date >= ${today} and next_due_date <= ${sevenDaysLater}`
      )
    );

  const totalVax = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(vaccinationsTable)
    .where(eq(vaccinationsTable.userId, userId));

  const upcomingCount = upcomingVaxRecords.length;
  const totalAnimals = animalCounts?.total ?? 0;
  const totalVaxCount = totalVax[0]?.count ?? 0;
  const compliancePercent = totalAnimals > 0 ? Math.min(100, Math.round((totalVaxCount / totalAnimals) * 100)) : 0;

  res.json({
    totalAnimals,
    totalMilkToday: milkToday?.total ?? 0,
    upcomingVaccinations: upcomingCount,
    healthyAnimals: animalCounts?.healthy ?? 0,
    sickAnimals: animalCounts?.sick ?? 0,
    milkThisWeek: milkWeek?.total ?? 0,
    vaccinationCompliancePercent: compliancePercent,
  });
});

router.get("/analytics/milk-trend", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;
  const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const trend = await db
    .select({
      date: milkEntriesTable.date,
      totalLiters: sql<number>`coalesce(sum(quantity_liters), 0)::real`,
    })
    .from(milkEntriesTable)
    .where(and(eq(milkEntriesTable.userId, userId), sql`date >= ${sevenDaysAgo}`))
    .groupBy(milkEntriesTable.date)
    .orderBy(milkEntriesTable.date);

  res.json(trend);
});

router.get("/analytics/animal-stats", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;

  const stats = await db
    .select({
      animalId: milkEntriesTable.animalId,
      animalName: animalsTable.name,
      species: animalsTable.species,
      totalLiters: sql<number>`coalesce(sum(${milkEntriesTable.quantityLiters}), 0)::real`,
      averageDaily: sql<number>`coalesce(avg(${milkEntriesTable.quantityLiters}), 0)::real`,
    })
    .from(milkEntriesTable)
    .leftJoin(animalsTable, eq(milkEntriesTable.animalId, animalsTable.id))
    .where(eq(milkEntriesTable.userId, userId))
    .groupBy(milkEntriesTable.animalId, animalsTable.name, animalsTable.species)
    .orderBy(sql`sum(${milkEntriesTable.quantityLiters}) desc`);

  res.json(
    stats.map((s) => ({
      animalId: s.animalId,
      animalName: s.animalName ?? "Unknown",
      species: s.species ?? "Unknown",
      totalLiters: s.totalLiters,
      averageDaily: Math.round(s.averageDaily * 100) / 100,
    }))
  );
});

router.get("/analytics/upcoming-vaccinations", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

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
    .where(
      and(
        eq(vaccinationsTable.userId, userId),
        sql`next_due_date is not null and next_due_date >= ${today} and next_due_date <= ${sevenDaysLater}`
      )
    )
    .orderBy(vaccinationsTable.nextDueDate);

  res.json(
    records.map((v) => ({
      ...v,
      animalName: v.animalName ?? "Unknown",
      createdAt: v.createdAt.toISOString(),
    }))
  );
});

export default router;
