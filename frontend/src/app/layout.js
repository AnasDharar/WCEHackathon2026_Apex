import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { Fjalla_One, Jost } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fjallaOne = Fjalla_One({
  weight: "400",
  variable: "--font-fjalla",
  subsets: ["latin"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

export const metadata = {
  title: "Manah Arogya",
  description: "Your wellness companion",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.cdnfonts.com/css/product-sans"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${jakarta.variable} ${geistMono.variable} ${fjallaOne.variable} ${jost.variable} antialiased font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
