import { Eraser, Paintbrush, PaintBucket, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { GameViewProps } from "../types/views";

export const GameView = ({ playerName, playerColor }: GameViewProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const brushSizeRef = useRef(8);
  const brushColorRef = useRef("#2f2a24");
  const [canvasReady, setCanvasReady] = useState(false);
  const [brushSize, setBrushSize] = useState(8);
  const [brushColor, setBrushColor] = useState("#2f2a24");
  const [activeTool, setActiveTool] = useState<"brush" | "bucket" | "eraser">(
    "brush",
  );
  const brushSizes = [4, 8, 14];
  const brushColors = [
    "#000000",
    "#ff5b5b",
    "#ffd166",
    "#06d6a0",
    "#118ab2",
    "#ffffff",
  ];
  const eraserColor = "#ffffff";

  const buildBrushCursor = (size: number, color: string) => {
    const radius = size / 2;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${radius}" cy="${radius}" r="${radius - 1}" fill="${color}" stroke="rgba(47,42,36,0.6)" stroke-width="1"/></svg>`;
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") ${radius} ${radius}, crosshair`;
  };

  const buildBucketCursor = () => {
    const size = 18;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="rgba(47,42,36,0.9)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 6h10l-1 13H8L7 6z"/><path d="M9 6a3 3 0 0 1 6 0"/><path d="M7 14h10"/></svg>`;
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") 4 4, crosshair`;
  };

  const getActiveColor = () =>
    activeTool === "eraser" ? eraserColor : brushColor;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * scale);
      canvas.height = Math.floor(rect.height * scale);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
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

  const getPixelPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.floor((event.clientX - rect.left) * scaleX),
      y: Math.floor((event.clientY - rect.top) * scaleY),
    };
  };

  const hexToRgba = (hex: string) => {
    const clean = hex.replace("#", "");
    const normalized =
      clean.length === 3
        ? clean
            .split("")
            .map((ch) => ch + ch)
            .join("")
        : clean;
    const int = Number.parseInt(normalized, 16);
    return {
      r: (int >> 16) & 255,
      g: (int >> 8) & 255,
      b: int & 255,
      a: 255,
    };
  };

  const colorsMatch = (
    data: Uint8ClampedArray,
    index: number,
    color: { r: number; g: number; b: number; a: number },
  ) =>
    data[index] === color.r &&
    data[index + 1] === color.g &&
    data[index + 2] === color.b &&
    data[index + 3] === color.a;

  const setColorAt = (
    data: Uint8ClampedArray,
    index: number,
    color: { r: number; g: number; b: number; a: number },
  ) => {
    data[index] = color.r;
    data[index + 1] = color.g;
    data[index + 2] = color.b;
    data[index + 3] = color.a;
  };

  const handleBucketFill = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const point = getPixelPoint(event);
    if (!point) return;

    const { width, height } = canvas;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const startIndex = (point.y * width + point.x) * 4;
    const target = {
      r: data[startIndex],
      g: data[startIndex + 1],
      b: data[startIndex + 2],
      a: data[startIndex + 3],
    };
    const fill = hexToRgba(brushColor);

    if (
      target.r === fill.r &&
      target.g === fill.g &&
      target.b === fill.b &&
      target.a === fill.a
    ) {
      return;
    }

    const stack: Array<{ x: number; y: number }> = [{ x: point.x, y: point.y }];
    while (stack.length) {
      const current = stack.pop();
      if (!current) continue;
      const { x, y } = current;
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      const index = (y * width + x) * 4;
      if (!colorsMatch(data, index, target)) continue;
      setColorAt(data, index, fill);
      stack.push({ x: x + 1, y });
      stack.push({ x: x - 1, y });
      stack.push({ x, y: y + 1 });
      stack.push({ x, y: y - 1 });
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasReady) return;
    if (activeTool === "bucket") {
      handleBucketFill(event);
      return;
    }
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const point = getPoint(event);
    if (!point) return;
    drawingRef.current = true;
    lastPointRef.current = point;
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = getActiveColor();
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
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
  };

  const handlePointerUp = () => {
    drawingRef.current = false;
    lastPointRef.current = null;
  };

  const handleClear = () => {
    const confirmed = window.confirm("Clear the canvas?");
    if (!confirmed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <section className="view game-view">
      <div className="game-topbar panel">
        <div>
          <strong>Round 1</strong>
          <span className="muted"> / 3</span>
        </div>
        <div className="game-topbar-center">Draw the word!</div>
        <div className="game-timer">01:32</div>
      </div>

      <div className="game-grid">
        <aside className="panel game-players">
          <h3>Players</h3>
          <ul className="list">
            <li className="list-item">
              <span
                className="avatar"
                style={{ backgroundColor: playerColor }}
              />
              {playerName || "Player"}
            </li>
            <li className="list-item">Luna</li>
            <li className="list-item">Kai</li>
            <li className="list-item">Mara</li>
          </ul>
        </aside>

        <section className="panel game-board">
          <canvas
            ref={canvasRef}
            className="canvas"
            style={{
              cursor:
                activeTool === "bucket"
                  ? buildBucketCursor()
                  : buildBrushCursor(brushSize, getActiveColor()),
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
          <div className="tools">
            <div className="tool-row">
              <button
                type="button"
                className={`btn secondary toggle ${activeTool === "brush" ? "active" : ""}`}
                onClick={() => setActiveTool("brush")}
              >
                <Paintbrush size={16} />
                Brush
              </button>
              <button
                type="button"
                className={`btn secondary toggle ${activeTool === "bucket" ? "active" : ""}`}
                onClick={() => setActiveTool("bucket")}
              >
                <PaintBucket size={16} />
                Bucket
              </button>
              <button
                type="button"
                className={`btn secondary toggle ${activeTool === "eraser" ? "active" : ""}`}
                onClick={() => setActiveTool("eraser")}
              >
                <Eraser size={16} />
                Eraser
              </button>
              <button className="btn secondary" onClick={handleClear}>
                <Trash2 size={16} />
                Clear
              </button>
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
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <aside className="panel game-chat">
          <h3>Chat</h3>
          <div className="chat-feed">
            <div className="chat-line">
              <strong>System:</strong> Game started!
            </div>
            <div className="chat-line">
              <strong>Luna:</strong> hello!
            </div>
            <div className="chat-line">
              <strong>Kai:</strong> is it a cat?
            </div>
          </div>
          <input
            className="chat-input"
            type="text"
            placeholder="Type your guess..."
          />
        </aside>
      </div>

      <div className="panel game-prompt">
        <span className="label">Word:</span>
        <span className="word-placeholder">_ _ _ _ _</span>
      </div>
    </section>
  );
};
