"use client";
import { useState } from "react";
import SceneCameraModal from "./cameraModal";

export default function SceneCamera() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Detect movie scene"
        className="fixed bottom-6 right-4 sm:right-20 z-40
                   w-12 h-12 rounded-full shadow-lg
                   bg-light-btn-bg dark:bg-dark-btn-bg
                   text-light-btn-text dark:text-dark-btn-text
                   hover:bg-light-btn-hover-bg dark:hover:bg-dark-btn-hover-bg
                   hover:scale-110 active:scale-95
                   transition-all duration-200
                   flex items-center justify-center"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
        </svg>
      </button>

      <SceneCameraModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}