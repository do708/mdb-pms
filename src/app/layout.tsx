import AuthProvider from "@/components/providers/AuthProvider";
import AppShell from "@/components/layout/AppShell";

import "./globals.css";

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