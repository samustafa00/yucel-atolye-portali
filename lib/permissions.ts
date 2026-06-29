import { prisma } from "@/lib/db";

export type TeacherCapability =
  | "canManageStudents"
  | "canCreateAssignments"
  | "canGradeAssignments"
  | "canTakeAttendance"
  | "canCreateAnnouncements";

export async function requireTeacherWorkshopPermission(
  teacherId: string,
  workshopId: string,
  capability: TeacherCapability
 ) {
  const permission = await prisma.teacherWorkshopPermission.findUnique({
    where: { teacherId_workshopId: { teacherId, workshopId } }
  });

  if (!permission || !permission[capability]) {
    throw new Error("Bu atölye için yetkiniz yok.");
  }

  return permission;
}

export async function teacherWorkshopIds(teacherId: string) {
  const permissions = await prisma.teacherWorkshopPermission.findMany({
    where: { teacherId },
    select: { workshopId: true }
  });
  return permissions.map((permission) => permission.workshopId);
}

export async function isSingleWorkshopMode() {
  const setting = await prisma.appSetting.findUnique({
    where: { key: "allowMultipleEnrollments" }
  });
  return setting?.value !== "true";
}
