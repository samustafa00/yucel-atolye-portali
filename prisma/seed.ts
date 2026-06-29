import { PrismaClient } from "@prisma/client";
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

function slugify(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
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
  const match = week.match(new RegExp(`\\* ${label}:\\s*(.+)`, "m"));
  return match?.[1]?.trim() ?? "";
}

function parseWeeks(block: string): ParsedWeek[] {
  return block
    .split(/(?=### \d+\. Hafta:)/)
    .filter((part) => part.trim().startsWith("###"))
    .map((part) => {
      const header = part.match(/^### (\d+)\. Hafta:\s*(.+)$/m);
      const konu = weekField(part, "Konu");
      const amac = weekField(part, "Amaç");
      return {
        weekNumber: Number(header?.[1] ?? 1),
        title: header?.[2]?.trim() ?? "Haftalık Etkinlik",
        description: [`Konu: ${konu}`, `Amaç: ${amac}`].filter((line) => !line.endsWith(": ")).join("\n"),
        outcomes: weekField(part, "Öğrenci kazanımı"),
        activity: weekField(part, "Etkinlik"),
        homeworkSuggestion: weekField(part, "Haftalık mini görev")
      };
    });
}

function parseCurriculumFile(): ParsedWorkshop[] {
  const filePath = path.join(process.cwd(), "mufredatlar.txt");
  const content = fs.readFileSync(filePath, "utf8").replace(/\r/g, "");
  const sections = content
    .split(/\n---\n/)
    .map((section) => section.trim())
    .filter((section) => /^# \d+\./m.test(section));

  return sections.map((section) => {
    const rawName = headingBlock(section, 1) || section.match(/^# \d+\.\s*(.+)$/m)?.[1] || "Atölye";
    const name = rawName.replace(/\s+Atölyesi$/i, "").trim();
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
      homeworkSuggestion: "Kısa gözlem notu hazırlar."
    }))
  }));
}

async function resetDatabase() {
  await prisma.auditLog.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.teacherNote.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.studentReward.deleteMany();
  await prisma.diamondTransaction.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.assignmentSubmission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.teacherWorkshopPermission.deleteMany();
  await prisma.workshopCurriculum.deleteMany();
  await prisma.parentAccessCode.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.workshop.deleteMany();
  await prisma.appSetting.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await resetDatabase();

  const [adminPassword, teacherPassword, studentPassword] = await Promise.all([
    bcrypt.hash("Admin123!", 12),
    bcrypt.hash("Ogretmen123!", 12),
    bcrypt.hash("Ogrenci123!", 12)
  ]);

  const admin = await prisma.user.create({
    data: {
      role: "admin",
      firstName: "Sistem",
      lastName: "Yöneticisi",
      email: "admin@atolye.local",
      passwordHash: adminPassword,
      isApproved: true,
      isActive: true
    }
  });

  const teacher = await prisma.user.create({
    data: {
      role: "teacher",
      firstName: "Ayşe",
      lastName: "Öğretmen",
      email: "ayse@example.com",
      passwordHash: teacherPassword,
      isApproved: true,
      isActive: true
    }
  });

  const student = await prisma.user.create({
    data: {
      role: "student",
      firstName: "Ali",
      lastName: "Yılmaz",
      email: "ali@example.com",
      schoolNumber: "1001",
      gradeLevel: "7",
      branch: "A",
      passwordHash: studentPassword,
      diamondBalance: 320,
      isApproved: true,
      isActive: true,
      parentAccessCodes: {
        create: {
          code: "V-8K4P2X",
          isActive: true
        }
      }
    }
  });

  const parsed = parseCurriculumFile();
  const workshops = parsed.length >= 6 ? parsed : fallbackWorkshops();

  const createdWorkshops = [];
  for (const [index, workshop] of workshops.entries()) {
    const created = await prisma.workshop.create({
      data: {
        name: workshop.name,
        slug: slugify(workshop.name),
        shortDescription: workshop.shortDescription,
        description: workshop.description,
        suitableFor: workshop.suitableFor,
        outcomes: workshop.outcomes,
        capacity: 24,
        sortOrder: index,
        isActive: true,
        curriculum: {
          create: workshop.weeks.slice(0, 8).map((week) => ({
            weekNumber: week.weekNumber,
            title: week.title,
            description: week.description,
            outcomes: week.outcomes,
            activity: week.activity,
            homeworkSuggestion: week.homeworkSuggestion
          }))
        }
      }
    });
    createdWorkshops.push(created);
  }

  const aiWorkshop = createdWorkshops.find((workshop) => workshop.name === "Yapay Zeka") ?? createdWorkshops[4];
  const rocketWorkshop = createdWorkshops.find((workshop) => workshop.name === "Roket") ?? createdWorkshops[5];

  await prisma.teacherWorkshopPermission.createMany({
    data: [aiWorkshop, rocketWorkshop].map((workshop) => ({
      teacherId: teacher.id,
      workshopId: workshop.id,
      canManageStudents: true,
      canCreateAssignments: true,
      canGradeAssignments: true,
      canTakeAttendance: true,
      canCreateAnnouncements: true
    }))
  });

  await prisma.enrollment.create({
    data: {
      studentId: student.id,
      workshopId: aiWorkshop.id,
      status: "active",
      enrolledByTeacherId: teacher.id
    }
  });

  const assignment = await prisma.assignment.create({
    data: {
      workshopId: aiWorkshop.id,
      teacherId: teacher.id,
      title: "Yapay Zeka Günlük Yaşam Araştırması",
      description: "Günlük yaşamda karşılaştığın bir yapay zeka örneğini 5-6 cümleyle açıkla.",
      weekNumber: 1,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      diamondReward: 40,
      maxScore: 100,
      isActive: true,
      submissions: {
        create: {
          studentId: student.id,
          status: "pending"
        }
      }
    }
  });

  await prisma.attendance.create({
    data: {
      workshopId: aiWorkshop.id,
      studentId: student.id,
      teacherId: teacher.id,
      weekNumber: 1,
      date: new Date(),
      status: "present",
      note: "Atölyeye zamanında katıldı."
    }
  });

  await prisma.diamondTransaction.create({
    data: {
      studentId: student.id,
      amount: 320,
      type: "earn",
      reason: "Seed demo elmas bakiyesi",
      createdByUserId: admin.id
    }
  });

  await prisma.reward.createMany({
    data: [
      { name: "Bronz Madalya", description: "Atölye yolculuğunda ilk başarı madalyası.", cost: 100, type: "medal", durationDays: 7, requiresAdminApproval: false },
      { name: "Gümüş Madalya", description: "Düzenli çalışma ve güçlü ilerleme madalyası.", cost: 250, type: "medal", durationDays: 7, requiresAdminApproval: false },
      { name: "Altın Madalya", description: "Üst düzey emek ve başarı görünürlüğü.", cost: 500, type: "medal", durationDays: 7, requiresAdminApproval: true },
      { name: "Profil Çerçevesi", description: "Profilde görünen özel çerçeve.", cost: 300, type: "frame", durationDays: 14, requiresAdminApproval: false },
      { name: "Fidan Katkı Rozeti", description: "Sosyal sorumluluk temasını güçlendiren rozet.", cost: 600, type: "social_good", durationDays: null, requiresAdminApproval: true },
      { name: "Doğa Dostu Öğrenci Rozeti", description: "Çevre duyarlılığı gösteren öğrenciler için rozet.", cost: 700, type: "badge", durationDays: null, requiresAdminApproval: true }
    ]
  });

  const bronze = await prisma.reward.findFirstOrThrow({ where: { name: "Bronz Madalya" } });
  await prisma.studentReward.create({
    data: {
      studentId: student.id,
      rewardId: bronze.id,
      status: "active",
      approvedAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
    }
  });

  await prisma.announcement.createMany({
    data: [
      {
        title: "Atölye Portalı Açıldı",
        content: "Öğrenci, öğretmen ve veli portalları kullanıma hazır.",
        targetType: "all",
        createdByUserId: admin.id,
        isPublished: true,
        publishedAt: new Date()
      },
      {
        title: "Yapay Zeka 1. Hafta Hazırlığı",
        content: "Bu hafta günlük hayattaki yapay zeka örneklerini konuşacağız.",
        targetType: "workshop",
        workshopId: aiWorkshop.id,
        createdByUserId: teacher.id,
        isPublished: true,
        publishedAt: new Date()
      }
    ]
  });

  await prisma.teacherNote.create({
    data: {
      studentId: student.id,
      teacherId: teacher.id,
      workshopId: aiWorkshop.id,
      note: "Bu hafta takım çalışmasına aktif katıldı."
    }
  });

  await prisma.appSetting.create({
    data: {
      key: "allowMultipleEnrollments",
      value: "false"
    }
  });

  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: "seed.completed",
        entityType: "System",
        entityId: null,
        description: "Seed verileri oluşturuldu."
      },
      {
        userId: teacher.id,
        action: "assignment.created",
        entityType: "Assignment",
        entityId: assignment.id,
        description: "Örnek ödev oluşturuldu."
      }
    ]
  });

  console.log("Seed tamamlandı.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
