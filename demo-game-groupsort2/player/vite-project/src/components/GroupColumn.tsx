import { AnimatePresence, motion } from "framer-motion";
import { layoutTransition } from "../config";
import type { GroupColumnProps } from "../types/components";

const GroupColumn: React.FC<GroupColumnProps> = ({ group, items }) => {
  return (
    <div
      data-group-id={group.id}
      className="shrink-0 w-64 h-full flex flex-col items-center bg-blue-50 rounded-3xl border-4 border-blue-200"
    >
      <div className="flex flex-col items-center p-4 border-b-4 border-blue-200 w-full bg-blue-100 rounded-t-3xl">
        <div className="w-32 h-32 flex items-center justify-center">
          <img
            src={group.imgsrc}
            alt={group.name}
            className="w-32 h-32 object-contain"
          />
        </div>
        <h3 className="mt-2 text-xl font-bold text-blue-800 text-center">
          {group.name}
        </h3>
      </div>

      <div className="flex-1 w-full p-4 overflow-y-auto custom-scrollbar flex flex-col items-center gap-4">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              layoutId={item.id}
              layout
              transition={layoutTransition}
              className="w-32 h-32 shrink-0 flex items-center justify-center border-4 border-green-400 bg-white rounded-2xl shadow"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <img
                src={item.imgsrc}
                alt={item.name}
                className="w-24 h-24 object-contain"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GroupColumn;
