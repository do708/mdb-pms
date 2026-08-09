import { pageTitle } from "@/lib/metadata";

export const metadata = pageTitle("Opdracht inplannen");

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
