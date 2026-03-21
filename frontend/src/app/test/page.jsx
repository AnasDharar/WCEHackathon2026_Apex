"use client";

import AssessmentWizard from "@/components/assessment/AssessmentWizard";

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10 font-google">
      <div className="mx-auto max-w-4xl">
        <AssessmentWizard mode="initial" presentation="page" />
      </div>
    </div>
  );
}
