"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PlayCircle } from "lucide-react";
import { toast } from "sonner";

import { startTestAction } from "@/actions/test";
import { runAction } from "@/lib/run-action";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PASS_PERCENTAGE, TEST_QUESTION_COUNT } from "@/lib/constants";
import { useLanguage } from "@/hooks/use-language";

export function StartTestButton({
  disabled,
  resumeId,
  className,
}: {
  disabled?: boolean;
  resumeId?: string | null;
  className?: string;
}) {
  const router = useRouter();
  const { language } = useLanguage();
  const hindi = language === "hi";
  const [loading, setLoading] = React.useState(false);

  async function start() {
    setLoading(true);
    const result = await runAction(() => startTestAction());
    setLoading(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    router.push(`/tests/${result.data!.testId}`);
  }

  if (resumeId) {
    return (
      <Button
        className={className}
        size="lg"
        loading={loading}
        onClick={() => router.push(`/tests/${resumeId}`)}
      >
        <PlayCircle className="h-4 w-4" /> {hindi ? "टेस्ट फिर से जारी रखें" : "Resume your test"}
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className={className} size="lg" disabled={disabled}>
          <PlayCircle className="h-4 w-4" /> {hindi ? "नया टेस्ट शुरू करें" : "Start a test"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {hindi ? "क्या आप टेस्ट शुरू करने के लिए तैयार हैं?" : "Ready to begin?"}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm">
              <p>
                {hindi
                  ? "एक बार शुरू करने के बाद, 30 मिनट का सर्वर टाइमर चलेगा:"
                  : "Once you start, the 30-minute timer runs on the server. To be clear:"}
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  {hindi
                    ? `कुल ${TEST_QUESTION_COUNT} यादृच्छिक रूप से चयनित प्रश्न, प्रत्येक 1 अंक का।`
                    : `${TEST_QUESTION_COUNT} randomly selected questions, one mark each.`}
                </li>
                <li>
                  {hindi
                    ? "कोई नकारात्मक अंकन (negative marking) नहीं है, इसलिए सभी प्रश्नों के उत्तर दें।"
                    : "No negative marking, so answer everything."}
                </li>
                <li>
                  {hindi
                    ? "पेज रिफ्रेश करने या टैब बंद करने से टाइमर नहीं रुकेगा।"
                    : "Refreshing or closing the tab does not reset the clock."}
                </li>
                <li>
                  {hindi
                    ? "समय समाप्त होने पर उत्तर स्वतः सबमिट हो जाएंगे।"
                    : "When time runs out your answers are submitted automatically."}
                </li>
                <li>
                  {hindi
                    ? `उत्तीर्ण होने के लिए ${PASS_PERCENTAGE}% अंक आवश्यक हैं।`
                    : `You need ${PASS_PERCENTAGE}% to pass, and answers are final once submitted.`}
                </li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{hindi ? "अभी नहीं" : "Not yet"}</AlertDialogCancel>
          <AlertDialogAction onClick={start} disabled={loading}>
            {loading
              ? (hindi ? "शुरू हो रहा है..." : "Starting...")
              : (hindi ? "टेस्ट शुरू करें" : "Start the test")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
