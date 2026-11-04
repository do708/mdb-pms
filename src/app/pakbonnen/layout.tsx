import { pageTitle } from "@/lib/metadata";

export const metadata = pageTitle("Pakbon uploaden");

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
