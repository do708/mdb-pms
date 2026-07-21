import AuthProvider from "@/components/providers/AuthProvider";
import AppShell from "@/components/layout/AppShell";

import "./globals.css";


export default function RootLayout({

    children,

}: Readonly<{

    children: React.ReactNode;

}>) {


    return (

        <html lang="nl">

            <body>

                <AuthProvider>

                    <AppShell>

                        {children}

                    </AppShell>

                </AuthProvider>

            </body>

        </html>

    );

}