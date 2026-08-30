/** Nederlandse labels voor aanvraag-overzicht (admin), gespiegeld aan het intakeformulier. */

export const TYPE_AANVRAAG_LABELS: Record<string, string> = {
    installatie: "Installatiewerkzaamheden",
    intake: "Intake",
    storing: "Storing",
    uren: "Uren",
    evalue8: "eValue8",
};

export const ONDERDEEL_META: Record<
    string,
    { titel: string; kleur: string }
> = {
    schermen: {
        titel: "Schermen",
        kleur: "bg-sky-50 border-sky-200",
    },
    videowall: {
        titel: "Videowall",
        kleur: "bg-emerald-50 border-emerald-200",
    },
    kiosk: {
        titel: "Kiosk",
        kleur: "bg-amber-50 border-amber-200",
    },
    mediaplayers: {
        titel: "Mediaplayers",
        kleur: "bg-violet-50 border-violet-200",
    },
    audio: {
        titel: "Audio",
        kleur: "bg-rose-50 border-rose-200",
    },
};

/** Veldlabels voor velden-objecten (videowall, audio, mediaplayers, legacy). */
export const VELD_LABELS: Record<string, string> = {
    aantal: "Aantal",
    formaat: "Formaat",
    formaatAnders: "Formaat (anders)",
    beugel: "Bevestiging",
    bevestigingDetail: "Bevestiging detail",
    bevestigingAnders: "Bevestiging (anders)",
    plafondHoogte: "Plafondhoogte",
    aansturing: "Aansturing",
    aansturingAnders: "Aansturing (anders)",
    orientatie: "Oriëntatie",
    locatie: "Locatie",
    type: "Type",
    configuratie: "Configuratie",
    opmerking: "Opmerking",
    speakersAantal: "Aantal speakers",
    speakersType: "Type speakers",
    versterker: "Versterker",
    ruimteM2: "Oppervlakte ruimte (m²)",
    kabelNodig: "Luidsprekerkabel trekken",
    kabelMdb: "MDB realisatie kabel",
    kabelAfstand: "Kabel afstand",
    kabelTraject: "Kabel traject",
    stroom: "Stroom binnen 3m",
    stroomMdb: "MDB realisatie stroom",
    stroomAfstand: "Stroom afstand",
    stroomTraject: "Stroom traject",
    internet: "Internet binnen 3m",
    internetMdb: "MDB realisatie internet",
    internetAfstand: "Internet afstand",
    internetTraject: "Internet traject",
    // LED videowall e.d.
    afmeting: "Afmeting",
    breedte: "Breedte",
    hoogte: "Hoogte",
    pixelPitch: "Pixel pitch",
};

export const META_KEYS = new Set([
    "project",
    "contact",
    "typeAanvraag",
    "storing",
    "geschatUren",
    "aantalMonteurs",
    "projectOmschrijving",
    "projectHardware",
    "projectHardwareBesteld",
    "projectHardwareStatus",
    "projectHardwareLevering",
    "evalue8Producten",
    "intake",
    "intakeWens",
]);
