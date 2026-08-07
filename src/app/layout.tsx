import type { Metadata } from "next";

import AuthProvider from "@/components/providers/AuthProvider";
import AppShell from "@/components/layout/AppShell";
import { APP_NAME } from "@/lib/metadata";

import "./globals.css";

export const metadata: Metadata = {
    title: {
        default: APP_NAME,
        template: `${APP_NAME} - %s`,
    },
};

export const viewport = {
    width: "device-width",
    initialScale: 1,
    // Geen viewportFit cover: op iOS Safari gaf dat een grote
    // lege strook onder de vaste monteur-footer.
};

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