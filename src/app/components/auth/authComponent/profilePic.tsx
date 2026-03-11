"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../../firebase/firebaseConfig";
import { User } from "firebase/auth";
import Image from "next/image";
import toast from "react-hot-toast";

const CLOUD_NAME    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

type Props = { user: User; onUpdated?: (newPhotoURL: string) => void };

/* ─── crop hook ──────────────────────────────────────────────────────────── */
function useCrop(imgSrc: string | null) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef    = useRef<HTMLImageElement | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale]   = useState(1);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });

  useEffect(() => {
    if (!imgSrc) return;
    const img = new window.Image();
    img.onload = () => { imgRef.current = img; setOffset({ x: 0, y: 0 }); setScale(1); };
    img.src = imgSrc;
  }, [imgSrc]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img) return;
    const SIZE = canvas.width;
    const ctx  = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, SIZE, SIZE);
    const drawW = img.naturalWidth  * scale;
    const drawH = img.naturalHeight * scale;
    const dx    = (SIZE - drawW) / 2 + offset.x;
    const dy    = (SIZE - drawH) / 2 + offset.y;
    ctx.drawImage(img, dx, dy, drawW, drawH);
    // dim outside
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // border
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
  }, [offset, scale]);

  useEffect(() => { draw(); }, [draw, imgSrc]);

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({ x: dragStart.current.ox + e.clientX - dragStart.current.mx, y: dragStart.current.oy + e.clientY - dragStart.current.my });
  }, [dragging]);
  const stopDrag = () => setDragging(false);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    setDragging(true);
    dragStart.current = { mx: t.clientX, my: t.clientY, ox: offset.x, oy: offset.y };
  };
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging) return;
    const t = e.touches[0];
    setOffset({ x: dragStart.current.ox + t.clientX - dragStart.current.mx, y: dragStart.current.oy + t.clientY - dragStart.current.my });
  }, [dragging]);

  const getCroppedBlob = (): Promise<Blob> => new Promise((resolve, reject) => {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img) return reject(new Error("No canvas"));
    const SIZE = canvas.width;
    const ctx  = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.save();
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
    ctx.clip();
    const drawW = img.naturalWidth  * scale;
    const drawH = img.naturalHeight * scale;
    const dx    = (SIZE - drawW) / 2 + offset.x;
    const dy    = (SIZE - drawH) / 2 + offset.y;
    ctx.drawImage(img, dx, dy, drawW, drawH);
    ctx.restore();
    canvas.toBlob(b => b ? resolve(b) : reject(new Error("toBlob failed")), "image/jpeg", 0.92);
  });

  return { canvasRef, scale, setScale, onMouseDown, onMouseMove, stopDrag, onTouchStart, onTouchMove, getCroppedBlob };
}

/* ─── crop modal ─────────────────────────────────────────────────────────── */
function CropModal({ imgSrc, onApply, onCancel }: {
  imgSrc: string;
  onApply: (blob: Blob) => void;
  onCancel: () => void;
}) {
  const crop = useCrop(imgSrc);

  // lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleApply = async () => {
    try { onApply(await crop.getCroppedBlob()); }
    catch { toast.error("Crop failed."); }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-light-card dark:bg-dark-card rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm shadow-2xl overflow-hidden">
        {/* handle */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-light-border dark:bg-dark-border" />
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          {/* header */}
          <div className="flex items-center justify-between w-full">
            <h3 className="text-sm font-semibold text-light-header dark:text-dark-header">Crop Photo</h3>
            <button onClick={onCancel} className="bg-transparent text-light-secondary-text dark:text-dark-secondary-text hover:text-light-body-text dark:hover:text-dark-body-text transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text -mt-2 self-start">
            Drag to reposition · scroll or pinch to zoom
          </p>

          {/* canvas */}
          <canvas
            ref={crop.canvasRef}
            width={260}
            height={260}
            className="rounded-full cursor-grab active:cursor-grabbing touch-none"
            onMouseDown={crop.onMouseDown}
            onMouseMove={crop.onMouseMove}
            onMouseUp={crop.stopDrag}
            onMouseLeave={crop.stopDrag}
            onTouchStart={crop.onTouchStart}
            onTouchMove={crop.onTouchMove}
            onTouchEnd={crop.stopDrag}
            onWheel={(e) => {
              e.preventDefault();
              crop.setScale(s => Math.min(4, Math.max(0.5, s - e.deltaY * 0.001)));
            }}
          />

          {/* zoom slider */}
          <div className="flex items-center gap-2 w-full">
            <svg className="w-3 h-3 shrink-0 text-light-secondary-text dark:text-dark-secondary-text" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="6" strokeWidth="2"/><path d="M21 21l-3.5-3.5" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="range" min={0.5} max={4} step={0.01}
              value={crop.scale}
              onChange={e => crop.setScale(parseFloat(e.target.value))}
              className="flex-1 accent-light-accent dark:accent-dark-accent h-1 cursor-pointer"
            />
            <svg className="w-4 h-4 shrink-0 text-light-secondary-text dark:text-dark-secondary-text" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="6" strokeWidth="2"/><path d="M21 21l-3.5-3.5" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>

          {/* actions */}
          <div className="flex gap-2 w-full">
            <button onClick={onCancel}
              className="flex-1 py-2 rounded-lg text-xs border border-light-border dark:border-dark-border
                text-light-secondary-text dark:text-dark-secondary-text bg-transparent
                hover:text-light-body-text dark:hover:text-dark-body-text transition-colors">
              Cancel
            </button>
            <button onClick={handleApply}
              className="flex-1 py-2 rounded-lg text-xs font-medium
                bg-light-btn-bg text-light-btn-text hover:bg-light-btn-hover-bg hover:text-light-btn-hover-text
                dark:bg-dark-btn-bg dark:text-dark-btn-text dark:hover:bg-dark-btn-hover-bg dark:hover:text-dark-btn-hover-text
                transition-colors">
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── main component ─────────────────────────────────────────────────────── */
export default function ProfilePictureUpdate({ user, onUpdated }: Props) {
  const [imgSrc, setImgSrc]       = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentPhoto = auth.currentUser?.photoURL ?? null;

  const initials = (() => {
    const name  = user.displayName?.trim();
    const email = user.email?.split("@")[0] || "";
    return (name ? name.charAt(0) : email.charAt(0)).toUpperCase();
  })();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("Please select an image file."); return; }
    if (f.size > 5 * 1024 * 1024)    { toast.error("Image must be under 5MB."); return; }
    setImgSrc(URL.createObjectURL(f));
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleCropApply = async (blob: Blob) => {
    setImgSrc(null);
    const currentUser = auth.currentUser;
    if (!currentUser) { toast.error("Not logged in."); return; }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", blob, "profile.jpg");
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("public_id", `profile_${currentUser.uid}_${Date.now()}`);
      formData.append("folder", "profile_pictures");

      const downloadURL = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);
        xhr.upload.onprogress = e => { if (e.lengthComputable) setProgress(Math.round(e.loaded / e.total * 100)); };
        xhr.onload = () => xhr.status === 200
          ? resolve(JSON.parse(xhr.responseText).secure_url)
          : reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`));
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(formData);
      });

      await updateProfile(currentUser, { photoURL: downloadURL });
      await currentUser.getIdToken(true);
      await currentUser.reload();

      try { await updateDoc(doc(db, "users", currentUser.uid), { photoURL: downloadURL }); }
      catch (err) { console.warn("Firestore update non-critical:", err); }

      window.dispatchEvent(new CustomEvent("signup-username-ready"));
      toast.success("Profile picture updated!");
      onUpdated?.(downloadURL);
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload photo.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const circumference = 2 * Math.PI * 46;

  return (
    <>
      {/* crop modal — portal-style, rendered outside the card flow */}
      {imgSrc && (
        <CropModal
          imgSrc={imgSrc}
          onApply={handleCropApply}
          onCancel={() => setImgSrc(null)}
        />
      )}

      <div className="flex flex-col items-center gap-1.5">
        <div
          className="relative group cursor-pointer w-24 h-24"
          onClick={() => !uploading && inputRef.current?.click()}
          title="Click to change profile picture"
        >
          {currentPhoto ? (
            <Image src={currentPhoto} alt="Profile" width={96} height={96}
              referrerPolicy="no-referrer" unoptimized
              className="rounded-full object-cover w-24 h-24 ring-2 ring-light-border dark:ring-dark-border group-hover:ring-light-accent dark:group-hover:ring-dark-accent transition-all duration-200" />
          ) : (
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold
              bg-light-accent/15 dark:bg-dark-accent/15 text-light-accent dark:text-dark-accent
              ring-2 ring-light-border dark:ring-dark-border group-hover:ring-light-accent dark:group-hover:ring-dark-accent transition-all duration-200">
              {initials}
            </div>
          )}

          {!uploading && (
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </div>
          )}

          {uploading && (
            <svg className="absolute inset-0 w-24 h-24 -rotate-90" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="46" fill="none" strokeWidth="3"
                className="text-light-accent/20 dark:text-dark-accent/20" stroke="currentColor" />
              <circle cx="48" cy="48" r="46" fill="none" strokeWidth="3"
                className="text-light-accent dark:text-dark-accent transition-all duration-150"
                stroke="currentColor" strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress / 100)} strokeLinecap="round" />
            </svg>
          )}
        </div>

        <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text h-4">
          {uploading ? `Uploading… ${progress}%` : ""}
        </p>

        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>
    </>
  );
}