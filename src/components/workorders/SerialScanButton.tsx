"use client";

import { useEffect, useRef, useState } from "react";

type BarcodeDetectorCtor = new (options?: {
    formats?: string[];
}) => {
    detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

function barcodeDetector(): BarcodeDetectorCtor | null {
    if (typeof window === "undefined") {
        return null;
    }
    return (
        (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor })
            .BarcodeDetector ?? null
    );
}

export default function SerialScanButton({
    onScan,
}: {
    onScan: (waarde: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [fout, setFout] = useState("");
    const videoRef = useRef<HTMLVideoElement | null>(null);
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

        const DetectorMaybe = barcodeDetector();
        if (!DetectorMaybe) {
            setFout("Scannen wordt op dit apparaat niet ondersteund.");
            return;
        }
        const DetectorImpl: BarcodeDetectorCtor = DetectorMaybe;

        let cancelled = false;
        let timer: number | null = null;

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
                video.srcObject = stream;
                await video.play();

                const detector = new DetectorImpl({
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
                        if (waarde) {
                            onScanRef.current(waarde.trim());
                            stop();
                        }
                    } catch {
                        /* volgende frame */
                    }
                }, 400);
            } catch {
                if (!cancelled) {
                    setFout("Camera kon niet worden geopend.");
                }
            }
        }

        void run();

        return () => {
            cancelled = true;
            if (timer) {
                window.clearInterval(timer);
            }
            streamRef.current?.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        };
    }, [open]);

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
                        />
                        {fout ? (
                            <p className="px-4 py-3 text-sm text-red-700">{fout}</p>
                        ) : (
                            <p className="px-4 py-2 text-xs text-gray-500">
                                Richt de camera op de barcode of QR-code.
                            </p>
                        )}
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
