import { userDocumentTypeLabel } from "@/constants/userDocumentTypes";

export type UserDocumentRow = {
    id: string;
    userId: string;
    type: string;
    number: string | null;
    expiresAt: Date | null;
    neverExpires: boolean;
    fileUrl: string;
    fileName: string | null;
    originalName: string | null;
    contentType: string | null;
    expiryNotifiedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

export function serializeUserDocument(doc: UserDocumentRow) {
    return {
        id: doc.id,
        userId: doc.userId,
        type: doc.type,
        typeLabel: userDocumentTypeLabel(doc.type),
        number: doc.number ?? "",
        expiresAt: doc.expiresAt
            ? doc.expiresAt.toISOString().slice(0, 10)
            : null,
        neverExpires: doc.neverExpires,
        fileUrl: doc.fileUrl,
        fileName: doc.fileName,
        originalName: doc.originalName,
        contentType: doc.contentType,
        expiryNotifiedAt: doc.expiryNotifiedAt
            ? doc.expiryNotifiedAt.toISOString()
            : null,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
    };
}
