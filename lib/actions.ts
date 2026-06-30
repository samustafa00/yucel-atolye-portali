"use server";

import { AnnouncementTargetType, AttendanceStatus, EnrollmentStatus, RewardType, Role, SubmissionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isSingleWorkshopMode, requireTeacherWorkshopPermission } from "@/lib/permissions";
import { clearSession, createParentSession, createUserSession, requireAdmin, requireStudent, requireTeacher } from "@/lib/session";
import { generateParentCode, generateResetToken, hashPassword, hashToken, verifyPassword } from "@/lib/security";
import { slugify } from "@/lib/format";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function numberField(formData: FormData, key: string, fallback = 0) {
  const value = Number(text(formData, key));
  return Number.isFinite(value) ? value : fallback;
}

function boolField(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function required(value: string, message: string) {
  if (!value) throw new Error(message);
  return value;
}

function ensurePassword(password: string, confirmation?: string) {
  if (password.length < 8) throw new Error("Şifre en az 8 karakter olmalı.");
  if (confirmation !== undefined && password !== confirmation) {
    throw new Error("Şifre ve tekrar alanı aynı olmalı.");
  }
}

function dueDateFrom(value: string) {
  if (!value) {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 7);
    return fallback;
  }
  return new Date(`${value}T23:59:00`);
}

type LoginActionState = {
  error: string;
};

function enrollmentStatusFrom(value: string): EnrollmentStatus {
  const statuses: EnrollmentStatus[] = ["active", "completed", "cancelled", "waitlist"];
  return statuses.includes(value as EnrollmentStatus) ? (value as EnrollmentStatus) : "active";
}

function announcementTargetFrom(value: string): AnnouncementTargetType {
  const targetTypes: AnnouncementTargetType[] = ["all", "students", "parents", "teachers", "workshop"];
  return targetTypes.includes(value as AnnouncementTargetType) ? (value as AnnouncementTargetType) : "all";
}

async function createAuditLog(
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  description: string
) {
  await prisma.auditLog.create({
    data: { userId, action, entityType, entityId, description }
  });
}

async function uniqueParentCode() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateParentCode();
    const exists = await prisma.parentAccessCode.findUnique({ where: { code } });
    if (!exists) return code;
  }
  throw new Error("Veli kodu üretilemedi, tekrar deneyin.");
}

async function createPendingSubmissions(studentId: string, workshopId: string) {
  const assignments = await prisma.assignment.findMany({
    where: { workshopId, isActive: true },
    select: { id: true }
  });

  for (const assignment of assignments) {
    await prisma.assignmentSubmission.upsert({
      where: { assignmentId_studentId: { assignmentId: assignment.id, studentId } },
      update: {},
      create: {
        assignmentId: assignment.id,
        studentId,
        status: "pending"
      }
    });
  }
}

async function deleteStudentWorkshopSubmissions(studentId: string, workshopId: string) {
  await prisma.assignmentSubmission.deleteMany({
    where: {
      studentId,
      assignment: { is: { workshopId } }
    }
  });
}

async function createStudentAccount({
  firstName,
  lastName,
  schoolNumber,
  gradeLevel,
  branch,
  email,
  password,
  createdByUserId
}: {
  firstName: string;
  lastName: string;
  schoolNumber: string;
  gradeLevel: string;
  branch: string;
  email: string;
  password: string;
  createdByUserId?: string | null;
}) {
  const parentCode = await uniqueParentCode();
  const passwordHash = await hashPassword(password);

  const student = await prisma.user.create({
    data: {
      role: "student",
      firstName,
      lastName,
      schoolNumber,
      gradeLevel,
      branch,
      email: email.toLocaleLowerCase("tr-TR"),
      passwordHash,
      isApproved: true,
      parentAccessCodes: { create: { code: parentCode } }
    }
  });

  await createAuditLog(
    createdByUserId ?? student.id,
    "student.created",
    "User",
    student.id,
    `${student.firstName} ${student.lastName} öğrenci hesabı oluşturuldu.`
  );

  return student;
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

export async function registerStudentAction(formData: FormData) {
  const password = required(text(formData, "password"), "Şifre gerekli.");
  ensurePassword(password, text(formData, "passwordConfirm"));

  const student = await createStudentAccount({
    firstName: required(text(formData, "firstName"), "Ad gerekli."),
    lastName: required(text(formData, "lastName"), "Soyad gerekli."),
    schoolNumber: required(text(formData, "schoolNumber"), "Okul numarası gerekli."),
    gradeLevel: required(text(formData, "gradeLevel"), "Sınıf gerekli."),
    branch: required(text(formData, "branch"), "Şube gerekli.").toLocaleUpperCase("tr-TR"),
    email: required(text(formData, "email"), "E-posta gerekli."),
    password
  });

  await createUserSession(student.id, student.role);
  redirect("/student/dashboard");
}

export async function loginStudentAction(_state: LoginActionState, formData: FormData): Promise<LoginActionState> {
  const schoolNumber = text(formData, "schoolNumber");
  const password = text(formData, "password");
  if (!schoolNumber || !password) {
    return { error: "Okul numarası ve şifre gerekli." };
  }

  const user = await prisma.user.findFirst({
    where: { schoolNumber, role: "student", isActive: true, isApproved: true }
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Okul numarası veya şifre hatalı." };
  }

  await createUserSession(user.id, user.role);
  redirect("/student/dashboard");
}

export async function forgotPasswordAction(formData: FormData) {
  const email = required(text(formData, "email"), "E-posta gerekli.").toLocaleLowerCase("tr-TR");
  const user = await prisma.user.findFirst({ where: { email, role: "student", isActive: true } });

  if (user) {
    const token = generateResetToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt
      }
    });
    redirect(`/student/reset-password?token=${token}`);
  }

  redirect("/student/login");
}

export async function resetPasswordAction(formData: FormData) {
  const token = required(text(formData, "token"), "Token gerekli.");
  const password = required(text(formData, "password"), "Yeni şifre gerekli.");
  ensurePassword(password, text(formData, "passwordConfirm"));

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true }
  });

  if (!record || record.usedAt || record.expiresAt < new Date() || record.user.role !== "student") {
    throw new Error("Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(password) }
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() }
    })
  ]);

  redirect("/student/login");
}

export async function registerTeacherAction(formData: FormData) {
  const password = required(text(formData, "password"), "Şifre gerekli.");
  ensurePassword(password, text(formData, "passwordConfirm"));

  const teacher = await prisma.user.create({
    data: {
      role: "teacher",
      firstName: required(text(formData, "firstName"), "Ad gerekli."),
      lastName: required(text(formData, "lastName"), "Soyad gerekli."),
      email: required(text(formData, "email"), "E-posta gerekli.").toLocaleLowerCase("tr-TR"),
      passwordHash: await hashPassword(password),
      isApproved: false
    }
  });

  await createAuditLog(teacher.id, "teacher.registered", "User", teacher.id, "Öğretmen onay bekliyor.");
  redirect("/teacher/login?pending=1");
}

export async function loginTeacherAction(_state: LoginActionState, formData: FormData): Promise<LoginActionState> {
  const email = text(formData, "email").toLocaleLowerCase("tr-TR");
  const password = text(formData, "password");
  if (!email || !password) {
    return { error: "E-posta ve şifre gerekli." };
  }

  const user = await prisma.user.findFirst({ where: { email, role: "teacher", isActive: true } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "E-posta veya şifre hatalı." };
  }
  if (!user.isApproved) {
    return { error: "Öğretmen hesabınız admin onayı bekliyor." };
  }

  await createUserSession(user.id, user.role);
  redirect("/teacher/dashboard");
}

export async function loginAdminAction(_state: LoginActionState, formData: FormData): Promise<LoginActionState> {
  const email = text(formData, "email").toLocaleLowerCase("tr-TR");
  const password = text(formData, "password");
  if (!email || !password) {
    return { error: "E-posta ve şifre gerekli." };
  }

  const user = await prisma.user.findFirst({
    where: { email, role: "admin", isActive: true, isApproved: true }
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "E-posta veya şifre hatalı." };
  }

  await createUserSession(user.id, user.role);
  redirect("/admin/dashboard");
}

export async function loginParentAction(_state: LoginActionState, formData: FormData): Promise<LoginActionState> {
  const schoolNumber = text(formData, "schoolNumber");
  const code = text(formData, "parentCode").toUpperCase();
  if (!schoolNumber || !code) {
    return { error: "Okul numarası ve veli kodu gerekli." };
  }

  const student = await prisma.user.findFirst({
    where: {
      role: "student",
      schoolNumber,
      isActive: true,
      parentAccessCodes: { some: { code, isActive: true } }
    }
  });

  if (!student) return { error: "Okul numarası veya veli kodu hatalı." };

  await prisma.parentAccessCode.update({
    where: { studentId: student.id },
    data: { lastUsedAt: new Date() }
  });

  await createParentSession(student.id);
  redirect("/parent/dashboard");
}

export async function submitAssignmentAction(formData: FormData) {
  const student = await requireStudent();
  const assignmentId = required(text(formData, "assignmentId"), "Ödev bulunamadı.");
  const answerText = required(text(formData, "answerText"), "Cevap metni gerekli.");

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { workshop: true }
  });
  if (!assignment || !assignment.isActive) throw new Error("Ödev aktif değil.");

  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: student.id, workshopId: assignment.workshopId, status: "active" }
  });
  if (!enrollment) throw new Error("Bu ödeve erişim yetkiniz yok.");

  await prisma.assignmentSubmission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId: student.id } },
    update: {
      answerText,
      status: assignment.dueDate < new Date() ? "late" : "submitted",
      submittedAt: new Date()
    },
    create: {
      assignmentId,
      studentId: student.id,
      answerText,
      status: assignment.dueDate < new Date() ? "late" : "submitted",
      submittedAt: new Date()
    }
  });

  await createAuditLog(student.id, "assignment.submitted", "Assignment", assignmentId, "Öğrenci ödev teslim etti.");
  revalidatePath("/student/assignments");
  redirect("/student/assignments");
}

export async function purchaseRewardAction(formData: FormData) {
  const student = await requireStudent();
  const rewardId = required(text(formData, "rewardId"), "Ödül bulunamadı.");

  const reward = await prisma.reward.findUnique({ where: { id: rewardId } });
  if (!reward || !reward.isActive) throw new Error("Ödül aktif değil.");
  if (student.diamondBalance < reward.cost) throw new Error("Bu ödül için yeterli elmas yok.");

  const expiresAt = reward.durationDays
    ? new Date(Date.now() + reward.durationDays * 24 * 60 * 60 * 1000)
    : null;

  await prisma.$transaction(async (tx) => {
    const studentReward = await tx.studentReward.create({
      data: {
        studentId: student.id,
        rewardId: reward.id,
        status: reward.requiresAdminApproval ? "pending" : "active",
        approvedAt: reward.requiresAdminApproval ? null : new Date(),
        expiresAt: reward.requiresAdminApproval ? null : expiresAt
      }
    });

    await tx.user.update({
      where: { id: student.id },
      data: { diamondBalance: { decrement: reward.cost } }
    });

    await tx.diamondTransaction.create({
      data: {
        studentId: student.id,
        amount: -reward.cost,
        type: "spend",
        reason: `${reward.name} ödülü satın alındı.`,
        relatedRewardId: reward.id,
        createdByUserId: student.id
      }
    });

    await tx.auditLog.create({
      data: {
        userId: student.id,
        action: "reward.purchased",
        entityType: "StudentReward",
        entityId: studentReward.id,
        description: `${reward.name} ödülü satın alındı.`
      }
    });
  });

  revalidatePath("/student/rewards");
  redirect("/student/badges");
}

export async function enrollStudentAction(formData: FormData) {
  const teacher = await requireTeacher();
  const schoolNumber = required(text(formData, "schoolNumber"), "Okul numarası gerekli.");
  const workshopId = required(text(formData, "workshopId"), "Atölye gerekli.");
  await requireTeacherWorkshopPermission(teacher.id, workshopId, "canManageStudents");

  const student = await prisma.user.findFirst({ where: { role: "student", schoolNumber, isActive: true } });
  if (!student) throw new Error("Öğrenci bulunamadı.");

  const workshop = await prisma.workshop.findUnique({ where: { id: workshopId } });
  if (!workshop) throw new Error("Atölye bulunamadı.");

  const singleMode = await isSingleWorkshopMode();
  const activeEnrollment = await prisma.enrollment.findFirst({
    where: { studentId: student.id, status: "active" }
  });
  if (singleMode && activeEnrollment && activeEnrollment.workshopId !== workshopId) {
    throw new Error("Öğrenci zaten aktif bir atölyeye kayıtlı.");
  }

  const activeCount = await prisma.enrollment.count({ where: { workshopId, status: "active" } });
  const status: EnrollmentStatus =
    activeCount >= workshop.capacity ? (boolField(formData, "allowWaitlist") ? "waitlist" : (() => { throw new Error("Kontenjan dolu."); })()) : "active";

  await prisma.enrollment.upsert({
    where: { studentId_workshopId: { studentId: student.id, workshopId } },
    update: { status, enrolledByTeacherId: teacher.id },
    create: { studentId: student.id, workshopId, status, enrolledByTeacherId: teacher.id }
  });

  if (status === "active") await createPendingSubmissions(student.id, workshopId);

  await createAuditLog(teacher.id, "enrollment.created", "Enrollment", student.id, `${student.schoolNumber} numaralı öğrenci ${workshop.name} atölyesine kaydedildi.`);
  revalidatePath("/teacher/enrollments");
  redirect("/teacher/students");
}

export async function createAssignmentAction(formData: FormData) {
  const teacher = await requireTeacher();
  const workshopId = required(text(formData, "workshopId"), "Atölye gerekli.");
  await requireTeacherWorkshopPermission(teacher.id, workshopId, "canCreateAssignments");

  const assignment = await prisma.assignment.create({
    data: {
      workshopId,
      teacherId: teacher.id,
      title: required(text(formData, "title"), "Başlık gerekli."),
      description: required(text(formData, "description"), "Açıklama gerekli."),
      weekNumber: numberField(formData, "weekNumber", 1),
      dueDate: dueDateFrom(text(formData, "dueDate")),
      diamondReward: numberField(formData, "diamondReward", 20),
      maxScore: numberField(formData, "maxScore", 100),
      requiresFile: boolField(formData, "requiresFile"),
      isActive: true
    }
  });

  const enrollments = await prisma.enrollment.findMany({
    where: { workshopId, status: "active" },
    select: { studentId: true }
  });

  if (enrollments.length) {
    await prisma.assignmentSubmission.createMany({
      data: enrollments.map((enrollment) => ({
        assignmentId: assignment.id,
        studentId: enrollment.studentId,
        status: "pending" as SubmissionStatus
      }))
    });
  }

  await createAuditLog(teacher.id, "assignment.created", "Assignment", assignment.id, `${assignment.title} ödevi oluşturuldu.`);
  redirect("/teacher/assignments");
}

export async function gradeSubmissionAction(formData: FormData) {
  const teacher = await requireTeacher();
  const submissionId = required(text(formData, "submissionId"), "Teslim bulunamadı.");
  const submission = await prisma.assignmentSubmission.findUnique({
    where: { id: submissionId },
    include: { assignment: true, student: true }
  });
  if (!submission) throw new Error("Teslim bulunamadı.");

  await requireTeacherWorkshopPermission(teacher.id, submission.assignment.workshopId, "canGradeAssignments");

  const selectedStatus = text(formData, "status") as SubmissionStatus;
  const status: SubmissionStatus = ["graded", "needs_revision", "late"].includes(selectedStatus)
    ? selectedStatus
    : "graded";
  const score = Math.min(numberField(formData, "score", 0), submission.assignment.maxScore);
  const extraDiamonds = Math.max(0, numberField(formData, "extraDiamonds", 0));
  const earnedDiamonds = status === "graded" ? submission.assignment.diamondReward + extraDiamonds : extraDiamonds;
  const shouldAward = submission.status !== "graded" && earnedDiamonds > 0;

  await prisma.$transaction(async (tx) => {
    await tx.assignmentSubmission.update({
      where: { id: submission.id },
      data: {
        score,
        feedback: text(formData, "feedback"),
        status,
        gradedByTeacherId: teacher.id,
        gradedAt: new Date()
      }
    });

    if (shouldAward) {
      await tx.user.update({
        where: { id: submission.studentId },
        data: { diamondBalance: { increment: earnedDiamonds } }
      });
      await tx.diamondTransaction.create({
        data: {
          studentId: submission.studentId,
          amount: earnedDiamonds,
          type: "earn",
          reason: `${submission.assignment.title} ödevi değerlendirildi.`,
          relatedAssignmentId: submission.assignmentId,
          createdByUserId: teacher.id
        }
      });
    }

    await tx.auditLog.create({
      data: {
        userId: teacher.id,
        action: "assignment.graded",
        entityType: "AssignmentSubmission",
        entityId: submission.id,
        description: `${submission.student.firstName} ${submission.student.lastName} ödevi değerlendirildi.`
      }
    });
  });

  revalidatePath("/teacher/submissions");
  redirect("/teacher/submissions");
}

export async function takeAttendanceAction(formData: FormData) {
  const teacher = await requireTeacher();
  const workshopId = required(text(formData, "workshopId"), "Atölye gerekli.");
  const studentId = required(text(formData, "studentId"), "Öğrenci gerekli.");
  await requireTeacherWorkshopPermission(teacher.id, workshopId, "canTakeAttendance");

  const status = text(formData, "status") as AttendanceStatus;
  if (!["present", "absent", "late", "excused"].includes(status)) {
    throw new Error("Yoklama durumu geçersiz.");
  }

  await prisma.attendance.upsert({
    where: {
      workshopId_studentId_weekNumber: {
        workshopId,
        studentId,
        weekNumber: numberField(formData, "weekNumber", 1)
      }
    },
    update: {
      teacherId: teacher.id,
      date: new Date(text(formData, "date") || Date.now()),
      status,
      note: text(formData, "note")
    },
    create: {
      workshopId,
      studentId,
      teacherId: teacher.id,
      weekNumber: numberField(formData, "weekNumber", 1),
      date: new Date(text(formData, "date") || Date.now()),
      status,
      note: text(formData, "note")
    }
  });

  await createAuditLog(teacher.id, "attendance.recorded", "Attendance", studentId, "Yoklama kaydı girildi.");
  revalidatePath("/teacher/attendance");
  redirect("/teacher/attendance");
}

export async function createTeacherAnnouncementAction(formData: FormData) {
  const teacher = await requireTeacher();
  const workshopId = required(text(formData, "workshopId"), "Atölye gerekli.");
  await requireTeacherWorkshopPermission(teacher.id, workshopId, "canCreateAnnouncements");

  await prisma.announcement.create({
    data: {
      title: required(text(formData, "title"), "Başlık gerekli."),
      content: required(text(formData, "content"), "İçerik gerekli."),
      targetType: "workshop",
      workshopId,
      createdByUserId: teacher.id,
      isPublished: true,
      publishedAt: new Date()
    }
  });

  await createAuditLog(teacher.id, "announcement.created", "Announcement", workshopId, "Atölye duyurusu yayınlandı.");
  redirect("/teacher/announcements");
}

export async function giveDiamondsAction(formData: FormData) {
  const teacher = await requireTeacher();
  const studentId = required(text(formData, "studentId"), "Öğrenci gerekli.");
  const workshopId = required(text(formData, "workshopId"), "Atölye gerekli.");
  await requireTeacherWorkshopPermission(teacher.id, workshopId, "canManageStudents");

  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId, workshopId, status: "active" }
  });
  if (!enrollment) throw new Error("Öğrenci bu atölyede aktif değil.");

  const amount = numberField(formData, "amount", 0);
  if (amount <= 0) throw new Error("Elmas miktarı pozitif olmalı.");

  await prisma.$transaction([
    prisma.user.update({ where: { id: studentId }, data: { diamondBalance: { increment: amount } } }),
    prisma.diamondTransaction.create({
      data: {
        studentId,
        amount,
        type: "earn",
        reason: required(text(formData, "reason"), "Açıklama gerekli."),
        createdByUserId: teacher.id
      }
    }),
    prisma.auditLog.create({
      data: {
        userId: teacher.id,
        action: "diamonds.manual_award",
        entityType: "User",
        entityId: studentId,
        description: `${amount} elmas manuel verildi.`
      }
    })
  ]);

  redirect("/teacher/students");
}

export async function addTeacherNoteAction(formData: FormData) {
  const teacher = await requireTeacher();
  const studentId = required(text(formData, "studentId"), "Öğrenci gerekli.");
  const workshopId = text(formData, "workshopId") || null;
  if (workshopId) await requireTeacherWorkshopPermission(teacher.id, workshopId, "canManageStudents");

  await prisma.teacherNote.create({
    data: {
      studentId,
      teacherId: teacher.id,
      workshopId,
      note: required(text(formData, "note"), "Not gerekli.")
    }
  });

  redirect("/teacher/students");
}

export async function adminCreateStudentAction(formData: FormData) {
  const admin = await requireAdmin();
  await createStudentAccount({
    firstName: required(text(formData, "firstName"), "Ad gerekli."),
    lastName: required(text(formData, "lastName"), "Soyad gerekli."),
    schoolNumber: required(text(formData, "schoolNumber"), "Okul numarası gerekli."),
    gradeLevel: required(text(formData, "gradeLevel"), "Sınıf gerekli."),
    branch: required(text(formData, "branch"), "Şube gerekli.").toLocaleUpperCase("tr-TR"),
    email: required(text(formData, "email"), "E-posta gerekli."),
    password: text(formData, "password") || "Ogrenci123!",
    createdByUserId: admin.id
  });
  redirect("/admin/students");
}

export async function regenerateParentCodeAction(formData: FormData) {
  const admin = await requireAdmin();
  const studentId = required(text(formData, "studentId"), "Öğrenci gerekli.");
  const code = await uniqueParentCode();

  await prisma.parentAccessCode.upsert({
    where: { studentId },
    update: { code, isActive: true },
    create: { studentId, code, isActive: true }
  });

  await createAuditLog(admin.id, "parent_code.regenerated", "ParentAccessCode", studentId, "Veli kodu yenilendi.");
  redirect("/admin/students");
}

export async function adminAdjustDiamondsAction(formData: FormData) {
  const admin = await requireAdmin();
  const studentId = required(text(formData, "studentId"), "Öğrenci gerekli.");
  const amount = numberField(formData, "amount", 0);
  if (amount === 0) throw new Error("Elmas miktarı sıfır olamaz.");

  await prisma.$transaction([
    prisma.user.update({ where: { id: studentId }, data: { diamondBalance: { increment: amount } } }),
    prisma.diamondTransaction.create({
      data: {
        studentId,
        amount,
        type: "adjustment",
        reason: text(formData, "reason") || "Admin elmas düzeltmesi",
        createdByUserId: admin.id
      }
    }),
    prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "diamonds.adjusted",
        entityType: "User",
        entityId: studentId,
        description: `${amount} elmas düzeltmesi yapıldı.`
      }
    })
  ]);

  redirect("/admin/students");
}

export async function adminDeleteStudentAction(formData: FormData) {
  const admin = await requireAdmin();
  const studentId = required(text(formData, "studentId"), "Öğrenci gerekli.");
  const student = await prisma.user.findFirst({ where: { id: studentId, role: "student" } });
  if (!student) throw new Error("Öğrenci bulunamadı.");

  await prisma.user.delete({ where: { id: studentId } });
  await createAuditLog(admin.id, "student.deleted", "User", studentId, `${student.firstName} ${student.lastName} öğrencisi silindi.`);
  redirect("/admin/students");
}

export async function approveTeacherAction(formData: FormData) {
  const admin = await requireAdmin();
  const teacherId = required(text(formData, "teacherId"), "Öğretmen gerekli.");
  const isApproved = text(formData, "isApproved") !== "false";

  await prisma.user.update({
    where: { id: teacherId },
    data: { isApproved, isActive: true }
  });

  await createAuditLog(admin.id, "teacher.approved", "User", teacherId, isApproved ? "Öğretmen onaylandı." : "Öğretmen onayı kaldırıldı.");
  redirect("/admin/teachers");
}

export async function adminDeleteTeacherAction(formData: FormData) {
  const admin = await requireAdmin();
  const teacherId = required(text(formData, "teacherId"), "Öğretmen gerekli.");
  const teacher = await prisma.user.findFirst({ where: { id: teacherId, role: "teacher" } });
  if (!teacher) throw new Error("Öğretmen bulunamadı.");

  await prisma.user.delete({ where: { id: teacherId } });
  await createAuditLog(admin.id, "teacher.deleted", "User", teacherId, `${teacher.firstName} ${teacher.lastName} öğretmeni silindi.`);
  redirect("/admin/teachers");
}

export async function adminSetPermissionAction(formData: FormData) {
  const admin = await requireAdmin();
  const teacherId = required(text(formData, "teacherId"), "Öğretmen gerekli.");
  const workshopId = required(text(formData, "workshopId"), "Atölye gerekli.");
  const intent = text(formData, "intent");

  if (intent === "remove") {
    await prisma.teacherWorkshopPermission.deleteMany({ where: { teacherId, workshopId } });
    await createAuditLog(admin.id, "teacher_permission.removed", "TeacherWorkshopPermission", teacherId, "Öğretmen atölye yetkisi kaldırıldı.");
  } else {
    await prisma.teacherWorkshopPermission.upsert({
      where: { teacherId_workshopId: { teacherId, workshopId } },
      update: {
        canManageStudents: boolField(formData, "canManageStudents"),
        canCreateAssignments: boolField(formData, "canCreateAssignments"),
        canGradeAssignments: boolField(formData, "canGradeAssignments"),
        canTakeAttendance: boolField(formData, "canTakeAttendance"),
        canCreateAnnouncements: boolField(formData, "canCreateAnnouncements")
      },
      create: {
        teacherId,
        workshopId,
        canManageStudents: boolField(formData, "canManageStudents"),
        canCreateAssignments: boolField(formData, "canCreateAssignments"),
        canGradeAssignments: boolField(formData, "canGradeAssignments"),
        canTakeAttendance: boolField(formData, "canTakeAttendance"),
        canCreateAnnouncements: boolField(formData, "canCreateAnnouncements")
      }
    });
    await createAuditLog(admin.id, "teacher_permission.granted", "TeacherWorkshopPermission", teacherId, "Öğretmene atölye yetkisi verildi.");
  }

  redirect("/admin/teachers");
}

export async function adminCreateWorkshopAction(formData: FormData) {
  const admin = await requireAdmin();
  const name = required(text(formData, "name"), "Atölye adı gerekli.");
  const workshop = await prisma.workshop.create({
    data: {
      name,
      slug: slugify(name),
      shortDescription: required(text(formData, "shortDescription"), "Kısa açıklama gerekli."),
      description: text(formData, "description") || text(formData, "shortDescription"),
      suitableFor: text(formData, "suitableFor"),
      outcomes: text(formData, "outcomes"),
      capacity: numberField(formData, "capacity", 24),
      sortOrder: numberField(formData, "sortOrder", 99),
      isActive: true
    }
  });
  await createAuditLog(admin.id, "workshop.created", "Workshop", workshop.id, `${name} atölyesi oluşturuldu.`);
  redirect("/admin/workshops");
}

export async function adminUpdateWorkshopAction(formData: FormData) {
  const admin = await requireAdmin();
  const workshopId = required(text(formData, "workshopId"), "Atölye gerekli.");
  const name = required(text(formData, "name"), "Atölye adı gerekli.");
  await prisma.workshop.update({
    where: { id: workshopId },
    data: {
      name,
      slug: slugify(name),
      shortDescription: required(text(formData, "shortDescription"), "Kısa açıklama gerekli."),
      description: text(formData, "description") || text(formData, "shortDescription"),
      suitableFor: text(formData, "suitableFor"),
      outcomes: text(formData, "outcomes"),
      capacity: numberField(formData, "capacity", 24),
      sortOrder: numberField(formData, "sortOrder", 99),
      isActive: boolField(formData, "isActive")
    }
  });
  await createAuditLog(admin.id, "workshop.updated", "Workshop", workshopId, "Atölye bilgileri güncellendi.");
  redirect("/admin/workshops");
}

export async function adminDeleteWorkshopAction(formData: FormData) {
  const admin = await requireAdmin();
  const workshopId = required(text(formData, "workshopId"), "Atölye gerekli.");
  const workshop = await prisma.workshop.findUnique({ where: { id: workshopId } });
  if (!workshop) throw new Error("Atölye bulunamadı.");

  await prisma.workshop.delete({ where: { id: workshopId } });
  await createAuditLog(admin.id, "workshop.deleted", "Workshop", workshopId, `${workshop.name} atölyesi silindi.`);
  redirect("/admin/workshops");
}

export async function adminCreateCurriculumAction(formData: FormData) {
  const admin = await requireAdmin();
  const workshopId = required(text(formData, "workshopId"), "Atölye gerekli.");
  const weekNumber = numberField(formData, "weekNumber", 1);

  const curriculum = await prisma.workshopCurriculum.upsert({
    where: { workshopId_weekNumber: { workshopId, weekNumber } },
    update: {
      title: required(text(formData, "title"), "Başlık gerekli."),
      description: required(text(formData, "description"), "Açıklama gerekli."),
      outcomes: text(formData, "outcomes"),
      activity: text(formData, "activity"),
      homeworkSuggestion: text(formData, "homeworkSuggestion")
    },
    create: {
      workshopId,
      weekNumber,
      title: required(text(formData, "title"), "Başlık gerekli."),
      description: required(text(formData, "description"), "Açıklama gerekli."),
      outcomes: text(formData, "outcomes"),
      activity: text(formData, "activity"),
      homeworkSuggestion: text(formData, "homeworkSuggestion")
    }
  });

  await createAuditLog(admin.id, "curriculum.upserted", "WorkshopCurriculum", curriculum.id, "Müfredat haftası eklendi veya güncellendi.");
  redirect("/admin/curriculum");
}

export async function adminUpdateCurriculumAction(formData: FormData) {
  const admin = await requireAdmin();
  const curriculumId = required(text(formData, "curriculumId"), "Müfredat gerekli.");
  const curriculum = await prisma.workshopCurriculum.update({
    where: { id: curriculumId },
    data: {
      weekNumber: numberField(formData, "weekNumber", 1),
      title: required(text(formData, "title"), "Başlık gerekli."),
      description: required(text(formData, "description"), "Açıklama gerekli."),
      outcomes: text(formData, "outcomes"),
      activity: text(formData, "activity"),
      homeworkSuggestion: text(formData, "homeworkSuggestion")
    }
  });

  await createAuditLog(admin.id, "curriculum.updated", "WorkshopCurriculum", curriculum.id, "Müfredat haftası güncellendi.");
  redirect("/admin/curriculum");
}

export async function adminDeleteCurriculumAction(formData: FormData) {
  const admin = await requireAdmin();
  const curriculumId = required(text(formData, "curriculumId"), "Müfredat gerekli.");
  const curriculum = await prisma.workshopCurriculum.findUnique({ where: { id: curriculumId } });
  if (!curriculum) throw new Error("Müfredat bulunamadı.");

  await prisma.workshopCurriculum.delete({ where: { id: curriculumId } });
  await createAuditLog(admin.id, "curriculum.deleted", "WorkshopCurriculum", curriculumId, "Müfredat haftası silindi.");
  redirect("/admin/curriculum");
}

export async function adminCreateEnrollmentAction(formData: FormData) {
  const admin = await requireAdmin();
  const studentId = required(text(formData, "studentId"), "Öğrenci gerekli.");
  const workshopId = required(text(formData, "workshopId"), "Atölye gerekli.");
  const workshop = await prisma.workshop.findUnique({ where: { id: workshopId } });
  if (!workshop) throw new Error("Atölye bulunamadı.");

  const singleMode = await isSingleWorkshopMode();
  const activeEnrollment = await prisma.enrollment.findFirst({ where: { studentId, status: "active" } });
  if (singleMode && activeEnrollment && activeEnrollment.workshopId !== workshopId) {
    throw new Error("Öğrenci zaten aktif bir atölyeye kayıtlı.");
  }

  const activeCount = await prisma.enrollment.count({ where: { workshopId, status: "active" } });
  const status: EnrollmentStatus = activeCount >= workshop.capacity ? "waitlist" : "active";

  await prisma.enrollment.upsert({
    where: { studentId_workshopId: { studentId, workshopId } },
    update: { status },
    create: { studentId, workshopId, status }
  });
  if (status === "active") await createPendingSubmissions(studentId, workshopId);
  await createAuditLog(admin.id, "enrollment.admin_created", "Enrollment", studentId, "Admin atölye kaydı yaptı.");
  redirect("/admin/enrollments");
}

export async function adminUpdateEnrollmentAction(formData: FormData) {
  const admin = await requireAdmin();
  const enrollmentId = required(text(formData, "enrollmentId"), "Kayıt gerekli.");
  const workshopId = required(text(formData, "workshopId"), "Atölye gerekli.");
  const status = enrollmentStatusFrom(text(formData, "status"));

  const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
  if (!enrollment) throw new Error("Kayıt bulunamadı.");

  const duplicate = await prisma.enrollment.findFirst({
    where: {
      id: { not: enrollmentId },
      studentId: enrollment.studentId,
      workshopId
    }
  });
  if (duplicate) throw new Error("Bu öğrencinin seçilen atölyede zaten kaydı var.");

  const singleMode = await isSingleWorkshopMode();
  if (singleMode && status === "active") {
    const otherActive = await prisma.enrollment.findFirst({
      where: {
        id: { not: enrollmentId },
        studentId: enrollment.studentId,
        status: "active"
      }
    });
    if (otherActive) throw new Error("Öğrenci zaten aktif bir atölyeye kayıtlı.");
  }

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { workshopId, status }
  });

  if (enrollment.workshopId !== workshopId || status !== "active") {
    await deleteStudentWorkshopSubmissions(enrollment.studentId, enrollment.workshopId);
  }
  if (status === "active") await createPendingSubmissions(enrollment.studentId, workshopId);

  await createAuditLog(admin.id, "enrollment.updated", "Enrollment", enrollmentId, "Admin atölye kaydını güncelledi.");
  redirect("/admin/enrollments");
}

export async function adminDeleteEnrollmentAction(formData: FormData) {
  const admin = await requireAdmin();
  const enrollmentId = required(text(formData, "enrollmentId"), "Kayıt gerekli.");
  const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
  if (!enrollment) throw new Error("Kayıt bulunamadı.");

  await prisma.enrollment.delete({ where: { id: enrollmentId } });
  await deleteStudentWorkshopSubmissions(enrollment.studentId, enrollment.workshopId);
  await createAuditLog(admin.id, "enrollment.deleted", "Enrollment", enrollmentId, "Admin atölye kaydını sildi.");
  redirect("/admin/enrollments");
}

export async function adminCreateAssignmentAction(formData: FormData) {
  const admin = await requireAdmin();
  const workshopId = required(text(formData, "workshopId"), "Atölye gerekli.");

  const assignment = await prisma.assignment.create({
    data: {
      workshopId,
      teacherId: admin.id,
      title: required(text(formData, "title"), "Başlık gerekli."),
      description: required(text(formData, "description"), "Açıklama gerekli."),
      weekNumber: numberField(formData, "weekNumber", 1),
      dueDate: dueDateFrom(text(formData, "dueDate")),
      diamondReward: numberField(formData, "diamondReward", 20),
      maxScore: numberField(formData, "maxScore", 100),
      requiresFile: boolField(formData, "requiresFile"),
      isActive: true
    }
  });

  const enrollments = await prisma.enrollment.findMany({
    where: { workshopId, status: "active" },
    select: { studentId: true }
  });
  if (enrollments.length) {
    await prisma.assignmentSubmission.createMany({
      data: enrollments.map((enrollment) => ({
        assignmentId: assignment.id,
        studentId: enrollment.studentId,
        status: "pending" as SubmissionStatus
      }))
    });
  }

  await createAuditLog(admin.id, "assignment.admin_created", "Assignment", assignment.id, "Admin ödev oluşturdu.");
  redirect("/admin/assignments");
}

export async function adminUpdateAssignmentAction(formData: FormData) {
  const admin = await requireAdmin();
  const assignmentId = required(text(formData, "assignmentId"), "Ödev gerekli.");
  const workshopId = required(text(formData, "workshopId"), "Atölye gerekli.");

  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) throw new Error("Ödev bulunamadı.");

  await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      workshopId,
      title: required(text(formData, "title"), "Başlık gerekli."),
      description: required(text(formData, "description"), "Açıklama gerekli."),
      weekNumber: numberField(formData, "weekNumber", 1),
      dueDate: dueDateFrom(text(formData, "dueDate")),
      diamondReward: numberField(formData, "diamondReward", 20),
      maxScore: numberField(formData, "maxScore", 100),
      requiresFile: boolField(formData, "requiresFile"),
      isActive: boolField(formData, "isActive")
    }
  });

  if (boolField(formData, "isActive")) {
    const enrollments = await prisma.enrollment.findMany({
      where: { workshopId, status: "active" },
      select: { studentId: true }
    });
    for (const enrollment of enrollments) {
      await prisma.assignmentSubmission.upsert({
        where: { assignmentId_studentId: { assignmentId, studentId: enrollment.studentId } },
        update: {},
        create: {
          assignmentId,
          studentId: enrollment.studentId,
          status: "pending"
        }
      });
    }
  }

  await createAuditLog(admin.id, "assignment.updated", "Assignment", assignmentId, "Admin ödevi güncelledi.");
  redirect("/admin/assignments");
}

export async function adminDeleteAssignmentAction(formData: FormData) {
  const admin = await requireAdmin();
  const assignmentId = required(text(formData, "assignmentId"), "Ödev gerekli.");
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) throw new Error("Ödev bulunamadı.");

  await prisma.assignment.delete({ where: { id: assignmentId } });
  await createAuditLog(admin.id, "assignment.deleted", "Assignment", assignmentId, `${assignment.title} ödevi silindi.`);
  redirect("/admin/assignments");
}

export async function adminTakeAttendanceAction(formData: FormData) {
  const admin = await requireAdmin();
  const workshopId = required(text(formData, "workshopId"), "Atölye gerekli.");
  const studentId = required(text(formData, "studentId"), "Öğrenci gerekli.");
  const status = text(formData, "status") as AttendanceStatus;

  await prisma.attendance.upsert({
    where: {
      workshopId_studentId_weekNumber: {
        workshopId,
        studentId,
        weekNumber: numberField(formData, "weekNumber", 1)
      }
    },
    update: {
      teacherId: admin.id,
      date: new Date(text(formData, "date") || Date.now()),
      status,
      note: text(formData, "note")
    },
    create: {
      workshopId,
      studentId,
      teacherId: admin.id,
      weekNumber: numberField(formData, "weekNumber", 1),
      date: new Date(text(formData, "date") || Date.now()),
      status,
      note: text(formData, "note")
    }
  });
  await createAuditLog(admin.id, "attendance.admin_recorded", "Attendance", studentId, "Admin yoklama kaydı girdi.");
  redirect("/admin/attendance");
}

export async function adminCreateRewardAction(formData: FormData) {
  const admin = await requireAdmin();
  const type = text(formData, "type") as RewardType;
  await prisma.reward.create({
    data: {
      name: required(text(formData, "name"), "Ödül adı gerekli."),
      description: required(text(formData, "description"), "Açıklama gerekli."),
      cost: numberField(formData, "cost", 100),
      type: ["badge", "medal", "frame", "social_good"].includes(type) ? type : "badge",
      durationDays: text(formData, "durationDays") ? numberField(formData, "durationDays", 0) : null,
      requiresAdminApproval: boolField(formData, "requiresAdminApproval"),
      isActive: true
    }
  });
  await createAuditLog(admin.id, "reward.created", "Reward", null, "Ödül oluşturuldu.");
  redirect("/admin/rewards");
}

export async function adminModerateRewardAction(formData: FormData) {
  const admin = await requireAdmin();
  const studentRewardId = required(text(formData, "studentRewardId"), "Öğrenci ödülü gerekli.");
  const intent = text(formData, "intent");
  const studentReward = await prisma.studentReward.findUnique({
    where: { id: studentRewardId },
    include: { reward: true }
  });
  if (!studentReward || studentReward.status !== "pending") throw new Error("Onay bekleyen ödül bulunamadı.");

  if (intent === "reject") {
    await prisma.$transaction([
      prisma.studentReward.update({ where: { id: studentRewardId }, data: { status: "rejected" } }),
      prisma.user.update({ where: { id: studentReward.studentId }, data: { diamondBalance: { increment: studentReward.reward.cost } } }),
      prisma.diamondTransaction.create({
        data: {
          studentId: studentReward.studentId,
          amount: studentReward.reward.cost,
          type: "adjustment",
          reason: `${studentReward.reward.name} reddedildi, elmas iade edildi.`,
          relatedRewardId: studentReward.rewardId,
          createdByUserId: admin.id
        }
      })
    ]);
  } else {
    const expiresAt = studentReward.reward.durationDays
      ? new Date(Date.now() + studentReward.reward.durationDays * 24 * 60 * 60 * 1000)
      : null;
    await prisma.studentReward.update({
      where: { id: studentRewardId },
      data: { status: "active", approvedAt: new Date(), expiresAt }
    });
  }

  await createAuditLog(admin.id, "reward.moderated", "StudentReward", studentRewardId, "Öğrenci ödülü moderasyonu yapıldı.");
  redirect("/admin/rewards");
}

export async function adminCreateAnnouncementAction(formData: FormData) {
  const admin = await requireAdmin();
  const targetType = announcementTargetFrom(text(formData, "targetType"));
  await prisma.announcement.create({
    data: {
      title: required(text(formData, "title"), "Başlık gerekli."),
      content: required(text(formData, "content"), "İçerik gerekli."),
      targetType,
      workshopId: targetType === "workshop" ? required(text(formData, "workshopId"), "Atölye gerekli.") : null,
      createdByUserId: admin.id,
      isPublished: boolField(formData, "isPublished"),
      publishedAt: boolField(formData, "isPublished") ? new Date() : null
    }
  });

  await createAuditLog(admin.id, "announcement.admin_created", "Announcement", null, "Admin duyuru oluşturdu.");
  redirect("/admin/announcements");
}

export async function adminUpdateAnnouncementAction(formData: FormData) {
  const admin = await requireAdmin();
  const announcementId = required(text(formData, "announcementId"), "Duyuru gerekli.");
  const announcement = await prisma.announcement.findUnique({ where: { id: announcementId } });
  if (!announcement) throw new Error("Duyuru bulunamadı.");

  const targetType = announcementTargetFrom(text(formData, "targetType"));
  const isPublished = boolField(formData, "isPublished");
  await prisma.announcement.update({
    where: { id: announcementId },
    data: {
      title: required(text(formData, "title"), "Başlık gerekli."),
      content: required(text(formData, "content"), "İçerik gerekli."),
      targetType,
      workshopId: targetType === "workshop" ? required(text(formData, "workshopId"), "Atölye gerekli.") : null,
      isPublished,
      publishedAt: isPublished ? announcement.publishedAt ?? new Date() : null
    }
  });

  await createAuditLog(admin.id, "announcement.updated", "Announcement", announcementId, "Admin duyuruyu güncelledi.");
  redirect("/admin/announcements");
}

export async function adminDeleteAnnouncementAction(formData: FormData) {
  const admin = await requireAdmin();
  const announcementId = required(text(formData, "announcementId"), "Duyuru gerekli.");
  const announcement = await prisma.announcement.findUnique({ where: { id: announcementId } });
  if (!announcement) throw new Error("Duyuru bulunamadı.");

  await prisma.announcement.delete({ where: { id: announcementId } });
  await createAuditLog(admin.id, "announcement.deleted", "Announcement", announcementId, `${announcement.title} duyurusu silindi.`);
  redirect("/admin/announcements");
}

export async function adminCreateTeacherAction(formData: FormData) {
  const admin = await requireAdmin();
  const password = text(formData, "password") || "Ogretmen123!";
  ensurePassword(password);

  const teacher = await prisma.user.create({
    data: {
      role: "teacher" as Role,
      firstName: required(text(formData, "firstName"), "Ad gerekli."),
      lastName: required(text(formData, "lastName"), "Soyad gerekli."),
      email: required(text(formData, "email"), "E-posta gerekli.").toLocaleLowerCase("tr-TR"),
      passwordHash: await hashPassword(password),
      isApproved: true,
      isActive: true
    }
  });

  await createAuditLog(admin.id, "teacher.created", "User", teacher.id, "Admin öğretmen oluşturdu.");
  redirect("/admin/teachers");
}
