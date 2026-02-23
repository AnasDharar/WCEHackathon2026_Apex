import Image from "next/image";
import Link from "next/link";

const FOOTER_COLUMNS = [
  {
    title: "Company",
    links: [
      { label: "Features", href: "#" },
      { label: "About", href: "#" },
      { label: "Download", href: "#" },
      { label: "Blogs", href: "#" },
      { label: "Contact Us", href: "#" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "FAQs", href: "#" },
      { label: "Help Center", href: "#" },
      { label: "Customer Support", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "#" },
      { label: "Privacy Policy", href: "#" },
    ],
  },
];

const SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: "#",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M14 8h3V4h-3c-2.8 0-5 2.2-5 5v3H6v4h3v4h4v-4h3.2l.8-4H13V9c0-.6.4-1 1-1Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    label: "Twitter",
    href: "#",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M18.9 6.2c-.6.3-1.2.5-1.9.6.7-.4 1.2-1 1.4-1.8-.6.4-1.4.7-2.1.9a3.3 3.3 0 0 0-5.7 2.2c0 .2 0 .5.1.7-2.7-.1-5.1-1.4-6.7-3.4-.3.5-.4 1-.4 1.6 0 1.1.6 2.1 1.5 2.7-.5 0-1-.2-1.5-.4v.1c0 1.6 1.2 2.9 2.7 3.2-.3.1-.6.1-.9.1-.2 0-.4 0-.6-.1.4 1.3 1.6 2.2 3 2.2A6.7 6.7 0 0 1 4 17.6a9.4 9.4 0 0 0 5.1 1.5c6.1 0 9.5-5.1 9.5-9.5v-.4c.7-.5 1.2-1 1.7-1.7-.7.3-1.3.5-2 .6Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "#",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6.7 8.5A1.8 1.8 0 1 0 6.7 5a1.8 1.8 0 0 0 0 3.5ZM5 19h3.4V10H5v9Zm5.4 0H14v-4.4c0-1.2.2-2.4 1.7-2.4s1.5 1.4 1.5 2.5V19H21v-5.1c0-2.5-.5-4.3-3.4-4.3-1.4 0-2.3.8-2.7 1.5h-.1V10h-3.4v9Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "#",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M20.4 7.4c-.2-.8-.8-1.4-1.6-1.6C17.4 5.4 12 5.4 12 5.4s-5.4 0-6.8.4c-.8.2-1.4.8-1.6 1.6-.4 1.4-.4 4.4-.4 4.4s0 3 .4 4.4c.2.8.8 1.4 1.6 1.6 1.4.4 6.8.4 6.8.4s5.4 0 6.8-.4c.8-.2 1.4-.8 1.6-1.6.4-1.4.4-4.4.4-4.4s0-3-.4-4.4ZM10.2 14.3V9.3l4.3 2.5-4.3 2.5Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    label: "WhatsApp",
    href: "#",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 4.3a7.7 7.7 0 0 0-6.6 11.7L4.3 20l4.1-1.1A7.7 7.7 0 1 0 12 4.3Zm4.5 10.9c-.2.5-1.1.9-1.5 1-.4 0-.9.1-1.5-.1-.4-.1-.9-.3-1.5-.6-2.6-1.1-4.2-3.9-4.3-4.1-.1-.2-1-1.4-1-2.6 0-1.2.6-1.9.8-2.2.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .5.4.2.5.7 1.7.7 1.8.1.2.1.4 0 .6-.1.2-.2.3-.3.5l-.3.4c-.1.1-.2.3-.1.5.1.2.5.9 1.1 1.4.7.7 1.4 1 1.6 1.1.2.1.4.1.6-.1.2-.2.7-.8.9-1 .2-.2.4-.2.6-.1l1.8.9c.2.1.4.2.4.3 0 .1 0 .8-.2 1.3Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-br from-orange-100 via-white to-green-100 px-4 pb-12 pt-16 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-[260px] w-[70%] -translate-x-1/2 rounded-full bg-gradient-to-r from-[#f6ad55]/36 via-[#fde68a]/28 to-[#86efac]/30 blur-3xl" />
        <div className="absolute right-[-8%] top-[18%] h-[340px] w-[340px] rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.16),rgba(255,255,255,0)_70%)] blur-2xl" />
        <div className="absolute bottom-[-120px] left-1/2 h-[280px] w-[130%] -translate-x-1/2 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.16),rgba(255,255,255,0)_66%)] opacity-60 blur-3xl" />
        <div className="absolute bottom-[18%] right-[8%] h-[120px] w-[320px] rounded-[100%] bg-[linear-gradient(90deg,rgba(245,158,11,0.2),rgba(34,197,94,0.18),rgba(255,255,255,0))] blur-2xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl text-center">
        <Image
          src="/logo_1_transparent.png"
          alt="Manah Arogya"
          width={360}
          height={82}
          className="mx-auto h-14 w-auto object-contain sm:h-16"
        />
        <p className="mt-4 text-[clamp(1.2rem,2.6vw,2rem)] font-semibold tracking-tight text-[#1e2740]">
          Nurturing Minds, Embracing Wellness
        </p>
        <div className="mx-auto mt-6 h-px w-full max-w-xl bg-gradient-to-r from-transparent via-[#f59e0b]/70 to-[#16a34a]/70" />
      </div>

      <div className="relative z-10 mx-auto mt-10 max-w-7xl rounded-3xl border border-white/40 bg-white/60 px-6 py-10 shadow-xl backdrop-blur-md sm:px-8 sm:py-12">
        <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-3 md:text-left">
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-lg font-semibold text-[#1f2937]">{column.title}</h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-[15px] font-medium text-[#4b5563] transition-colors hover:text-[#109f5e]"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {SOCIAL_LINKS.map((social) => (
            <Link
              key={social.label}
              href={social.href}
              aria-label={social.label}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/55 bg-white/70 text-[#243040] shadow-md backdrop-blur-md transition-transform duration-300 hover:scale-110 hover:text-[#109f5e]"
            >
              {social.icon}
            </Link>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          {"\u00A9"} 2024 Manah Arogya. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
