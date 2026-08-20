"use client";

/** Zet HTML uit Outlook/mail om naar leesbare instructietekst (tabellen + fotolinks). */
export function htmlNaarInstructie(html: string, plain: string): string {
    if (typeof window === "undefined" || !html.trim()) {
        return plain;
    }

    try {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const regels: string[] = [];
        let regel = "";

        function flushRegel() {
            const t = regel.replace(/[ \t]+/g, " ").trim();
            if (t) {
                regels.push(t);
            }
            regel = "";
        }

        function walk(node: Node) {
            if (node.nodeType === Node.TEXT_NODE) {
                regel += node.textContent || "";
                return;
            }

            if (!(node instanceof HTMLElement)) {
                node.childNodes.forEach(walk);
                return;
            }

            const tag = node.tagName.toLowerCase();

            if (tag === "style" || tag === "script") {
                return;
            }

            if (tag === "br") {
                flushRegel();
                return;
            }

            if (tag === "table") {
                flushRegel();
                const rijen = Array.from(node.querySelectorAll(":scope > tbody > tr, :scope > thead > tr, :scope > tr"));
                const bron = rijen.length ? rijen : Array.from(node.querySelectorAll("tr"));
                for (const tr of bron) {
                    const cellen = Array.from(tr.querySelectorAll("th,td")).map((cel) => {
                        const links = Array.from(cel.querySelectorAll("a[href]"))
                            .map((a) => a.getAttribute("href") || "")
                            .filter((href) => /^https?:\/\//i.test(href));
                        const tekst = (cel.textContent || "").replace(/\s+/g, " ").trim();
                        if (links.length && /^foto\s*link$/i.test(tekst)) {
                            return links[0];
                        }
                        if (links.length && tekst && !tekst.includes(links[0])) {
                            return [tekst, ...links].filter(Boolean).join(" ");
                        }
                        return tekst || links[0] || "";
                    });
                    if (cellen.some(Boolean)) {
                        regels.push(cellen.join("\t"));
                    }
                }
                regels.push("");
                return;
            }

            if (tag === "a") {
                const href = node.getAttribute("href") || "";
                const tekst = (node.textContent || "").replace(/\s+/g, " ").trim();
                if (/^https?:\/\//i.test(href)) {
                    if (!tekst || /^foto\s*link$/i.test(tekst)) {
                        regel += href;
                    } else if (!tekst.includes(href)) {
                        regel += `${tekst} ${href}`;
                    } else {
                        regel += tekst;
                    }
                    return;
                }
            }

            if (tag === "img") {
                const src = node.getAttribute("src") || "";
                if (/^https?:\/\//i.test(src)) {
                    flushRegel();
                    regels.push(src);
                }
                return;
            }

            if (["p", "div", "h1", "h2", "h3", "li", "tr"].includes(tag)) {
                flushRegel();
                node.childNodes.forEach(walk);
                flushRegel();
                return;
            }

            node.childNodes.forEach(walk);
        }

        walk(doc.body);
        flushRegel();

        const omgezet = regels.join("\n").replace(/\n{3,}/g, "\n\n").trim();

        if (omgezet.length > 20) {
            return omgezet;
        }
    } catch {
        // val terug op plain
    }

    return plain;
}
