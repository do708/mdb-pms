import { prisma } from "@/lib/prisma";
import {
    isToolCategory,
    type ToolCategory,
} from "@/constants/gereedschap";

export function formatToolCode(category: ToolCategory, seq: number): string {
    return `MDB-${category}-${String(seq).padStart(5, "0")}`;
}

/**
 * Wijs het volgende sequentiële nummer toe binnen een transactie.
 * `nextValue` = eerstvolgende vrije nummer.
 */
export async function allocateToolCode(
    category: ToolCategory
): Promise<string> {
    if (!isToolCategory(category)) {
        throw new Error("Ongeldige categorie");
    }

    return prisma.$transaction(async (tx) => {
        const existing = await tx.toolIdSequence.findUnique({
            where: { category },
        });

        if (!existing) {
            await tx.toolIdSequence.create({
                data: { category, nextValue: 2 },
            });
            return formatToolCode(category, 1);
        }

        const seq = existing.nextValue;
        await tx.toolIdSequence.update({
            where: { category },
            data: { nextValue: seq + 1 },
        });
        return formatToolCode(category, seq);
    });
}
