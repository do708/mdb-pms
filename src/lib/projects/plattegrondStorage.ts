import {
    archiveCustomerSlug,
    archiveSlug,
} from "@/lib/archive/formatArchiveLocationName";
import {
    isNasConfigured,
    joinNasPath,
    nasFileUrl,
    synologyArchiveRoot,
} from "@/lib/nas/synologyConfig";
import { synologyUploadFile } from "@/lib/nas/synologyClient";

export function projectPlattegrondNasFolder(project: {
    number: string;
    name: string;
    customer: { name: string };
}): string {
    const archive = synologyArchiveRoot();
    const parent = archive.replace(/\/[^/]+$/, "") || "/mdb-pms";
    const customer = archiveCustomerSlug(project.customer.name);
    const projectSlug = archiveSlug(`${project.number}-${project.name}`);

    return joinNasPath(parent, "projecten", customer, projectSlug, "plattegronden");
}

export async function storeProjectPlattegrond(options: {
    project: {
        number: string;
        name: string;
        customer: { name: string };
    };
    filename: string;
    buffer: Buffer;
    contentType: string;
    supabaseUpload: () => Promise<{ path: string; url: string }>;
}): Promise<{ path: string; url: string; storage: "nas" | "supabase" }> {
    if (isNasConfigured()) {
        const folder = projectPlattegrondNasFolder(options.project);
        const nasPath = await synologyUploadFile(
            folder,
            options.filename,
            options.buffer,
            options.contentType
        );

        return {
            path: nasPath,
            url: nasFileUrl(nasPath),
            storage: "nas",
        };
    }

    const supabase = await options.supabaseUpload();

    return {
        ...supabase,
        storage: "supabase",
    };
}
