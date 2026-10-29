"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { BrowserMultiFormatReader } from "@zxing/browser";

type BarcodeDetectorCtor = new (options?: {
    formats?: string[];
}) => {
    detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

function nativeBarcodeDetector(): BarcodeDetectorCtor | null {
    if (typeof window === "undefined") {
        return null;
    }
    return (
        (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor })
            .BarcodeDetector ?? null
    );
}

function zxingReader(): BrowserMultiFormatReader {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.CODE_93,
        BarcodeFormat.ITF,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.QR_CODE,
        BarcodeFormat.DATA_MATRIX,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    return new BrowserMultiFormatReader(hints);
}

export default function SerialScanButton({
    onScan,
}: {
    onScan: (waarde: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [fout, setFout] = useState("");
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const fileRef = useRef<HTMLInputElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const onScanRef = useRef(onScan);
    onScanRef.current = onScan;

    function stop() {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setOpen(false);
        setFout("");
    }

    useEffect(() => {
        if (!open) {
            return;
        }

        let cancelled = false;
        let timer: number | null = null;
        let zxingStop: (() => void) | null = null;

        async function run() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: "environment" } },
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

                const DetectorNative = nativeBarcodeDetector();
                if (DetectorNative) {
                    const detector = new DetectorNative({
                        formats: [
                            "code_128",
                            "code_39",
                            "code_93",
                            "ean_13",
                            "ean_8",
                            "upc_a",
                            "upc_e",
                            "qr_code",
                            "data_matrix",
                            "itf",
                        ],
                    });
                    timer = window.setInterval(async () => {
                        if (video.readyState < 2) {
                            return;
                        }
                        try {
                            const hits = await detector.detect(video);
                            const waarde = hits.find((hit) => hit.rawValue?.trim())
                                ?.rawValue;
                            if (waarde && !cancelled) {
                                onScanRef.current(waarde.trim());
                                stop();
                            }
                        } catch {
                            /* volgende frame */
                        }
                    }, 400);
                    return;
                }

                const reader = zxingReader();
                const controls = await reader.decodeFromStream(
                    stream,
                    video,
                    (result, _error, scanControls) => {
                        const waarde = result?.getText()?.trim();
                        if (waarde && !cancelled) {
                            onScanRef.current(waarde);
                            scanControls.stop();
                            stop();
                        }
                    }
                );
                zxingStop = () => controls.stop();
            } catch {
                if (!cancelled) {
                    setFout(
                        "Camera kon niet worden geopend. Je kunt ook een foto van de barcode maken."
                    );
                }
            }
        }

        void run();

        return () => {
            cancelled = true;
            if (timer) {
                window.clearInterval(timer);
            }
            zxingStop?.();
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
        try {
            const url = URL.createObjectURL(file);
            const image = document.createElement("img");
            image.src = url;
            await image.decode();
            const result = await zxingReader().decodeFromImageElement(image);
            URL.revokeObjectURL(url);
            const waarde = result.getText().trim();
            if (!waarde) {
                setFout("Geen barcode gevonden op de foto.");
                return;
            }
            onScanRef.current(waarde);
            stop();
        } catch {
            setFout("Geen barcode gevonden op de foto. Probeer opnieuw, dichterbij.");
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
                <div className="fixed inset-0 z-50 bg-black/70 flex flex-col items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden">
                        <p className="px-4 py-3 text-sm font-semibold">
                            Serienummer scannen
                        </p>
                        <video
                            ref={videoRef}
                            className="w-full aspect-[3/4] bg-black object-cover"
                            playsInline
                            muted
                            autoPlay
                        />
                        {fout ? (
                            <p className="px-4 py-3 text-sm text-red-700">{fout}</p>
                        ) : (
                            <p className="px-4 py-2 text-xs text-gray-500">
                                Richt de camera op de barcode of QR-code.
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
                            onClick={() => fileRef.current?.click()}
                            className="w-full py-3 text-sm font-semibold border-t"
                        >
                            Foto van barcode maken
                        </button>
                        <button
                            type="button"
                            onClick={stop}
                            className="w-full py-3 text-sm font-semibold border-t"
                        >
                            Sluiten
                        </button>
                    </div>
                </div>
            ) : null}
        </>
    );
}
