import Link from "next/link";
import { InstituteLogo } from "@/components/brand/institute-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { INSTITUTE } from "@/lib/constants";
import { AuthSidebar } from "@/components/auth/auth-sidebar";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell-bg grid min-h-dvh lg:grid-cols-2">
      <AuthSidebar />

      <main id="main" className="flex flex-col">
        <div className="flex items-center justify-between p-4 lg:justify-end">
          <Link href="/" className="flex items-center gap-2 font-semibold lg:hidden">
            <InstituteLogo size={36} className="h-9 w-9 shrink-0" title={null} />
            {INSTITUTE.shortName}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center p-4 pb-16">
          <div className="w-full max-w-md animate-fade-in">{children}</div>
        </div>
      </main>
    </div>
  );
}
