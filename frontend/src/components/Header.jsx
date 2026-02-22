"use client";
import { useState, useEffect, useRef } from "react";
<<<<<<< HEAD
import Link from "next/link";
=======
>>>>>>> fe284132db5241f483ddb0ebc2838f05aede3f0a
import { auth } from "../../firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNotification } from "@/context/NotificationContext";

export default function Header({ title, subtitle }) {
  const [user, setUser] = useState(null);
<<<<<<< HEAD
  const { notifications, unreadCount, markAllAsRead } =
    useNotification() || {
      notifications: [],
      unreadCount: 0,
      markAllAsRead: () => {},
    };
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);

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
    setShowNotifications(!showNotifications);
    setShowProfileMenu(false);
  };

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
    setShowNotifications(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };
=======
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdown = useRef(null);
  
  useEffect(() => {
    if (showDropdown) {
      dropdown.current?.classList.remove("hidden");
      dropdown.current?.classList.add("block");
    } else {
      dropdown.current?.classList.add("hidden");
      dropdown.current?.classList.remove("block");
    }
  }, [showDropdown]);
>>>>>>> fe284132db5241f483ddb0ebc2838f05aede3f0a

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);
  return (
    <div className="mb-6 flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold font-google text-gray-800">
          {title}
        </h1>
        <p className="text-gray-500 text-sm">{subtitle}</p>
      </div>

<<<<<<< HEAD
      <div className="flex items-center gap-3">
        <button
          className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 border-2 border-gray-200 hover:bg-gray-100 transition-colors"
          aria-label="Info"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_429_11160)">
              <circle
                cx="12"
                cy="11.9999"
                r="9"
                stroke="#292929"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect
                x="12"
                y="8"
                width="0.01"
                height="0.01"
                stroke="#292929"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M12 12V16"
                stroke="#292929"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <defs>
              <clipPath id="clip0_429_11160">
                <rect width="24" height="24" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </button>

        <div className="relative" ref={menuRef}>
          <div className="flex items-center gap-3 px-4 h-12 rounded-full bg-gray-50 border-2 border-gray-200">
            <button
              className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition-colors"
              onClick={handleNotificationClick}
              aria-label="Notifications"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.00195 17H5.60636C4.34793 17 3.71872 17 3.58633 16.9023C3.4376 16.7925 3.40126 16.7277 3.38515 16.5436C3.37082 16.3797 3.75646 15.7486 4.52776 14.4866C5.32411 13.1835 6.00031 11.2862 6.00031 8.6C6.00031 7.11479 6.63245 5.69041 7.75766 4.6402C8.88288 3.59 10.409 3 12.0003 3C13.5916 3 15.1177 3.59 16.2429 4.6402C17.3682 5.69041 18.0003 7.11479 18.0003 8.6C18.0003 11.2862 18.6765 13.1835 19.4729 14.4866C20.2441 15.7486 20.6298 16.3797 20.6155 16.5436C20.5994 16.7277 20.563 16.7925 20.4143 16.9023C20.2819 17 19.6527 17 18.3943 17H15.0003M9.00195 17L9.00031 18C9.00031 19.6569 10.3435 21 12.0003 21C13.6572 21 15.0003 19.6569 15.0003 18V17M9.00195 17H15.0003"
                  stroke="#000000"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              className="flex items-center gap-2 cursor-pointer"
              onClick={handleProfileClick}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-700">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                    {user?.displayName?.charAt(0) ||
                      user?.email?.charAt(0) ||
                      "U"}
                  </div>
                )}
              </div>
              <div className="hidden sm:block font-google text-left">
                <div className="text-[14px] text-gray-700 font-bold">
                  {user?.displayName || "User"}
                </div>
                <div className="text-[10px] text-gray-400 max-w-[140px] truncate">
                  {user?.email || ""}
                </div>
              </div>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7 10L12 15L17 10"
                  stroke="#000000"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {showNotifications && (
            <div className="absolute right-0 top-14 w-80 bg-white shadow-xl rounded-2xl border border-gray-100 z-50 overflow-hidden transform transition-all duration-200 ease-out origin-top-right">
              <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center backdrop-blur-sm">
                <h3 className="font-semibold text-gray-800 text-sm">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications?.length === 0 ? (
                  <div className="p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-gray-400"
                      >
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">
                      No new notifications
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      We'll let you know when something arrives.
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notif.read ? "bg-emerald-50/30" : ""
                      }`}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                            !notif.read ? "bg-emerald-500" : "bg-transparent"
                          }`}
                        />
                        <div>
                          <h4
                            className={`text-sm ${
                              !notif.read
                                ? "font-semibold text-gray-900"
                                : "font-medium text-gray-700"
                            }`}
                          >
                            {notif.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-2 font-medium">
                            {new Date(notif.timestamp).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-lg border border-gray-100 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-xs text-gray-500 mb-1">Signed in as</p>
                <p className="text-sm font-medium text-gray-800 truncate">
                  {user?.email || "Guest"}
                </p>
              </div>
              <div className="py-1">
                {user ? (
                  <>
                    <Link
                      href="/home"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    href="/signin"
                    className="block px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50"
                  >
                    Login / Sign up
                  </Link>
                )}
              </div>
            </div>
          )}
=======
      <div className="flex justify-center items-center gap-2">
        <div className="flex justify-center items-center gap-4 px-4 h-12 rounded-full bg-gray-50 border-2 border-gray-200">
          <div>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.00195 17H5.60636C4.34793 17 3.71872 17 3.58633 16.9023C3.4376 16.7925 3.40126 16.7277 3.38515 16.5436C3.37082 16.3797 3.75646 15.7486 4.52776 14.4866C5.32411 13.1835 6.00031 11.2862 6.00031 8.6C6.00031 7.11479 6.63245 5.69041 7.75766 4.6402C8.88288 3.59 10.409 3 12.0003 3C13.5916 3 15.1177 3.59 16.2429 4.6402C17.3682 5.69041 18.0003 7.11479 18.0003 8.6C18.0003 11.2862 18.6765 13.1835 19.4729 14.4866C20.2441 15.7486 20.6298 16.3797 20.6155 16.5436C20.5994 16.7277 20.563 16.7925 20.4143 16.9023C20.2819 17 19.6527 17 18.3943 17H15.0003M9.00195 17L9.00031 18C9.00031 19.6569 10.3435 21 12.0003 21C13.6572 21 15.0003 19.6569 15.0003 18V17M9.00195 17H15.0003" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

        </div>

        <div className="relative flex justify-center items-center gap-2 cursor-pointer px-4 h-12 rounded-full bg-gray-50 border-2 border-gray-200" onClick={() => setShowDropdown(!showDropdown)}>
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-700">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
              </div>
            )}
          </div>
          <div className="font-google">
            <div className="text-[14px] text-gray-700 font-bold">{user?.displayName || "User"}</div>
            <div className="text-[10px] text-gray-400">{user?.email || ""}</div>
          </div>
          <div className="cursor-pointer hover:bg-gray-100 rounded-full" onClick={() => setShowDropdown(!showDropdown)}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 10L12 15L17 10" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="absolute top-12 border-2 border-gray-200 left-0 w-48 bg-white rounded-lg hidden" ref={dropdown}>
            <div className="px-4 py-2 hover:bg-gray-100">Account Settings</div>
            <div className="px-4 py-2 hover:bg-gray-100">Edit Profile</div>
            <div className="px-4 py-2 hover:bg-gray-100 text-red-600 font-semibold">Logout</div>
          </div>
>>>>>>> fe284132db5241f483ddb0ebc2838f05aede3f0a
        </div>
      </div>
    </div>
  );
}
