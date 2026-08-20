import { decompressRTF } from "@kenjiuno/decompressrtf";
import type { FieldsData } from "@kenjiuno/msgreader";
import MsgReaderImport from "@kenjiuno/msgreader";
import { simpleParser, type AddressObject } from "mailparser";

export type ParsedEmailAttachment = {
    index: number;
    name: string;
    contentType: string | null;
    size: number | null;
};

export type ParsedEmail = {
    from: string | null;
    to: string | null;
    cc: string | null;
    date: string | null;
    subject: string | null;
    bodyHtml: string | null;
    bodyText: string | null;
    attachments: ParsedEmailAttachment[];
};

export type NestedEmailAttachment = {
    filename: string;
    contentType: string;
    content: Buffer;
};

type MsgReaderInstance = {
    getFileData: () => FieldsData;
    getAttachment: (attach: number | FieldsData) => {
        fileName: string;
        content: Uint8Array;
    };
};

type MsgReaderConstructor = new (
    arrayBuffer: ArrayBuffer | DataView
) => MsgReaderInstance;

function resolveMsgReader(): MsgReaderConstructor {
    const imported = MsgReaderImport as unknown as
        | MsgReaderConstructor
        | { default?: unknown };

    const candidates = [
        imported,
        typeof imported === "object" && imported
            ? (imported as { default?: unknown }).default
            : null,
        typeof imported === "object"
        && imported
        && (imported as { default?: { default?: unknown } }).default
            ? (imported as { default: { default?: unknown } }).default.default
            : null,
    ];

    for (const candidate of candidates) {
        if (typeof candidate === "function") {
            return candidate as MsgReaderConstructor;
        }
    }

    throw new Error("MSG-lezer niet beschikbaar");
}

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
    return Uint8Array.from(buffer).buffer;
}

function toIso(value?: string | Date | null): string | null {
    if (!value) {
        return null;
    }

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toISOString();
}

function displayPerson(name?: string | null, email?: string | null): string | null {
    const n = name?.trim() || "";
    const e = email?.trim() || "";

    if (n && e && n !== e) {
        return `${n} <${e}>`;
    }

    return n || e || null;
}

function formatRecipients(
    recipients: FieldsData[] | undefined,
    type: "to" | "cc"
): string | null {
    const names = (recipients ?? [])
        .filter((recipient) => (recipient.recipType || "to") === type)
        .map((recipient) =>
            displayPerson(recipient.name, recipient.smtpAddress || recipient.email)
        )
        .filter((value): value is string => Boolean(value));

    return names.length > 0 ? names.join(", ") : null;
}

function decodeHtmlBytes(bytes: Uint8Array): string {
    if (bytes.length >= 2 && bytes[1] === 0) {
        return Buffer.from(bytes).toString("utf16le");
    }

    return Buffer.from(bytes).toString("utf8");
}

function rtfToPlainText(rtf: string): string {
    return rtf
        .replace(/\\par[d]?/gi, "\n")
        .replace(/\\tab/gi, "\t")
        .replace(/\\'([0-9a-fA-F]{2})/g, (_, hex: string) =>
            String.fromCharCode(parseInt(hex, 16))
        )
        .replace(/\\[a-z]+\-?\d* ?/gi, "")
        .replace(/[{}]/g, "")
        .replace(/\r\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function looksLikeRtfGarbage(value: string): boolean {
    return /LatentStyles|mso-|\\htmltag|<w:WordDocument|\\fromhtml/i.test(value);
}

function extractHtmlFromOutlookRtf(rtf: string): string | null {
    if (!/\\fromhtml/i.test(rtf)) {
        return null;
    }

    const start = rtf.search(/<html\b/i);

    if (start < 0) {
        return null;
    }

    let html = rtf.slice(start);
    const end = html.search(/<\/html>/i);

    if (end >= 0) {
        html = html.slice(0, end + "</html>".length);
    }

    html = html
        .replace(/\\htmlrtf0?/g, "")
        .replace(/\{\\\*\\htmltag\d+\s*/g, "")
        .replace(/\\u(-?\d+)\??/g, (_, code: string) => {
            const n = Number(code);
            return String.fromCharCode(n < 0 ? n + 65536 : n);
        })
        .replace(/\\'([0-9a-fA-F]{2})/g, (_, hex: string) =>
            String.fromCharCode(parseInt(hex, 16))
        )
        .replace(/\\par[d]?/gi, "\n")
        .replace(/\\tab/gi, "\t")
        .replace(/\\line /gi, "\n")
        .replace(/\\~ /g, " ")
        .replace(/\\[{}\\]/g, (match) => match.slice(-1))
        .replace(/\\[a-z]+\-?\d* ?/gi, "")
        .replace(/[{}]/g, "")
        .replace(/\r\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    return html.includes("<") ? html : null;
}

function bodyFromMsg(info: FieldsData): { html: string | null; text: string | null } {
    const htmlFromString = info.bodyHtml?.trim() || null;
    const htmlFromBytes = info.html?.length
        ? decodeHtmlBytes(info.html).trim()
        : "";

    let text = info.body?.trim() || null;
    let html = htmlFromString || htmlFromBytes || null;

    if (!html && info.compressedRtf?.length) {
        try {
            const decompressed = decompressRTF(Array.from(info.compressedRtf));
            const rtf = Buffer.from(decompressed).toString("latin1");
            html = extractHtmlFromOutlookRtf(rtf);

            if (!html && !text) {
                const plain = rtfToPlainText(rtf);

                if (plain && !looksLikeRtfGarbage(plain)) {
                    text = plain;
                }
            }
        } catch {
            // RTF is optioneel; zonder body tonen we een lege mail.
        }
    }

    return { html, text };
}

function contentTypeForName(name: string): string {
    const lower = name.toLowerCase();

    if (lower.endsWith(".msg")) {
        return "application/vnd.ms-outlook";
    }

    if (lower.endsWith(".eml")) {
        return "message/rfc822";
    }

    if (lower.endsWith(".pdf")) {
        return "application/pdf";
    }

    if (lower.endsWith(".png")) {
        return "image/png";
    }

    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
        return "image/jpeg";
    }

    return "application/octet-stream";
}

function shouldListMsgAttachment(att: FieldsData): boolean {
    if (att.attachmentHidden) {
        return false;
    }

    const name = att.fileName || att.name || "";

    if (att.pidContentId && /\.(png|jpe?g|gif|bmp|wmz|mso)$/i.test(name)) {
        return false;
    }

    return true;
}

function msgAttachmentName(att: FieldsData): string {
    if (att.innerMsgContent) {
        return (
            att.innerMsgContentFields?.subject
            || att.name
            || att.fileName
            || "ingebed bericht.msg"
        );
    }

    return att.fileName || att.name || "bijlage";
}

function createMsgReader(buffer: Buffer): MsgReaderInstance {
    const MsgReader = resolveMsgReader();
    return new MsgReader(toArrayBuffer(buffer));
}

function parseMsg(buffer: Buffer): ParsedEmail {
    const reader = createMsgReader(buffer);
    const info = reader.getFileData();

    if (info.error) {
        throw new Error(info.error);
    }

    const { html, text } = bodyFromMsg(info);
    const attachments = (info.attachments ?? [])
        .map((att, index) => ({ att, index }))
        .filter(({ att }) => shouldListMsgAttachment(att))
        .map(({ att, index }) => ({
            index,
            name: msgAttachmentName(att),
            contentType: contentTypeForName(msgAttachmentName(att)),
            size: att.contentLength ?? null,
        }));

    return {
        from: displayPerson(
            info.senderName,
            info.senderSmtpAddress || info.smtpAddress || info.senderEmail
        ),
        to: formatRecipients(info.recipients, "to"),
        cc: formatRecipients(info.recipients, "cc"),
        date: toIso(info.clientSubmitTime || info.messageDeliveryTime || null),
        subject: info.subject?.trim() || null,
        bodyHtml: html,
        bodyText: text,
        attachments,
    };
}

function addressText(
    value?: AddressObject | AddressObject[] | null
): string | null {
    if (!value) {
        return null;
    }

    const list = Array.isArray(value) ? value : [value];
    const text = list
        .map((item) => item.text?.trim())
        .filter((item): item is string => Boolean(item))
        .join(", ");

    return text || null;
}

async function parseEml(buffer: Buffer): Promise<ParsedEmail> {
    const mail = await simpleParser(buffer);
    const html = typeof mail.html === "string" && mail.html.trim()
        ? mail.html
        : null;

    return {
        from: addressText(mail.from),
        to: addressText(mail.to),
        cc: addressText(mail.cc),
        date: toIso(mail.date ?? null),
        subject: mail.subject?.trim() || null,
        bodyHtml: html,
        bodyText: mail.text?.trim() || null,
        attachments: mail.attachments
            .map((att, index) => ({ att, index }))
            .filter(({ att }) => !att.related)
            .map(({ att, index }) => ({
                index,
                name: att.filename || att.cid || `bijlage-${index + 1}`,
                contentType: att.contentType || null,
                size: att.size,
            })),
    };
}

export function isEmailFilename(name: string | null | undefined): boolean {
    const lower = (name ?? "").toLowerCase();
    return lower.endsWith(".msg") || lower.endsWith(".eml");
}

export async function parseEmailFile(
    buffer: Buffer,
    filename: string
): Promise<ParsedEmail> {
    const lower = filename.toLowerCase();

    if (lower.endsWith(".msg")) {
        return parseMsg(buffer);
    }

    if (lower.endsWith(".eml")) {
        return parseEml(buffer);
    }

    throw new Error("Dit bestand is geen e-mail");
}

export async function extractNestedEmailAttachment(
    buffer: Buffer,
    filename: string,
    index: number
): Promise<NestedEmailAttachment | null> {
    const lower = filename.toLowerCase();

    if (lower.endsWith(".msg")) {
        const reader = createMsgReader(buffer);
        const info = reader.getFileData();
        const att = info.attachments?.[index];

        if (!att) {
            return null;
        }

        const data = reader.getAttachment(att);
        const name = data.fileName || msgAttachmentName(att);

        return {
            filename: name,
            contentType: contentTypeForName(name),
            content: Buffer.from(data.content),
        };
    }

    if (lower.endsWith(".eml")) {
        const mail = await simpleParser(buffer);
        const att = mail.attachments[index];

        if (!att) {
            return null;
        }

        return {
            filename: att.filename || att.cid || `bijlage-${index + 1}`,
            contentType: att.contentType || "application/octet-stream",
            content: Buffer.isBuffer(att.content)
                ? att.content
                : Buffer.from(att.content),
        };
    }

    return null;
}
