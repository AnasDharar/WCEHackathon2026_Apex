"use client";

import AssessmentWizard from "@/components/assessment/AssessmentWizard";

export default function AssessmentModal({ open, onClose, onCompleted }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-gray-950/45 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-white/30 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 px-6 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Dashboard Retake
              </p>
              <h2 className="mt-1 text-lg font-bold text-gray-900">Take another assessment</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-6">
          <AssessmentWizard
            mode="retake"
            presentation="modal"
            onClose={onClose}
            onCompleted={onCompleted}
          />
        </div>
      </div>
    </div>
  );
}
