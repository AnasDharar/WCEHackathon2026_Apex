import "./globals.css";

export const metadata = {
  title: "Manah Arogya",
  description: "Your wellness companion",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
