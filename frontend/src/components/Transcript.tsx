"use client";

function formatTime(timestamp) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

export default function Transcript({ items }) {
  return (
    <section className="flex h-full min-h-[22rem] flex-col rounded-[2rem] border border-white/70 bg-white/85 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Conversation History</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600 sm:text-xs">
          {items.length} messages
        </span>
      </div>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
        {items.length ? (
          items.map((item) => (
            <article
              key={item.id}
              className={`rounded-2xl px-3.5 py-3 ${
                item.speaker === "assistant"
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-900"
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <span
                  className={`text-xs font-semibold uppercase tracking-[0.2em] ${
                    item.speaker === "assistant" ? "text-white/70" : "text-slate-500"
                  }`}
                >
                  {item.speaker === "assistant" ? "AI" : "You"}
                </span>
                <span
                  className={`text-xs ${
                    item.speaker === "assistant" ? "text-white/60" : "text-slate-500"
                  }`}
                >
                  {formatTime(item.timestamp)}
                </span>
              </div>
              <p className="text-sm leading-6">{item.text}</p>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            Start speaking to see the conversation appear here in real time.
          </div>
        )}
      </div>
    </section>
  );
}
