"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RetestStatus } from "@prisma/client";
import { Clock, RotateCcw, Send, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";

import { requestRetestAction } from "@/actions/retest";
import { runAction } from "@/lib/run-action";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { useLanguage } from "@/hooks/use-language";

export type RetestRequestRow = {
  id: string;
  status: RetestStatus;
  reason: string | null;
  adminNote: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  consumedAt: Date | null;
};

const STATUS_META: Record<
  RetestStatus,
  { label: string; labelHi: string; variant: "warning" | "success" | "destructive"; icon: typeof Clock }
> = {
  PENDING: { label: "Awaiting review", labelHi: "समीक्षा प्रतीक्षित", variant: "warning", icon: Clock },
  APPROVED: { label: "Approved", labelHi: "स्वीकृत", variant: "success", icon: ThumbsUp },
  REJECTED: { label: "Rejected", labelHi: "अस्वीकृत", variant: "destructive", icon: ThumbsDown },
};

export function RetestPanel({
  canRequest,
  blockedMessage,
  requests,
  attemptsUsed,
  freeAttempts,
}: {
  /** False when the learner can already start a test, or already has one pending. */
  canRequest: boolean;
  blockedMessage: string | null;
  requests: RetestRequestRow[];
  attemptsUsed: number;
  freeAttempts: number;
}) {
  const router = useRouter();
  const { language } = useLanguage();
  const hindi = language === "hi";

  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const result = await runAction(() => requestRetestAction({ reason }));
    setBusy(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message ?? (hindi ? "अनुरोध भेजा गया।" : "Request sent."));
    setReason("");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-primary" aria-hidden />{" "}
          {hindi ? "असीमित टेस्ट अभ्यास" : "Unlimited Test Practice"}
        </CardTitle>
        <CardDescription>
          {hindi
            ? `आपने ${attemptsUsed} टेस्ट प्रयास पूरे किए हैं। माँ पीताम्बरा आईटीआई में आपको असीमित अभ्यास की सुविधा है — किसी एडमिन अनुमोदन की आवश्यकता नहीं है।`
            : `You have completed ${attemptsUsed} test attempt${attemptsUsed === 1 ? "" : "s"}. Unlimited practice attempts are unlocked — no admin approval needed.`}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {blockedMessage ? (
          <Alert variant={canRequest ? "warning" : "info"}>
            <AlertDescription>{blockedMessage}</AlertDescription>
          </Alert>
        ) : null}

        {canRequest ? (
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="retest-reason">Why do you need another attempt? (optional)</Label>
              <Textarea
                id="retest-reason"
                value={reason}
                maxLength={500}
                onChange={(event) => setReason(event.target.value)}
                placeholder="For example: my internet dropped during the test, or I want to improve my score after revising."
              />
              <p className="text-xs text-muted-foreground">{reason.length}/500</p>
            </div>
            <Button type="submit" loading={busy}>
              <Send className="h-4 w-4" /> Send request
            </Button>
          </form>
        ) : null}

        {requests.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">{hindi ? "आपके अनुरोध" : "Your requests"}</h3>
            <ul className="divide-y">
              {requests.map((request) => {
                const meta = STATUS_META[request.status];
                const Icon = meta.icon;
                return (
                  <li key={request.id} className="flex flex-wrap items-start gap-3 py-3 first:pt-0">
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <Badge variant={meta.variant}>
                          <Icon className="h-3 w-3" /> {hindi ? meta.labelHi : meta.label}
                        </Badge>
                        {request.status === "APPROVED" ? (
                          <Badge variant="outline">
                            {request.consumedAt
                              ? (hindi ? "प्रयुक्त" : "Used")
                              : (hindi ? "उपयोग के लिए तैयार" : "Ready to use")}
                          </Badge>
                        ) : null}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(request.createdAt, true)}
                        </span>
                      </span>
                      {request.reason ? (
                        <span className="mt-1 block text-sm text-muted-foreground">
                          “{request.reason}”
                        </span>
                      ) : null}
                      {request.adminNote ? (
                        <span className="mt-1 block text-sm">
                          <strong className="font-medium">Institute&apos;s note: </strong>
                          {request.adminNote}
                        </span>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
