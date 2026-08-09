import type { Metadata } from "next";

/** Merknaam in de browsertab (titeltemplate: `Pro Management Systeem - {pagina}`). */
export const APP_NAME = "Pro Management Systeem";
export function pageTitle(name: string): Metadata {
    return { title: name };
}
