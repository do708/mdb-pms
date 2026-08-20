"use client";

import WerkInstructieWeergave from "@/components/workorders/WerkInstructieWeergave";
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
        <div className="space-y-3">
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
            {value.trim() ? (
                <div className="rounded-lg border border-indigo-100 bg-white p-3 space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
                        Zo ziet de monteur het
                    </p>
                    <WerkInstructieWeergave tekst={value} />
                </div>
            ) : null}
        </div>
    );
}
