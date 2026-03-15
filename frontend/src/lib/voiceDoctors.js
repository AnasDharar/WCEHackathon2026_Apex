export const voiceDoctors = [
  {
    id: "depression",
    name: "Depression Specialist Agent",
    specialty: "Depression Care",
    description: "Supports low mood, emotional heaviness, and burnout recovery.",
    accent: "Voice support",
    color: "from-amber-200 via-orange-100 to-white",
    image:
      "https://cdn.jsdelivr.net/gh/hfg-gmuend/openmoji/color/svg/1F469-200D-2695-FE0F.svg",
  },
  {
    id: "anxiety",
    name: "Anxiety Specialist Agent",
    specialty: "Anxiety Care",
    description: "Helps with overthinking, panic feelings, and racing thoughts.",
    accent: "Voice support",
    color: "from-sky-200 via-cyan-100 to-white",
    image:
      "https://cdn.jsdelivr.net/gh/hfg-gmuend/openmoji/color/svg/1F9D1-200D-2695-FE0F.svg",
  },
  {
    id: "stress",
    name: "Stress Specialist Agent",
    specialty: "Stress Care",
    description: "Guides users through pressure, overload, and mental fatigue.",
    accent: "Voice support",
    color: "from-emerald-200 via-teal-100 to-white",
    image:
      "https://cdn.jsdelivr.net/gh/hfg-gmuend/openmoji/color/svg/1F468-200D-2695-FE0F.svg",
  },
  {
    id: "sleep",
    name: "Sleep Specialist Agent",
    specialty: "Sleep Care",
    description: "Supports better rest, calmer nights, and sleep routines.",
    accent: "Voice support",
    color: "from-indigo-200 via-blue-100 to-white",
    image:
      "https://cdn.jsdelivr.net/gh/hfg-gmuend/openmoji/color/svg/1F469-200D-2695-FE0F.svg",
  },
  {
    id: "trauma-support",
    name: "Trauma Support Agent",
    specialty: "Trauma Support",
    description: "Offers grounding and emotionally safe support in hard moments.",
    accent: "Voice support",
    color: "from-rose-200 via-pink-100 to-white",
    image:
      "https://cdn.jsdelivr.net/gh/hfg-gmuend/openmoji/color/svg/1F9D1-200D-2695-FE0F.svg",
  },
  {
    id: "youth-care",
    name: "Student Support Agent",
    specialty: "Youth Care",
    description: "Supports study pressure, confidence issues, and loneliness.",
    accent: "Voice support",
    color: "from-violet-200 via-fuchsia-100 to-white",
    image:
      "https://cdn.jsdelivr.net/gh/hfg-gmuend/openmoji/color/svg/1F9D1-200D-2695-FE0F.svg",
  },
];

export function getVoiceDoctorById(doctorId) {
  return voiceDoctors.find((doctor) => doctor.id === doctorId) || voiceDoctors[0];
}
