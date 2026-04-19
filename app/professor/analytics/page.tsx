"use client";

export default function AnalyticsPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/10">
        <div>
          <h2 className="text-2xl font-headline font-extrabold text-on-surface">Class Analytics</h2>
          <p className="text-on-surface-variant text-sm mt-1">Review performance data and identify learning gaps.</p>
        </div>
      </div>
      <div className="h-96 w-full flex items-center justify-center bg-surface-container rounded-2xl border-2 border-dashed border-outline-variant/30">
        <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">insights</span>
            <p className="font-bold text-on-surface-variant">Analytics Dashboard coming soon!</p>
        </div>
      </div>
    </div>
  );
}
