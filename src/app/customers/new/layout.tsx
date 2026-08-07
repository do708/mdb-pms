import { pageTitle } from "@/lib/metadata";

export const metadata = pageTitle("Nieuwe opdrachtgever");

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
