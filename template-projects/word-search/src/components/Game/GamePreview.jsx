import { useEffect, useState } from "react";
import { formatCssUrl, resolveTemplateAssetPath } from "../../utils/imageUtils";
import Grid from "../Grid/Grid";
import ImageHints from "../ImageHints/ImageHints";

export default function GamePreview({
  grid,
  items,
  background,
  selectedCells,
  foundCells,
  foundWords,
  hintCell,
  onHint,
  onOpenTutorial,
  onPointerDown,
  onPointerEnter,
  onPointerMove,
  onPointerUp
}) {
  const [hasBackgroundError, setHasBackgroundError] = useState(false);
  const resolvedBackground = resolveTemplateAssetPath(background);

  useEffect(() => {
    if (!resolvedBackground) {
      setHasBackgroundError(false);
      return;
    }

    let cancelled = false;
    const image = new Image();

    image.onload = () => {
      if (!cancelled) {
        setHasBackgroundError(false);
      }
    };

    image.onerror = () => {
      if (!cancelled) {
        setHasBackgroundError(true);
      }
    };

    image.src = resolvedBackground;

    return () => {
      cancelled = true;
    };
  }, [resolvedBackground]);

  const activeBackground = hasBackgroundError ? null : resolvedBackground;
  const uniqueFoundCount = new Set(foundWords).size;
  const totalWords = items.length;
  const progressPercent = totalWords ? Math.round((uniqueFoundCount / totalWords) * 100) : 0;
  const titleStyle = activeBackground
    ? { color: "#ffffff", mixBlendMode: "difference" }
    : { color: "#172033" };
  const helperStyle = activeBackground
    ? { color: "#ffffff", mixBlendMode: "difference" }
    : { color: "rgba(23, 32, 51, 0.78)" };

  return (
    <div className="overlay">
      <div
        className="overlay-content"
        style={{
          background: activeBackground ? formatCssUrl(activeBackground) : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundColor: "transparent"
        }}
      >
        <div className="game-topbar">
          <h2 className="game-title" style={titleStyle}>Word Search Game</h2>

          <div className="progress-container">
            <div className="progress-track" />
            <div
              className="progress-fill"
              style={{
                width: `${progressPercent}%`
              }}
            />
            <div className="progress-label">
              {uniqueFoundCount}/{totalWords} ({progressPercent}%)
            </div>
          </div>

          <p className="game-helper" style={helperStyle}>
            Drag across the grid to find words. On phones, swipe directly on the letters.
          </p>

          <div className="game-actions">
            <button className="hint-btn" onClick={onHint}>
              Hint
            </button>
            <button className="hint-btn hint-btn--secondary" onClick={onOpenTutorial}>
              How to Play
            </button>
          </div>
        </div>
        <div className="game-scale">
          <div className="game-wrapper">
            <Grid
              grid={grid}
              selectedCells={selectedCells || []}
              foundCells={foundCells || []}
              hintCell={hintCell}
              onPointerDown={onPointerDown}
              onPointerEnter={onPointerEnter}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />

            <ImageHints items={items} foundWords={foundWords} />
          </div>
        </div>
      </div>
    </div>
  );
}
