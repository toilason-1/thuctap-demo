import { AnimatePresence, motion } from "framer-motion";

// ─── Mascot Banner ────────────────────────────────────────────────────────────
export default function MascotBanner({
  state,
}: {
  state: "idle" | "happy" | "sad" | null;
}) {
  if (!state || state === "idle") return null;
  return (
    <AnimatePresence>
      <motion.div
        key={state}
        initial={{ scale: 0, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0, opacity: 0, y: -20 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        // Floating at bottom left
        // Absolute inside HUD on desktop
        className={`
          fixed z-50 bottom-8 left-8 right-auto
          md:absolute md:bottom-4 md:left-4 md:right-4
          rounded-2xl px-6 py-4 text-center font-black text-base shadow-2xl border-2
          ${
            state === "happy"
              ? "bg-linear-to-r from-green-400 to-emerald-500 text-white border-green-300"
              : "bg-linear-to-r from-red-400 to-pink-500 text-white border-red-300"
          }
        `}
      >
        {state === "happy"
          ? "🎉 Tuyệt vời! Đúng rồi!"
          : "😢 Sai rồi! Thử lại nhé!"}
      </motion.div>
    </AnimatePresence>
  );
}
