"use client";

import * as React from "react";
import {
  CheckCircle2,
  Clock,
  ListChecks,
  Shuffle,
  Target,
  TimerReset,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/hooks/use-language";
import { PASS_PERCENTAGE, TEST_QUESTION_COUNT } from "@/lib/constants";

export function TestRules() {
  const { language } = useLanguage();
  const hindi = language === "hi";

  const rules = [
    {
      icon: ListChecks,
      title: hindi ? `${TEST_QUESTION_COUNT} प्रश्न` : `${TEST_QUESTION_COUNT} questions`,
      body: hindi
        ? "बहुविकल्पीय एवं सही/गलत प्रश्न, प्रत्येक 1 अंक का।"
        : "Multiple choice and true/false, one mark each.",
    },
    {
      icon: Clock,
      title: hindi ? "30 मिनट समय" : "30 minutes",
      body: hindi
        ? "समय की गणना सर्वर द्वारा की जाती है और इसे रीसेट नहीं किया जा सकता।"
        : "The clock is kept on the server and cannot be reset.",
    },
    {
      icon: Shuffle,
      title: hindi ? "यादृच्छिक प्रश्न" : "Randomised",
      body: hindi
        ? "प्रत्येक प्रयास में प्रश्न और उनके विकल्प बदल दिए जाते हैं।"
        : "Questions and their options are shuffled per attempt.",
    },
    {
      icon: Target,
      title: hindi ? `उत्तीर्ण होने के लिए ${PASS_PERCENTAGE}%` : `${PASS_PERCENTAGE}% to pass`,
      body: hindi
        ? `यानी ${TEST_QUESTION_COUNT} में से ${Math.ceil((PASS_PERCENTAGE / 100) * TEST_QUESTION_COUNT)} सही उत्तर आवश्यक हैं।`
        : `That is ${Math.ceil((PASS_PERCENTAGE / 100) * TEST_QUESTION_COUNT)} correct out of ${TEST_QUESTION_COUNT}.`,
    },
    {
      icon: TimerReset,
      title: hindi ? "स्वतः सबमिट" : "Auto submit",
      body: hindi
        ? "समय समाप्त होते ही आपके उत्तर अपने-आप जमा हो जाते हैं।"
        : "When time runs out, your answers are graded as they stand.",
    },
    {
      icon: CheckCircle2,
      title: hindi ? "नेगेटिव मार्किंग नहीं" : "No negative marking",
      body: hindi
        ? "गलत उत्तर पर कोई अंक नहीं कटता, इसलिए कोई प्रश्न खाली न छोड़ें।"
        : "Wrong answers cost nothing, so never leave a blank.",
    },
  ];

  return (
    <section aria-labelledby="rules-heading">
      <h2 id="rules-heading" className="sr-only">
        {hindi ? "टेस्ट के नियम" : "Test rules"}
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rules.map((rule) => (
          <li key={rule.title}>
            <Card className="h-full p-5">
              <span className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <rule.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="font-semibold">{rule.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{rule.body}</p>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
