import { Router, type IRouter } from "express";
import { db, animalsTable, milkEntriesTable, vaccinationsTable } from "@workspace/db";
import { and, eq, gte, sql, isNotNull } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

type Lang = "en" | "hi" | "mr";

interface Recommendation {
  id: string;
  category: "health" | "milk" | "vaccination" | "general";
  priority: "high" | "medium" | "low";
  title: string;
  message: string;
  action?: string;
}

const T = {
  sickAnimalsTitle: {
    en: (n: number) => `${n} animal(s) need attention`,
    hi: (n: number) => `${n} पशु को ध्यान देने की आवश्यकता है`,
    mr: (n: number) => `${n} जनावरांना लक्ष देण्याची गरज आहे`,
  },
  sickAnimalsMsg: {
    en: (names: string) => `The following animals are not in good health: ${names}. Consider consulting a veterinarian.`,
    hi: (names: string) => `निम्नलिखित पशु अच्छे स्वास्थ्य में नहीं हैं: ${names}। पशु चिकित्सक से सलाह लें।`,
    mr: (names: string) => `पुढील जनावरे चांगल्या तब्येतीत नाहीत: ${names}. पशुवैद्याचा सल्ला घ्या.`,
  },
  visitAnimals: {
    en: "Visit Animals page",
    hi: "पशु पृष्ठ पर जाएं",
    mr: "जनावरे पृष्ठावर जा",
  },
  visitVacc: {
    en: "Visit Vaccinations page",
    hi: "टीकाकरण पृष्ठ पर जाएं",
    mr: "लसीकरण पृष्ठावर जा",
  },
  visitMilk: {
    en: "Visit Milk page",
    hi: "दूध पृष्ठ पर जाएं",
    mr: "दूध पृष्ठावर जा",
  },
  vaccTitle: {
    en: (n: number) => `${n} vaccination(s) coming up`,
    hi: (n: number) => `${n} टीकाकरण आने वाले हैं`,
    mr: (n: number) => `${n} लसीकरण येणार आहेत`,
  },
  vaccMsg: {
    en: "Stay ahead of disease prevention. Check upcoming vaccination schedules.",
    hi: "रोग रोकथाम में आगे रहें। आगामी टीकाकरण कार्यक्रम देखें।",
    mr: "रोग प्रतिबंधात पुढे रहा. येणारे लसीकरण वेळापत्रक तपासा.",
  },
  lowMilkTitle: {
    en: (name: string) => `${name}'s milk production is low`,
    hi: (name: string) => `${name} का दूध उत्पादन कम है`,
    mr: (name: string) => `${name} चे दूध उत्पादन कमी आहे`,
  },
  lowMilkMsg: {
    en: (avg: string) => `Average is ${avg}L/day. Check feed quality, water supply, and consider a veterinary check.`,
    hi: (avg: string) => `औसत ${avg} लीटर/दिन है। चारे की गुणवत्ता, पानी की आपूर्ति की जांच करें और पशु चिकित्सा जांच पर विचार करें।`,
    mr: (avg: string) => `सरासरी ${avg} लीटर/दिवस आहे. चारा गुणवत्ता, पाणी पुरवठा तपासा आणि पशुवैद्यकीय तपासणीचा विचार करा.`,
  },
  noAnimalsTitle: {
    en: "Get started by adding your animals",
    hi: "अपने पशु जोड़कर शुरुआत करें",
    mr: "तुमची जनावरे जोडून सुरुवात करा",
  },
  noAnimalsMsg: {
    en: "Add your livestock to start tracking health, milk production, and vaccinations.",
    hi: "स्वास्थ्य, दूध उत्पादन और टीकाकरण को ट्रैक करने के लिए अपने पशुधन को जोड़ें।",
    mr: "आरोग्य, दूध उत्पादन आणि लसीकरण ट्रॅक करण्यासाठी तुमची जनावरे जोडा.",
  },
  addAnimal: {
    en: "Add an animal",
    hi: "पशु जोड़ें",
    mr: "जनावर जोडा",
  },
  monsoonTitle: {
    en: "Monsoon Care Tip",
    hi: "मानसून देखभाल टिप",
    mr: "पावसाळी काळजी टिप",
  },
  monsoonMsg: {
    en: "Keep animal shelters dry. Watch for foot rot in cattle and parasitic infections during monsoon season.",
    hi: "पशु आश्रयों को सूखा रखें। मानसून में मवेशियों में फुट रोट और परजीवी संक्रमण पर ध्यान दें।",
    mr: "जनावरांचे निवारे कोरडे ठेवा. पावसाळ्यात गुरांमध्ये फूट रॉट आणि परजीवी संक्रमणावर लक्ष ठेवा.",
  },
  winterTitle: {
    en: "Winter Care Tip",
    hi: "सर्दी देखभाल टिप",
    mr: "हिवाळी काळजी टिप",
  },
  winterMsg: {
    en: "Provide warm bedding and adequate fodder. Cold stress reduces milk production by 10-15%.",
    hi: "गर्म बिस्तर और पर्याप्त चारा प्रदान करें। ठंड के तनाव से दूध उत्पादन में 10-15% की कमी आती है।",
    mr: "उबदार बिछाना आणि पुरेसा चारा द्या. थंडीच्या ताणामुळे दूध उत्पादन 10-15% ने कमी होते.",
  },
  summerTitle: {
    en: "Summer Care Tip",
    hi: "गर्मी देखभाल टिप",
    mr: "उन्हाळी काळजी टिप",
  },
  summerMsg: {
    en: "Ensure plenty of clean water. Heat stress can reduce milk yield significantly. Provide shade.",
    hi: "पर्याप्त साफ पानी सुनिश्चित करें। गर्मी के तनाव से दूध की उपज काफी कम हो सकती है। छाया प्रदान करें।",
    mr: "भरपूर स्वच्छ पाणी द्या. उष्णतेच्या ताणामुळे दुधाचे उत्पादन लक्षणीयरीत्या कमी होऊ शकते. सावली द्या.",
  },
  logMilkTitle: {
    en: "Don't forget to log today's milk",
    hi: "आज का दूध दर्ज करना न भूलें",
    mr: "आजचे दूध नोंदवायला विसरू नका",
  },
  logMilkMsg: {
    en: "Daily logging helps you track production trends and identify issues early.",
    hi: "दैनिक लॉगिंग आपको उत्पादन रुझानों को ट्रैक करने और समस्याओं की जल्दी पहचान करने में मदद करती है।",
    mr: "दैनिक नोंद तुम्हाला उत्पादन ट्रेंड ट्रॅक करण्यात आणि समस्या लवकर ओळखण्यात मदत करते.",
  },
};

function pickLang(raw: unknown): Lang {
  const v = String(raw || "").toLowerCase();
  if (v === "hi" || v === "mr" || v === "en") return v;
  return "en";
}

router.get("/recommendations", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;
  const lang = pickLang(req.query.lang);
  const recs: Recommendation[] = [];

  const animals = await db.select().from(animalsTable).where(eq(animalsTable.userId, userId));

  // 1) Sick animals
  const sick = animals.filter((a) => a.healthStatus !== "healthy");
  if (sick.length > 0) {
    const names = sick.map((a) => a.name).join(", ");
    recs.push({
      id: "sick-animals",
      category: "health",
      priority: "high",
      title: T.sickAnimalsTitle[lang](sick.length),
      message: T.sickAnimalsMsg[lang](names),
      action: T.visitAnimals[lang],
    });
  }

  // 2) Vaccinations due in next 7 days
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const upcoming = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(vaccinationsTable)
    .where(
      and(
        eq(vaccinationsTable.userId, userId),
        isNotNull(vaccinationsTable.nextDueDate),
        gte(vaccinationsTable.nextDueDate, todayStr),
      ),
    );
  const upcomingCount = upcoming[0]?.count ?? 0;

  if (upcomingCount > 0) {
    recs.push({
      id: "upcoming-vaccinations",
      category: "vaccination",
      priority: "medium",
      title: T.vaccTitle[lang](upcomingCount),
      message: T.vaccMsg[lang],
      action: T.visitVacc[lang],
    });
  }

  // 3) Underperforming milk producers
  const milkingSpecies = ["cow", "buffalo", "goat"];
  const milkingAnimals = animals.filter((a) => milkingSpecies.includes(a.species.toLowerCase()));

  if (milkingAnimals.length > 0) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    const sevenAgoStr = sevenDaysAgo.toISOString().split("T")[0];

    for (const a of milkingAnimals) {
      const result = await db
        .select({ total: sql<number>`coalesce(sum(${milkEntriesTable.quantityLiters}), 0)::float` })
        .from(milkEntriesTable)
        .where(
          and(
            eq(milkEntriesTable.userId, userId),
            eq(milkEntriesTable.animalId, a.id),
            gte(milkEntriesTable.date, sevenAgoStr),
          ),
        );
      const avgPerDay = (result[0]?.total ?? 0) / 7;

      if (avgPerDay < 3 && a.healthStatus === "healthy") {
        recs.push({
          id: `low-milk-${a.id}`,
          category: "milk",
          priority: "medium",
          title: T.lowMilkTitle[lang](a.name),
          message: T.lowMilkMsg[lang](avgPerDay.toFixed(1)),
          action: T.visitMilk[lang],
        });
      }
    }
  }

  // 4) General tips
  if (animals.length === 0) {
    recs.push({
      id: "no-animals",
      category: "general",
      priority: "low",
      title: T.noAnimalsTitle[lang],
      message: T.noAnimalsMsg[lang],
      action: T.addAnimal[lang],
    });
  } else {
    const month = today.getMonth();
    if (month >= 5 && month <= 8) {
      recs.push({
        id: "monsoon-tip",
        category: "general",
        priority: "low",
        title: T.monsoonTitle[lang],
        message: T.monsoonMsg[lang],
      });
    } else if (month >= 11 || month <= 1) {
      recs.push({
        id: "winter-tip",
        category: "general",
        priority: "low",
        title: T.winterTitle[lang],
        message: T.winterMsg[lang],
      });
    } else {
      recs.push({
        id: "summer-tip",
        category: "general",
        priority: "low",
        title: T.summerTitle[lang],
        message: T.summerMsg[lang],
      });
    }
  }

  // 5) Daily milk logging reminder
  const todayMilk = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(milkEntriesTable)
    .where(and(eq(milkEntriesTable.userId, userId), eq(milkEntriesTable.date, todayStr)));
  const todayMilkCount = todayMilk[0]?.count ?? 0;

  if (milkingAnimals.length > 0 && todayMilkCount === 0) {
    recs.push({
      id: "log-milk-today",
      category: "milk",
      priority: "low",
      title: T.logMilkTitle[lang],
      message: T.logMilkMsg[lang],
      action: T.visitMilk[lang],
    });
  }

  res.json(recs);
});

export default router;
