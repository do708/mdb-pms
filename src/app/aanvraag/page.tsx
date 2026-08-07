"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import InstallatieSectie from "@/components/aanvraag/InstallatieSectie";
import {
    AanvraagRuimte,
    ExtraDiensten,
    StroomInternetBlok,
    emptyExtra,
    emptyRuimte,
    emptyStroomInternet,
    summarizeRuimtes,
    summarizeVoorziening,
} from "@/types/aanvraagInstallatie";

interface Bijlage {
    url: string;
    name: string;
}

function AanvraagFormulier() {
    const searchParams = useSearchParams();
    const token = searchParams.get("client_id") || "";

    const [laden, setLaden] = useState(true);
    const [opdrachtgever, setOpdrachtgever] = useState("");
    const [linkGeldig, setLinkGeldig] = useState(false);

    const [locatie, setLocatie] = useState("");
    const [straat, setStraat] = useState("");
    const [huisnummer, setHuisnummer] = useState("");
    const [postcode, setPostcode] = useState("");
    const [plaats, setPlaats] = useState("");

    const [contactPersoon, setContactPersoon] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [contactPhone, setContactPhone] = useState("");

    const [opmerkingen, setOpmerkingen] = useState("");
    const [aanvragerNaam, setAanvragerNaam] = useState("");

    // installatie | storing | uren | intake
    const [typeAanvraag, setTypeAanvraag] = useState("");

    const [ruimtes, setRuimtes] = useState<AanvraagRuimte[]>(() => [
        emptyRuimte(),
    ]);
    const [stroomBlok, setStroomBlok] = useState<StroomInternetBlok>(
        emptyStroomInternet()
    );
    const [internetBlok, setInternetBlok] = useState<StroomInternetBlok>(
        emptyStroomInternet()
    );
    const [extra, setExtra] = useState<ExtraDiensten>(emptyExtra());

    // Storing
    const [storingOmschrijving, setStoringOmschrijving] = useState("");
    const [hardwareVervangen, setHardwareVervangen] = useState("");
    const [hardwareBesteld, setHardwareBesteld] = useState("");
    const [hardwareLevering, setHardwareLevering] = useState("");

    // Uren
    const [geschatUren, setGeschatUren] = useState("");
    const [aantalMonteurs, setAantalMonteurs] = useState("");

    const [bijlagen, setBijlagen] = useState<Bijlage[]>([]);
    const [uploadBezig, setUploadBezig] = useState(false);
    const [sleepActief, setSleepActief] = useState(false);
    const [versturenBezig, setVersturenBezig] = useState(false);
    const [verstuurd, setVerstuurd] = useState(false);
    const [fout, setFout] = useState("");

    useEffect(() => {
        async function laadKlant() {
            if (!token) {
                setLinkGeldig(false);
                setLaden(false);
                return;
            }

            try {
                const res = await fetch(`/api/aanvraag/${token}`);

                if (res.ok) {
                    const data = await res.json();
                    setOpdrachtgever(data.customerName);
                    setLinkGeldig(true);
                } else {
                    setLinkGeldig(false);
                }
            } catch {
                setLinkGeldig(false);
            }

            setLaden(false);
        }

        laadKlant();
    }, [token]);

    const uploadFile = useCallback(
        async (file: File): Promise<{ url: string; name: string } | null> => {
            const isFoto = file.type.startsWith("image/");
            const isPdf = file.type === "application/pdf";

            if (!isFoto && !isPdf) {
                setFout("Alleen foto's en PDF-bestanden zijn toegestaan.");
                return null;
            }

            const fd = new FormData();
            fd.append("file", file);
            fd.append("token", token);

            try {
                setUploadBezig(true);
                const res = await fetch("/api/aanvraag/upload", {
                    method: "POST",
                    body: fd,
                });
                const data = await res.json();

                if (res.ok && data.success) {
                    return { url: data.url, name: data.name };
                }

                setFout(data.error || "Upload mislukt.");
                return null;
            } catch {
                setFout("Upload mislukt.");
                return null;
            } finally {
                setUploadBezig(false);
            }
        },
        [token]
    );

    const verwerkBestanden = useCallback(
        async (files: FileList | File[]) => {
            setFout("");

            for (const file of Array.from(files)) {
                const result = await uploadFile(file);

                if (result) {
                    setBijlagen((b) => [
                        ...b,
                        { url: result.url, name: result.name },
                    ]);
                }
            }
        },
        [uploadFile]
    );

    function verwijderBijlage(index: number) {
        setBijlagen((b) => b.filter((_, i) => i !== index));
    }

    async function verstuur() {
        setFout("");

        if (!typeAanvraag) {
            setFout(
                "Kies een type aanvraag (Installatie, Storing, Uren of Intake)."
            );
            return;
        }

        if (!locatie && !straat && !plaats) {
            setFout(
                "Vul minimaal de locatie of het adres van de werklocatie in."
            );
            return;
        }

        setVersturenBezig(true);

        const schermenSamenvatting =
            typeAanvraag === "installatie"
                ? summarizeRuimtes(ruimtes).join("; ")
                : "";

        const stroomTekst =
            typeAanvraag === "installatie"
                ? summarizeVoorziening("Stroom", stroomBlok)
                : "";

        const internetTekst =
            typeAanvraag === "installatie"
                ? summarizeVoorziening("Internet", internetBlok)
                : "";

        try {
            const res = await fetch(`/api/aanvraag/${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    locatie,
                    straat,
                    huisnummer,
                    postcode,
                    plaats,
                    schermen: schermenSamenvatting,
                    stroom: stroomTekst,
                    internet: internetTekst,
                    opmerkingen,
                    aanvragerNaam,
                    specificaties: {
                        typeAanvraag,
                        contact: {
                            persoon: contactPersoon,
                            email: contactEmail,
                            telefoon: contactPhone,
                        },
                        ...(typeAanvraag === "installatie"
                            ? {
                                  ruimtes,
                                  stroom: stroomBlok,
                                  internet: internetBlok,
                                  extra,
                              }
                            : {}),
                        storing: {
                            omschrijving: storingOmschrijving,
                            hardwareVervangen,
                            hardwareBesteld,
                            hardwareLevering,
                        },
                        geschatUren,
                        aantalMonteurs,
                    },
                    bijlagen,
                }),
            });

            if (res.ok) {
                setVerstuurd(true);
            } else {
                const data = await res.json();
                setFout(data.error || "Versturen mislukt.");
            }
        } catch {
            setFout("Versturen mislukt.");
        }

        setVersturenBezig(false);
    }

    if (laden) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                Laden...
            </div>
        );
    }

    if (!linkGeldig) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="max-w-md text-center">
                    <h1 className="text-xl font-bold text-gray-800 mb-2">
                        Ongeldige of verlopen link
                    </h1>
                    <p className="text-gray-600">
                        Deze aanvraaglink is niet (meer) geldig. Neem contact op
                        met MDB Networks voor een nieuwe link.
                    </p>
                </div>
            </div>
        );
    }

    if (verstuurd) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="max-w-md text-center">
                    <div className="text-5xl mb-4">✓</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        Bedankt voor uw aanvraag!
                    </h1>
                    <p className="text-gray-600">
                        Uw aanvraag is ontvangen door MDB Networks. Wij nemen
                        deze in behandeling en nemen contact met u op voor de
                        planning.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="mb-6 text-center">
                    <img
                        src="/images/MDB-Logo.png"
                        alt="MDB Networks"
                        className="h-24 w-auto mx-auto mb-4"
                    />
                    <h1 className="text-2xl font-bold text-gray-900">
                        Aanvraag Service- en Installatiewerkzaamheden
                    </h1>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-6">
                    <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
                        <span className="text-xs font-semibold text-sky-700 uppercase tracking-wide">
                            Opdrachtgever
                        </span>
                        <p className="text-lg font-bold text-sky-900">
                            {opdrachtgever}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="font-semibold text-gray-800 border-b pb-1">
                            Werkbon- &amp; locatiegegevens
                        </h2>

                        <label className="block">
                            <span className="text-sm text-gray-600">
                                Locatie / filiaalnaam
                            </span>
                            <input
                                value={locatie}
                                onChange={(e) => setLocatie(e.target.value)}
                                placeholder="Bijv. Filiaal Almere Centrum"
                                className="w-full border rounded-xl p-3 mt-1"
                            />
                        </label>

                        <div className="flex flex-wrap gap-3">
                            <label className="block flex-1 min-w-[180px]">
                                <span className="text-sm text-gray-600">
                                    Straat
                                </span>
                                <input
                                    value={straat}
                                    onChange={(e) => setStraat(e.target.value)}
                                    className="w-full border rounded-xl p-3 mt-1"
                                />
                            </label>
                            <label className="block w-28">
                                <span className="text-sm text-gray-600">
                                    Huisnr.
                                </span>
                                <input
                                    value={huisnummer}
                                    onChange={(e) =>
                                        setHuisnummer(e.target.value)
                                    }
                                    className="w-full border rounded-xl p-3 mt-1"
                                />
                            </label>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <label className="block w-36">
                                <span className="text-sm text-gray-600">
                                    Postcode
                                </span>
                                <input
                                    value={postcode}
                                    onChange={(e) =>
                                        setPostcode(e.target.value)
                                    }
                                    className="w-full border rounded-xl p-3 mt-1"
                                />
                            </label>
                            <label className="block flex-1 min-w-[180px]">
                                <span className="text-sm text-gray-600">
                                    Plaats
                                </span>
                                <input
                                    value={plaats}
                                    onChange={(e) => setPlaats(e.target.value)}
                                    className="w-full border rounded-xl p-3 mt-1"
                                />
                            </label>
                        </div>

                        <label className="block">
                            <span className="text-sm text-gray-600">
                                Contactpersoon
                            </span>
                            <input
                                value={contactPersoon}
                                onChange={(e) =>
                                    setContactPersoon(e.target.value)
                                }
                                placeholder="Naam contactpersoon"
                                className="w-full border rounded-xl p-3 mt-1"
                            />
                        </label>

                        <div className="flex flex-wrap gap-3">
                            <label className="block flex-1 min-w-[180px]">
                                <span className="text-sm text-gray-600">
                                    E-mailadres
                                </span>
                                <input
                                    type="email"
                                    value={contactEmail}
                                    onChange={(e) =>
                                        setContactEmail(e.target.value)
                                    }
                                    placeholder="naam@bedrijf.nl"
                                    className="w-full border rounded-xl p-3 mt-1"
                                />
                            </label>
                            <label className="block flex-1 min-w-[150px]">
                                <span className="text-sm text-gray-600">
                                    Telefoonnummer
                                </span>
                                <input
                                    value={contactPhone}
                                    onChange={(e) =>
                                        setContactPhone(e.target.value)
                                    }
                                    placeholder="06 ..."
                                    className="w-full border rounded-xl p-3 mt-1"
                                />
                            </label>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="font-semibold text-gray-800 border-b pb-1">
                            Type aanvraag / bon
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-2">
                            {[
                                {
                                    k: "installatie",
                                    label: "Installatiewerkzaamheden",
                                },
                                {
                                    k: "storing",
                                    label: "Storing / Servicebezoek",
                                },
                                { k: "uren", label: "Regie / Uren" },
                                { k: "intake", label: "Intake op locatie" },
                            ].map((t) => (
                                <button
                                    key={t.k}
                                    type="button"
                                    onClick={() => setTypeAanvraag(t.k)}
                                    className={
                                        "rounded-xl py-3 px-3 border-2 text-sm font-medium "
                                        +
                                        (typeAanvraag === t.k
                                            ? "bg-sky-100 text-sky-800 border-sky-300"
                                            : "bg-white text-gray-700 border-gray-200")
                                    }
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {typeAanvraag === "installatie" ? (
                        <InstallatieSectie
                            ruimtes={ruimtes}
                            onRuimtesChange={setRuimtes}
                            stroom={stroomBlok}
                            onStroomChange={setStroomBlok}
                            internet={internetBlok}
                            onInternetChange={setInternetBlok}
                            extra={extra}
                            onExtraChange={setExtra}
                            opmerkingen={opmerkingen}
                            onOpmerkingenChange={setOpmerkingen}
                            uploadFile={uploadFile}
                        />
                    ) : null}

                    {typeAanvraag === "intake" ? (
                        <label className="block">
                            <span className="text-sm font-semibold text-gray-800">
                                Opmerkingen / notities
                            </span>
                            <textarea
                                rows={4}
                                value={opmerkingen}
                                onChange={(e) =>
                                    setOpmerkingen(e.target.value)
                                }
                                placeholder="Toelichting bij de intake"
                                className="w-full border rounded-xl p-3 mt-1"
                            />
                        </label>
                    ) : null}

                    {typeAanvraag === "storing" ? (
                        <div className="space-y-4">
                            <label className="block">
                                <span className="text-sm text-gray-600">
                                    Omschrijving storing
                                </span>
                                <textarea
                                    rows={4}
                                    value={storingOmschrijving}
                                    onChange={(e) =>
                                        setStoringOmschrijving(e.target.value)
                                    }
                                    placeholder="Beschrijf de storing zo duidelijk mogelijk"
                                    className="w-full border rounded-xl p-3 mt-1"
                                />
                            </label>

                            <div>
                                <span className="text-sm text-gray-600 block mb-1">
                                    Moet er hardware worden vervangen?
                                </span>
                                <div className="flex gap-2">
                                    {(["Ja", "Nee"] as const).map((optie) => (
                                        <button
                                            key={optie}
                                            type="button"
                                            onClick={() =>
                                                setHardwareVervangen((h) =>
                                                    h === optie ? "" : optie
                                                )
                                            }
                                            className={
                                                "flex-1 rounded-xl py-2 border-2 text-sm font-medium "
                                                +
                                                (hardwareVervangen === optie
                                                    ? optie === "Ja"
                                                        ? "bg-amber-100 text-amber-800 border-amber-300"
                                                        : "bg-emerald-100 text-emerald-800 border-emerald-300"
                                                    : "bg-white text-gray-700 border-gray-200")
                                            }
                                        >
                                            {optie}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {hardwareVervangen === "Ja" ? (
                                <div className="pl-3 border-l-2 border-amber-200 space-y-3">
                                    <div>
                                        <span className="text-sm text-gray-600 block mb-1">
                                            Is deze al besteld?
                                        </span>
                                        <div className="flex gap-2">
                                            {(["Ja", "Nee"] as const).map(
                                                (optie) => (
                                                    <button
                                                        key={optie}
                                                        type="button"
                                                        onClick={() =>
                                                            setHardwareBesteld(
                                                                (h) =>
                                                                    h === optie
                                                                        ? ""
                                                                        : optie
                                                            )
                                                        }
                                                        className={
                                                            "flex-1 rounded-xl py-2 border-2 text-sm font-medium "
                                                            +
                                                            (hardwareBesteld ===
                                                            optie
                                                                ? "bg-sky-100 text-sky-800 border-sky-300"
                                                                : "bg-white text-gray-700 border-gray-200")
                                                        }
                                                    >
                                                        {optie}
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-600 block mb-1">
                                            Waar wordt deze geleverd?
                                        </span>
                                        <div className="flex gap-2">
                                            {[
                                                "MDB Networks",
                                                "Op locatie",
                                            ].map((optie) => (
                                                <button
                                                    key={optie}
                                                    type="button"
                                                    onClick={() =>
                                                        setHardwareLevering(
                                                            (h) =>
                                                                h === optie
                                                                    ? ""
                                                                    : optie
                                                        )
                                                    }
                                                    className={
                                                        "flex-1 rounded-xl py-2 border-2 text-sm font-medium "
                                                        +
                                                        (hardwareLevering ===
                                                        optie
                                                            ? "bg-sky-100 text-sky-800 border-sky-300"
                                                            : "bg-white text-gray-700 border-gray-200")
                                                    }
                                                >
                                                    {optie}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            <label className="block">
                                <span className="text-sm text-gray-600">
                                    Opmerkingen
                                </span>
                                <textarea
                                    rows={3}
                                    value={opmerkingen}
                                    onChange={(e) =>
                                        setOpmerkingen(e.target.value)
                                    }
                                    className="w-full border rounded-xl p-3 mt-1"
                                />
                            </label>
                        </div>
                    ) : null}

                    {typeAanvraag === "uren" ? (
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-3">
                                <label className="block flex-1 min-w-[140px]">
                                    <span className="text-sm text-gray-600">
                                        Geschat aantal dagen
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={geschatUren}
                                        onChange={(e) =>
                                            setGeschatUren(e.target.value)
                                        }
                                        className="w-full border rounded-xl p-3 mt-1"
                                    />
                                </label>
                                <label className="block flex-1 min-w-[140px]">
                                    <span className="text-sm text-gray-600">
                                        Aantal monteurs
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={aantalMonteurs}
                                        onChange={(e) =>
                                            setAantalMonteurs(e.target.value)
                                        }
                                        className="w-full border rounded-xl p-3 mt-1"
                                    />
                                </label>
                            </div>
                            <label className="block">
                                <span className="text-sm text-gray-600">
                                    Opmerkingen
                                </span>
                                <textarea
                                    rows={3}
                                    value={opmerkingen}
                                    onChange={(e) =>
                                        setOpmerkingen(e.target.value)
                                    }
                                    className="w-full border rounded-xl p-3 mt-1"
                                />
                            </label>
                        </div>
                    ) : null}

                    {typeAanvraag ? (
                        <div className="space-y-3">
                            <h2 className="font-semibold text-gray-800 border-b pb-1">
                                Documenten &amp; foto&apos;s
                            </h2>

                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setSleepActief(true);
                                }}
                                onDragLeave={() => setSleepActief(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setSleepActief(false);
                                    if (e.dataTransfer.files?.length) {
                                        void verwerkBestanden(
                                            e.dataTransfer.files
                                        );
                                    }
                                }}
                                className={
                                    "border-2 border-dashed rounded-xl p-6 text-center transition "
                                    +
                                    (sleepActief
                                        ? "border-sky-500 bg-sky-50"
                                        : "border-gray-300")
                                }
                            >
                                <p className="text-gray-500 text-sm mb-2">
                                    Sleep foto&apos;s of PDF&apos;s hierheen,
                                    of
                                </p>
                                <label className="inline-block cursor-pointer text-sky-600 font-medium">
                                    <span>kies bestanden</span>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*,application/pdf"
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files?.length) {
                                                void verwerkBestanden(
                                                    e.target.files
                                                );
                                            }
                                        }}
                                    />
                                </label>
                                {uploadBezig ? (
                                    <p className="text-xs text-gray-400 mt-2">
                                        Bezig met uploaden...
                                    </p>
                                ) : null}
                            </div>

                            {bijlagen.length > 0 ? (
                                <ul className="space-y-1">
                                    {bijlagen.map((b, i) => (
                                        <li
                                            key={i}
                                            className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2"
                                        >
                                            <span className="truncate">
                                                📎 {b.name}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    verwijderBijlage(i)
                                                }
                                                className="text-red-500 ml-2"
                                            >
                                                Verwijderen
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>
                    ) : null}

                    <label className="block">
                        <span className="text-sm text-gray-600">
                            Naam aanvrager
                        </span>
                        <input
                            value={aanvragerNaam}
                            onChange={(e) => setAanvragerNaam(e.target.value)}
                            className="w-full border rounded-xl p-3 mt-1"
                        />
                    </label>

                    {fout ? (
                        <p className="text-red-600 text-sm font-medium">
                            {fout}
                        </p>
                    ) : null}

                    <button
                        type="button"
                        disabled={versturenBezig || !typeAanvraag}
                        onClick={() => void verstuur()}
                        className="w-full bg-[#0066FF] text-white rounded-xl py-3.5 font-bold disabled:opacity-50"
                    >
                        {versturenBezig
                            ? "Bezig met versturen..."
                            : "Verstuur aanvraag"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AanvraagPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center text-gray-500">
                    Laden...
                </div>
            }
        >
            <AanvraagFormulier />
        </Suspense>
    );
}
