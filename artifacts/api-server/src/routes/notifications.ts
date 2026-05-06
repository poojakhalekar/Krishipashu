import { Router, type IRouter } from "express";
import { db, notificationsTable, vaccinationsTable, animalsTable } from "@workspace/db";
import { and, desc, eq, gte, lte, isNotNull } from "drizzle-orm";
import { MarkNotificationReadParams } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

async function syncVaccinationNotifications(userId: number): Promise<void> {
  const today = new Date();
  const sevenDays = new Date();
  sevenDays.setDate(today.getDate() + 7);
  const todayStr = today.toISOString().split("T")[0];
  const sevenStr = sevenDays.toISOString().split("T")[0];

  const upcoming = await db
    .select({
      id: vaccinationsTable.id,
      vaccineName: vaccinationsTable.vaccineName,
      nextDueDate: vaccinationsTable.nextDueDate,
      animalName: animalsTable.name,
    })
    .from(vaccinationsTable)
    .innerJoin(animalsTable, eq(vaccinationsTable.animalId, animalsTable.id))
    .where(
      and(
        eq(vaccinationsTable.userId, userId),
        isNotNull(vaccinationsTable.nextDueDate),
        gte(vaccinationsTable.nextDueDate, todayStr),
        lte(vaccinationsTable.nextDueDate, sevenStr),
      ),
    );

  for (const v of upcoming) {
    const link = `vaccination:${v.id}`;
    const existing = await db
      .select()
      .from(notificationsTable)
      .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.link, link)));
    if (existing.length === 0) {
      await db.insert(notificationsTable).values({
        userId,
        type: "vaccination",
        title: "Vaccination Due Soon",
        message: `${v.animalName} needs ${v.vaccineName} by ${v.nextDueDate}`,
        link,
      });
    }
  }
}

router.get("/notifications", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;
  await syncVaccinationNotifications(userId);

  const list = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);

  res.json(
    list.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })),
  );
});

router.patch("/notifications/:id/read", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [notif] = await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.id, params.data.id), eq(notificationsTable.userId, req.userId!)))
    .returning();

  if (!notif) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json({ ...notif, createdAt: notif.createdAt.toISOString() });
});

router.post("/notifications/read-all", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.userId, req.userId!));
  res.json({ success: true });
});

export default router;
