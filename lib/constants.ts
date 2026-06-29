import {
  BookOpen,
  ClipboardCheck,
  Gem,
  GraduationCap,
  Home,
  Megaphone,
  Medal,
  Rocket,
  Settings,
  Shield,
  Store,
  Users
} from "lucide-react";

export const SCHOOL_NAME = "Yücel Çelikbilek İmam Hatip Ortaokulu";
export const PORTAL_NAME = "Atölye Portalı";
export const SCHOOL_LOGO_PATH = "/logo_yucel_mark.png";

export const publicNav = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/workshops", label: "Atölyeler" },
  { href: "/student/login", label: "Öğrenci" },
  { href: "/teacher/login", label: "Öğretmen" },
  { href: "/parent/login", label: "Veli" }
];

export const studentNav = [
  { href: "/student/dashboard", label: "Panel", icon: Home },
  { href: "/student/workshop", label: "Atölyem", icon: Rocket },
  { href: "/student/assignments", label: "Ödevlerim", icon: ClipboardCheck },
  { href: "/student/rewards", label: "Ödül Mağazası", icon: Store },
  { href: "/student/badges", label: "Rozetlerim", icon: Medal },
  { href: "/student/announcements", label: "Duyurular", icon: Megaphone }
];

export const parentNav = [
  { href: "/parent/dashboard", label: "Genel Durum", icon: Home },
  { href: "/parent/workshop", label: "Atölye", icon: Rocket },
  { href: "/parent/assignments", label: "Ödevler", icon: ClipboardCheck },
  { href: "/parent/attendance", label: "Yoklama", icon: BookOpen },
  { href: "/parent/rewards", label: "Rozetler", icon: Medal }
];

export const teacherNav = [
  { href: "/teacher/dashboard", label: "Panel", icon: Home },
  { href: "/teacher/students", label: "Öğrenciler", icon: Users },
  { href: "/teacher/enrollments", label: "Kayıt", icon: GraduationCap },
  { href: "/teacher/assignments", label: "Ödevler", icon: ClipboardCheck },
  { href: "/teacher/submissions", label: "Değerlendirme", icon: Shield },
  { href: "/teacher/attendance", label: "Yoklama", icon: BookOpen },
  { href: "/teacher/announcements", label: "Duyurular", icon: Megaphone }
];

export const adminNav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: Home },
  { href: "/admin/students", label: "Öğrenciler", icon: Users },
  { href: "/admin/teachers", label: "Öğretmenler", icon: GraduationCap },
  { href: "/admin/workshops", label: "Atölyeler", icon: Rocket },
  { href: "/admin/curriculum", label: "Müfredat", icon: BookOpen },
  { href: "/admin/enrollments", label: "Kayıtlar", icon: ClipboardCheck },
  { href: "/admin/assignments", label: "Ödevler", icon: Shield },
  { href: "/admin/attendance", label: "Yoklama", icon: BookOpen },
  { href: "/admin/rewards", label: "Ödüller", icon: Gem },
  { href: "/admin/announcements", label: "Duyurular", icon: Megaphone },
  { href: "/admin/reports", label: "Raporlar", icon: Settings },
  { href: "/admin/audit-logs", label: "Audit", icon: Shield }
];

export const submissionLabels = {
  pending: "Bekliyor",
  submitted: "Gönderildi",
  graded: "Değerlendirildi",
  needs_revision: "Tekrar Yapmalı",
  late: "Geç Teslim"
};

export const attendanceLabels = {
  present: "Geldi",
  absent: "Gelmedi",
  late: "Geç Geldi",
  excused: "Mazeretli"
};

export const rewardStatusLabels = {
  active: "Aktif",
  pending: "Onay Bekliyor",
  rejected: "Reddedildi",
  expired: "Süresi Doldu"
};
