import { pageTitle } from "@/lib/metadata";

export const metadata = pageTitle("Dashboard");

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
