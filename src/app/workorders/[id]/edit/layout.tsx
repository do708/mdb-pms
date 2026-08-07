import { pageTitle } from "@/lib/metadata";

export const metadata = pageTitle("Werkbon bewerken");

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
