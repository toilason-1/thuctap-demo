import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useState, useMemo } from "react";

import type { DiagramData, Label } from "../types/diagram";
import DiagramBoard from "./DiagramBoard";
import { ItemCard } from "./DraggableItem";
import DraggableItem from "./DraggableItem";
import GameFeedback from "./GameFeedback";

interface Props {
  data: DiagramData;
}

const DiagramGame: React.FC<Props> = ({ data }) => {
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [activeLabel, setActiveLabel] = useState<Label | null>(null);

  // 🔥 NEW: trạng thái hướng dẫn
  const [started, setStarted] = useState(false);

  // 🔥 generate labels từ points
  const labels: Label[] = useMemo(
    () =>
      data.points.map((p) => ({
        id: p.id,
        name: p.text,
      })),
    [data]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveLabel(event.active.data.current as Label);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLabel(null);

    if (!over) return;

    const pointId = over.id as string;
    const label = active.data.current as Label;

    setPlaced((prev) => ({
      ...prev,
      [pointId]: label.id,
    }));
  };

  // 🔄 RESET GAME
  const handlePlayAgain = () => {
    setPlaced({});
    setStarted(false); // 👉 quay lại màn hướng dẫn
  };

  const usedLabels = Object.values(placed);
  const remainingLabels = labels.filter((l) => !usedLabels.includes(l.id));

  const isGameComplete =
    labels.length > 0 &&
    remainingLabels.length === 0 &&
    Object.keys(placed).length === data.points.length;

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen flex items-center justify-center
        bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">

        {/* ============================= */}
        {/* 🔥 MAIN GAME */}
        {/* ============================= */}
        <div className="w-full max-w-6xl
          bg-white/10 backdrop-blur-2xl
          rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.5)]
          p-6 flex gap-6 border border-white/20 relative overflow-hidden">

          {/* BOARD */}
          <div className="flex-1 flex items-center justify-center">
            <DiagramBoard data={data} placed={placed} />
          </div>

          {/* LABEL PANEL */}
          <div className="w-72 bg-white/10 rounded-2xl p-5 flex flex-col border border-white/10">
            
            <h2 className="text-white mb-4 text-lg font-bold tracking-wide">
              🏷️ Labels
            </h2>

            <div className="flex flex-col gap-3 overflow-y-auto pr-1 no-scrollbar">
              {remainingLabels.map((label) => (
                <DraggableItem key={label.id} item={label} />
              ))}
            </div>

            {/* COMPLETE */}
            {isGameComplete && (
              <div className="mt-6 text-center animate-fade-in">
                <div className="text-green-400 font-bold text-xl mb-3 animate-bounce">
                  🎉 Hoàn thành!
                </div>

                <button
                  onClick={handlePlayAgain}
                  className="
                    w-full py-3 rounded-xl font-semibold
                    bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500
                    hover:scale-105 hover:shadow-xl
                    transition-all duration-300 text-white
                  "
                >
                  🔄 Chơi lại
                </button>
              </div>
            )}
          </div>

          {/* ============================= */}
          {/* 🔥 OVERLAY HƯỚNG DẪN */}
          {/* ============================= */}
          {!started && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
              
              <div className="bg-white/10 backdrop-blur-xl
                border border-white/20
                rounded-2xl p-8 w-[400px] text-center
                shadow-2xl">

                <h2 className="text-2xl font-bold text-white mb-4">
                  🎮 Hướng dẫn
                </h2>

                <div className="text-gray-200 text-sm space-y-2 mb-6 text-left">
                  <p>👉 Kéo nhãn bên phải</p>
                  <p>👉 Thả vào đúng vị trí trên hình</p>
                  <p>👉 Hoàn thành tất cả để chiến thắng 🎉</p>
                </div>

                <button
                  onClick={() => setStarted(true)}
                  className="
                    w-full py-3 rounded-xl font-semibold
                    bg-gradient-to-r from-green-400 to-cyan-400
                    hover:scale-105 hover:shadow-xl
                    transition-all duration-300 text-black
                  "
                >
                  ▶️ Bắt đầu chơi
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FEEDBACK */}
      {started && <GameFeedback data={data} placed={placed} />}

      {/* DRAG PREVIEW */}
      <DragOverlay>
        {activeLabel ? <ItemCard item={activeLabel} /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default DiagramGame;