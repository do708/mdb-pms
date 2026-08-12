import { Resend } from "resend";

type SendPayload = Parameters<Resend["emails"]["send"]>[0];

export function getResend(): Resend | null {
    if (!process.env.RESEND_API_KEY) {
        return null;
    }

    return new Resend(process.env.RESEND_API_KEY);
}

/** Resend gooit niet bij API-fouten — altijd error checken. */
export async function sendResendEmail(payload: SendPayload) {
    const resend = getResend();

    if (!resend) {
        throw new Error("RESEND_API_KEY ontbreekt");
    }

    const { data, error } = await resend.emails.send(payload);

    if (error) {
        throw new Error(error.message || "E-mail versturen mislukt");
    }

    return data;
}

export function projectMailbox(): string {
    return process.env.PROJECT_EMAIL || "projects@mdb-networks.nl";
}

export function infoMailbox(): string {
    return "info@mdb-networks.nl";
}

/** Interne meldingen (aanvragen, opdrachten, niet-gereed, afspraak-BCC). Formulieren: to projectMailbox(), cc infoMailbox(). */
export function internalNotificationRecipients(): string[] {
    return [projectMailbox()];
}
