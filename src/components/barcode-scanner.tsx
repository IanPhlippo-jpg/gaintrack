/**
 * Barcodescanner met de camera van je gsm.
 * - Start pas na een tik op "Camera openen": iOS (zeker als web-app op het beginscherm) laat de camera
 *   enkel toe na een gebruikersgebaar.
 * - Gebruikt de ingebouwde BarcodeDetector als die er is, anders ZXing (Safari/iOS, Capacitor).
 * - Fallback: een foto van de barcode nemen (camera-app) en die laten uitlezen, of de code typen.
 */
import * as React from "react";
import { Camera, ImageIcon, Keyboard, ScanLine } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DetectorLike = { detect: (src: HTMLVideoElement | HTMLImageElement) => Promise<{ rawValue: string }[]> };
type DetectorCtor = new (opts: { formats: string[] }) => DetectorLike;

const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "qr_code"];

async function zxingReader() {
  const { BrowserMultiFormatReader } = await import("@zxing/browser");
  const { BarcodeFormat, DecodeHintType } = await import("@zxing/library");
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.CODE_128, BarcodeFormat.QR_CODE]);
  hints.set(DecodeHintType.TRY_HARDER, true);
  return new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 150 });
}

function describeError(e: unknown): string {
  const name = e instanceof Error ? e.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "Geen toegang tot de camera. Sta cameratoegang toe (Instellingen → Safari → Camera, of bij de app op je beginscherm) en probeer opnieuw.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "Geen geschikte camera gevonden op dit toestel.";
  if (name === "NotReadableError") return "De camera is bezet door een andere app. Sluit die en probeer opnieuw.";
  return `De camera kon niet gestart worden${e instanceof Error && e.message ? ` (${e.name}: ${e.message})` : ""}. Neem een foto van de barcode of typ de code.`;
}

export function BarcodeScanner({ open, onClose, onDetected }: { open: boolean; onClose: () => void; onDetected: (code: string) => void }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [manual, setManual] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "starting" | "scanning" | "found" | "photo">("idle");
  const doneRef = React.useRef(false);
  const stopRef = React.useRef<() => void>(() => {});

  const finish = React.useCallback(
    (code: string) => {
      if (doneRef.current) return;
      doneRef.current = true;
      setStatus("found");
      try {
        navigator.vibrate?.(80);
      } catch {
        /* geen trilfunctie */
      }
      stopRef.current();
      onDetected(code);
    },
    [onDetected],
  );

  // Bij sluiten alles stoppen en terug naar het beginscherm van de scanner.
  React.useEffect(() => {
    if (open) {
      doneRef.current = false;
      setError(null);
      setStatus("idle");
      setManual("");
      return;
    }
    stopRef.current();
  }, [open]);

  React.useEffect(() => () => stopRef.current(), []);

  const startCamera = async () => {
    const video = videoRef.current;
    if (!video) return;
    setError(null);
    setStatus("starting");
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("idle");
      setError("Deze browser geeft geen toegang tot de camera. Neem een foto van de barcode of typ de code.");
      return;
    }
    let cancelled = false;
    let stream: MediaStream | null = null;
    let timer = 0;
    let controls: { stop: () => void } | null = null;
    stopRef.current = () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      controls?.stop();
      stream?.getTracks().forEach((t) => t.stop());
      if (video) video.srcObject = null;
    };
    try {
      const Detector = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
      if (Detector) {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
        if (cancelled) return stopRef.current();
        video.srcObject = stream;
        await video.play();
        setStatus("scanning");
        const detector = new Detector({ formats: FORMATS });
        const tick = async () => {
          if (cancelled || doneRef.current) return;
          try {
            const codes = await detector.detect(video);
            if (codes.length && codes[0].rawValue) return finish(codes[0].rawValue);
          } catch {
            /* frame overslaan */
          }
          timer = window.setTimeout(tick, 120);
        };
        void tick();
      } else {
        const reader = await zxingReader();
        controls = await reader.decodeFromConstraints({ video: { facingMode: { ideal: "environment" } }, audio: false }, video, (result) => {
          if (result) finish(result.getText());
        });
        if (cancelled) return stopRef.current();
        setStatus("scanning");
      }
    } catch (e) {
      stopRef.current();
      setStatus("idle");
      setError(describeError(e));
    }
  };

  /** Fallback: foto van de barcode (camera-app) uitlezen. */
  const decodePhoto = async (file: File) => {
    setError(null);
    setStatus("photo");
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("afbeelding")); img.src = url; });
      const Detector = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
      if (Detector) {
        const codes = await new Detector({ formats: FORMATS }).detect(img);
        if (codes.length && codes[0].rawValue) return finish(codes[0].rawValue);
      }
      const reader = await zxingReader();
      const result = await reader.decodeFromImageElement(img);
      finish(result.getText());
    } catch {
      setStatus("idle");
      setError("Geen barcode herkend op de foto. Probeer dichterbij en recht van voren, of typ de code.");
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const live = status === "starting" || status === "scanning";

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()} title="Barcode scannen" description="Richt de camera op de streepjescode van het product." full>
      <div className="space-y-4">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-black">
          <video ref={videoRef} className={live || status === "found" ? "h-full w-full object-cover" : "hidden"} playsInline muted autoPlay />
          {!live && status !== "found" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
              <Camera className="size-10 opacity-80" />
              <p className="text-sm opacity-80">{status === "photo" ? "Foto wordt uitgelezen…" : "Tik om de camera te openen en de streepjescode te scannen."}</p>
              <Button size="lg" onClick={() => void startCamera()} disabled={status === "photo"}>
                <Camera className="size-4" /> Camera openen
              </Button>
              <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={status === "photo"}>
                <ImageIcon className="size-4" /> Foto van barcode nemen
              </Button>
            </div>
          )}
          {live && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-32 w-[78%] rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                {status === "scanning" && <div className="absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-primary shadow-[0_0_12px_var(--primary)]" />}
              </div>
            </div>
          )}
          {(live || status === "found") && (
            <div className="absolute inset-x-0 bottom-3 flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                {status === "found" ? <ScanLine className="size-3.5 text-primary" /> : <Camera className="size-3.5" />}
                {status === "starting" ? "Camera starten…" : status === "scanning" ? "Zoeken naar barcode…" : "Gevonden!"}
              </span>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void decodePhoto(f);
          }}
        />
        {error && <p className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</p>}
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
            <Keyboard className="size-4" /> Of typ de barcode
          </p>
          <div className="flex gap-2">
            <Input value={manual} onChange={(e) => setManual(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="bv. 5449000000996" />
            <Button className="h-12 shrink-0" disabled={manual.length < 6} onClick={() => onDetected(manual)}>
              Zoek
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
