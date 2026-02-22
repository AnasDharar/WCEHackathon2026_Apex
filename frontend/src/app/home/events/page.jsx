import Header from "@/components/Header";

const events = [
  {
    id: 1,
    title: "Mental Health Awareness Workshop",
    type: "Workshop",
    date: "26 Feb 2026",
    time: "4:00 PM – 6:00 PM",
    location: "Tilak Hall",
    tag: "On-campus",
    description:
      "Interactive session on understanding stress, anxiety, and building healthy coping mechanisms with campus counselors.",
  },
  {
    id: 2,
    title: "Morning Exercise & Mindfulness",
    type: "Wellness Activity",
    date: "27 Feb 2026",
    time: "7:00 AM – 8:00 AM",
    location: "Tilak Hall Lawn",
    tag: "Open to all",
    description:
      "Guided stretching, light cardio, and short mindfulness practice to start your day with energy and calm.",
  },
  {
    id: 3,
    title: "Peer Support Circle",
    type: "Group Session",
    date: "01 Mar 2026",
    time: "5:00 PM – 6:30 PM",
    location: "Tilak Hall",
    tag: "Limited seats",
    description:
      "Facilitated safe-space circle where students can share experiences about academics, relationships, and burnout.",
  },
];

export default function Events() {
  return (
    <>
      <Header
        title="Events"
        subtitle="Discover upcoming wellness events and workshops."
      />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-semibold text-sm flex-shrink-0">
                    <div className="text-center leading-tight">
                      <div className="text-[10px] uppercase tracking-wide">
                        {event.date.split(" ")[1]}
                      </div>
                      <div className="text-xs font-bold">
                        {event.date.split(" ")[0]}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                        {event.title}
                      </h2>
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        {event.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {event.description}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {event.date} · {event.time}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 2C8.13401 2 5 5.13401 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13401 15.866 2 12 2Z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 11.5C13.3807 11.5 14.5 10.3807 14.5 9C14.5 7.61929 13.3807 6.5 12 6.5C10.6193 6.5 9.5 7.61929 9.5 9C9.5 10.3807 10.6193 11.5 12 11.5Z"
                          />
                        </svg>
                        {event.location}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {event.tag}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-stretch gap-2 w-full md:w-40">
                  <button className="w-full py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors">
                    Register
                  </button>
                  <button className="w-full py-2.5 rounded-lg bg-gray-50 text-gray-700 text-sm font-medium border border-gray-200 hover:bg-gray-100 transition-colors">
                    Add to calendar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              Today&apos;s vibe
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Small steps like attending one session or morning exercise can
              significantly lift your mood.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Bring a friend along for more comfort.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                You can just listen; sharing is always optional.
              </li>
            </ul>
          </div>

          <div className="bg-emerald-600 rounded-3xl p-5 text-white shadow-sm">
            <p className="text-sm font-medium mb-2">Reminder</p>
            <p className="text-sm opacity-90 mb-4">
              If you are feeling overwhelmed, you can directly book a private
              appointment from the Appointments tab.
            </p>
            <p className="text-xs text-emerald-100">
              Your participation in events and sessions remains confidential
              within the campus wellness team.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
