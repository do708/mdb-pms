import { pageTitle } from "@/lib/metadata";

export const metadata = pageTitle("Mijn dashboard");

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
