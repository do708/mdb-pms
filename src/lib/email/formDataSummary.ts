import type { FormDefinition, FormField } from "@/constants/formDefinitions";

function displayValue(field: FormField, raw: unknown): string | null {
    if (raw === undefined || raw === null || raw === "") {
        return null;
    }

    const val = String(raw);

    if (field.type === "handtekening") {
        return val.startsWith("data:") ? "Handtekening ontvangen" : val;
    }

    if (field.type === "foto") {
        if (val.startsWith("http://") || val.startsWith("https://")) {
            return val;
        }

        return "Foto ontvangen";
    }

    return val;
}

export function summarizeFormData(
    definition: FormDefinition,
    data: Record<string, unknown>
): string {
    const lines: string[] = [];

    for (const field of definition.fields) {
        if (field.type === "kop") {
            lines.push("");
            lines.push(`--- ${field.label} ---`);
            continue;
        }

        const shown = displayValue(field, data[field.id]);

        if (shown === null) {
            continue;
        }

        lines.push(`${field.label}: ${shown}`);
    }

    return lines.join("\n").trim();
}

export function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
