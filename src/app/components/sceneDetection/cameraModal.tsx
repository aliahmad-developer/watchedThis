"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

type CameraMode = "chooser" | "live" | "uploading" | "error";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function SceneCameraModal({ open, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<CameraMode>("chooser");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Track if we're still mounted to avoid state updates after close
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (open) {
      setMode("chooser");
      setError("");
      setCapturing(false);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, mode]);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  }, [stream]);

  const handleClose = useCallback(() => {
    stopCamera();
    setError("");
    setMode("chooser");
    setCapturing(false);
    onClose();
  }, [stopCamera, onClose]);

  const startCamera = async () => {
    setError("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (!isMounted.current) { s.getTracks().forEach((t) => t.stop()); return; }
      setStream(s);
      setMode("live");
    } catch {
      setError("Camera access denied. Please allow camera permissions.");
    }
  };

  const captureAndSubmit = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setCapturing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      async (blob) => {
        if (!blob) { setCapturing(false); return; }
        stopCamera();
        setMode("uploading");
        await submitImage(blob, "capture.jpg");
      },
      "image/jpeg",
      0.92,
    );
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    setMode("uploading");
    await submitImage(file, file.name);
  };

  const submitImage = async (blob: Blob, filename: string) => {
    setError("");
    const formData = new FormData();
    formData.append("file", blob, filename);
    try {
      const res = await fetch("/api/sceneDetection", {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response:", text.slice(0, 300));
        throw new Error("Server returned an unexpected response. Please try again.");
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scene detection failed.");
      if (!data.movies || data.movies.length === 0) throw new Error("No matching scenes found. Try a clearer image.");

      sessionStorage.setItem("sceneResults", JSON.stringify(data.movies));

      if (!isMounted.current) return;
      onSuccess?.();
      onClose();
      router.push("/sceneDetect"); 
    } catch (err: any) {
      if (!isMounted.current) return;
      setError(err.message || "Something went wrong. Please try again.");
      setMode("error");
      setCapturing(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      >
        <div className="bg-light-card dark:bg-dark-card rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl overflow-hidden">
          {/* Handle bar — mobile only */}
          <div className="flex justify-center pt-3 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-light-border dark:bg-dark-border" />
          </div>

          {/* ── CHOOSER ── */}
          {mode === "chooser" && (
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Identify a Scene</h2>
                <button onClick={handleClose} className="bg-transparent text-light-secondary-text dark:text-dark-secondary-text hover:text-light-body-text dark:hover:text-dark-body-text transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text -mt-1">
                Point your camera at a movie scene or upload a screenshot
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={startCamera}
                  className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-light-border dark:border-dark-border hover:border-light-accent dark:hover:border-dark-accent hover:bg-light-accent/5 dark:hover:bg-dark-accent/5 transition-all duration-200 group bg-transparent"
                >
                  <div className="w-12 h-12 rounded-full bg-light-bg dark:bg-dark-bg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-light-accent dark:text-dark-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-light-body-text dark:text-dark-body-text">Live Camera</span>
                </button>

                <button
                  onClick={() => inputRef.current?.click()}
                  className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-light-border dark:border-dark-border hover:border-light-accent dark:hover:border-dark-accent hover:bg-light-accent/5 dark:hover:bg-dark-accent/5 transition-all duration-200 group bg-transparent"
                >
                  <div className="w-12 h-12 rounded-full bg-light-bg dark:bg-dark-bg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-light-accent dark:text-dark-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-light-body-text dark:text-dark-body-text">Upload Image</span>
                </button>
              </div>

              {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            </div>
          )}

          {/* ── LIVE CAMERA ── */}
          {mode === "live" && (
            <div className="flex flex-col">
              <div className="relative bg-black">
                <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-72 object-cover" />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-6 border border-white/30 rounded-lg" />
                  <div className="absolute top-6 left-6 w-5 h-5 border-t-2 border-l-2 border-white rounded-tl-lg" />
                  <div className="absolute top-6 right-6 w-5 h-5 border-t-2 border-r-2 border-white rounded-tr-lg" />
                  <div className="absolute bottom-6 left-6 w-5 h-5 border-b-2 border-l-2 border-white rounded-bl-lg" />
                  <div className="absolute bottom-6 right-6 w-5 h-5 border-b-2 border-r-2 border-white rounded-br-lg" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 gap-3">
                <button onClick={handleClose} className="bg-transparent text-xs text-light-secondary-text dark:text-dark-secondary-text hover:text-light-body-text dark:hover:text-dark-body-text transition-colors">
                  Cancel
                </button>
                <button
                  onClick={captureAndSubmit}
                  disabled={capturing}
                  className="w-14 h-14 rounded-full border-4 border-light-btn-bg dark:border-dark-btn-bg bg-white hover:scale-105 active:scale-95 disabled:opacity-50 transition-all duration-150 flex items-center justify-center"
                >
                  {capturing && <div className="w-5 h-5 rounded-full border-2 border-light-btn-bg dark:border-dark-btn-bg border-t-transparent animate-spin" />}
                </button>
                <button
                  onClick={() => { stopCamera(); setMode("chooser"); }}
                  className="bg-transparent text-xs text-light-secondary-text dark:text-dark-secondary-text hover:text-light-body-text dark:hover:text-dark-body-text transition-colors"
                >
                  Upload instead
                </button>
              </div>
            </div>
          )}

          {/* ── UPLOADING ── */}
          {mode === "uploading" && (
            <div className="p-10 flex flex-col items-center gap-4">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-light-accent dark:bg-dark-accent animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <p className="text-sm font-medium text-light-header dark:text-dark-header">Analysing scene...</p>
              <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text text-center">
                First request may take ~30s if the model server is waking up
              </p>
            </div>
          )}

          {/* ── ERROR ── */}
          {mode === "error" && (
            <div className="p-8 flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-light-header dark:text-dark-body-text mb-1">Something went wrong</p>
                <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text">{error}</p>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={handleClose}
                  className="flex-1 py-2 rounded-lg text-xs border border-light-border dark:border-dark-border text-light-secondary-text dark:text-dark-secondary-text hover:bg-light-border/30 dark:hover:bg-dark-border/30 transition-colors bg-transparent"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setError(""); setMode("chooser"); }}
                  className="flex-1 py-2 rounded-lg text-xs bg-light-btn-bg dark:bg-dark-btn-bg text-light-btn-text dark:text-dark-btn-text hover:bg-light-btn-hover-bg dark:hover:bg-dark-btn-hover-bg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ""; }}
      />
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
}