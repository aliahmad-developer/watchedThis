"use client";
import { useState, useRef, useCallback, useEffect, useMemo, memo } from "react";
import toast from "react-hot-toast";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type Props = { user: User; onUpdated?: (newPhotoURL: string) => void };

/* ─── module-level constants ─────────────────────────────────────────────── */
const RING_CIRCUMFERENCE = 2 * Math.PI * 46;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_RESOLUTION = 4096;
const CACHE_TTL = 3600000;
const CROP_JPEG_QUALITY = 0.92;
const MAX_ZOOM = 4;
const MIN_ZOOM = 0.5;

/* ─── helpers ────────────────────────────────────────────────────────────── */
function validateImage(file: File): Promise<boolean> {
  if (!file.type.startsWith("image/")) return Promise.resolve(false);
  if (file.size > MAX_FILE_SIZE) return Promise.resolve(false);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (
        img.naturalWidth > MAX_RESOLUTION ||
        img.naturalHeight > MAX_RESOLUTION
      ) {
        resolve(false);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          const arr = new Uint8Array(reader.result as ArrayBuffer).subarray(
            0,
            4,
          );
          const header = Array.from(arr)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
          const isValid =
            header.startsWith("ffd8ff") ||
            header.startsWith("89504e47") ||
            header.startsWith("47494638") ||
            header.startsWith("52494646");
          resolve(isValid);
        };
        reader.readAsArrayBuffer(file.slice(0, 4));
      }
    };
    img.onerror = () => resolve(false);
    img.src = URL.createObjectURL(file);
  });
}

/* ─── crop hook ──────────────────────────────────────────────────────────── */
function useCrop(imgSrc: string | null, canvasSize: number) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const [scaleState, setScaleState] = useState(1);
  const dragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });
  const lastPinchDist = useRef<number | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const SIZE = canvas.width;
    const ctx = canvas.getContext("2d")!;
    const { x, y } = offsetRef.current;
    const scale = scaleRef.current;

    ctx.clearRect(0, 0, SIZE, SIZE);
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    ctx.drawImage(
      img,
      (SIZE - drawW) / 2 + x,
      (SIZE - drawH) / 2 + y,
      drawW,
      drawH,
    );

    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, SIZE, SIZE);

    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
  }, []);

  useEffect(() => {
    if (!imgSrc) return;
    const img = new window.Image();
    img.onload = () => {
      imgRef.current = img;
      offsetRef.current = { x: 0, y: 0 };
      const fitScale = Math.max(
        canvasSize / img.naturalWidth,
        canvasSize / img.naturalHeight,
      );
      scaleRef.current = fitScale;
      setScaleState(fitScale);
      draw();
    };
    img.src = imgSrc;
  }, [imgSrc, canvasSize, draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const next = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, scaleRef.current - e.deltaY * 0.001),
      );
      scaleRef.current = next;
      setScaleState(next);
      draw();
    };
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [draw]);

  const setScale = useCallback(
    (val: number) => {
      scaleRef.current = val;
      setScaleState(val);
      draw();
    },
    [draw],
  );

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    dragStart.current = {
      mx: e.clientX,
      my: e.clientY,
      ox: offsetRef.current.x,
      oy: offsetRef.current.y,
    };
  }, []);

  const rafRef = useRef<number | null>(null);
  const throttledDraw = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      draw();
      rafRef.current = null;
    });
  }, [draw]);

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging.current) return;
      offsetRef.current = {
        x: dragStart.current.ox + e.clientX - dragStart.current.mx,
        y: dragStart.current.oy + e.clientY - dragStart.current.my,
      };
      throttledDraw();
    },
    [throttledDraw],
  );

  const stopDrag = useCallback(() => {
    dragging.current = false;
    lastPinchDist.current = null;
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      dragging.current = true;
      dragStart.current = {
        mx: t.clientX,
        my: t.clientY,
        ox: offsetRef.current.x,
        oy: offsetRef.current.y,
      };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.hypot(dx, dy);
    }
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        if (lastPinchDist.current !== null) {
          const next = Math.min(
            MAX_ZOOM,
            Math.max(
              MIN_ZOOM,
              scaleRef.current + (dist - lastPinchDist.current) * 0.01,
            ),
          );
          scaleRef.current = next;
          setScaleState(next);
          throttledDraw();
        }
        lastPinchDist.current = dist;
        return;
      }
      if (!dragging.current || e.touches.length !== 1) return;
      const t = e.touches[0];
      offsetRef.current = {
        x: dragStart.current.ox + t.clientX - dragStart.current.mx,
        y: dragStart.current.oy + t.clientY - dragStart.current.my,
      };
      throttledDraw();
    },
    [throttledDraw],
  );

  const getCroppedBlob = useCallback(
    (): Promise<Blob> =>
      new Promise((resolve, reject) => {
        const img = imgRef.current;
        if (!img) return reject(new Error("No image loaded"));

        const offscreen = document.createElement("canvas");
        offscreen.width = canvasSize;
        offscreen.height = canvasSize;
        const ctx = offscreen.getContext("2d")!;

        ctx.save();
        ctx.beginPath();
        ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2, 0, Math.PI * 2);
        ctx.clip();

        const scale = scaleRef.current;
        const { x, y } = offsetRef.current;
        const drawW = img.naturalWidth * scale;
        const drawH = img.naturalHeight * scale;
        ctx.drawImage(
          img,
          (canvasSize - drawW) / 2 + x,
          (canvasSize - drawH) / 2 + y,
          drawW,
          drawH,
        );
        ctx.restore();

        offscreen.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
          "image/jpeg",
          CROP_JPEG_QUALITY,
        );
      }),
    [canvasSize],
  );

  return {
    canvasRef,
    scale: scaleState,
    setScale,
    onMouseDown,
    onMouseMove,
    stopDrag,
    onTouchStart,
    onTouchMove,
    getCroppedBlob,
  };
}

/* ─── crop modal ─────────────────────────────────────────────────────────── */
const CropModal = memo(function CropModal({
  imgSrc,
  onApply,
  onCancel,
}: {
  imgSrc: string;
  onApply: (blob: Blob) => void;
  onCancel: () => void;
}) {
  const canvasSize = useMemo(() => Math.min(280, window.innerWidth - 48), []);
  const crop = useCrop(imgSrc, canvasSize);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleApply = useCallback(async () => {
    try {
      const blob = await crop.getCroppedBlob();
      onApply(blob);
    } catch {
      toast.error("Crop failed.");
    }
  }, [crop.getCroppedBlob, onApply]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-light-card dark:bg-dark-card rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm shadow-2xl overflow-hidden">
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-light-border dark:bg-dark-border" />
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          <div className="flex items-center justify-between w-full">
            <h3 className="text-sm font-semibold text-light-header dark:text-dark-header">
              Crop Photo
            </h3>
            <button
              onClick={onCancel}
              className="bg-transparent text-light-secondary-text dark:text-dark-secondary-text hover:text-light-body-text dark:hover:text-dark-body-text transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text -mt-2 self-start">
            Drag to reposition · scroll or pinch to zoom
          </p>

          <canvas
            ref={crop.canvasRef}
            width={canvasSize}
            height={canvasSize}
            role="img"
            aria-label={`Crop preview, zoom ${crop.scale.toFixed(1)}x`}
            aria-roledescription="circular crop area"
            className="rounded-full cursor-grab active:cursor-grabbing touch-none"
            onMouseDown={crop.onMouseDown}
            onMouseMove={crop.onMouseMove}
            onMouseUp={crop.stopDrag}
            onMouseLeave={crop.stopDrag}
            onTouchStart={crop.onTouchStart}
            onTouchMove={crop.onTouchMove}
            onTouchEnd={crop.stopDrag}
          />

          <div className="flex items-center gap-2 w-full">
            <svg
              className="w-3 h-3 shrink-0 text-light-secondary-text dark:text-dark-secondary-text"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="11" cy="11" r="6" strokeWidth="2" />
              <path d="M21 21l-3.5-3.5" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={crop.scale}
              onChange={(e) => crop.setScale(parseFloat(e.target.value))}
              aria-valuetext={`${crop.scale.toFixed(1)}x zoom`}
              aria-label="Zoom level"
              className="flex-1 accent-light-accent dark:accent-dark-accent h-1 cursor-pointer"
            />
            <svg
              className="w-4 h-4 shrink-0 text-light-secondary-text dark:text-dark-secondary-text"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="11" cy="11" r="6" strokeWidth="2" />
              <path d="M21 21l-3.5-3.5" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          <div className="flex gap-2 w-full">
            <button
              onClick={onCancel}
              className="flex-1 py-2 rounded-lg text-xs border border-light-border dark:border-dark-border
                text-light-secondary-text dark:text-dark-secondary-text bg-transparent
                hover:text-light-body-text dark:hover:text-dark-body-text transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex-1 py-2 rounded-lg text-xs font-medium
                bg-light-btn-bg text-light-btn-text hover:bg-light-btn-hover-bg hover:text-light-btn-hover-text
                dark:bg-dark-btn-bg dark:text-dark-btn-text dark:hover:bg-dark-btn-hover-bg dark:hover:text-dark-btn-hover-text
                transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

/* ─── main component ─────────────────────────────────────────────────────── */
const ProfilePictureUpdate = memo(function ProfilePictureUpdate({
  user,
  onUpdated,
}: Props) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevImgSrc = useRef<string | null>(null);
  const cacheKey = `profilePhoto_${user?.id}`;

  const photoURL = (user?.user_metadata?.avatar_url as string) || null;

  const updateCache = useCallback(
    (newUrl: string) => {
      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ url: newUrl, timestamp: Date.now() }),
        );
      } catch {}
    },
    [cacheKey],
  );

  useEffect(() => {
    if (prevImgSrc.current) URL.revokeObjectURL(prevImgSrc.current);
    prevImgSrc.current = imgSrc;
    return () => {
      if (imgSrc) URL.revokeObjectURL(imgSrc);
    };
  }, [imgSrc]);

  const initials = useMemo(() => {
    const name = (user.user_metadata?.full_name as string)?.trim();
    const email = user.email?.split("@")[0] || "";
    return (name ? name.charAt(0) : email.charAt(0)).toUpperCase();
  }, [user.user_metadata?.full_name, user.email]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      if (!(await validateImage(f))) {
        toast.error(
          "Invalid image: must be JPEG/PNG/GIF/WEBP, <5MB, <4K resolution.",
        );
        return;
      }
      setImgSrc(URL.createObjectURL(f));
      if (inputRef.current) inputRef.current.value = "";
    },
    [],
  );

  const uploadBlob = useCallback(
    async (blob: Blob) => {
      if (!user) {
        toast.error("Not logged in.");
        return;
      }
      setUploading(true);

      try {
        const supabase = createClient();
        const path = `${user.id}/profile.jpg`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, blob, {
            contentType: "image/jpeg",
            upsert: true,
            cacheControl: "3600",
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(path);

        // Cache-bust so the browser doesn't reuse a stale cached image
        const bustedUrl = `${publicUrl}?t=${Date.now()}`;

        const { error: updateError } = await supabase.auth.updateUser({
          data: { avatar_url: bustedUrl },
        });
        if (updateError) throw updateError;

        updateCache(bustedUrl);
        onUpdated?.(bustedUrl);
        window.dispatchEvent(new Event("auth-updated"));
        toast.success("Profile picture updated!");
      } catch (err: any) {
        console.error("Upload error:", err);
        toast.error(err?.message || "Failed to upload photo.");
      } finally {
        setUploading(false);
      }
    },
    [user, onUpdated, updateCache],
  );

  const handleCropApply = useCallback(
    (blob: Blob) => {
      setImgSrc(null);
      uploadBlob(blob);
    },
    [uploadBlob],
  );

  const handleCancel = useCallback(() => setImgSrc(null), []);
  const handleAvatarClick = useCallback(() => {
    if (!uploading) inputRef.current?.click();
  }, [uploading]);

  return (
    <>
      {imgSrc && (
        <CropModal
          imgSrc={imgSrc}
          onApply={handleCropApply}
          onCancel={handleCancel}
        />
      )}

      <div className="flex flex-col items-center gap-1.5">
        <div
          className="relative group cursor-pointer w-24 h-24"
          onClick={handleAvatarClick}
          title="Click to change profile picture"
        >
          {photoURL ? (
            <img
              src={photoURL}
              alt="Profile"
              width={96}
              height={96}
              fetchPriority="high"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
              className="rounded-full object-cover w-24 h-24 ring-2 ring-light-border dark:ring-dark-border group-hover:ring-light-accent dark:group-hover:ring-dark-accent transition-all duration-200"
            />
          ) : (
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold
              bg-light-accent/15 dark:bg-dark-accent/15 text-light-accent dark:text-dark-accent
              ring-2 ring-light-border dark:ring-dark-border group-hover:ring-light-accent dark:group-hover:ring-dark-accent transition-all duration-200"
            >
              {initials}
            </div>
          )}

          {!uploading && (
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                />
              </svg>
            </div>
          )}

          {uploading && (
            <svg
              className="absolute inset-0 w-24 h-24 -rotate-90 animate-spin"
              viewBox="0 0 96 96"
              style={{ animationDuration: "1.2s" }}
            >
              <circle
                cx="48"
                cy="48"
                r="46"
                fill="none"
                strokeWidth="3"
                className="text-light-accent/20 dark:text-dark-accent/20"
                stroke="currentColor"
              />
              <circle
                cx="48"
                cy="48"
                r="46"
                fill="none"
                strokeWidth="3"
                className="text-light-accent dark:text-dark-accent"
                stroke="currentColor"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={RING_CIRCUMFERENCE * 0.7}
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>

        <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text h-4">
          {uploading ? "Uploading…" : ""}
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </>
  );
});

export default ProfilePictureUpdate;