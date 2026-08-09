import { pageTitle } from "@/lib/metadata";

export const metadata = pageTitle("Opdrachten");

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
