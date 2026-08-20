"use client";

import type { ReactNode } from "react";
import {
    isProjectHardwareBesteld,
    normalizeProjectHardwareStatuses,
} from "@/lib/aanvraag/hardwareStatus";
import {
    META_KEYS,
    ONDERDEEL_META,
    TYPE_AANVRAAG_LABELS,
    VELD_LABELS,
} from "@/lib/aanvraag/overzichtLabels";
import { aansturingWeergave } from "@/lib/aanvraag/installatieTypes";

export interface AanvraagOverzichtSnapshot {
    specificaties?: unknown;
    aanvragerNaam?: string | null;
    opmerkingen?: string | null;
    /** Legacy top-level stringvelden (oude aanvragen). */
    schermen?: string | null;
    beugel?: string | null;
    stroom?: string | null;
    internet?: string | null;
}

interface Bijlage {
    url?: string;
    name?: string;
}

interface Props {
    snapshot: AanvraagOverzichtSnapshot | null | undefined;
    /** Locatieblok tonen (dashboard); op werkbon-edit meestal false. */
    locatie?: {
        locatie?: string | null;
        straat?: string | null;
        huisnummer?: string | null;
        postcode?: string | null;
        plaats?: string | null;
        contactPersoon?: string | null;
        contactEmail?: string | null;
        contactPhone?: string | null;
        opdrachtgever?: string | null;
    } | null;
    bijlagen?: Bijlage[] | null;
    className?: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }
    return value as Record<string, unknown>;
}

function str(value: unknown): string {
    if (value === null || value === undefined) return "";
    return String(value).trim();
}

function Field({
    label,
    value,
    href,
    external,
}: {
    label: string;
    value: unknown;
    /** Optioneel: maak waarde een link (mailto:/tel:/url). */
    href?: string;
    /** Open link in nieuw tabblad (bijv. Google Maps). */
    external?: boolean;
}) {
    const text = str(value);
    if (!text) return null;
    return (
        <div className="min-w-0">
            <p className="text-xs text-gray-500">{label}</p>
            {href ? (
                <a
                    href={href}
                    {...(
                        external
                        ? {
                            target: "_blank",
                            rel: "noopener noreferrer",
                        }
                        : {}
                    )}
                    className="text-sm text-sky-700 hover:underline break-words"
                >
                    {text}
                </a>
            ) : (
                <p className="text-sm text-gray-900 break-words">{text}</p>
            )}
        </div>
    );
}

function Section({
    title,
    kleur,
    children,
}: {
    title: string;
    kleur?: string;
    children: ReactNode;
}) {
    return (
        <div
            className={`rounded-xl border p-3 space-y-3 ${
                kleur || "bg-white border-gray-200"
            }`}
        >
            <h3 className="font-semibold text-sm text-gray-800">
                {title}
            </h3>
            {children}
        </div>
    );
}

function Card({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <div className="rounded-lg border border-white/80 bg-white/90 p-3 space-y-2.5 shadow-sm">
            <p className="font-medium text-sm text-gray-800">{title}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {children}
            </div>
        </div>
    );
}

function mdbDetail(
    mdb: unknown,
    afstand: unknown,
    traject: unknown
): string {
    const m = str(mdb);
    if (!m) return "";
    if (m !== "Ja") return `MDB: ${m}`;
    const details = [
        str(afstand) ? `afstand ${str(afstand)}` : "",
        str(traject),
    ].filter(Boolean);
    return details.length > 0
        ? `MDB: Ja — ${details.join(", ")}`
        : "MDB: Ja";
}

function stroomWeergave(item: Record<string, unknown>): string {
    const stroom = str(item.stroom);
    if (!stroom) return "";
    if (stroom !== "Nee") return stroom;
    const detail = mdbDetail(
        item.stroomMdb,
        item.stroomAfstand,
        item.stroomTraject
    );
    return detail ? `${stroom} (${detail})` : stroom;
}

function internetWeergave(item: Record<string, unknown>): string {
    const internet = str(item.internet);
    if (!internet) return "";
    if (internet !== "Nee") return internet;
    const detail = mdbDetail(
        item.internetMdb,
        item.internetAfstand,
        item.internetTraject
    );
    return detail ? `${internet} (${detail})` : internet;
}

function formaatWeergave(item: Record<string, unknown>): string {
    const formaat = str(item.formaat);
    if (formaat === "Anders") {
        return str(item.formaatAnders) || "Anders";
    }
    return formaat;
}

function labelVoorVeld(key: string): string {
    if (VELD_LABELS[key]) return VELD_LABELS[key];
    if (key.startsWith("beugel_")) {
        return key.slice("beugel_".length);
    }
    return key;
}

function VeldenGrid({
    velden,
}: {
    velden: Record<string, unknown> | null | undefined;
}) {
    if (!velden) return null;

    const entries = Object.entries(velden).filter(([, v]) => {
        if (v === null || v === undefined) return false;
        if (typeof v === "string") return v.trim().length > 0;
        if (typeof v === "number" || typeof v === "boolean") return true;
        return false;
    });

    if (entries.length === 0) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {entries.map(([k, v]) => (
                <Field key={k} label={labelVoorVeld(k)} value={v} />
            ))}
        </div>
    );
}

function SchermenBlok({
    blok,
    legacySamenvatting,
}: {
    blok: Record<string, unknown> | null;
    legacySamenvatting?: string | null;
}) {
    if (!blok) {
        if (!legacySamenvatting) return null;
        return (
            <Section
                title={ONDERDEEL_META.schermen.titel}
                kleur={ONDERDEEL_META.schermen.kleur}
            >
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {legacySamenvatting}
                </p>
            </Section>
        );
    }

    if (!blok.aan) return null;

    const items = Array.isArray(blok.items) ? blok.items : [];
    const velden = asRecord(blok.velden);

    return (
        <Section
            title={ONDERDEEL_META.schermen.titel}
            kleur={ONDERDEEL_META.schermen.kleur}
        >
            {velden?.aantal ? (
                <Field label="Aantal schermen" value={velden.aantal} />
            ) : null}

            {items.length > 0 ? (
                <div className="space-y-3">
                    {items.map((raw, i) => {
                        const s = asRecord(raw) || {};
                        return (
                            <Card key={i} title={`Scherm ${i + 1}`}>
                                <Field
                                    label="Formaat"
                                    value={formaatWeergave(s)}
                                />
                                <Field
                                    label="Bevestiging"
                                    value={
                                        str(s.bevestigingDetail) === "Anders"
                                            ? `Specials: ${str(s.bevestigingAnders) || "Anders"}`
                                            : [
                                                  str(s.bevestigingDetail),
                                                  str(s.beugel),
                                              ]
                                                  .filter(Boolean)
                                                  .join(" · ")
                                                  || str(s.beugel)
                                    }
                                />
                                <Field
                                    label="Aansturing"
                                    value={
                                        str(s.aansturing) === "Anders"
                                            ? str(s.aansturingAnders) ||
                                              "Anders"
                                            : aansturingWeergave(
                                                  str(s.aansturing)
                                              )
                                    }
                                />
                                <Field
                                    label="Plafondhoogte"
                                    value={s.plafondHoogte}
                                />
                                <Field
                                    label="Oriëntatie"
                                    value={s.orientatie}
                                />
                                <Field label="Locatie" value={s.locatie} />
                                <Field
                                    label="Stroom binnen 3m"
                                    value={stroomWeergave(s)}
                                />
                                <Field
                                    label="Internet binnen 3m"
                                    value={internetWeergave(s)}
                                />
                                {str(s.berekendType) ? (
                                    <div className="min-w-0">
                                        <p className="text-xs text-gray-500">
                                            Installatietype
                                        </p>
                                        <p className="text-sm font-semibold text-[#0066FF]">
                                            Type {str(s.berekendType)}
                                        </p>
                                    </div>
                                ) : null}
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <>
                    <VeldenGrid velden={velden} />
                    {legacySamenvatting ? (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {legacySamenvatting}
                        </p>
                    ) : null}
                </>
            )}
        </Section>
    );
}

function KioskBlok({ blok }: { blok: Record<string, unknown> | null }) {
    if (!blok?.aan) return null;

    const items = Array.isArray(blok.items) ? blok.items : [];
    const velden = asRecord(blok.velden);

    return (
        <Section
            title={ONDERDEEL_META.kiosk.titel}
            kleur={ONDERDEEL_META.kiosk.kleur}
        >
            {velden?.aantal ? (
                <Field label="Aantal kiosken" value={velden.aantal} />
            ) : null}

            {items.length > 0 ? (
                <div className="space-y-3">
                    {items.map((raw, i) => {
                        const k = asRecord(raw) || {};
                        return (
                            <Card key={i} title={`Kiosk ${i + 1}`}>
                                <Field label="Locatie" value={k.locatie} />
                                <Field label="Type" value={k.type} />
                                <Field
                                    label="Opmerking"
                                    value={k.opmerking}
                                />
                                <Field
                                    label="Stroom binnen 3m"
                                    value={stroomWeergave(k)}
                                />
                                <Field
                                    label="Internet binnen 3m"
                                    value={internetWeergave(k)}
                                />
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <VeldenGrid velden={velden} />
            )}
        </Section>
    );
}

function GeneriekOnderdeel({
    keyName,
    blok,
}: {
    keyName: string;
    blok: Record<string, unknown>;
}) {
    if (!blok.aan) return null;

    const meta = ONDERDEEL_META[keyName] || {
        titel: keyName.charAt(0).toUpperCase() + keyName.slice(1),
        kleur: "bg-gray-50 border-gray-200",
    };
    const velden = asRecord(blok.velden);

    return (
        <Section title={meta.titel} kleur={meta.kleur}>
            <VeldenGrid velden={velden} />
            {!velden || Object.keys(velden).length === 0 ? (
                <p className="text-sm text-gray-600">Aangevinkt</p>
            ) : null}
        </Section>
    );
}

/**
 * Leesbare, gestructureerde weergave van een klantaanvraag —
 * gespiegeld aan `/aanvraag`, voor kantoor/admin.
 */
export default function AanvraagSpecificatiesOverzicht({
    snapshot,
    locatie,
    bijlagen,
    className = "",
}: Props) {
    if (!snapshot && !locatie) return null;

    const specs = asRecord(snapshot?.specificaties) || {};
    const typeRaw = str(specs.typeAanvraag);
    const typeLabel =
        TYPE_AANVRAAG_LABELS[typeRaw] || typeRaw || "";

    const contact = asRecord(specs.contact);
    const contactPersoon =
        locatie?.contactPersoon || str(contact?.persoon);
    const contactEmail =
        locatie?.contactEmail || str(contact?.email);
    const contactPhone =
        locatie?.contactPhone || str(contact?.telefoon);

    const showLocatie =
        locatie
        && (
            str(locatie.opdrachtgever)
            || str(locatie.locatie)
            || str(locatie.straat)
            || str(locatie.postcode)
            || str(locatie.plaats)
            || contactPersoon
            || contactEmail
            || contactPhone
        );

    const intakeWens =
        str(specs.intakeWens)
        || str(asRecord(specs.intake)?.wens);

    const storing = asRecord(specs.storing);
    const evalue8 = Array.isArray(specs.evalue8Producten)
        ? specs.evalue8Producten
        : [];

    const schermenBlok = asRecord(specs.schermen);
    const kioskBlok = asRecord(specs.kiosk);

    const overigeOnderdelen = Object.entries(specs).filter(([k, v]) => {
        if (META_KEYS.has(k)) return false;
        if (k === "schermen" || k === "kiosk") return false;
        const blok = asRecord(v);
        return !!(blok && blok.aan);
    });

    const hardwareStatus = specs.projectHardwareStatus;
    const hardwareBesteldLegacy = str(specs.projectHardwareBesteld);
    const hardwareLevering = str(specs.projectHardwareLevering);
    const hasHardware =
        hardwareStatus
        || hardwareBesteldLegacy
        || hardwareLevering;

    const bijlageLijst = Array.isArray(bijlagen) ? bijlagen : [];

    const hasSpecsContent =
        typeLabel
        || snapshot?.aanvragerNaam
        || intakeWens
        || schermenBlok?.aan
        || snapshot?.schermen
        || kioskBlok?.aan
        || overigeOnderdelen.length > 0
        || evalue8.length > 0
        || specs.project === "Ja"
        || hasHardware
        || storing
        || str(specs.geschatUren)
        || str(specs.aantalMonteurs)
        || snapshot?.opmerkingen
        || snapshot?.stroom
        || snapshot?.internet
        || snapshot?.beugel
        || bijlageLijst.length > 0;

    if (!showLocatie && !hasSpecsContent) return null;

    return (
        <div className={`space-y-3 text-left ${className}`}>
            {typeLabel ? (
                <p className="text-sm">
                    <span className="text-gray-500">Type aanvraag:</span>{" "}
                    <span className="font-semibold text-gray-900">
                        {typeLabel}
                    </span>
                </p>
            ) : null}

            {snapshot?.aanvragerNaam ? (
                <Field
                    label="Aanvrager"
                    value={snapshot.aanvragerNaam}
                />
            ) : null}

            {showLocatie ? (
                <Section title="Gegevens locatie & contactpersoon">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <Field
                            label="Opdrachtgever"
                            value={locatie?.opdrachtgever}
                        />
                        <Field
                            label="Locatie / filiaalnaam"
                            value={locatie?.locatie}
                        />
                        {(() => {
                            const straatRegel = [
                                locatie?.straat,
                                locatie?.huisnummer,
                            ]
                                .filter(Boolean)
                                .join(" ");
                            const mapsQuery = [
                                straatRegel,
                                locatie?.postcode,
                                locatie?.plaats,
                            ]
                                .filter(Boolean)
                                .join(", ");
                            return (
                                <Field
                                    label="Straat"
                                    value={straatRegel}
                                    href={
                                        mapsQuery
                                        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`
                                        : undefined
                                    }
                                    external
                                />
                            );
                        })()}
                        <Field
                            label="Postcode"
                            value={locatie?.postcode}
                        />
                        <Field label="Plaats" value={locatie?.plaats} />
                        <Field
                            label="Contactpersoon op locatie"
                            value={contactPersoon}
                        />
                        <Field
                            label="E-mailadres"
                            value={contactEmail}
                            href={
                                contactEmail
                                ? `mailto:${contactEmail}`
                                : undefined
                            }
                        />
                        <Field
                            label="Telefoonnummer"
                            value={contactPhone}
                            href={
                                contactPhone
                                ? `tel:${String(contactPhone).replace(/\s+/g, "")}`
                                : undefined
                            }
                        />
                    </div>
                </Section>
            ) : null}

            {intakeWens ? (
                <Section
                    title="Intake"
                    kleur="bg-indigo-50 border-indigo-200"
                >
                    <Field label="Wens klant" value={intakeWens} />
                </Section>
            ) : null}

            {typeRaw === "storing" && storing ? (
                <Section
                    title="Storing"
                    kleur="bg-orange-50 border-orange-200"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <Field
                            label="Omschrijving"
                            value={storing.omschrijving}
                        />
                        <Field
                            label="Hardware vervangen"
                            value={storing.hardwareVervangen}
                        />
                        <Field
                            label="Al besteld"
                            value={storing.hardwareBesteld}
                        />
                        <Field
                            label="Levering"
                            value={storing.hardwareLevering}
                        />
                    </div>
                </Section>
            ) : null}

            {(str(specs.geschatUren) || str(specs.aantalMonteurs)) && (
                <Section
                    title="Uren"
                    kleur="bg-slate-50 border-slate-200"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <Field
                            label="Geschat aantal dagen"
                            value={specs.geschatUren}
                        />
                        <Field
                            label="Aantal monteurs"
                            value={specs.aantalMonteurs}
                        />
                    </div>
                </Section>
            )}

            {evalue8.length > 0 ? (
                <Section
                    title="eValue8 producten"
                    kleur="bg-teal-50 border-teal-200"
                >
                    <ul className="space-y-1.5">
                        {evalue8.map((raw, i) => {
                            const p = asRecord(raw) || {};
                            return (
                                <li
                                    key={i}
                                    className="text-sm text-gray-800"
                                >
                                    <span className="font-mono text-xs">
                                        {str(p.code)}
                                    </span>
                                    {str(p.product)
                                        ? ` — ${str(p.product)}`
                                        : ""}
                                    {str(p.aantal)
                                        ? ` ×${str(p.aantal)}`
                                        : ""}
                                </li>
                            );
                        })}
                    </ul>
                </Section>
            ) : null}

            <SchermenBlok
                blok={schermenBlok}
                legacySamenvatting={snapshot?.schermen}
            />

            <KioskBlok blok={kioskBlok} />

            {overigeOnderdelen.map(([k, v]) => (
                <GeneriekOnderdeel
                    key={k}
                    keyName={k}
                    blok={asRecord(v) || { aan: true }}
                />
            ))}

            {specs.project === "Ja" ? (
                <Section
                    title="Project (offerte-basis)"
                    kleur="bg-yellow-50 border-yellow-200"
                >
                    <Field label="Project" value="Ja" />
                    <Field
                        label="Projectomschrijving"
                        value={specs.projectOmschrijving}
                    />
                </Section>
            ) : null}

            {hasHardware ? (
                <Section
                    title="Hardware"
                    kleur="bg-fuchsia-50 border-fuchsia-200"
                >
                    <div className="
                        rounded-lg border border-gray-200
                        bg-white px-2.5 py-2 space-y-1.5
                    ">
                        {hardwareStatus ? (
                            <>
                                <div className="flex flex-wrap gap-1.5">
                                    {normalizeProjectHardwareStatuses(
                                        hardwareStatus
                                    ).map((status) => (
                                        <span
                                            key={status}
                                            className="
                                                inline-flex items-center
                                                rounded-md border border-gray-200
                                                bg-gray-50 px-2 py-0.5
                                                text-xs font-medium text-gray-800
                                            "
                                        >
                                            {status}
                                        </span>
                                    ))}
                                </div>
                                {isProjectHardwareBesteld(hardwareStatus)
                                && hardwareLevering ? (
                                    <p className="text-[11px] text-gray-500">
                                        Levering:{" "}
                                        <span className="font-medium text-gray-800">
                                            {hardwareLevering}
                                        </span>
                                    </p>
                                ) : null}
                            </>
                        ) : hardwareBesteldLegacy ? (
                            <>
                                <span
                                    className="
                                        inline-flex items-center
                                        rounded-md border border-gray-200
                                        bg-gray-50 px-2 py-0.5
                                        text-xs font-medium text-gray-800
                                    "
                                >
                                    {hardwareBesteldLegacy}
                                </span>
                                {hardwareLevering ? (
                                    <p className="text-[11px] text-gray-500">
                                        Levering:{" "}
                                        <span className="font-medium text-gray-800">
                                            {hardwareLevering}
                                        </span>
                                    </p>
                                ) : null}
                            </>
                        ) : hardwareLevering ? (
                            <p className="text-[11px] text-gray-500">
                                Levering:{" "}
                                <span className="font-medium text-gray-800">
                                    {hardwareLevering}
                                </span>
                            </p>
                        ) : (
                            <p className="text-xs text-gray-500">
                                Geen hardwarestatus.
                            </p>
                        )}
                    </div>
                </Section>
            ) : null}

            {/* Legacy top-level stroom/internet alleen als er geen per-item data is */}
            {!schermenBlok?.aan
            && (snapshot?.stroom || snapshot?.internet || snapshot?.beugel) ? (
                <Section title="Voorzieningen (legacy)">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <Field label="Beugel" value={snapshot?.beugel} />
                        <Field
                            label="Stroom binnen 3m"
                            value={snapshot?.stroom}
                        />
                        <Field
                            label="Internet binnen 3m"
                            value={snapshot?.internet}
                        />
                    </div>
                </Section>
            ) : null}

            {snapshot?.opmerkingen ? (
                <Section title="Opmerkingen">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {snapshot.opmerkingen}
                    </p>
                </Section>
            ) : null}

            {bijlageLijst.length > 0 ? (
                <Section title="Bijlagen">
                    <ul className="space-y-1">
                        {bijlageLijst.map((b, i) => (
                            <li key={i}>
                                {b.url ? (
                                    <a
                                        href={b.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm text-blue-600 underline"
                                    >
                                        📎 {b.name || "bijlage"}
                                    </a>
                                ) : (
                                    <span className="text-sm text-gray-700">
                                        📎 {b.name || "bijlage"}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                </Section>
            ) : null}
        </div>
    );
}

/** Normaliseer API/DB-waarde naar snapshot voor de overzichtcomponent. */
export function parseAanvraagSnapshot(
    value: unknown
): AanvraagOverzichtSnapshot | null {
    const rec = asRecord(value);
    if (!rec) return null;

    // Al een snapshot-envelope
    if ("specificaties" in rec || "aanvragerNaam" in rec) {
        return {
            specificaties: rec.specificaties ?? null,
            aanvragerNaam: str(rec.aanvragerNaam) || null,
            opmerkingen: str(rec.opmerkingen) || null,
            schermen: str(rec.schermen) || null,
            beugel: str(rec.beugel) || null,
            stroom: str(rec.stroom) || null,
            internet: str(rec.internet) || null,
        };
    }

    // Ruwe specificaties-JSON (dashboard)
    return { specificaties: rec };
}
