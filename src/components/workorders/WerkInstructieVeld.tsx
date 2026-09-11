"use client";

import { htmlNaarInstructie } from "@/lib/werkInstructie/htmlNaarInstructie";

export default function WerkInstructieVeld({
    value,
    onChange,
}: {
    value: string;
    onChange: (next: string) => void;
}) {
    function onPaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
        const html = event.clipboardData.getData("text/html");
        const plain = event.clipboardData.getData("text/plain");
        if (!html || (!html.includes("<table") && !html.includes("<a "))) {
            return;
        }

        const omgezet = htmlNaarInstructie(html, plain);
        if (!omgezet || omgezet === plain) {
            return;
        }

        event.preventDefault();
        const veld = event.currentTarget;
        const start = veld.selectionStart;
        const end = veld.selectionEnd;
        const next =
            value.slice(0, start) + omgezet + value.slice(end);
        onChange(next);
    }

    return (
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onPaste={onPaste}
            placeholder={
                "Plak hier de mail (setups, materialen, fotolinks en installatie-opmerkingen).\nTabellen en fotolinks blijven leesbaar voor de monteur."
            }
            className="
                w-full border border-gray-200 rounded-lg
                p-3 text-sm text-gray-900 min-h-48 bg-white
                placeholder:text-gray-400 leading-relaxed
                font-sans whitespace-pre-wrap
            "
        />
    );
}
