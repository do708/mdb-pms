"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Camera, QrCode } from "lucide-react";

import { parseToolQrPayload } from "@/lib/gereedschap/parseQr";

function maakQrReader(): BrowserMultiFormatReader {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.QR_CODE,
        BarcodeFormat.DATA_MATRIX,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    return new BrowserMultiFormatReader(hints);
}

function decodeCanvas(
    reader: BrowserMultiFormatReader,
    canvas: HTMLCanvasElement
): string | null {
    try {
        return reader.decodeFromCanvas(canvas).getText().trim() || null;
    } catch {
        return null;
    }
}

function decodeFrame(
    reader: BrowserMultiFormatReader,
    bron: CanvasImageSource,
    bronBreedte: number,
    bronHoogte: number
): string | null {
    if (bronBreedte < 8 || bronHoogte < 8) return null;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    const gewassen: Array<[number, number, number, number]> = [
        [0, 0, 1, 1],
        [0.1, 0.15, 0.8, 0.7],
        [0.2, 0.25, 0.6, 0.5],
    ];

    for (const [x, y, w, h] of gewassen) {
        const sx = Math.round(bronBreedte * x);
        const sy = Math.round(bronHoogte * y);
        const sw = Math.max(8, Math.round(bronBreedte * w));
        const sh = Math.max(8, Math.round(bronHoogte * h));
        const maxRand = 1100;
        const schaal = Math.min(1, maxRand / Math.max(sw, sh));
        canvas.width = Math.max(8, Math.round(sw * schaal));
        canvas.height = Math.max(8, Math.round(sh * schaal));
        ctx.drawImage(bron, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

        const hit = decodeCanvas(reader, canvas);
        if (hit) return hit;
    }

    return null;
}

type Props = {
    onScan: (code: string) => void;
    /** Optionele knoptekst */
    label?: string;
    className?: string;
    /** Open de camera meteen (bijv. via ?scan=1) */
    autoOpen?: boolean;
};

/**
 * Camerascanner voor gereedschap-QR's (hergebruikt ZXing zoals SerialScanButton).
 */
export default function GereedschapQrScanner({
    onScan,
    label = "QR scannen",
    className = "",
    autoOpen = false,
}: Props) {
    const [open, setOpen] = useState(autoOpen);
    const [fout, setFout] = useState("");
    const [bezig, setBezig] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const fileRef = useRef<HTMLInputElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const onScanRef = useRef(onScan);
    onScanRef.current = onScan;

    function sluiten() {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setOpen(false);
        setFout("");
        setBezig(false);
    }

    function handleRaw(raw: string) {
        const code = parseToolQrPayload(raw);
        if (!code) {
            setFout(
                "Geen geldige gereedschapscode herkend. Zoek naar MDB-G-00001 of /asset/…"
            );
            return false;
        }
        onScanRef.current(code);
        sluiten();
        return true;
    }

    useEffect(() => {
        if (!open) return;

        let cancelled = false;
        let timer: number | null = null;
        const reader = maakQrReader();

        async function start() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: { ideal: "environment" },
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                    },
                    audio: false,
                });
                if (cancelled) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }
                streamRef.current = stream;
                const video = videoRef.current;
                if (!video) return;
                video.setAttribute("playsinline", "true");
                video.srcObject = stream;
                await video.play();

                const tick = () => {
                    if (cancelled) return;
                    const w = video.videoWidth;
                    const h = video.videoHeight;
                    if (w >= 16 && h >= 16) {
                        const waarde = decodeFrame(reader, video, w, h);
                        if (waarde && handleRaw(waarde)) return;
                    }
                    timer = window.setTimeout(tick, 180);
                };
                tick();
            } catch {
                if (!cancelled) {
                    setFout(
                        "Camera kon niet worden geopend. Gebruik hieronder een foto."
                    );
                }
            }
        }

        void start();

        return () => {
            cancelled = true;
            if (timer) window.clearTimeout(timer);
            streamRef.current?.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    async function onFoto(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        setBezig(true);
        setFout("");
        try {
            const bitmap = await createImageBitmap(file);
            const waarde = decodeFrame(
                maakQrReader(),
                bitmap,
                bitmap.width,
                bitmap.height
            );
            bitmap.close();
            if (!waarde) {
                setFout(
                    "Nog geen QR herkend. Houd de code vlak en in het kader."
                );
                return;
            }
            handleRaw(waarde);
        } catch {
            setFout("Deze foto kon niet worden gelezen. Probeer live scannen.");
        } finally {
            setBezig(false);
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => {
                    setFout("");
                    setOpen(true);
                }}
                className={
                    className ||
                    `
                    inline-flex items-center justify-center gap-2
                    rounded-xl bg-[#0066FF] px-4 py-2.5
                    text-sm font-semibold text-white
                    hover:bg-[#0052cc] transition
                `
                }
            >
                <QrCode className="h-4 w-4" />
                {label}
            </button>

            {open ? (
                <div className="fixed inset-0 z-50 bg-black flex flex-col">
                    <div className="relative flex-1 min-h-0">
                        <video
                            ref={videoRef}
                            className="absolute inset-0 w-full h-full object-cover bg-black"
                            playsInline
                            muted
                            autoPlay
                        />
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div
                                className="
                                    w-[72%] max-w-xs aspect-square rounded-2xl
                                    border-2 border-white
                                    shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]
                                "
                            />
                        </div>
                        <p className="absolute top-4 left-0 right-0 text-center text-white text-sm font-semibold drop-shadow">
                            Houd de gereedschap-QR in het kader
                        </p>
                    </div>
                    {fout ? (
                        <p className="px-4 py-2 text-sm text-red-200 bg-black">
                            {fout}
                        </p>
                    ) : (
                        <p className="px-4 py-2 text-xs text-white/80 bg-black">
                            De camera scant automatisch. QR wijst naar{" "}
                            <code className="text-white">/asset/MDB-…</code>
                        </p>
                    )}
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => void onFoto(e)}
                    />
                    <button
                        type="button"
                        disabled={bezig}
                        onClick={() => fileRef.current?.click()}
                        className="w-full py-3 text-sm font-semibold bg-white text-gray-900 inline-flex items-center justify-center gap-2"
                    >
                        <Camera className="h-4 w-4" />
                        {bezig ? "Foto lezen…" : "Foto maken"}
                    </button>
                    <button
                        type="button"
                        onClick={sluiten}
                        className="w-full py-3 text-sm font-semibold bg-neutral-900 text-white"
                    >
                        Sluiten
                    </button>
                </div>
            ) : null}
        </>
    );
}
