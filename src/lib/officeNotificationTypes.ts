export type OfficeNotificationSoort =
    | "aanvraag"
    | "formulier"
    | "telaat"
    | "materiaal";

export interface OfficeNotification {
    id: string;
    soort: OfficeNotificationSoort;
    title: string;
    subtitle: string;
    href: string;
}

export const OFFICE_NOTIFICATION_LABEL: Record<
    OfficeNotificationSoort,
    string
> = {
    aanvraag: "Aanvraag",
    formulier: "Formulier",
    telaat: "Te laat invullen",
    materiaal: "Materiaal klaarzetten",
};
