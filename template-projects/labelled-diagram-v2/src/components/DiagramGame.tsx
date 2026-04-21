import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  TransformComponent,
  TransformWrapper,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import { APP_DATA, resolveAssetUrl } from "../data";
import type { GameState } from "../types";
import "./DiagramGame.css";

// --- Sub-components ---

const GameHeader: React.FC<{
  progress: number;
  total: number;
  onHelp: () => void;
  onReset: () => void;
}> = ({ progress, total, onHelp, onReset }) => (
  <header className="game-header">
    <div className="game-title-group">
      <h1 className="game-title">Labelled Diagram</h1>
      <div className="stats-badge">
        Progress: {progress} / {total}
      </div>
    </div>
    <div className="header-controls">
      <button className="btn-header help" onClick={onHelp}>
        <span>💡</span> Tutorial
      </button>
      <button className="btn-header reset" onClick={onReset}>
        <span>🔄</span> Reset
      </button>
    </div>
  </header>
);

const TutorialModal: React.FC<{
  step: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}> = ({ step, onPrev, onNext, onClose }) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [step]);

  const steps = [
    {
      title: "Welcome! 👋",
      desc: "Let's learn how to label this diagram correctly. It's easy, follow the steps!",
      img: "tutorial-1.png",
    },
    {
      title: "Move and Zoom 🔍",
      desc: "Use your mouse wheel to zoom in or out. Hold the LEFT button and drag to move the map around.",
      img: "tutorial-2.png",
    },
    {
      title: "Interactive Modes 🖱️",
      desc: "Click the icon in the sidebar to switch between 'Click' and 'Drag' modes.",
      img: "tutorial-3.png",
    },
    {
      title: "Labelling 🏷️",
      desc: "In Drag mode, pull a label onto a target circle. In Click mode, select a label first, then click a target.",
      img: "tutorial-4.png",
    },
    {
      title: "Check Results ✅",
      desc: "Press 'Check Results' at the bottom when you're done. Green means correct, Red means try again!",
      img: "tutorial-5.png",
    },
  ];

  const currentStep = steps[step];

  return (
    <div className="tutorial-overlay" onClick={onClose}>
      <motion.div
        className="tutorial-content"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tutorial-media">
          {!imgError ? (
            <img
              src={`assets/images/${currentStep.img}`}
              alt={currentStep.title}
              className="tutorial-img"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="tutorial-placeholder">
              <span>🖼️</span>
              <span>Tutorial Image {step + 1}</span>
            </div>
          )}
        </div>
        <div className="tutorial-info">
          <div className="tutorial-step-dots">
            {steps.map((_, i) => (
              <div key={i} className={`dot ${i === step ? "active" : ""}`} />
            ))}
          </div>
          <h2 className="tutorial-title">{currentStep.title}</h2>
          <p className="tutorial-desc">{currentStep.desc}</p>
          <div className="tutorial-nav">
            {step > 0 ? (
              <button className="btn-nav btn-prev" onClick={onPrev}>
                Previous
              </button>
            ) : (
              <div style={{ flex: 1 }} />
            )}
            {step < steps.length - 1 ? (
              <button className="btn-nav btn-next" onClick={onNext}>
                Next
              </button>
            ) : (
              <button className="btn-nav btn-done" onClick={onClose}>
                Start Playing
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const AnnotationPoint: React.FC<{
  isCorrect: boolean;
  isWrong: boolean;
  hasLabel: boolean;
  placedLabelText?: string;
  canDrop: boolean;
  onClick: () => void;
  style: React.CSSProperties;
}> = ({
  isCorrect,
  isWrong,
  hasLabel,
  placedLabelText,
  canDrop,
  onClick,
  style,
}) => (
  <div
    className={`target-point ${canDrop ? "can-drop" : ""} ${hasLabel ? "has-label" : ""} ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`}
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    style={style}
  >
    <div className="target-marker" />
    <AnimatePresence>
      {placedLabelText && (
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 10, x: "-50%" }}
          animate={{ scale: 1, opacity: 1, y: 0, x: "-50%" }}
          exit={{ scale: 0, opacity: 0, y: 10, x: "-50%" }}
          className="placed-label"
        >
          {placedLabelText}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// --- Main Game Component ---

const DiagramGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    placedPoints: {},
    isReviewMode: false,
    showCongratulation: false,
    interactionMode: "click",
    isTutorialOpen: false,
    tutorialStep: 0,
  });

  const [activeLabelId, setActiveLabelId] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState<{
    width: number;
    height: number;
  } | null>(APP_DATA.imagePath ? null : { width: 800, height: 500 });
  const [transform, setTransform] = useState({
    scale: 1,
    positionX: 0,
    positionY: 0,
  });

  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const availableLabels = useMemo(() => {
    const placedLabelIds = Object.values(gameState.placedPoints);
    let items = APP_DATA.points.filter((p) => !placedLabelIds.includes(p.id));

    if (gameState.interactionMode === "click" && activeLabelId) {
      const activeItem = items.find((p) => p.id === activeLabelId);
      if (activeItem) {
        items = [activeItem, ...items.filter((p) => p.id !== activeLabelId)];
      }
    }
    return items;
  }, [gameState.placedPoints, activeLabelId, gameState.interactionMode]);

  const handleTargetClick = (pointId: string) => {
    if (gameState.isReviewMode) return;
    if (activeLabelId) {
      setGameState((prev) => {
        const newPlaced = { ...prev.placedPoints };
        Object.keys(newPlaced).forEach((tid) => {
          if (newPlaced[tid] === activeLabelId) delete newPlaced[tid];
        });
        newPlaced[pointId] = activeLabelId;
        return { ...prev, placedPoints: newPlaced };
      });
      setActiveLabelId(null);
    } else {
      const existingLabelId = gameState.placedPoints[pointId];
      if (existingLabelId) {
        setActiveLabelId(existingLabelId);
        setGameState((prev) => {
          const newPlaced = { ...prev.placedPoints };
          delete newPlaced[pointId];
          return { ...prev, placedPoints: newPlaced };
        });
      }
    }
  };

  return (
    <div className="game-container">
      <GameHeader
        progress={Object.keys(gameState.placedPoints).length}
        total={APP_DATA.points.length}
        onHelp={() =>
          setGameState((prev) => ({
            ...prev,
            isTutorialOpen: true,
            tutorialStep: 0,
          }))
        }
        onReset={() =>
          setGameState((prev) => ({
            ...prev,
            placedPoints: {},
            isReviewMode: false,
            showCongratulation: false,
          }))
        }
      />

      <main className="game-main">
        <div className="canvas-area">
          <TransformWrapper
            ref={transformRef}
            initialScale={1}
            minScale={0.1}
            maxScale={8}
            centerOnInit
            doubleClick={{ disabled: true }}
            onTransformed={(ref) => setTransform({ ...ref.state })}
            onInit={(ref) => setTransform({ ...ref.state })}
          >
            {({ resetTransform }) => (
              <div className="diagram-stage">
                <div className="canvas-controls">
                  <button onClick={() => transformRef.current?.zoomIn()}>
                    +
                  </button>
                  <button onClick={() => transformRef.current?.zoomOut()}>
                    -
                  </button>
                  <button
                    className="btn-reset-view"
                    onClick={() => resetTransform()}
                  >
                    Reset View
                  </button>
                </div>

                <TransformComponent
                  wrapperStyle={{ width: "100%", height: "100%" }}
                >
                  <div className="diagram-wrapper">
                    {APP_DATA.imagePath ? (
                      <img
                        ref={imgRef}
                        src={resolveAssetUrl(APP_DATA.imagePath)}
                        alt="Diagram"
                        className="diagram-image"
                        draggable={false}
                        onLoad={(e) => {
                          const img = e.currentTarget;
                          setImgSize({
                            width: img.offsetWidth,
                            height: img.offsetHeight,
                          });
                          if (transformRef.current) {
                            setTransform({
                              ...transformRef.current.instance.transformState,
                            });
                          }
                        }}
                      />
                    ) : (
                      <div className="image-placeholder">
                        <span className="placeholder-icon">🖼️</span>
                        <span className="placeholder-text">
                          Select a diagram in the editor to begin
                        </span>
                      </div>
                    )}
                  </div>
                </TransformComponent>

                <div className="annotation-layer">
                  {imgSize &&
                    APP_DATA.points.map((point) => {
                      const placedLabelId = gameState.placedPoints[point.id];
                      const labelItem = APP_DATA.points.find(
                        (p) => p.id === placedLabelId,
                      );
                      const isCorrect =
                        gameState.isReviewMode && placedLabelId === point.id;
                      const isWrong =
                        gameState.isReviewMode &&
                        placedLabelId &&
                        placedLabelId !== point.id;

                      const x =
                        (point.xPercent / 100) *
                          imgSize.width *
                          transform.scale +
                        transform.positionX;
                      const y =
                        (point.yPercent / 100) *
                          imgSize.height *
                          transform.scale +
                        transform.positionY;

                      return (
                        <AnnotationPoint
                          key={point.id}
                          point={point}
                          isCorrect={isCorrect}
                          isWrong={isWrong}
                          hasLabel={!!placedLabelId}
                          placedLabelText={labelItem?.text}
                          canDrop={false}
                          onClick={() => handleTargetClick(point.id)}
                          style={{ left: x, top: y, position: "absolute" }}
                        />
                      );
                    })}
                </div>
              </div>
            )}
          </TransformWrapper>
        </div>

        <aside className="labels-rack">
          <div className="rack-header">
            <h2 className="rack-title">Labels</h2>
            <button
              className="mode-toggle-icon"
              onClick={() =>
                setGameState((prev) => ({
                  ...prev,
                  interactionMode:
                    prev.interactionMode === "click" ? "drag" : "click",
                }))
              }
            >
              {gameState.interactionMode === "click" ? "🖱️" : "🖐️"}
            </button>
          </div>

          <div className="labels-scroll-container">
            <AnimatePresence mode="popLayout">
              {availableLabels.map((label) => (
                <motion.div
                  key={label.id}
                  layout
                  className={`label-item ${activeLabelId === label.id ? "active" : ""} ${gameState.interactionMode === "click" && activeLabelId === label.id ? "pinned" : ""}`}
                  onClick={() => {
                    if (gameState.interactionMode === "click") {
                      setActiveLabelId((prev) =>
                        prev === label.id ? null : label.id,
                      );
                    }
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {label.text}
                </motion.div>
              ))}
            </AnimatePresence>
            {availableLabels.length === 0 && (
              <div className="no-labels">Challenge complete! 🎉</div>
            )}
          </div>

          <div className="rack-footer">
            <button
              className={`btn-submit ${gameState.isReviewMode ? "active" : ""}`}
              onClick={() => {
                if (gameState.isReviewMode) {
                  setGameState((prev) => ({ ...prev, isReviewMode: false }));
                } else {
                  const correctCount = Object.keys(
                    gameState.placedPoints,
                  ).filter((tid) => gameState.placedPoints[tid] === tid).length;
                  setGameState((prev) => ({
                    ...prev,
                    isReviewMode: true,
                    showCongratulation: correctCount === APP_DATA.points.length,
                  }));
                }
              }}
              disabled={Object.keys(gameState.placedPoints).length === 0}
            >
              {gameState.isReviewMode ? "Back to Edit" : "Check Results"}
            </button>
          </div>
        </aside>
      </main>

      <AnimatePresence>
        {gameState.isTutorialOpen && (
          <TutorialModal
            step={gameState.tutorialStep}
            onPrev={() =>
              setGameState((prev) => ({
                ...prev,
                tutorialStep: prev.tutorialStep - 1,
              }))
            }
            onNext={() =>
              setGameState((prev) => ({
                ...prev,
                tutorialStep: prev.tutorialStep + 1,
              }))
            }
            onClose={() =>
              setGameState((prev) => ({ ...prev, isTutorialOpen: false }))
            }
          />
        )}

        {gameState.showCongratulation && (
          <div
            className="popup-overlay"
            onClick={() =>
              setGameState((p) => ({ ...p, showCongratulation: false }))
            }
          >
            <motion.div
              className="popup-content"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="popup-icon">🏆</div>
              <h2>Perfect Score!</h2>
              <p>You have successfully labelled all parts of the diagram.</p>
              <button
                className="btn-popup"
                onClick={() =>
                  setGameState((p) => ({ ...p, showCongratulation: false }))
                }
              >
                Awesome!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DiagramGame;
