"use client";

import Link from "next/link";

// ISO 8601 weeknummer (weken beginnen op maandag)
function isoWeek(date: Date) {
    const d = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );

    const day = d.getUTCDay() || 7;

    d.setUTCDate(d.getUTCDate() + 4 - day);

    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));

    return Math.ceil(
        ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
    );
}

function monteurNameLines(name: string | null | undefined): {
    voornaam: string;
    achternaam: string | null;
} {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
        return { voornaam: "Monteur", achternaam: null };
    }
    if (parts.length === 1) {
        return { voornaam: parts[0], achternaam: null };
    }
    return {
        voornaam: parts[0],
        achternaam: parts.slice(1).join(" "),
    };
}

interface WeekViewProps {
    items: any[];
    leave?: any[];
    // Alle monteurs (zodat ook lege monteurs een rij krijgen)
    engineers?: { id: string; name: string | null }[];
    // Maandag van de te tonen week; standaard deze week
    weekStart?: Date;
    /** Sleep een klus naar een andere dag/tijd/monteur */
    onMovePlan?: (args: {
        workorderId: string;
        dateIso: string;
        hour: number;
        engineerId: string;
    }) => void;
}

function toIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

export default function WeekView({
    items,
    leave = [],
    engineers = [],
    weekStart,
    onMovePlan,
}: WeekViewProps) {
    const today = new Date();
    const todayIso = toIsoDate(today);

    const startOfWeek = weekStart
        ? new Date(weekStart)
        : (() => {
              const d = new Date(today);
              d.setDate(today.getDate() - today.getDay() + 1);
              return d;
          })();

    const days = Array.from({ length: 6 }, (_, index) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + index);
        return date;
    });

    function isoDate(d: Date): string {
        return toIsoDate(d);
    }

    // De dag loopt van 07:00 tot 18:00. Elk uur is PX_PER_UUR hoog.
    const DAG_START_UUR = 7;
    const DAG_EIND_UUR = 18;
    const PX_PER_UUR = 26;
    const DAG_PADDING_TOP = 10;
    const DAG_HOOGTE =
        (DAG_EIND_UUR - DAG_START_UUR) * PX_PER_UUR + DAG_PADDING_TOP;

    const uurLijnen = Array.from(
        { length: DAG_EIND_UUR - DAG_START_UUR + 1 },
        (_, i) => DAG_START_UUR + i
    );

    function heeftKloktijd(d: Date): boolean {
        return d.getHours() !== 0 || d.getMinutes() !== 0;
    }

    function uurVan(d: Date): number {
        const u = d.getHours() + d.getMinutes() / 60;
        return Math.min(DAG_EIND_UUR, Math.max(DAG_START_UUR, u));
    }

    function formatUurLabel(uur: number): string {
        const h = Math.floor(uur);
        const m = Math.round((uur - h) * 60);
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }

    /**
     * Meerdaagse klus: elke dag dezelfde dagelijkse van-/tot-tijd
     * (starttijd uit plannedDate, eindtijd uit plannedEndDate).
     * Zo begint dag 2 niet stiekem om 08:00.
     */
    function blokUren(
        item: any,
        day: Date
    ): { beginUur: number; eindUur: number } {
        const cellIso = isoDate(day);
        const start = item.plannedDate ? new Date(item.plannedDate) : null;
        const eind = item.plannedEndDate
            ? new Date(item.plannedEndDate)
            : null;

        if (!start) {
            return { beginUur: DAG_START_UUR, eindUur: DAG_EIND_UUR };
        }

        const startIso = isoDate(start);
        const endIso = eind ? isoDate(eind) : startIso;
        const meerdaags = startIso !== endIso;

        if (meerdaags) {
            const beginUur = heeftKloktijd(start)
                ? uurVan(start)
                : DAG_START_UUR;
            let eindUur =
                eind && heeftKloktijd(eind)
                    ? uurVan(eind)
                    : DAG_EIND_UUR;

            if (eindUur <= beginUur) {
                eindUur = Math.min(DAG_EIND_UUR, beginUur + 2);
            }

            return { beginUur, eindUur };
        }

        // Één dag
        const startIsDezeDag = startIso === cellIso;
        let beginUur = DAG_START_UUR;
        let eindUur = DAG_EIND_UUR;

        if (startIsDezeDag && heeftKloktijd(start)) {
            beginUur = uurVan(start);
        }

        if (eind && isoDate(eind) === cellIso && heeftKloktijd(eind)) {
            eindUur = uurVan(eind);
        } else if (startIsDezeDag && !eind && heeftKloktijd(start)) {
            eindUur = Math.min(DAG_EIND_UUR, uurVan(start) + 2);
        }

        if (eindUur <= beginUur) {
            eindUur = Math.min(DAG_EIND_UUR, beginUur + 1);
        }

        return { beginUur, eindUur };
    }

    function blokPositie(
        item: any,
        day: Date
    ): { top: number; height: number; beginUur: number; eindUur: number } {
        const { beginUur, eindUur } = blokUren(item, day);

        const top =
            (beginUur - DAG_START_UUR) * PX_PER_UUR + DAG_PADDING_TOP;

        const height = Math.max(40, (eindUur - beginUur) * PX_PER_UUR);

        return { top, height, beginUur, eindUur };
    }

    function hourFromClientY(
        clientY: number,
        cellEl: HTMLElement
    ): number {
        const rect = cellEl.getBoundingClientRect();
        const y = clientY - rect.top - DAG_PADDING_TOP;
        const raw = DAG_START_UUR + y / PX_PER_UUR;
        const snapped = Math.round(raw * 4) / 4;
        return Math.min(
            DAG_EIND_UUR - 0.25,
            Math.max(DAG_START_UUR, snapped)
        );
    }

    function leaveOn(userId: string, day: Date) {
        const iso = isoDate(day);

        return leave.find((l) => {
            if (l.userId !== userId) {
                return false;
            }

            const from = l.from;
            const to = l.to || l.from;

            return from <= iso && iso <= to;
        });
    }

    function itemsForUserDay(userId: string, day: Date) {
        return items.filter((item) => {
            const isPrimary = item.assignedUser?.id === userId;

            const isExtra =
                Array.isArray(item.extraEngineers) &&
                item.extraEngineers.some(
                    (e: any) => e.user?.id === userId
                );

            if (!isPrimary && !isExtra) {
                return false;
            }

            if (!item.plannedDate) {
                return false;
            }

            const cellIso = isoDate(day);
            const startIso = isoDate(new Date(item.plannedDate));
            const endIso = item.plannedEndDate
                ? isoDate(new Date(item.plannedEndDate))
                : startIso;

            return startIso <= cellIso && cellIso <= endIso;
        });
    }

    function weekJobCount(userId: string): number {
        return days.reduce(
            (sum, day) => sum + itemsForUserDay(userId, day).length,
            0
        );
    }

    const users =
        engineers.length > 0
            ? engineers
            : (Array.from(
                  new Map(
                      items
                          .filter((item) => item.assignedUser)
                          .map((item) => [
                              item.assignedUser.id,
                              item.assignedUser,
                          ])
                  ).values()
              ) as { id: string; name: string | null }[]);

    const gridCols =
        "120px repeat(6, minmax(110px, 1fr))";

    return (
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 px-5 pt-5 pb-4 border-b border-slate-100 bg-gradient-to-br from-[#e8f0ff] via-white to-[#fff5fa]">
                <h2 className="text-lg font-bold text-slate-900">
                    Weekoverzicht
                </h2>
                <span className="inline-flex items-center rounded-full bg-[#0066FF]/10 text-[#0066FF] text-xs font-semibold px-2.5 py-0.5">
                    Week {isoWeek(startOfWeek)}
                </span>
            </div>

            {users.length === 0 ? (
                <p className="text-slate-500 p-6">
                    Geen werkbonnen met monteur ingepland deze week.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <div className="min-w-[980px] p-3 sm:p-4">
                        {/* Koprij */}
                        <div
                            className="grid gap-2 mb-2 sticky top-0 z-20"
                            style={{ gridTemplateColumns: gridCols }}
                        >
                            <div className="flex items-end px-2 pb-2">
                                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                    Monteur
                                </span>
                            </div>

                            {days.map((day) => {
                                const iso = isoDate(day);
                                const isToday = iso === todayIso;
                                const weekday = day.toLocaleDateString(
                                    "nl-NL",
                                    { weekday: "short" }
                                );
                                const dayNum = day.getDate();

                                return (
                                    <Link
                                        key={day.toISOString()}
                                        href={`/workorders/new?date=${iso}`}
                                        title="Werkbon klaarzetten op deze dag"
                                            className={`
                                            group flex flex-col items-center justify-center
                                            rounded-xl px-2 py-2.5 transition
                                            ${
                                                isToday
                                                    ? "bg-[#d6007e] text-white shadow-sm shadow-[#d6007e]/25"
                                                    : "bg-[#e8f0ff]/70 text-slate-700 hover:bg-[#e8f0ff]"
                                            }
                                        `}
                                    >
                                        <span
                                            className={`text-[11px] font-medium uppercase tracking-wide ${
                                                isToday
                                                    ? "text-white/80"
                                                    : "text-[#0066FF]/70"
                                            }`}
                                        >
                                            {weekday}
                                        </span>
                                        <span className="text-lg font-bold leading-none mt-0.5 tabular-nums">
                                            {dayNum}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Rijen */}
                        <div className="space-y-2">
                            {users.map((user) => {
                                const jobs = weekJobCount(user.id);
                                const { voornaam, achternaam } =
                                    monteurNameLines(user.name);

                                return (
                                    <div
                                        key={user.id}
                                        className="grid gap-2 rounded-2xl border border-slate-100 bg-slate-50/40 p-2 hover:border-slate-200 hover:bg-white transition"
                                        style={{
                                            gridTemplateColumns: gridCols,
                                        }}
                                    >
                                        <div className="px-1.5 py-2 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 leading-snug">
                                                {voornaam}
                                                {achternaam ? (
                                                    <>
                                                        <br />
                                                        {achternaam}
                                                    </>
                                                ) : null}
                                            </p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                {jobs === 0
                                                    ? "Niets gepland"
                                                    : `${jobs}× deze week`}
                                            </p>
                                        </div>

                                        {days.map((day) => {
                                            const iso = isoDate(day);
                                            const isToday =
                                                iso === todayIso;
                                            const verlof = leaveOn(
                                                user.id,
                                                day
                                            );
                                            const dayItems =
                                                itemsForUserDay(
                                                    user.id,
                                                    day
                                                );

                                            return (
                                                <div
                                                    key={day.toISOString()}
                                                    className="flex flex-col gap-1.5 min-w-0"
                                                >
                                                    <div
                                                        className={`
                                                            relative rounded-xl overflow-hidden
                                                            border transition
                                                            ${
                                                                isToday
                                                                    ? "border-[#d6007e]/35 bg-[#fff5fa]"
                                                                    : "border-slate-200/80 bg-white"
                                                            }
                                                            ${
                                                                verlof
                                                                    ? "border-orange-200"
                                                                    : ""
                                                            }
                                                        `}
                                                        style={{
                                                            minHeight: `${DAG_HOOGTE}px`,
                                                        }}
                                                        onDragOver={
                                                            onMovePlan &&
                                                            !verlof
                                                                ? (e) => {
                                                                      e.preventDefault();
                                                                      e.dataTransfer.dropEffect =
                                                                          "move";
                                                                  }
                                                                : undefined
                                                        }
                                                        onDrop={
                                                            onMovePlan &&
                                                            !verlof
                                                                ? (e) => {
                                                                      e.preventDefault();
                                                                      const workorderId =
                                                                          e.dataTransfer.getData(
                                                                              "workorderId"
                                                                          );
                                                                      if (
                                                                          !workorderId
                                                                      ) {
                                                                          return;
                                                                      }
                                                                      const hour =
                                                                          hourFromClientY(
                                                                              e.clientY,
                                                                              e.currentTarget
                                                                          );
                                                                      onMovePlan(
                                                                          {
                                                                              workorderId,
                                                                              dateIso:
                                                                                  iso,
                                                                              hour,
                                                                              engineerId:
                                                                                  user.id,
                                                                          }
                                                                      );
                                                                  }
                                                                : undefined
                                                        }
                                                    >
                                                        {/* Uurlijnen */}
                                                        {!verlof &&
                                                            uurLijnen.map(
                                                                (uur) => {
                                                                    if (
                                                                        uur ===
                                                                        DAG_EIND_UUR
                                                                    ) {
                                                                        return null;
                                                                    }
                                                                    const top =
                                                                        (uur -
                                                                            DAG_START_UUR) *
                                                                            PX_PER_UUR +
                                                                        DAG_PADDING_TOP;
                                                                    return (
                                                                        <div
                                                                            key={
                                                                                uur
                                                                            }
                                                                            className="absolute left-0 right-0 border-t border-dashed border-slate-100 pointer-events-none"
                                                                            style={{
                                                                                top: `${top}px`,
                                                                            }}
                                                                        >
                                                                            <span className="absolute left-1 -top-2 text-[9px] text-slate-300 tabular-nums select-none">
                                                                                {String(
                                                                                    uur
                                                                                ).padStart(
                                                                                    2,
                                                                                    "0"
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                }
                                                            )}

                                                        {verlof ? (
                                                            <div
                                                                className="
                                                                    absolute inset-1
                                                                    bg-gradient-to-b from-orange-50 to-orange-100/80
                                                                    text-orange-800 text-xs
                                                                    rounded-lg px-2
                                                                    text-center font-medium
                                                                    flex flex-col items-center justify-center gap-0.5
                                                                    z-10
                                                                "
                                                            >
                                                                <span className="text-base leading-none">
                                                                    🌴
                                                                </span>
                                                                <span>
                                                                    {verlof.type ||
                                                                        "Verlof"}
                                                                </span>
                                                            </div>
                                                        ) : null}

                                                        {dayItems.map(
                                                            (item) => {
                                                                const pos =
                                                                    blokPositie(
                                                                        item,
                                                                        day
                                                                    );
                                                                const color =
                                                                    (item
                                                                        .customer
                                                                        ?.color ??
                                                                        item
                                                                            .project
                                                                            ?.customer
                                                                            ?.color) ??
                                                                    "#2563eb";

                                                                const timeLabel = `${formatUurLabel(pos.beginUur)}–${formatUurLabel(pos.eindUur)}`;

                                                                return (
                                                                    <div
                                                                        key={
                                                                            item.id
                                                                        }
                                                                        draggable={
                                                                            !!onMovePlan
                                                                        }
                                                                        onDragStart={
                                                                            onMovePlan
                                                                                ? (e) => {
                                                                                      e.dataTransfer.setData(
                                                                                          "workorderId",
                                                                                          item.id
                                                                                      );
                                                                                      e.dataTransfer.effectAllowed =
                                                                                          "move";
                                                                                  }
                                                                                : undefined
                                                                        }
                                                                        className={`
                                                                            absolute text-white
                                                                            rounded-lg px-2 py-1
                                                                            leading-tight overflow-hidden
                                                                            shadow-sm ring-1 ring-black/10
                                                                            hover:brightness-110 hover:shadow-md
                                                                            transition z-[5]
                                                                            ${
                                                                                onMovePlan
                                                                                    ? "cursor-grab active:cursor-grabbing"
                                                                                    : ""
                                                                            }
                                                                        `}
                                                                        style={{
                                                                            backgroundColor:
                                                                                color,
                                                                            top: `${pos.top}px`,
                                                                            height: `${pos.height}px`,
                                                                            left: "4px",
                                                                            right: "4px",
                                                                        }}
                                                                    >
                                                                        <Link
                                                                            href={`/workorders/${item.id}`}
                                                                            draggable={
                                                                                false
                                                                            }
                                                                            className="block h-full"
                                                                            onClick={(
                                                                                e
                                                                            ) => {
                                                                                // Voorkom navigatie direct na slepen
                                                                                if (
                                                                                    e.defaultPrevented
                                                                                ) {
                                                                                    e.preventDefault();
                                                                                }
                                                                            }}
                                                                        >
                                                                            <span className="text-[11px] font-bold block opacity-95">
                                                                                {timeLabel}
                                                                            </span>

                                                                            <span className="text-[12px] block truncate font-semibold">
                                                                                {(item
                                                                                    .customer
                                                                                    ?.name ??
                                                                                    item
                                                                                        .project
                                                                                        ?.customer
                                                                                        ?.name) ??
                                                                                    "Onbekende klant"}
                                                                            </span>

                                                                            <strong className="text-[11px] block truncate font-medium opacity-90">
                                                                                {item
                                                                                    .project
                                                                                    ?.name ??
                                                                                    item.title}
                                                                            </strong>
                                                                        </Link>
                                                                    </div>
                                                                );
                                                            }
                                                        )}
                                                    </div>

                                                    {onMovePlan ? (
                                                    <Link
                                                        href={`/workorders/new?date=${iso}&engineer=${user.id}`}
                                                        title="Werkbon klaarzetten voor deze monteur op deze dag"
                                                        className="
                                                            group/plan flex items-center justify-center gap-1
                                                            rounded-lg py-1.5 text-[11px] font-medium
                                                            text-slate-400 bg-white border border-transparent
                                                            hover:border-[#0066FF]/30 hover:bg-[#e8f0ff]
                                                            hover:text-[#0066FF] transition
                                                        "
                                                    >
                                                        <span
                                                            className="
                                                                inline-flex h-4 w-4 items-center justify-center
                                                                rounded-full bg-slate-100 text-slate-500
                                                                group-hover/plan:bg-[#0066FF] group-hover/plan:text-white
                                                                text-[10px] font-bold leading-none transition
                                                            "
                                                        >
                                                            +
                                                        </span>
                                                        Plannen
                                                    </Link>
                                                    ) : null}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
