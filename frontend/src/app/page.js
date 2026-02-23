"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import Footer from "@/components/Footer";

const NAV_ITEMS = ["Features", "About", "Download", "Blogs", "Contact Us"];

const FEATURE_ITEMS = [
  { title: "Online Therapy", icon: "therapy" },
  { title: "Mental Health Tests", icon: "test" },
  { title: "Habit Tracker", icon: "habit" },
  { title: "24/7 Support", icon: "support" },
];

function FloatingBubble({ className, icon, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1, y: [0, -12, 0] }}
      transition={{ duration: 4.6, delay, repeat: Infinity, ease: "easeInOut" }}
      className={`pointer-events-none absolute z-40 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#f2deca] bg-white/90 text-xl shadow-[0_18px_34px_rgba(22,24,30,0.12)] backdrop-blur-md ${className}`}
    >
      {icon}
    </motion.div>
  );
}

function TherapyIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="7" r="3" stroke="#F97316" strokeWidth="1.8" />
      <path
        d="M5.5 19C6.3 15.8 8.7 14 12 14C15.3 14 17.7 15.8 18.5 19"
        stroke="#15803D"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M17 6.2h4m-2-2v4" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function TestIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="4" width="12" height="16" rx="2" stroke="#15803D" strokeWidth="1.8" />
      <path d="M9 8h4M9 12h4M9 16h2" stroke="#15803D" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="19" cy="17" r="3" stroke="#F97316" strokeWidth="1.8" />
      <path d="m20.8 18.8 1.7 1.7" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function HabitIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m4 14 4 4 12-12"
        stroke="#15803D"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="6" r="3" stroke="#F97316" strokeWidth="1.8" />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 12a8 8 0 0 1 16 0v3a2 2 0 0 1-2 2h-2v-5h4"
        stroke="#0F766E"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M4 12v3a2 2 0 0 0 2 2h2v-5H4"
        stroke="#0F766E"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M10.5 19h3" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BubbleBrainIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 7a3 3 0 0 1 6 0v9a3 3 0 1 1-6 0V7Z" stroke="#F97316" strokeWidth="1.8" />
      <path
        d="M8 10H5a2 2 0 1 0 0 4h3M14 10h3a2 2 0 1 1 0 4h-3"
        stroke="#F97316"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BubbleChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v6A2.5 2.5 0 0 1 17.5 15H11l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 12.5v-6Z"
        stroke="#15803D"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="9.5" r="1" fill="#F97316" />
      <circle cx="12" cy="9.5" r="1" fill="#F97316" />
      <circle cx="15" cy="9.5" r="1" fill="#F97316" />
    </svg>
  );
}

function BubbleCareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 7.6c0-1.7 1.3-3.1 3-3.1S18 6 18 7.6c0 2.9-2.8 5.2-6 7.2-3.2-2-6-4.3-6-7.2 0-1.7 1.3-3.1 3-3.1s3 1.4 3 3.1Z"
        stroke="#F97316"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BubbleLeafIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 19.5V11"
        stroke="#15803D"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 14.2c-4-1-6.2-4.1-6.2-7.7 3.8 0 6.1 1.8 6.2 5.6 0-3.8 2.4-5.6 6.2-5.6 0 3.6-2.2 6.7-6.2 7.7Z"
        stroke="#F97316"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldSmallIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3 5 6v6c0 4.5 3 7.9 7 9 4-1.1 7-4.5 7-9V6l-7-3Z"
        stroke="#2F8A4D"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="m9.7 12 1.5 1.5 3.2-3.2"
        stroke="#2F8A4D"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="#2F8A4D" strokeWidth="1.8" />
      <path
        d="m8.7 12.2 2.2 2.2 4.4-4.4"
        stroke="#2F8A4D"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LotusAccent() {
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" fill="none" aria-hidden="true">
      <ellipse cx="34" cy="56" rx="18" ry="8" fill="#2D8C5A" fillOpacity="0.2" />
      <path d="M34 49c-8-6-12-14-8-19 4 1 7 5 8 10 1-5 4-9 8-10 4 5 0 13-8 19Z" fill="#E8943A" />
      <path d="M34 50c-4-4-6-9-4-13 2 1 3 3 4 6 1-3 2-5 4-6 2 4 0 9-4 13Z" fill="#F3C770" />
      <path d="M16 53c4-7 10-8 14-6-5 2-8 5-10 10Z" fill="#4D9A58" />
      <path d="M52 53c-4-7-10-8-14-6 5 2 8 5 10 10Z" fill="#4D9A58" />
    </svg>
  );
}

function FeatureChip({ icon, title }) {
  const iconMap = {
    therapy: <TherapyIcon />,
    test: <TestIcon />,
    habit: <HabitIcon />,
    support: <SupportIcon />,
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/40 bg-white/60 px-4 py-3 shadow-md backdrop-blur-sm transition-transform duration-300 hover:scale-105 hover:shadow-lg">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-white to-[#f5f7f3] shadow-[inset_0_0_0_1px_rgba(232,235,227,0.9)]">
        {iconMap[icon]}
      </div>
      <p className="text-[17px] font-semibold leading-tight text-[#1f2937]">{title}</p>
    </div>
  );
}

function WavePattern({ className = "" }) {
  return (
    <svg
      viewBox="0 0 620 340"
      fill="none"
      aria-hidden="true"
      className={className}
      preserveAspectRatio="none"
    >
      <path
        d="M20 170c90-95 205-95 295 0s205 95 285 0"
        stroke="#E9B06D"
        strokeOpacity="0.55"
        strokeWidth="1.2"
      />
      <path
        d="M20 193c90-95 205-95 295 0s205 95 285 0"
        stroke="#E9B06D"
        strokeOpacity="0.38"
        strokeWidth="1.2"
      />
      <path
        d="M20 216c90-95 205-95 295 0s205 95 285 0"
        stroke="#6EB06A"
        strokeOpacity="0.34"
        strokeWidth="1.2"
      />
      <path
        d="M20 239c90-95 205-95 295 0s205 95 285 0"
        stroke="#6EB06A"
        strokeOpacity="0.24"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto h-[460px] w-full max-w-[700px] sm:h-[560px] lg:h-[690px]">
      <div className="pointer-events-none absolute left-1/2 top-[54px] z-0 h-[250px] w-[250px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(22,163,74,0.28),rgba(255,255,255,0)_70%)] blur-xl sm:h-[320px] sm:w-[320px] lg:h-[440px] lg:w-[440px]" />
      <div className="pointer-events-none absolute left-1/2 top-[30px] z-0 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.30),rgba(255,255,255,0)_72%)] blur-xl sm:h-[400px] sm:w-[400px] lg:h-[540px] lg:w-[540px]" />
      <div className="pointer-events-none absolute right-[-10%] top-[38px] z-0 h-[250px] w-[250px] rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.18),rgba(255,255,255,0)_72%)] blur-2xl sm:h-[330px] sm:w-[330px] lg:h-[430px] lg:w-[430px]" />
      <WavePattern className="pointer-events-none absolute -right-3 top-[170px] z-0 h-[190px] w-[340px] opacity-55 lg:top-[238px] lg:h-[250px] lg:w-[500px]" />

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6.8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-1/2 top-[18px] z-20 -translate-x-1/2 sm:top-[14px] lg:top-[6px]"
      >
        <Image
          src="/mental-wellness-hero.svg"
          alt="Calm meditating person with soft wellness aura and brain icon"
          width={760}
          height={760}
          priority
          className="h-auto w-[330px] max-w-none sm:w-[430px] lg:w-[600px]"
        />
      </motion.div>

      <FloatingBubble className="left-[10%] top-[148px] h-12 w-12 sm:left-[12%] sm:top-[190px] lg:left-[14%] lg:top-[252px]" icon={<BubbleBrainIcon />} delay={0.1} />
      <FloatingBubble className="right-[12%] top-[142px] h-12 w-12 sm:right-[12%] sm:top-[188px] lg:right-[13%] lg:top-[246px]" icon={<BubbleCareIcon />} delay={0.22} />
      <FloatingBubble className="right-[8%] top-[244px] h-12 w-12 sm:right-[10%] sm:top-[300px] lg:right-[8%] lg:top-[362px]" icon={<BubbleChatIcon />} delay={0.34} />
      <FloatingBubble className="left-[9%] top-[250px] h-12 w-12 sm:left-[12%] sm:top-[316px] lg:left-[12%] lg:top-[382px]" icon={<BubbleLeafIcon />} delay={0.44} />

      <div className="pointer-events-none absolute bottom-[18px] left-1/2 z-10 h-[78px] w-[90%] -translate-x-1/2 rounded-[50%] border border-[#dddfe4] bg-gradient-to-b from-white to-[#eaebef] shadow-[0_22px_34px_rgba(0,0,0,0.12)] sm:h-[96px] lg:h-[132px]" />
      <div className="pointer-events-none absolute bottom-[34px] left-1/2 z-10 h-[52px] w-[72%] -translate-x-1/2 rounded-[50%] border border-[#d8dce1] bg-gradient-to-b from-white to-[#f2f3f6] sm:h-[68px] lg:bottom-[44px] lg:h-[84px]" />
      <div className="pointer-events-none absolute bottom-[51px] left-1/2 z-10 h-[18px] w-[36%] -translate-x-1/2 rounded-[50%] border border-dashed border-[#d8dade] lg:bottom-[68px] lg:h-[24px]" />
      <div className="pointer-events-none absolute bottom-[8px] left-1/2 z-0 h-[54px] w-[52%] -translate-x-1/2 rounded-[50%] bg-green-900/16 blur-2xl lg:h-[64px]" />
      <div className="pointer-events-none absolute bottom-[20px] right-[10%] z-20 sm:right-[12%] lg:bottom-[36px] lg:right-[12%]">
        <LotusAccent />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-orange-100 via-white to-green-100 text-[#141827]">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          animate={{ x: ["-2%", "2%", "-2%"] }}
          transition={{ duration: 12.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-28 right-[-6%] h-[280px] w-[74%] rounded-full bg-gradient-to-r from-[#f39f37]/58 via-[#f7cf8b]/34 to-transparent blur-3xl"
        />
        <motion.div
          animate={{ x: ["4%", "-3%", "4%"] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[24px] right-[-7%] h-[260px] w-[68%] rounded-full bg-gradient-to-r from-[#bad67f]/42 via-[#87c96a]/35 to-transparent blur-3xl"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_32%,rgba(34,197,94,0.18),rgba(255,255,255,0)_45%),radial-gradient(circle_at_70%_18%,rgba(251,191,36,0.2),rgba(255,255,255,0)_38%)]" />
      </div>

      <header className="relative z-30 px-4 pt-5 sm:px-6 md:px-8 lg:px-10">
        <motion.div
          initial={{ y: -18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.55 }}
          className="mx-auto flex w-full max-w-[1460px] items-center justify-between gap-2 sm:gap-4"
        >
          <div className="flex min-w-0 items-center gap-2 sm:gap-4 lg:gap-5">
            <Image
              src="/logo_1_transparent.png"
              alt="Manah Arogya"
              width={340}
              height={74}
              priority
              className="h-9 w-auto object-contain sm:h-11 md:h-13 lg:h-14"
            />
            <span className="hidden h-7 w-px bg-[#ea9b4d] lg:block" />
          </div>

          <div className="hidden flex-1 items-center justify-center lg:flex">
            <div className="w-full max-w-[560px] border-b border-[#e7e2d8] pb-3.5">
              <nav className="flex items-center justify-between gap-8">
                {NAV_ITEMS.map((item) => (
                  <a
                    key={item}
                    href="#"
                    className="text-[18px] font-medium text-[#1f2430] transition-colors hover:text-[#0b7e57]"
                  >
                    {item}
                  </a>
                ))}
              </nav>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link href="/home">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-full border border-[#2f3136] bg-gradient-to-b from-[#282a30] via-[#171a22] to-[#11131b] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(0,0,0,0.28)] sm:px-6 sm:py-3 sm:text-base md:px-9 md:text-[18px]"
              >
                Get Started <span className="ml-2 text-[16px]">-&gt;</span>
              </motion.button>
            </Link>
            <Link href="/signin" className="hidden sm:inline-flex">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-full border border-[#e0e3e7] bg-white/88 px-5 py-3 text-base font-semibold text-[#1f2430] shadow-[0_12px_24px_rgba(0,0,0,0.07)] backdrop-blur-md md:px-8 md:text-[18px]"
              >
                Sign In
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </header>

      <section className="relative z-20 w-full px-4 pb-12 pt-7 sm:px-6 md:px-8 lg:px-10">
        <div className="mx-auto grid max-w-[1460px] items-center gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
          <div className="max-w-[760px] text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.45 }}
              className="relative mb-7 inline-flex flex-col items-center lg:items-start"
            >
              <div className="relative flex items-center gap-3 rounded-full border border-white/40 bg-gradient-to-b from-white/85 to-white/72 px-4 py-2 shadow-sm backdrop-blur-md sm:px-6 sm:py-2.5">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#5da85e] shadow-[0_0_0_4px_rgba(93,168,94,0.12)]" />
                <span className="text-[14px] font-semibold text-[#1d2431] sm:text-[16px] md:text-[18px]">
                  Your Companion for Mental Wellness
                </span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.55 }}
              className="text-balance text-5xl font-bold tracking-tight leading-tight text-[#13182a] sm:text-6xl lg:text-7xl"
            >
              Nurturing Minds,
              <br />
              Embracing{" "}
              <span className="bg-gradient-to-r from-[#0f8b52] via-[#109f5e] to-[#0c7f4a] bg-clip-text text-transparent">
                Wellness
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.55 }}
              className="mx-auto mt-4 max-w-[760px] text-[clamp(1.02rem,3.7vw,2rem)] leading-[1.45] text-[#3b4351] lg:mx-0"
            >
              A one-stop AI-powered platform for mental wellness. Take tests, book therapy
              sessions, track habits, and get 24/7 AI support.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.55 }}
              className="mx-auto mt-6 grid max-w-[820px] gap-3 sm:grid-cols-2 xl:grid-cols-4 lg:mx-0"
            >
              {FEATURE_ITEMS.map((item) => (
                <FeatureChip key={item.title} icon={item.icon} title={item.title} />
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.46, duration: 0.55 }}
              className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4 lg:justify-start"
            >
              <Link href="/home">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-full bg-gradient-to-r from-green-600 to-emerald-500 px-7 py-3.5 text-[16px] font-semibold text-white shadow-xl transition-transform sm:px-10 sm:py-4 sm:text-[18px]"
                >
                  Get Started <span className="ml-2">-&gt;</span>
                </motion.button>
              </Link>
              <Link href="/home">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-full border border-[#cfd3db] bg-white/55 px-7 py-3.5 text-[16px] font-semibold text-[#1f2430] shadow-lg backdrop-blur-md transition-transform sm:px-10 sm:py-4 sm:text-[18px]"
                >
                  Explore Features
                </motion.button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.56, duration: 0.55 }}
              className="mt-6 flex flex-wrap items-center justify-center gap-2.5 text-[15px] font-medium text-[#26323c] sm:gap-3 md:text-[18px] lg:justify-start"
            >
              <span className="inline-flex items-center gap-2">
                <span className="text-[#3b8f3b]">
                  <ShieldSmallIcon />
                </span>
                100% Confidential
              </span>
              <span className="text-[#9da4ad]">&bull;</span>
              <span className="inline-flex items-center gap-2">
                <span className="text-[#3b8f3b]">
                  <CheckCircleIcon />
                </span>
                Trusted by Experts
              </span>
            </motion.div>
          </div>

          <div className="relative min-h-[475px] sm:min-h-[575px] lg:min-h-[705px]">
            <HeroVisual />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
