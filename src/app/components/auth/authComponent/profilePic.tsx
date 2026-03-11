"use client";
import { useState, useRef } from "react";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../../firebase/firebaseConfig";
import { User } from "firebase/auth";
import Image from "next/image";
import toast from "react-hot-toast";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

type Props = {
  user: User;
  onUpdated?: (newPhotoURL: string) => void;
};

export default function ProfilePictureUpdate({ user, onUpdated }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentPhoto = localPreview ?? auth.currentUser?.photoURL ?? null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }

    // Show local preview immediately
    setLocalPreview(URL.createObjectURL(f));

    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast.error("Not logged in.");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", f);
      formData.append("upload_preset", UPLOAD_PRESET);
      // Use timestamp in public_id to bust Cloudinary's CDN cache
      formData.append("public_id", `profile_${currentUser.uid}_${Date.now()}`);
      formData.append("folder", "profile_pictures");

      const downloadURL = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(
          "POST",
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        );
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable)
            setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            console.log("Cloudinary response:", data); // debug
            resolve(data.secure_url);
          } else {
            console.error("Cloudinary error:", xhr.responseText);
            reject(
              new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`),
            );
          }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(formData);
      });

      console.log("Uploading photoURL:", downloadURL); // debug

      // Update Firebase Auth
      await updateProfile(currentUser, { photoURL: downloadURL });
      await currentUser.getIdToken(true);
      await currentUser.reload();

      console.log("After reload photoURL:", auth.currentUser?.photoURL); // debug

      // Persist to Firestore
      try {
        await updateDoc(doc(db, "users", currentUser.uid), {
          photoURL: downloadURL,
        });
      } catch (err) {
        console.warn("Firestore update failed (non-critical):", err);
      }

      // Clear local preview — now auth.currentUser?.photoURL has the real URL
      setLocalPreview(null);

      // Notify AuthButton to re-sync
      window.dispatchEvent(new CustomEvent("signup-username-ready"));

      toast.success("Profile picture updated!");
      onUpdated?.(downloadURL);
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err?.message || "Failed to upload photo.");
      setLocalPreview(null);
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const initials = (() => {
    const name = user.displayName?.trim();
    const email = user.email?.split("@")[0] || "";
    return (name ? name.charAt(0) : email.charAt(0)).toUpperCase();
  })();

  const circumference = 2 * Math.PI * 46;

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Avatar — click to upload directly */}
      <div
        className="relative group cursor-pointer w-24 h-24"
        onClick={() => !uploading && inputRef.current?.click()}
        title="Click to change profile picture"
      >
        {currentPhoto ? (
          <Image
            src={currentPhoto}
            alt="Profile"
            width={96}
            height={96}
            referrerPolicy="no-referrer"
            unoptimized // skip Next.js cache so new Cloudinary URLs show immediately
            className="rounded-full object-cover w-24 h-24 ring-2 ring-light-border dark:ring-dark-border group-hover:ring-light-accent dark:group-hover:ring-dark-accent transition-all duration-200"
          />
        ) : (
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold
            bg-light-accent/15 dark:bg-dark-accent/15
            text-light-accent dark:text-dark-accent
            ring-2 ring-light-border dark:ring-dark-border
            group-hover:ring-light-accent dark:group-hover:ring-dark-accent
            transition-all duration-200"
          >
            {initials}
          </div>
        )}

        {/* Camera overlay */}
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

        {/* Progress ring */}
        {uploading && (
          <svg
            className="absolute inset-0 w-24 h-24 -rotate-90"
            viewBox="0 0 96 96"
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
              className="text-light-accent dark:text-dark-accent transition-all duration-150"
              stroke="currentColor"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress / 100)}
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>

      <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
        {uploading && `Uploading… ${progress}%`}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
