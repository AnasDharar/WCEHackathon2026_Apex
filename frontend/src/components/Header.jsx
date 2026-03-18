"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { auth } from "../../firebaseConfig";
import { useNotification } from "@/context/NotificationContext";
import { clearUserSession, firstNameFromName, saveUserSession } from "@/lib/userSession";

const box_shadow = "shadow-[0_4px_20px_rgba(0,0,0,0.03)]";

export default function Header({ title, subtitle }) {
  const [user, setUser] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);

  const { notifications, unreadCount, markAllAsRead } = useNotification() || {
    notifications: [],
    unreadCount: 0,
    markAllAsRead: () => { },
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        saveUserSession({
          id: currentUser.uid,
          name: currentUser.displayName || "",
          first_name: firstNameFromName(currentUser.displayName || "", currentUser.email || ""),
          email: currentUser.email || "",
        });
      } else {
        clearUserSession();
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowNotifications(false);
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = () => {
    if (!showNotifications && unreadCount > 0) {
      markAllAsRead();
    }
    setShowNotifications((prev) => !prev);
    setShowProfileMenu(false);
  };

  const handleProfileClick = () => {
    setShowProfileMenu((prev) => !prev);
    setShowNotifications(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } finally {
      clearUserSession();
      setShowProfileMenu(false);
    }
  };

  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="font-google text-xl font-semibold text-neutral-900">{title}</h1>
        <p className="text-[13px] text-neutral-500 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center gap-2.5" ref={menuRef}>
        <button
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${box_shadow} bg-white transition-colors hover:bg-neutral-50`}
          aria-label="Info"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#737373" strokeWidth="1.8" />
            <path d="M12 11.5V16" stroke="#737373" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="8" r="1" fill="#737373" />
          </svg>
        </button>

        <div className="relative">
          <div className={`flex h-11 items-center gap-2.5 rounded-xl ${box_shadow} bg-white px-3`}>
            <button
              className="relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-neutral-50"
              onClick={handleNotificationClick}
              aria-label="Notifications"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 17H5.6c-1.26 0-1.89 0-2.01-.1-.15-.11-.18-.18-.2-.36-.01-.16.37-.79 1.14-2.05C5.32 13.18 6 11.29 6 8.6 6 7.11 6.63 5.69 7.76 4.64A6.17 6.17 0 0 1 12 3c1.6 0 3.12.59 4.24 1.64A5.9 5.9 0 0 1 18 8.6c0 2.69.68 4.58 1.47 5.89.77 1.26 1.15 1.89 1.14 2.05-.02.18-.05.25-.2.36-.12.1-.75.1-2 .1H15m-6 0V18a3 3 0 0 0 6 0v-1"
                  stroke="#525252"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            <div className="h-5 w-px bg-neutral-100" />

            <button className="flex items-center gap-2" onClick={handleProfileClick}>
              <div className="h-7 w-7 overflow-hidden rounded-full border border-neutral-200">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-neutral-800 text-xs font-semibold text-white">
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </div>
                )}
              </div>
              <div className="hidden text-left sm:block">
                <div className="font-google text-[13px] font-semibold text-neutral-700">
                  {user?.displayName || "User"}
                </div>
                <div className="max-w-[130px] truncate text-[10px] text-neutral-400">
                  {user?.email || ""}
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 10L12 15L17 10"
                  stroke="#a3a3a3"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {showNotifications && (
            <div className={`absolute right-0 top-14 z-50 w-80 overflow-hidden rounded-2xl bg-white ${box_shadow}`}>
              <div className="flex items-center justify-between border-b border-neutral-50 px-4 py-3">
                <h3 className="text-sm font-semibold text-neutral-800">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-700"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-neutral-400">No new notifications</div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`border-b border-neutral-50 p-4 ${notif.read ? "bg-white" : "bg-neutral-50/50"
                        }`}
                    >
                      <h4
                        className={`text-sm ${notif.read ? "font-medium text-neutral-600" : "font-semibold text-neutral-900"
                          }`}
                      >
                        {notif.title}
                      </h4>
                      <p className="mt-1 text-xs text-neutral-400">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {showProfileMenu && (
            <div className={`absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl bg-white ${box_shadow}`}>
              <div className="border-b border-neutral-50 px-4 py-3">
                <p className="mb-1 text-[11px] text-neutral-400">Signed in as</p>
                <p className="truncate text-sm font-medium text-neutral-800">{user?.email || "Guest"}</p>
              </div>
              <div className="py-1">
                {user ? (
                  <>
                    <Link href="/home" className="block px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50">
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    href="/signin"
                    className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    Login / Sign up
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
