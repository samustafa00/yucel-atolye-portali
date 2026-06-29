import { PrismaClient, type RewardType } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

type ParsedWeek = {
  weekNumber: number;
  title: string;
  description: string;
  outcomes: string;
  activity: string;
  homeworkSuggestion: string;
};

type ParsedWorkshop = {
  name: string;
  shortDescription: string;
  description: string;
  suitableFor: string;
  outcomes: string;
  finalProject: string;
  weeks: ParsedWeek[];
};

type RewardSeed = {
  name: string;
  description: string;
  cost: number;
  type: RewardType;
  durationDays: number | null;
  requiresAdminApproval: boolean;
};

function slugify(value: string) {
  const replacements: Record<string, string> = {
    ç: "c",
    ğ: "g",
    ı: "i",
    ö: "o",
    ş: "s",
    ü: "u"
  };

  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşü]/g, (letter) => replacements[letter] ?? letter)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function compact(value: string) {
  return value
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function headingBlock(section: string, number: number) {
  const regex = new RegExp(`(?:^|\\n)## ${number}\\. [^\\n]+\\n([\\s\\S]*?)(?=\\n## \\d+\\. |$)`);
  return compact(section.match(regex)?.[1] ?? "");
}

function bullets(block: string) {
  return block
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("* "))
    .map((line) => line.replace(/^\* /, ""))
    .join("\n");
}

function weekField(week: string, label: string) {
  const match = week.match(new RegExp(`\\* ${escapeRegex(label)}:\\s*(.+)`, "m"));
  return match?.[1]?.trim() ?? "";
}

function parseWeeks(block: string): ParsedWeek[] {
  return block
    .split(/(?=### \d+\. Hafta:)/)
    .filter((part) => part.trim().startsWith("###"))
    .map((part) => {
      const header = part.match(/^### (\d+)\. Hafta:\s*(.+)$/m);
      const topic = weekField(part, "Konu");
      const goal = weekField(part, "Amaç");
      return {
        weekNumber: Number(header?.[1] ?? 1),
        title: header?.[2]?.trim() ?? "Haftalık Etkinlik",
        description: [
          topic ? `Konu: ${topic}` : "",
          goal ? `Amaç: ${goal}` : ""
        ]
          .filter(Boolean)
          .join("\n"),
        outcomes: weekField(part, "Öğrenci kazanımı"),
        activity: weekField(part, "Etkinlik"),
        homeworkSuggestion: weekField(part, "Haftalık mini görev")
      };
    });
}

function parseCurriculumFile(): ParsedWorkshop[] {
  const filePath = path.join(process.cwd(), "mufredatlar.txt");
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, "utf8").replace(/\r/g, "");
  const sections = content
    .split(/\n---\n/)
    .map((section) => section.trim())
    .filter((section) => /^# \d+\./m.test(section));

  return sections.map((section) => {
    const rawName = headingBlock(section, 1) || section.match(/^# \d+\.\s*(.+)$/m)?.[1] || "Atölye";
    const name = rawName.replace(/\s+Atölyesi$/iu, "").trim();
    const shortDescription = headingBlock(section, 2);
    const suitableFor = bullets(headingBlock(section, 3));
    const outcomes = bullets(headingBlock(section, 4));
    const curriculum = headingBlock(section, 5);
    const finalProject = headingBlock(section, 6);
    return {
      name,
      shortDescription,
      description: compact(`${shortDescription}\n\nÖrnek final projesi:\n${finalProject}`),
      suitableFor,
      outcomes,
      finalProject,
      weeks: parseWeeks(curriculum)
    };
  });
}

function fallbackWorkshops(): ParsedWorkshop[] {
  const names = ["Döner Kanat", "Sabit Kanat", "FPV Dron Pilotluğu", "Proje Yönetmeliği", "Yapay Zeka", "Roket"];
  return names.map((name) => ({
    name,
    shortDescription: `${name} atölyesi ortaokul öğrencileri için güvenli, üretim odaklı ve 8 haftalık bir öğrenme deneyimi sunar.`,
    description: `${name} atölyesinde öğrenciler temel kavramları tanır, güvenli uygulamalar yapar ve final projesi sunar.`,
    suitableFor: "Meraklı öğrenciler\nTakım çalışmasını seven öğrenciler\nSTEM alanlarına ilgi duyan öğrenciler",
    outcomes: "Tasarım yapar\nProblem çözer\nGüvenli çalışma alışkanlığı kazanır\nSunum becerisi geliştirir",
    finalProject: `${name} final projesi`,
    weeks: Array.from({ length: 8 }, (_, index) => ({
      weekNumber: index + 1,
      title: `${index + 1}. Hafta Etkinliği`,
      description: "Temel konu anlatımı ve uygulama",
      outcomes: "Haftanın temel kazanımını açıklar.",
      activity: "Sınıf içi güvenli etkinlik",
      homeworkSuggestion: ""
    }))
  }));
}

async function ensureInitialAdmin() {
  const existingAdminCount = await prisma.user.count({ where: { role: "admin" } });
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  const firstName = process.env.SEED_ADMIN_FIRST_NAME?.trim() || "Sistem";
  const lastName = process.env.SEED_ADMIN_LAST_NAME?.trim() || "Yöneticisi";

  if (!email || !password) {
    if (existingAdminCount === 0) {
      console.warn("SEED_ADMIN_EMAIL ve SEED_ADMIN_PASSWORD tanımlanmadığı için ilk admin hesabı oluşturulmadı.");
    }
    return null;
  }

  if (password.length < 8) {
    throw new Error("SEED_ADMIN_PASSWORD en az 8 karakter olmalı.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== "admin") {
      throw new Error(`${email} adresi admin olmayan bir kullanıcıya ait.`);
    }

    await prisma.user.update({
      where: { id: existing.id },
      data: { isActive: true, isApproved: true }
    });
    console.log(`Admin hesabı zaten var: ${email}`);
    return existing;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.user.create({
    data: {
      role: "admin",
      firstName,
      lastName,
      email,
      passwordHash,
      isApproved: true,
      isActive: true
    }
  });

  console.log(`İlk admin hesabı oluşturuldu: ${email}`);
  return admin;
}

async function ensureAppSettings() {
  const existing = await prisma.appSetting.findUnique({
    where: { key: "allowMultipleEnrollments" }
  });

  if (!existing) {
    await prisma.appSetting.create({
      data: { key: "allowMultipleEnrollments", value: "false" }
    });
  }
}

async function upsertWorkshops() {
  const parsed = parseCurriculumFile();
  const workshops = parsed.length >= 6 ? parsed : fallbackWorkshops();

  for (const [index, workshop] of workshops.entries()) {
    const slug = slugify(workshop.name);
    const saved = await prisma.workshop.upsert({
      where: { slug },
      update: {
        name: workshop.name,
        shortDescription: workshop.shortDescription,
        description: workshop.description,
        suitableFor: workshop.suitableFor,
        outcomes: workshop.outcomes,
        capacity: 24,
        sortOrder: index,
        isActive: true
      },
      create: {
        name: workshop.name,
        slug,
        shortDescription: workshop.shortDescription,
        description: workshop.description,
        suitableFor: workshop.suitableFor,
        outcomes: workshop.outcomes,
        capacity: 24,
        sortOrder: index,
        isActive: true
      }
    });

    for (const week of workshop.weeks.slice(0, 8)) {
      await prisma.workshopCurriculum.upsert({
        where: {
          workshopId_weekNumber: {
            workshopId: saved.id,
            weekNumber: week.weekNumber
          }
        },
        update: {
          title: week.title,
          description: week.description,
          outcomes: week.outcomes,
          activity: week.activity,
          homeworkSuggestion: week.homeworkSuggestion
        },
        create: {
          workshopId: saved.id,
          weekNumber: week.weekNumber,
          title: week.title,
          description: week.description,
          outcomes: week.outcomes,
          activity: week.activity,
          homeworkSuggestion: week.homeworkSuggestion
        }
      });
    }
  }
}

async function upsertReward(data: RewardSeed) {
  const existing = await prisma.reward.findFirst({ where: { name: data.name } });
  if (existing) {
    await prisma.reward.update({
      where: { id: existing.id },
      data: { ...data, isActive: true }
    });
    return;
  }

  await prisma.reward.create({
    data: { ...data, isActive: true }
  });
}

async function upsertRewards() {
  const rewards: RewardSeed[] = [
    { name: "Bronz Madalya", description: "Atölye yolculuğunda ilk başarı madalyası.", cost: 100, type: "medal", durationDays: 7, requiresAdminApproval: false },
    { name: "Gümüş Madalya", description: "Düzenli çalışma ve güçlü ilerleme madalyası.", cost: 250, type: "medal", durationDays: 7, requiresAdminApproval: false },
    { name: "Altın Madalya", description: "Üst düzey emek ve başarı görünürlüğü.", cost: 500, type: "medal", durationDays: 7, requiresAdminApproval: true },
    { name: "Profil Çerçevesi", description: "Profilde görünen özel çerçeve.", cost: 300, type: "frame", durationDays: 14, requiresAdminApproval: false },
    { name: "Fidan Katkı Rozeti", description: "Sosyal sorumluluk temasını güçlendiren rozet.", cost: 600, type: "social_good", durationDays: null, requiresAdminApproval: true },
    { name: "Doğa Dostu Öğrenci Rozeti", description: "Çevre duyarlılığı gösteren öğrenciler için rozet.", cost: 700, type: "badge", durationDays: null, requiresAdminApproval: true }
  ];

  for (const reward of rewards) {
    await upsertReward(reward);
  }
}

async function ensureWelcomeAnnouncement(adminId?: string) {
  const existing = await prisma.announcement.findFirst({
    where: { title: "Atölye Portalı Açıldı" }
  });

  if (existing) return;

  await prisma.announcement.create({
    data: {
      title: "Atölye Portalı Açıldı",
      content: "Yücel Çelikbilek İmam Hatip Ortaokulu atölye portalı kullanıma hazır.",
      targetType: "all",
      createdByUserId: adminId,
      isPublished: true,
      publishedAt: new Date()
    }
  });
}

async function main() {
  const admin = await ensureInitialAdmin();

  await ensureAppSettings();
  await upsertWorkshops();
  await upsertRewards();
  await ensureWelcomeAnnouncement(admin?.id);

  console.log("Canlı seed tamamlandı. Mevcut öğrenci ve öğretmen verileri silinmedi.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
