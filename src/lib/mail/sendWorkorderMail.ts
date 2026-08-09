import {
    internalNotificationRecipients,
    sendResendEmail,
} from "@/lib/email/resendClient";

interface WorkorderMailProps {
    pdf: Buffer;
    filename: string;
    workorderNumber: string;
    customer?: string;
    project?: string;
}

export async function sendWorkorderMail({
    pdf,
    filename,
    workorderNumber,
    customer,
    project,
}: WorkorderMailProps) {
    await sendResendEmail({
        from: "MDB PMS <noreply@mdb-networks.nl>",
        to: internalNotificationRecipients(),
        subject: `Opdracht ${workorderNumber} afgerond`,
        html: `
        <h2>Opdracht afgerond</h2>
        <p>
            Opdracht:
            <strong>${workorderNumber}</strong>
        </p>
        <p>
            Opdrachtgever:
            ${customer ?? ""}
        </p>
        <p>
            Project:
            ${project ?? ""}
        </p>
        <p>
            De opdracht is automatisch gegenereerd
            vanuit MDB Project Management Systeem.
        </p>
        `,
        attachments: [
            {
                filename,
                content: pdf,
            },
        ],
    });
}
