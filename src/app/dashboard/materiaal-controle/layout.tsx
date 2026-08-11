import { pageTitle } from "@/lib/metadata";

export const metadata = pageTitle("Materiaal controleren");

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
