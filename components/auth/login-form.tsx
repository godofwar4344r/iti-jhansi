"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Mail } from "lucide-react";
import { toast } from "sonner";

import { loginAction, resendVerificationAction } from "@/actions/auth";
import { runAction } from "@/lib/run-action";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GoogleButton } from "@/components/auth/google-button";

import { useLanguage } from "@/hooks/use-language";
import { Sparkles, ShieldCheck, GraduationCap } from "lucide-react";

export function LoginForm({
  callbackUrl,
  googleEnabled,
  initiallyPending = false,
}: {
  callbackUrl?: string;
  /** False when the deployment has no Google OAuth credentials configured. */
  googleEnabled: boolean;
  initiallyPending?: boolean;
}) {
  const { language } = useLanguage();
  const hindi = language === "hi";

  const [showPassword, setShowPassword] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [redirecting, setRedirecting] = React.useState(false);
  const [approvalPending, setApprovalPending] = React.useState(initiallyPending);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = form;

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    setNeedsVerification(false);
    setApprovalPending(false);

    const result = await runAction(() => loginAction(values));

    if (!result.ok) {
      setFormError(result.error);
      if (result.error.toLowerCase().includes("verify")) setNeedsVerification(true);
      return;
    }

    if (result.data?.approvalRequired) {
      setApprovalPending(true);
      toast.success(result.message ?? "Login request submitted.");
      return;
    }

    setRedirecting(true);
    toast.success(hindi ? "सफलतापूर्वक लॉगिन हो गया! पुनः निर्देशित किया जा रहा है..." : "Signed in! Redirecting...");
    const targetUrl = callbackUrl || result.data?.redirectTo || "/dashboard";
    window.location.assign(targetUrl);
  }

  function handleQuickDemo(email: string, pass: string) {
    setValue("email", email);
    setValue("password", pass);
    void onSubmit({ email, password: pass, remember: true });
  }

  async function handleResend() {
    setResending(true);
    const result = await runAction(() =>
      resendVerificationAction({ email: getValues("email") }),
    );
    setResending(false);
    if (result.ok) toast.success(result.message ?? (hindi ? "सत्यापन ईमेल भेजा गया।" : "Verification e-mail sent."));
    else toast.error(result.error);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          {hindi ? "पोर्टल में लॉगिन करें" : "Welcome back"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {hindi
            ? "अपने कौशल प्रशिक्षण एवं ऑनलाइन परीक्षा में भाग लेने के लिए लॉगिन करें।"
            : "Sign in to continue your training and assessments."}
        </p>
      </header>

      {/* Quick Demo Login Helper Box */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>{hindi ? "त्वरित टेस्ट लॉगिन (1-क्लिक डेमो):" : "Quick Demo Credentials (1-Click):"}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {hindi
            ? "सीधे टेस्ट करने के लिए नीचे दिए गए बटन पर क्लिक करें:"
            : "Click below to sign in instantly with test credentials:"}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="justify-start text-xs border-primary/30 hover:bg-primary/10"
            disabled={isSubmitting || redirecting}
            onClick={() => handleQuickDemo("student@maapitambra.edu", "Password123!")}
          >
            <GraduationCap className="h-3.5 w-3.5 text-primary mr-1 shrink-0" />
            <span className="truncate">{hindi ? "छात्र लॉगिन (Student)" : "Student: student@..."}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="justify-start text-xs border-primary/30 hover:bg-primary/10"
            disabled={isSubmitting || redirecting}
            onClick={() => handleQuickDemo("admin@maapitambra.edu", "Admin123!")}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-primary mr-1 shrink-0" />
            <span className="truncate">{hindi ? "एडमिन लॉगिन (Admin)" : "Admin: admin@..."}</span>
          </Button>
        </div>
      </div>

      {formError ? (
        <Alert variant="destructive">
          <AlertDescription className="space-y-3">
            <p>{formError}</p>
            {needsVerification ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                loading={resending}
                onClick={handleResend}
              >
                <Mail className="h-4 w-4" /> {hindi ? "सत्यापन ईमेल पुनः भेजें" : "Resend verification e-mail"}
              </Button>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      {approvalPending ? (
        <Alert>
          <AlertDescription>
            Request submitted. Wait for an administrator to approve it, then press Sign in again.
            Approval is valid for 15 minutes and one login only.
          </AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">{hindi ? "ईमेल पता (E-mail)" : "E-mail address"}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="student@maapitambra.edu"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          {errors.email ? (
            <p id="email-error" className="text-sm text-destructive">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{hindi ? "पासवर्ड (Password)" : "Password"}</Label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-primary hover:underline"
            >
              {hindi ? "पासवर्ड भूल गए?" : "Forgot password?"}
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className="pr-10"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password ? (
            <p id="password-error" className="text-sm text-destructive">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            checked={watch("remember")}
            onCheckedChange={(checked) => setValue("remember", checked === true)}
          />
          <Label htmlFor="remember" className="cursor-pointer font-normal text-muted-foreground">
            {hindi ? "इस डिवाइस पर मुझे याद रखें" : "Remember me on this device"}
          </Label>
        </div>

        <Button type="submit" className="w-full" loading={isSubmitting || redirecting} disabled={isSubmitting || redirecting}>
          {redirecting
            ? (hindi ? "लॉगिन हो रहा है..." : "Signing in...")
            : (hindi ? "लॉगिन करें (Sign In)" : "Sign in")}
        </Button>
      </form>

      {googleEnabled ? (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {hindi ? "या" : "or"}
              </span>
            </div>
          </div>

          <GoogleButton callbackUrl={callbackUrl || "/dashboard"} />
        </>
      ) : null}

      <p className="text-center text-sm text-muted-foreground">
        {hindi ? "खाता नहीं है? " : "Don't have an account? "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          {hindi ? "नया खाता बनाएं" : "Create one"}
        </Link>
      </p>
    </div>
  );
}
