"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  FileQuestion,
  FileText,
  LayoutDashboard,
  ListChecks,
  RotateCcw,
  LogIn,
  UserCheck,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/use-language";
import type { NavIconName, NavItem } from "@/components/layout/nav-items";

/** Icon names are resolved here, on the client, so no component crosses the RSC boundary. */
const ICONS: Record<NavIconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  learn: BookOpen,
  tests: ListChecks,
  progress: BarChart3,
  profile: UserRound,
  users: Users,
  pdfs: FileText,
  questions: FileQuestion,
  analytics: BarChart3,
  retests: RotateCcw,
  loginRequests: LogIn,
  registrations: UserCheck,
};

const LABELS_HI: Record<string, string> = {
  "/dashboard": "डैशबोर्ड",
  "/learn": "अध्ययन सामग्री",
  "/tests": "ऑनलाइन परीक्षा",
  "/progress": "प्रगति एवं परिणाम",
  "/profile": "मेरी प्रोफ़ाइल",
  "/admin": "अवलोकन",
  "/admin/registrations": "पंजीकरण",
  "/admin/users": "यूज़र प्रबंधन",
  "/admin/pdfs": "पीडीएफ सामग्री",
  "/admin/questions": "प्रश्न बैंक",
  "/admin/analytics": "परीक्षा रिपोर्ट",
  "/admin/retests": "पुनः परीक्षा",
  "/admin/login-requests": "लॉगिन अनुरोध",
};

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { language } = useLanguage();

  return (
    <nav aria-label="Main" className="space-y-1">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = ICONS[item.icon];
        const displayLabel = language === "hi" && LABELS_HI[item.href] ? LABELS_HI[item.href] : item.label;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              language === "hi" && "font-devanagari",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="flex-1 truncate">{displayLabel}</span>
            {active ? <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
