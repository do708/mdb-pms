import { pageTitle } from "@/lib/metadata";

export const metadata = pageTitle("Materialen");

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
