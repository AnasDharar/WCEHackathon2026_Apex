"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, ShieldAlert, Stethoscope, BookOpen, Calendar, Bell } from "lucide-react";

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: undefined },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Moderation", href: "/admin/moderation", icon: ShieldAlert },
    { name: "Therapists", href: "/admin/therapists", icon: Stethoscope },
    { name: "Resources", href: "/admin/resources", icon: BookOpen },
    { name: "Events", href: "/admin/events", icon: Calendar },
    { name: "Alerts", href: "/admin/alerts", icon: Bell },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            Admin Panel
          </h2>
        </div>
        <nav className="mt-6 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-emerald-50 text-emerald-600 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-emerald-600"
                }`}
              >
                {Icon && <Icon className="w-5 h-5" />}
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
