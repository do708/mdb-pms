import { pageTitle } from "@/lib/metadata";

export const metadata = pageTitle("Nieuw project");

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
