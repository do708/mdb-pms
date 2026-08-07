import { pageTitle } from "@/lib/metadata";

export const metadata = pageTitle("Klantformulier");

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
