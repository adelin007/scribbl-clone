import { Paintbrush, Trash2 } from "lucide-react";
import { RoundScores } from "./RoundScores";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  onClientEvent,
  selectWord,
  sendDrawingData,
  sendGuess,
  socket,
} from "../socket/config";
import {
  GameEvent,
  RoomState,
  type DrawDataPoint,
  type DrawDataUpdateType,
  type Room,
  type ShapeType,
} from "../types";
import type { GameViewProps } from "../types/views";

export const GameView = ({ room, playerName, playerColor }: GameViewProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chatFeedRef = useRef<HTMLDivElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const shapeStartRef = useRef<{ x: number; y: number } | null>(null);
  const brushSizeRef = useRef(8);
  const brushColorRef = useRef("#2f2a24");
  const [canvasReady, setCanvasReady] = useState(false);
  const [brushSize, setBrushSize] = useState(8);
  const [brushColor, setBrushColor] = useState("#2f2a24");
  const [guessInput, setGuessInput] = useState("");
  const chatInputRef = useRef<HTMLInputElement | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [roundEndDialog, setRoundEndDialog] = useState<{
    show: boolean;
    word: string;
  }>({ show: false, word: "" });
  const [activeTool, setActiveTool] = useState<
    "brush" | "circle" | "triangle" | "rectangle"
  >("brush");
  const brushSizes = [4, 8, 14];
  const brushColors = [
    "#000000",
    "#ffffff",
    "#ff0000",
    "#ff7f00",
    "#ffff00",
    "#7fff00",
    "#00ff00",
    "#00ff7f",
    "#00ffff",
    "#007fff",
    "#0000ff",
    "#7f00ff",
    "#ff00ff",
    "#ff007f",
  ];
  const remotePointsRef = useRef(
    new Map<string, { x: number; y: number; timestamp: number }>(),
  );
  const pendingDrawingDataRef = useRef<DrawDataPoint[] | null>(null);
  const gamePlayers = room?.players?.length ? room.players : [];
  const localPlayer =
    room?.players?.find((player) => player.socketId === socket.id) ??
    room?.players?.find(
      (player) => player.name === playerName && player.color === playerColor,
    );

  const isDrawingAllowed = Boolean(
    room?.gameState?.currentDrawerId &&
    localPlayer?.id === room.gameState.currentDrawerId,
  );
  const activeRoomId = room?.id;
  const localPlayerId = localPlayer?.id;

  const buildBrushCursor = (size: number, color: string) => {
    const radius = size / 2;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${radius}" cy="${radius}" r="${radius - 1}" fill="${color}" stroke="rgba(47,42,36,0.6)" stroke-width="1"/></svg>`;
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") ${radius} ${radius}, crosshair`;
  };

  // const buildBucketCursor = () => {
  //   const size = 18;
  //   const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="rgba(47,42,36,0.9)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 6h10l-1 13H8L7 6z"/><path d="M9 6a3 3 0 0 1 6 0"/><path d="M7 14h10"/></svg>`;
  //   return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") 4 4, crosshair`;
  // };

  const isShapeTool = (tool: typeof activeTool) =>
    tool === "circle" || tool === "triangle" || tool === "rectangle";

  const drawShape = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      tool: ShapeType,
      start: { x: number; y: number },
      end: { x: number; y: number },
      options?: { preview?: boolean; color?: string; size?: number },
    ) => {
      const radius = Math.hypot(end.x - start.x, end.y - start.y);
      ctx.save();
      ctx.lineWidth = options?.size ?? brushSizeRef.current;
      ctx.strokeStyle = options?.color ?? brushColorRef.current;
      if (options?.preview) {
        ctx.globalAlpha = 0.6;
        ctx.setLineDash([6, 4]);
      }

      if (tool === "circle") {
        ctx.beginPath();
        ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (tool === "rectangle") {
        const width = Math.abs(end.x - start.x) * 2;
        const height = Math.abs(end.y - start.y) * 2;
        ctx.strokeRect(
          start.x - width / 2,
          start.y - height / 2,
          width,
          height,
        );
      } else if (tool === "triangle") {
        const height = radius * Math.sqrt(3);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y - (2 / 3) * height);
        ctx.lineTo(start.x - radius, start.y + height / 3);
        ctx.lineTo(start.x + radius, start.y + height / 3);
        ctx.closePath();
        ctx.stroke();
      }

      ctx.restore();
    },
    [],
  );

  const emitShapeUpdate = (
    tool: ShapeType,
    start: { x: number; y: number },
    end: { x: number; y: number },
  ) => {
    if (!activeRoomId || !localPlayerId) return;
    sendDrawingData({
      roomId: activeRoomId,
      playerId: localPlayerId,
      action: "DRAW",
      drawingData: {
        roomId: activeRoomId,
        playerId: localPlayerId,
        tool: "shape",
        size: brushSizeRef.current,
        color: brushColorRef.current,
        shape: {
          kind: tool,
          start,
          end,
        },
        timestamp: new Date().toISOString(),
      },
    });
  };

  const clearPreview = () => {
    const preview = previewCanvasRef.current;
    if (!preview) return;
    const ctx = preview.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, preview.width, preview.height);
  };

  const cancelShape = useCallback(() => {
    shapeStartRef.current = null;
    clearPreview();
  }, []);

  const drawPreview = (
    tool: ShapeType,
    start: { x: number; y: number },
    end: { x: number; y: number },
  ) => {
    const preview = previewCanvasRef.current;
    if (!preview) return;
    const ctx = preview.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, preview.width, preview.height);
    drawShape(ctx, tool, start, end, { preview: true });
  };

  const emitDrawingUpdate = (
    action: DrawDataUpdateType,
    point: { x: number; y: number },
    toolOverride?: "brush",
  ) => {
    if (!activeRoomId || !localPlayerId) return;
    const tool =
      toolOverride ?? (isShapeTool(activeTool) ? "brush" : activeTool);
    sendDrawingData({
      roomId: activeRoomId,
      playerId: localPlayerId,
      action,
      drawingData: {
        roomId: activeRoomId,
        playerId: localPlayerId,
        tool,
        size: brushSizeRef.current,
        color: brushColorRef.current,
        x: point.x,
        y: point.y,
        timestamp: new Date().toISOString(),
      },
    });
  };

  const handleGuessSubmit = () => {
    if (!guessInput.trim() || !activeRoomId || !localPlayerId) return;
    const inputElement = chatInputRef.current;
    sendGuess({
      roomId: activeRoomId,
      playerId: localPlayerId,
      guess: guessInput.trim(),
    });
    setGuessInput("");
    // Keep focus after state update
    requestAnimationFrame(() => {
      inputElement?.focus();
    });
  };

  const handleGuessKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleGuessSubmit();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const preview = previewCanvasRef.current;
    const previewCtx = preview?.getContext("2d");

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * scale);
      canvas.height = Math.floor(rect.height * scale);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      if (preview && previewCtx) {
        preview.width = Math.floor(rect.width * scale);
        preview.height = Math.floor(rect.height * scale);
        previewCtx.setTransform(scale, 0, 0, scale, 0, 0);
        previewCtx.clearRect(0, 0, preview.width, preview.height);
      }
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = brushSizeRef.current;
      ctx.strokeStyle = brushColorRef.current;
      setCanvasReady(true);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cancelShape();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cancelShape]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    brushSizeRef.current = brushSize;
    brushColorRef.current = brushColor;
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = brushColor;
  }, [brushColor, brushSize]);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    remotePointsRef.current.clear();
  }, []);

  const replayDrawingData = useCallback(
    (drawingData: DrawDataPoint[]) => {
      const drawRemoteStroke = (data: DrawDataPoint) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        if (data.tool === "shape") {
          drawShape(ctx, data.shape.kind, data.shape.start, data.shape.end, {
            color: data.color,
            size: data.size,
          });
          return;
        }
        const x = data.x;
        const y = data.y;
        const lastPoint = remotePointsRef.current.get(data.playerId);
        const strokeColor = data.color;
        const timestamp = Number.isNaN(Date.parse(data.timestamp))
          ? Date.now()
          : Date.parse(data.timestamp);
        const shouldBreakStroke =
          lastPoint && Math.abs(timestamp - lastPoint.timestamp) > 100;

        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = data.size;
        ctx.strokeStyle = strokeColor;

        if (lastPoint && !shouldBreakStroke) {
          ctx.beginPath();
          ctx.moveTo(lastPoint.x, lastPoint.y);
          ctx.lineTo(x, y);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.fillStyle = strokeColor;
          ctx.arc(x, y, data.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        remotePointsRef.current.set(data.playerId, { x, y, timestamp });
      };

      clearCanvas();
      drawingData.forEach((data) => {
        drawRemoteStroke(data);
      });
    },
    [clearCanvas, drawShape],
  );

  useEffect(() => {
    const unsubscribe = onClientEvent(
      GameEvent.UPDATED_DRAWING_DATA,
      (payload) => {
        const roomData = payload?.data as Room | undefined;
        const drawingData = roomData?.gameState?.drawingData;
        if (!drawingData) return;
        if (!canvasReady) {
          pendingDrawingDataRef.current = drawingData;
          return;
        }

        replayDrawingData(drawingData);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [canvasReady, replayDrawingData]);

  useEffect(() => {
    if (!canvasReady) return;
    if (!pendingDrawingDataRef.current) return;
    const drawingData = pendingDrawingDataRef.current;
    pendingDrawingDataRef.current = null;
    replayDrawingData(drawingData);
  }, [canvasReady, replayDrawingData]);

  useEffect(() => {
    const unsubscribe = onClientEvent(GameEvent.GUESS_MADE, (payload) => {
      const roomData = payload?.data as Room | undefined;
      if (!roomData) return;
      // Room data already has updated guesses array
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onClientEvent(GameEvent.ROUND_STARTED, (payload) => {
      const roomData = payload?.data as Room | undefined;
      if (!roomData) return;

      // Show dialog with the last word from the previous round
      if (roomData.gameState?.lastWord) {
        setRoundEndDialog({ show: true, word: roomData.gameState.lastWord });
        setTimeout(() => {
          setRoundEndDialog({ show: false, word: "" });
        }, 3000);
      }

      // Clear the canvas when a new round starts
      clearCanvas();
    });

    return () => {
      unsubscribe();
    };
  }, [clearCanvas]);

  useEffect(() => {
    if (chatFeedRef.current) {
      chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
    }
  }, [room?.gameState?.guesses]);

  useEffect(() => {
    const drawTimeSeconds = room?.settings?.drawTime ?? 0;
    const timerStartedAt = room?.gameState?.timerStartedAt;
    const isDrawing = room?.gameState?.roomState === RoomState.DRAWING;

    if (!isDrawing || !timerStartedAt || drawTimeSeconds <= 0) {
      const resetTimeoutId = window.setTimeout(() => {
        setTimeLeft(null);
      }, 0);
      return () => {
        window.clearTimeout(resetTimeoutId);
      };
    }

    const updateTimeLeft = () => {
      const startedAtMs = new Date(timerStartedAt).getTime();
      const elapsedSeconds = Math.floor((Date.now() - startedAtMs) / 1000);
      const remainingSeconds = Math.max(0, drawTimeSeconds - elapsedSeconds);
      setTimeLeft(remainingSeconds);
    };

    const initialTimeoutId = window.setTimeout(updateTimeLeft, 0);
    const intervalId = window.setInterval(() => {
      updateTimeLeft();
    }, 1000);

    return () => {
      window.clearTimeout(initialTimeoutId);
      window.clearInterval(intervalId);
    };
  }, [
    room?.settings?.drawTime,
    room?.gameState?.timerStartedAt,
    room?.gameState?.roomState,
  ]);

  // Auto-focus the input when it becomes available to guess
  useEffect(() => {
    const canGuessNow =
      !isDrawingAllowed &&
      !localPlayer?.guessed &&
      room?.gameState?.roomState === RoomState.DRAWING;

    if (canGuessNow && chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, [isDrawingAllowed, localPlayer?.guessed, room?.gameState?.roomState]);

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingAllowed) return;
    if (!canvasReady) return;
    if (isShapeTool(activeTool)) {
      const point = getPoint(event);
      if (!point) return;
      shapeStartRef.current = point;
      drawPreview(activeTool, point, point);
      return;
    }

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const point = getPoint(event);
    if (!point) return;
    drawingRef.current = true;
    lastPointRef.current = point;
    emitDrawingUpdate("DRAW", point);
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = brushColor;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingAllowed) return;
    if (shapeStartRef.current && isShapeTool(activeTool)) {
      const point = getPoint(event);
      if (!point) return;
      drawPreview(activeTool, shapeStartRef.current, point);
      return;
    }
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const point = getPoint(event);
    if (!point) return;
    const lastPoint = lastPointRef.current;
    if (!lastPoint) return;
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPointRef.current = point;
    emitDrawingUpdate("DRAW", point);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingAllowed) return;
    if (shapeStartRef.current && isShapeTool(activeTool)) {
      const start = shapeStartRef.current;
      cancelShape();
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      const end = getPoint(event) ?? start;
      drawShape(ctx, activeTool, start, end);
      emitShapeUpdate(activeTool, start, end);
      return;
    }
    drawingRef.current = false;
    lastPointRef.current = null;
  };

  const handleClear = () => {
    if (!isDrawingAllowed) return;
    const confirmed = window.confirm("Clear the canvas?");
    if (!confirmed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    emitDrawingUpdate("CLEAR", { x: 0, y: 0 });
  };

  const canGuess =
    !isDrawingAllowed &&
    !localPlayer?.guessed &&
    room?.gameState?.roomState === RoomState.DRAWING;

  const isPlayerChoosingWord =
    room?.gameState?.roomState === RoomState.PLAYER_CHOOSE_WORD;

  const headerStatus = isPlayerChoosingWord
    ? "Choosing word..."
    : isDrawingAllowed
      ? "Your turn to draw!"
      : "Guess the word!";

  const formatTime = (seconds: number) => {
    const safeSeconds = Math.max(0, seconds);
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  };

  console.log("Rendering GameView with room:", room);

  return (
    <section className="view game-view">
      {roundEndDialog.show && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setRoundEndDialog({ show: false, word: "" })}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "2rem 3rem",
              borderRadius: "0.5rem",
              textAlign: "center",
              maxWidth: "500px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, color: "#2f2a24" }}>🎉🎉🎉</h2>
            <p style={{ fontSize: "1.2rem", margin: "1rem 0" }}>
              The word was:{" "}
              <strong style={{ color: "#4f86c6", fontSize: "1.5rem" }}>
                {roundEndDialog.word}
              </strong>
            </p>
            <div style={{ margin: "2rem 0 1rem 0" }}>
              <h3 style={{ color: "#2f2a24", marginBottom: "0.5rem" }}>
                Scores
              </h3>
              <RoundScores
                players={gamePlayers}
                localPlayerId={localPlayerId}
                isRoundOver={room?.gameState?.roomState !== RoomState.DRAWING}
                roundScores={room?.gameState?.roundScores || {}}
                currentRound={room?.gameState?.currentRound || 1}
              />
            </div>
            <button
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1.5rem",
                backgroundColor: "#4f86c6",
                color: "white",
                border: "none",
                borderRadius: "0.25rem",
                cursor: "pointer",
                fontSize: "1rem",
              }}
              onClick={() => setRoundEndDialog({ show: false, word: "" })}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {!roundEndDialog.show &&
        room?.gameState?.roomState === RoomState.PLAYER_CHOOSE_WORD &&
        isDrawingAllowed &&
        room?.gameState?.wordChoices &&
        room.gameState.wordChoices.length > 0 && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                padding: "2rem 3rem",
                borderRadius: "0.5rem",
                textAlign: "center",
                maxWidth: "600px",
              }}
            >
              <h2 style={{ marginTop: 0, color: "#2f2a24" }}>
                Choose a word to draw
              </h2>
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  marginTop: "2rem",
                  justifyContent: "center",
                }}
              >
                {room.gameState.wordChoices.map((word) => (
                  <button
                    key={word}
                    style={{
                      padding: "1rem 2rem",
                      backgroundColor: "#4f86c6",
                      color: "white",
                      border: "none",
                      borderRadius: "0.5rem",
                      cursor: "pointer",
                      fontSize: "1.2rem",
                      fontWeight: "600",
                      transition: "transform 0.1s, background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.05)";
                      e.currentTarget.style.backgroundColor = "#3a6fa0";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.backgroundColor = "#4f86c6";
                    }}
                    onClick={() => {
                      if (!activeRoomId || !localPlayerId) return;
                      selectWord({
                        roomId: activeRoomId,
                        playerId: localPlayerId,
                        word,
                      });
                    }}
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      <div className="game-topbar panel">
        <div>
          <strong>Round {room?.gameState?.currentRound || 1}</strong>
          <span className="muted"> / {room?.settings?.rounds || 3}</span>
        </div>
        <div
          className="game-topbar-center"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <div>{headerStatus}</div>
          {isDrawingAllowed && room?.gameState?.currentWord && (
            <div
              style={{
                fontSize: "2rem",
                fontWeight: "700",
                letterSpacing: "0.05em",
              }}
            >
              {room.gameState.currentWord}
            </div>
          )}
        </div>
        <div className="game-timer">
          {timeLeft === null
            ? formatTime(room?.settings?.drawTime ?? 0)
            : formatTime(timeLeft)}
        </div>
      </div>

      <div className="game-grid">
        <aside className="panel game-players">
          <h3>Players</h3>
          <ul className="list">
            {gamePlayers.map((player) => {
              const isDrawer = player.id === room?.gameState?.currentDrawerId;
              const isLocalPlayer =
                player.name === playerName && player.color === playerColor;
              return (
                <li
                  className={`list-item ${isDrawer ? "drawing" : ""}`}
                  key={player.id}
                >
                  <span
                    className="avatar"
                    style={{ backgroundColor: player.color }}
                  />
                  <span>
                    {player.name}
                    {isLocalPlayer && <span className="player-you">YOU</span>}
                  </span>
                  <span className="player-score">{player.score}</span>
                  {isDrawer && <span className="drawer-badge">Drawing</span>}
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="panel game-board">
          <div className="canvas-wrap">
            <canvas
              ref={canvasRef}
              className="canvas"
              style={{
                cursor: isDrawingAllowed
                  ? buildBrushCursor(brushSize, brushColor)
                  : "not-allowed",
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />
            <canvas ref={previewCanvasRef} className="canvas-preview" />
          </div>
          <div
            className="tools"
            style={{ opacity: isDrawingAllowed ? 1 : 0.5 }}
          >
            <div className="tool-row">
              <button
                type="button"
                className={`btn secondary toggle ${activeTool === "brush" ? "active" : ""}`}
                onClick={() => setActiveTool("brush")}
                disabled={!isDrawingAllowed}
              >
                <Paintbrush size={16} />
                Brush
              </button>
              <button
                className="btn secondary"
                onClick={handleClear}
                disabled={!isDrawingAllowed}
              >
                <Trash2 size={16} />
                Clear
              </button>
            </div>
            <div className="tool-row">
              <span className="label">Shapes</span>
              <button
                type="button"
                className={`btn secondary toggle ${activeTool === "circle" ? "active" : ""}`}
                onClick={() => setActiveTool("circle")}
                disabled={!isDrawingAllowed}
              >
                Circle
              </button>
              <button
                type="button"
                className={`btn secondary toggle ${activeTool === "rectangle" ? "active" : ""}`}
                onClick={() => setActiveTool("rectangle")}
                disabled={!isDrawingAllowed}
              >
                Rectangle
              </button>
              <button
                type="button"
                className={`btn secondary toggle ${activeTool === "triangle" ? "active" : ""}`}
                onClick={() => setActiveTool("triangle")}
                disabled={!isDrawingAllowed}
              >
                Triangle
              </button>
              <span className="shape-tooltip">
                Click and drag to size. Release to draw. Press Esc to cancel.
              </span>
            </div>
            <div className="tool-row">
              <span className="label">Brush</span>
              <div className="brush-sizes">
                {brushSizes.map((size, index) => (
                  <button
                    key={size}
                    type="button"
                    className={`brush-dot ${index === 0 ? "small" : ""} ${index === 2 ? "large" : ""} ${brushSize === size ? "selected" : ""}`}
                    onClick={() => setBrushSize(size)}
                    disabled={!isDrawingAllowed}
                    aria-label={`Brush size ${size}`}
                  />
                ))}
              </div>
            </div>
            <div className="tool-row">
              <span className="label">Colors</span>
              <div className="color-palette">
                {brushColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`color ${brushColor === color ? "selected" : ""}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setBrushColor(color)}
                    disabled={!isDrawingAllowed}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <aside className="panel game-chat">
          <h3>Chat</h3>
          <div className="chat-feed" ref={chatFeedRef}>
            <div className="chat-line">
              <strong>System:</strong> Game started!
            </div>
            {room?.gameState?.guesses?.map((guessItem, index) => {
              const player = gamePlayers.find(
                (p) => p.id === guessItem.playerId,
              );

              // If local player hasn't guessed yet and this is a correct guess
              if (!localPlayer?.guessed && guessItem.correct) {
                // For correct guesses, show "Player X had guessed" without revealing the word
                return (
                  <div
                    key={index}
                    className="chat-line"
                    style={{
                      color: "#22c55e",
                      fontWeight: "600",
                      fontStyle: "italic",
                    }}
                  >
                    <span>{player?.name || "Unknown"} had guessed</span>
                  </div>
                );
              }

              // Show all incorrect guesses and all guesses for players who have guessed
              return (
                <div
                  key={index}
                  className="chat-line"
                  style={{
                    color: guessItem.correct ? "#22c55e" : "inherit",
                    fontWeight: guessItem.correct ? "600" : "normal",
                  }}
                >
                  <strong>{player?.name || "Unknown"}:</strong>{" "}
                  {guessItem.guess}
                </div>
              );
            })}
          </div>
          {!isDrawingAllowed && localPlayer?.guessed && (
            <div
              className="chat-input"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#22c55e",
                fontWeight: "600",
              }}
            >
              Congrats, you guessed!
            </div>
          )}
          {canGuess && (
            <input
              className="chat-input"
              type="text"
              placeholder="Type your guess..."
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              onKeyDown={handleGuessKeyDown}
              ref={chatInputRef}
            />
          )}
        </aside>
      </div>
    </section>
  );
};
