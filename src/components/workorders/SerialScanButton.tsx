"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { BrowserMultiFormatReader } from "@zxing/browser";

function maakReader(): BrowserMultiFormatReader {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.CODE_93,
        BarcodeFormat.ITF,
        BarcodeFormat.CODABAR,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.QR_CODE,
        BarcodeFormat.DATA_MATRIX,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.RSS_14,
        BarcodeFormat.RSS_EXPANDED,
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

function invertCanvas(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        return;
    }
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = image.data;
    for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
    }
    ctx.putImageData(image, 0, 0);
}

function decodeBron(
    reader: BrowserMultiFormatReader,
    bron: CanvasImageSource,
    bronBreedte: number,
    bronHoogte: number
): string | null {
    if (bronBreedte < 8 || bronHoogte < 8) {
        return null;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
        return null;
    }

    const gewassen: Array<[number, number, number, number]> = [
        [0, 0, 1, 1],
        [0.12, 0.32, 0.76, 0.36],
        [0.05, 0.2, 0.9, 0.6],
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
        if (hit) {
            return hit;
        }

        invertCanvas(canvas);
        const inverted = decodeCanvas(reader, canvas);
        if (inverted) {
            return inverted;
        }
    }

    return null;
}

export default function SerialScanButton({
    onScan,
}: {
    onScan: (waarde: string) => void;
}) {
    const [open, setOpen] = useState(false);
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

    useEffect(() => {
        if (!open) {
            return;
        }

        let cancelled = false;
        let timer: number | null = null;
        const reader = maakReader();

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
                if (!video) {
                    return;
                }
                video.setAttribute("playsinline", "true");
                video.srcObject = stream;
                await video.play();

                const tick = () => {
                    if (cancelled) {
                        return;
                    }
                    const w = video.videoWidth;
                    const h = video.videoHeight;
                    if (w >= 16 && h >= 16) {
                        const waarde = decodeBron(reader, video, w, h);
                        if (waarde) {
                            onScanRef.current(waarde);
                            sluiten();
                            return;
                        }
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
            if (timer) {
                window.clearTimeout(timer);
            }
            streamRef.current?.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        };
    }, [open]);

    async function onFoto(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) {
            return;
        }
        setBezig(true);
        setFout("");
        try {
            const bitmap = await createImageBitmap(file);
            const waarde = decodeBron(
                maakReader(),
                bitmap,
                bitmap.width,
                bitmap.height
            );
            bitmap.close();
            if (!waarde) {
                setFout("Nog geen code herkend. Houd de code vlak en in het kader.");
                return;
            }
            onScanRef.current(waarde);
            sluiten();
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
                className="
                    shrink-0 rounded-lg border border-sky-200
                    bg-sky-50 px-2.5 py-2 text-xs font-semibold
                    text-sky-800
                "
            >
                Scannen
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
                                    w-[82%] max-w-sm h-[22%] rounded-xl
                                    border-2 border-white
                                    shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]
                                "
                            />
                        </div>
                        <p className="absolute top-4 left-0 right-0 text-center text-white text-sm font-semibold drop-shadow">
                            Houd de barcode in het kader
                        </p>
                    </div>
                    {fout ? (
                        <p className="px-4 py-2 text-sm text-red-200 bg-black">
                            {fout}
                        </p>
                    ) : (
                        <p className="px-4 py-2 text-xs text-white/80 bg-black">
                            De camera scant automatisch, zoals een scan-app.
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
                        className="w-full py-3 text-sm font-semibold bg-white text-gray-900"
                    >
                        {bezig ? "Foto lezen..." : "Foto maken"}
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
