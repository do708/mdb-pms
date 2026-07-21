import "./globals.css";
import AppShell from "@/components/layout/AppShell";

export const metadata = {
  title: "MDB PMS",
  description: "Project Management System",
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (

    <html lang="nl">

      <body>

        <AppShell>

            {children}

        </AppShell>

      </body>

    </html>

  );
}