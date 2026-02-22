"use client";
import { useState, useEffect } from "react";
import { auth } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { redirect } from "next/navigation";

export default function Header({ title, subtitle }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  if(!user){
    redirect("/signin");
  }
  return (
    <div className="mb-6 flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold font-google text-gray-800">{title}</h1>
        <p className="text-gray-500 text-sm">{subtitle}</p>
      </div>

      <div className="flex justify-center items-center gap-2">
        <div className="flex justify-center items-center gap-4 px-4 h-12 rounded-full bg-gray-50 border-2 border-gray-200">
          <div>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.00195 17H5.60636C4.34793 17 3.71872 17 3.58633 16.9023C3.4376 16.7925 3.40126 16.7277 3.38515 16.5436C3.37082 16.3797 3.75646 15.7486 4.52776 14.4866C5.32411 13.1835 6.00031 11.2862 6.00031 8.6C6.00031 7.11479 6.63245 5.69041 7.75766 4.6402C8.88288 3.59 10.409 3 12.0003 3C13.5916 3 15.1177 3.59 16.2429 4.6402C17.3682 5.69041 18.0003 7.11479 18.0003 8.6C18.0003 11.2862 18.6765 13.1835 19.4729 14.4866C20.2441 15.7486 20.6298 16.3797 20.6155 16.5436C20.5994 16.7277 20.563 16.7925 20.4143 16.9023C20.2819 17 19.6527 17 18.3943 17H15.0003M9.00195 17L9.00031 18C9.00031 19.6569 10.3435 21 12.0003 21C13.6572 21 15.0003 19.6569 15.0003 18V17M9.00195 17H15.0003" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

        </div>

        <div className="flex justify-center items-center gap-2 cursor-pointer px-4 h-12 rounded-full bg-gray-50 border-2 border-gray-200">
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
          <div>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 10L12 15L17 10" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
