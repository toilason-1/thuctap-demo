import { useDraggable } from "@dnd-kit/core";
import type { Label } from "../types/diagram";

interface Props {
  item: Label;
}

export const ItemCard: React.FC<Props> = ({ item }) => {
  return (
    <div className="
      px-4 py-2 rounded-xl
      bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500
      text-white font-semibold text-sm
      shadow-lg border border-white/30
      hover:scale-105 hover:shadow-xl
      transition-all duration-200
      cursor-grab active:cursor-grabbing
    ">
      {item.name}
    </div>
  );
};

const DraggableItem: React.FC<Props> = ({ item }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: item.id,
    data: item,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <ItemCard item={item} />
    </div>
  );
};

export default DraggableItem;