import clsx from "clsx";
import { useAnimation, type PanInfo, motion } from "framer-motion";
import { useRef } from "react";
import type { DraggableItemProps } from "../types/components";
import { layoutTransition } from "../config";

const DraggableItem: React.FC<DraggableItemProps> = ({
  item,
  onDragEnd,
  containerRef,
  isDragging,
  onDragStart,
}) => {
  const controls = useAnimation();
  const itemRef = useRef<HTMLDivElement>(null);

  const handleDragStart = () => {
    onDragStart(item.id);
  };

  const handleDragEnd = async (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const droppedOnGroup = await onDragEnd(item, info, itemRef);

    if (!droppedOnGroup) {
      controls.start({
        x: 0,
        y: 0,
        transition: { ...layoutTransition, duration: 0.3 },
      });
    }
  };

  return (
    <motion.div
      ref={itemRef}
      layout
      layoutId={item.id}
      drag
      dragConstraints={containerRef}
      dragMomentum={false}
      dragElastic={0.1}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      animate={controls}
      whileDrag={{
        scale: 1.1,
        zIndex: 50,
        boxShadow: "0px 10px 20px rgba(0,0,0,0.2)",
        cursor: "grabbing",
      }}
      transition={layoutTransition}
      className={clsx(
        "w-32 h-32 flex items-center justify-center border-4 border-yellow-400 rounded-3xl bg-white shadow-lg select-none",
        isDragging
          ? "opacity-0"
          : "opacity-100 cursor-grab active:cursor-grabbing",
      )}
      style={{ touchAction: "none" }}
    >
      <img
        src={item.imgsrc}
        alt={item.name}
        className="w-24 h-24 object-contain pointer-events-none"
      />
    </motion.div>
  );
};

export default DraggableItem;
