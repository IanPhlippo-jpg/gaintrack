/**
 * Barcodescanner met de camera van je gsm.
 * Gebruikt de ingebouwde BarcodeDetector als die er is, anders ZXing (werkt in Safari op iOS en in de Capacitor-app).
 */
import * as React from "react";
import { Camera, Keyboard, ScanLine } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DetectorLike = { detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
type DetectorCtor = new (opts: { formats: string[] }) => DetectorLike;

const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "qr_code"];

export function BarcodeScanner({ open, onClose, onDetected }: { open: boolean; onClose: () => void; onDetected: (code: string) => void }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [manual, setManual] = React.useState("");
  const [status, setStatus] = React.useState<"start" | "scanning" | "found">("start");
  const doneRef = React.useRef(false);

  React.useEffect(() => {
    if (!open) return;
    doneRef.current = false;
    setError(null);
    setStatus("start");
    let stream: MediaStream | null = null;
    let raf = 0;
    let zxingControls: { stop: () => void } | null = null;
    let cancelled = false;

    const finish = (code: string) => {
      if (doneRef.current) return;
      doneRef.current = true;
      setStatus("found");
      try {
        navigator.vibrate?.(80);
      } catch {
        /* geen trilfunctie */
      }
      onDetected(code);
    };

    (async () => {
      const video = videoRef.current;
      if (!video) return;
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Geen camera beschikbaar in deze browser. Typ de barcode hieronder.");
        return;
      }
      try {
        const Detector = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
        if (Detector) {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
          if (cancelled) return;
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
            raf = window.setTimeout(tick, 120) as unknown as number;
          };
          tick();
        } else {
          const { BrowserMultiFormatReader } = await import("@zxing/browser");
          const { BarcodeFormat, DecodeHintType } = await import("@zxing/library");
          const hints = new Map();
          hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.CODE_128, BarcodeFormat.QR_CODE]);
          hints.set(DecodeHintType.TRY_HARDER, true);
          const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 150 });
          zxingControls = await reader.decodeFromConstraints({ video: { facingMode: { ideal: "environment" } }, audio: false }, video, (result) => {
            if (result) finish(result.getText());
          });
          if (cancelled) zxingControls.stop();
          else setStatus("scanning");
        }
      } catch (e) {
        setError(e instanceof Error && e.name === "NotAllowedError" ? "Geen toegang tot de camera. Sta cameratoegang toe in de instellingen of typ de code." : "De camera kon niet gestart worden. Typ de barcode hieronder.");
      }
    })();

    return () => {
      cancelled = true;
      if (raf) clearTimeout(raf);
      zxingControls?.stop();
      stream?.getTracks().forEach((t) => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [open, onDetected]);

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()} title="Barcode scannen" description="Richt de camera op de streepjescode van het product." full>
      <div className="space-y-4">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-black">
          <video ref={videoRef} className="h-full w-full object-cover" playsInline muted autoPlay />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-32 w-[78%] rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
              {status === "scanning" && <div className="absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-primary shadow-[0_0_12px_var(--primary)]" />}
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-3 flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              {status === "found" ? <ScanLine className="size-3.5 text-primary" /> : <Camera className="size-3.5" />}
              {status === "start" ? "Camera starten…" : status === "scanning" ? "Zoeken naar barcode…" : "Gevonden!"}
            </span>
          </div>
        </div>
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
