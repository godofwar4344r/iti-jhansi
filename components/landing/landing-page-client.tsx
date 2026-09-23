"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  Languages,
  Lightbulb,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { InstituteLogo } from "@/components/brand/institute-logo";
import { useLanguage } from "@/hooks/use-language";
import {
  INSTITUTE,
  INSTITUTE_PILLARS,
  OCCUPATIONS,
  OCCUPATION_DESCRIPTIONS,
  OCCUPATION_LABELS,
  PASS_PERCENTAGE,
  SUBJECT_LABELS,
  SUBJECTS,
  TEST_BLUEPRINT,
  TEST_QUESTION_COUNT,
} from "@/lib/constants";

const PILLAR_ICONS = [Sparkles, Lightbulb, Briefcase, TrendingUp];

export function LandingPageClient({ user }: { user: any }) {
  const { language } = useLanguage();
  const hindi = language === "hi";

  const features = [
    {
      icon: BookOpen,
      title: hindi ? "आधिकारिक NIMI प्रश्न बैंक" : "The official NIMI question banks",
      body: hindi
        ? "सभी AITT मॉडल पेपर्स और DGT प्रश्न बैंक ऑनलाइन पढ़ें, बुकमार्क करें और ऑफ़लाइन अध्ययन हेतु डाउनलोड करें।"
        : "Every AITT sample paper and DGT question bank for your trade is published here. Read it in the browser, bookmark it, and download it for later.",
    },
    {
      icon: Languages,
      title: hindi ? "हिन्दी एवं English में प्रश्न" : "English and हिन्दी, side by side",
      body: hindi
        ? "द्विभाषी प्रश्न पत्र जिसमें आप टेस्ट के दौरान किसी भी समय एक क्लिक में हिन्दी और अंग्रेज़ी बदल सकते हैं।"
        : "Questions taken from the bilingual AITT papers carry their Hindi text. Switch language mid-test without losing a single answer.",
    },
    {
      icon: Timer,
      title: hindi ? "वास्तविक AITT परीक्षा पैटर्न" : "Built to the real paper",
      body: hindi
        ? `${TEST_QUESTION_COUNT} प्रश्न, 30 मिनट का सर्वर टाइमर, ट्रेड थ्योरी, कार्यशाला गणना, ड्रॉइंग एवं एम्प्लॉयबिलिटी स्किल्स। ${PASS_PERCENTAGE}% उत्तीर्णांक, कोई नेगेटिव मार्किंग नहीं।`
        : `${TEST_QUESTION_COUNT} questions in the same subject mix as the trade test: theory, workshop calculation, drawing and employability skills. ${PASS_PERCENTAGE}% to pass, no negative marking.`,
    },
    {
      icon: Target,
      title: hindi ? "गलत उत्तर का तुरंत समाधान" : "Every wrong answer names its page",
      body: hindi
        ? "यदि किसी प्रश्न का उत्तर गलत होता है, तो सिस्टम आपको सटीक पुस्तक और पृष्ठ संख्या बताता है ताकि आप तुरंत सुधार कर सकें।"
        : "Miss a question and the result tells you which document and which page it came from, so revision starts where you actually went wrong.",
    },
    {
      icon: BarChart3,
      title: hindi ? "विस्तृत स्कोर व प्रगति विश्लेषण" : "Progress you can see",
      body: hindi
        ? "प्रत्येक टेस्ट का प्रतिशत, औसत स्कोर, विषयवार विश्लेषण और कमजोर क्षेत्रों पर विशेष ध्यान देने की योजना।"
        : "Attempts, best and average scores, accuracy per topic and per subject, plus a study plan built from the questions you missed.",
    },
    {
      icon: GraduationCap,
      title: hindi ? "संस्थान स्तर पर संपूर्ण नियंत्रण" : "Built for the institute",
      body: hindi
        ? "छात्रों का प्रबंधन, असीमित अभ्यास टेस्ट, पीडीएफ अपलोड और विस्तृत परीक्षा परिणाम रिपोर्ट।"
        : "Verified sign-in, role-based access, unlimited practice tests, and an admin panel for trainees, material, question banks and exports.",
    },
  ];

  return (
    <div className="app-shell-bg min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 font-semibold">
            <InstituteLogo size={44} className="h-11 w-11 shrink-0" title={null} priority />
            <span className="hidden flex-col leading-tight sm:flex">
              <span className={hindi ? "font-devanagari font-bold" : "font-bold"}>
                {hindi ? INSTITUTE.nameHi : INSTITUTE.name}
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                {INSTITUTE.city} · ITI code {INSTITUTE.scvtCode}
              </span>
            </span>
          </Link>

          <nav className="flex items-center gap-2" aria-label="Primary">
            <LanguageToggle />
            <ThemeToggle />
            {user ? (
              <Button asChild>
                <Link href="/dashboard">
                  {hindi ? "डैशबोर्ड" : "Dashboard"} <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">{hindi ? "लॉगिन करें" : "Sign in"}</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup">{hindi ? "पंजीकरण" : "Register"}</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main id="main">
        {/* Hero Section */}
        <section className="container py-14 md:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
            <div className="text-center lg:text-left">
              <Badge className="mb-5 bg-primary/10 text-primary hover:bg-primary/20">
                {hindi ? INSTITUTE.portalNameHi : INSTITUTE.portalName}
              </Badge>
              <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                {hindi ? "कौशल आज, " : "Skill Today, "}
                <span className="text-saffron">{hindi ? "सफलता कल" : "Success Tomorrow"}</span>
              </h1>
              <p
                lang="hi"
                className="mt-3 text-lg font-semibold text-primary dark:text-gold font-devanagari"
              >
                {INSTITUTE.mottoHi}
              </p>
              <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-muted-foreground lg:mx-0">
                {hindi
                  ? "माँ पीताम्बरा प्राइवेट आईटीआई झाँसी के शिक्षार्थियों हेतु आधिकारिक ऑनलाइन शिक्षण एवं परीक्षा पोर्टल। अपने ट्रेड की आधिकारिक NIMI अध्ययन सामग्री पढ़ें और ऑनलाइन मॉक टेस्ट का अभ्यास करें।"
                  : "Study the official NIMI and DGT material for your trade, then sit a timed practice paper built to the same blueprint as the All India Trade Test, in English or Hindi, with every wrong answer pointing you back to the page that explains it."}
              </p>
              <p className="mx-auto mt-4 max-w-xl text-xs text-muted-foreground lg:mx-0">
                {hindi ? INSTITUTE.nameHi : INSTITUTE.name}, {INSTITUTE.city} · NCVT & SCVT संबद्ध · ITI कोड {INSTITUTE.scvtCode}
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                <Button asChild size="lg">
                  <Link href={user ? "/dashboard" : "/signup"}>
                    {user
                      ? (hindi ? "डैशबोर्ड खोलें" : "Open dashboard")
                      : (hindi ? "नया छात्र खाता बनाएं" : "Create your account")}{" "}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href={user ? "/learn" : "/login"}>
                    {user
                      ? (hindi ? "अध्ययन सामग्री देखें" : "Browse material")
                      : (hindi ? "पहले से खाता है? लॉगिन करें" : "I already have an account")}
                  </Link>
                </Button>
              </div>

              {/* Demo credentials notification */}
              <div className="mt-6 inline-flex flex-wrap items-center justify-center lg:justify-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span>{hindi ? "टेस्ट लॉगिन उपलब्ध:" : "Demo Credentials:"}</span>
                <span className="font-mono font-medium text-foreground">student@maapitambra.edu</span>
                <span>|</span>
                <span className="font-mono text-muted-foreground">Password123!</span>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="relative">
                <div
                  className="absolute -inset-8 rounded-full bg-gold/15 blur-3xl"
                  aria-hidden
                />
                <InstituteLogo
                  size={320}
                  priority
                  className="relative h-64 w-64 animate-float drop-shadow-xl sm:h-80 sm:w-80"
                />
              </div>
            </div>
          </div>

          {/* Four Pillars */}
          <ul className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
            {INSTITUTE_PILLARS.map((pillar, index) => {
              const Icon = PILLAR_ICONS[index]!;
              return (
                <li key={pillar.label} className="glass rounded-xl px-4 py-5 text-center">
                  <span className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="text-sm font-semibold">{pillar.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground font-devanagari">
                    {pillar.labelHi}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Features Grid */}
        <section className="border-t border-border/60 bg-muted/20 py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="outline" className="mb-3">
                {hindi ? "परीक्षा की तैयारी" : "Exam Preparation"}
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {hindi
                  ? "आईटीआई परीक्षा में उत्कृष्ट प्रदर्शन हेतु सब कुछ"
                  : "Everything you need to excel in your trade tests"}
              </h2>
              <p className="mt-3 text-muted-foreground">
                {hindi
                  ? "NCVT और SCVT परीक्षा पैटर्न पर आधारित वास्तविक समय ऑनलाइन टेस्ट और अध्ययन सामग्री।"
                  : "Built strictly around the official syllabus and question blueprint for guaranteed success."}
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feat) => {
                const Icon = feat.icon;
                return (
                  <div key={feat.title} className="rounded-2xl border bg-card p-6 shadow-sm">
                    <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="font-semibold text-lg">{feat.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feat.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Trades Section */}
        <section className="container py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-3">
              {hindi ? "उपलब्ध ट्रेड्स" : "Available Trades"}
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {hindi ? "संस्थान में संचालित मुख्य ट्रेड्स" : "Trades Offered at Maa Pitambra ITI"}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {hindi
                ? "प्रत्येक ट्रेड के लिए समर्पित अध्ययन सामग्री एवं बहुविकल्पीय प्रश्न बैंक।"
                : "Dedicated learning material and question banks tailored to your trade."}
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {OCCUPATIONS.map((occ) => (
              <div key={occ} className="rounded-xl border p-5 bg-card">
                <Badge variant="secondary" className="mb-3">
                  {OCCUPATION_LABELS[occ]}
                </Badge>
                <h3 className="font-semibold text-base">{OCCUPATION_LABELS[occ]}</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  {OCCUPATION_DESCRIPTIONS[occ]}
                </p>
                <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-primary font-medium">
                  <Link href={user ? `/learn?occupation=${occ}` : "/signup"} className="inline-flex items-center hover:underline">
                    {hindi ? "सामग्री देखें" : "View material"} <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-muted/40 py-8 text-center text-xs text-muted-foreground">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} {INSTITUTE.name}, {INSTITUTE.city}. NCVT & SCVT कोड 2627.</p>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hover:underline">{hindi ? "लॉगिन" : "Sign In"}</Link>
            <span>·</span>
            <Link href="/signup" className="hover:underline">{hindi ? "पंजीकरण" : "Register"}</Link>
            <span>·</span>
            <LanguageToggle />
          </div>
        </div>
      </footer>
    </div>
  );
}
