import type { Metadata } from "next";

/** Merknaam in de browsertab (titeltemplate: `Pro System - {pagina}`). */
export const APP_NAME = "Pro System";

export function pageTitle(name: string): Metadata {
    return { title: name };
}
