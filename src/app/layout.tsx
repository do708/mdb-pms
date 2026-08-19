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
    applicationName: APP_NAME,
    icons: {
        icon: [
            { url: "/favicon.ico", sizes: "48x48" },
            { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
            { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
        apple: [
            { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
        ],
        shortcut: "/favicon.ico",
    },
    manifest: "/manifest.webmanifest",
    appleWebApp: {
        capable: true,
        title: "MDB PMS",
        statusBarStyle: "black",
    },
};

export const viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: "#0066FF",
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