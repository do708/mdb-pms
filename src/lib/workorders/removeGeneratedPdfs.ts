import { createClient } from "@supabase/supabase-js";

import { prisma } from "@/lib/prisma";
import {
    deleteDocumentenboxFromNas,
    supabaseStoragePathFromUrl,
} from "@/lib/documents/documentenboxStorage";
import { nasPathFromStored } from "@/lib/nas/synologyConfig";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export function isGeneratedWorkorderPdf(
    name: string,
    url: string,
    workorderNumber: string
): boolean {
    const number = workorderNumber.trim().toLowerCase();
    if (!number) {
        return false;
    }

    const file = name.trim().toLowerCase();
    if (
        file === `${number}.pdf`
        || file === `opdracht-${number}.pdf`
    ) {
        return true;
    }

    const path = (supabaseStoragePathFromUrl(url) || url).toLowerCase();
    return (
        path.includes(`workorders/${number}.pdf`)
        || path.endsWith(`/${number}.pdf`)
    );
}

export async function removeGeneratedWorkorderPdfs(
    workorderId: string,
    workorderNumber: string
): Promise<number> {
    const documents = await prisma.document.findMany({
        where: { workorderId },
        select: { id: true, name: true, url: true },
    });

    const generated = documents.filter((doc) =>
        isGeneratedWorkorderPdf(doc.name, doc.url, workorderNumber)
    );

    for (const doc of generated) {
        try {
            if (nasPathFromStored(doc.url)) {
                await deleteDocumentenboxFromNas(doc.url);
            } else {
                const path = supabaseStoragePathFromUrl(doc.url);
                if (path) {
                    await supabase.storage
                        .from("workorder-files")
                        .remove([path])
                        .catch(() => {});
                }
            }
        } catch (error) {
            console.error("GENERATED PDF STORAGE DELETE ERROR", doc.id, error);
        }

        await prisma.document.delete({ where: { id: doc.id } });
    }

    return generated.length;
}
