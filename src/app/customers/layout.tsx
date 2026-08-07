import { pageTitle } from "@/lib/metadata";

export const metadata = pageTitle("Opdrachtgevers");

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
