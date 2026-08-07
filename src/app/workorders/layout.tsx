import { pageTitle } from "@/lib/metadata";

export const metadata = pageTitle("Werkbonnen");

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
