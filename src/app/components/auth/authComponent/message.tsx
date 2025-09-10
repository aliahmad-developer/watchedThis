"use client";

type Props = {
  message: string;
  messageKey: number;
};

export default function Message({ message, messageKey }: Props) {
  if (!message) return null;

  return (
    <div
      key={messageKey}
      className={`py-2 px-4 rounded-lg text-sm ${
        message.toLowerCase().includes("success") ||
        message.toLowerCase().includes("sent")
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      } transition-all duration-300 ease-in-out`}
    >
      {message}
    </div>
  );
}
