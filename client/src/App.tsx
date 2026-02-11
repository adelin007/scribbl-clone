import { useEffect, useRef, useState } from "react";
import { GameView } from "./components/GameView";
import { LobbyView } from "./components/LobbyView";
import { ResultsView } from "./components/ResultsView";
import { StartView } from "./components/StartView";
import type { GameState } from "./types/views";
import "./App.css";

function App() {
  const roomIdFromUrl = new URLSearchParams(window.location.search).get(
    "roomId",
  );
  const [gameState, setGameState] = useState<GameState>(
    roomIdFromUrl ? "lobby" : "start",
  );
  const [playerName, setPlayerName] = useState(roomIdFromUrl ? "Guest" : "");
  const [playerColor, setPlayerColor] = useState("#f25c54");
  const [roomId, setRoomId] = useState(roomIdFromUrl || "");
  const [inviteCopied, setInviteCopied] = useState(false);
  const [showStartTooltip, setShowStartTooltip] = useState(false);
  const inviteTimeoutRef = useRef<number | null>(null);

  const isHost = !roomIdFromUrl;
  const playerCount = 1;
  const maxPlayers = 8;
  const startDisabled = !isHost;
  const createDisabled = playerName.length === 0;

  const buildRoomId = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const buildInviteUrl = (id: string) =>
    `${window.location.origin}${window.location.pathname}?roomId=${encodeURIComponent(
      id,
    )}`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Intentionally ignore clipboard errors for now.
    }
  };

  const handleCreateRoom = async () => {
    if (createDisabled) return;
    const newRoomId = buildRoomId(playerName);
    setRoomId(newRoomId);
    await copyToClipboard(buildInviteUrl(newRoomId));
    setGameState("lobby");
  };

  const handleInvite = async () => {
    if (!roomId || inviteCopied) return;
    await copyToClipboard(buildInviteUrl(roomId));
    setInviteCopied(true);
    if (inviteTimeoutRef.current) {
      window.clearTimeout(inviteTimeoutRef.current);
    }
    inviteTimeoutRef.current = window.setTimeout(() => {
      setInviteCopied(false);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (inviteTimeoutRef.current) {
        window.clearTimeout(inviteTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">Scribbl</div>
        <div className="app-subtitle">Client UI preview</div>
      </header>

      <main className="app-main">
        {gameState === "start" && (
          <StartView
            playerName={playerName}
            playerColor={playerColor}
            createDisabled={createDisabled}
            onNameChange={setPlayerName}
            onColorChange={setPlayerColor}
            onCreate={handleCreateRoom}
          />
        )}

        {gameState === "lobby" && (
          <LobbyView
            playerName={playerName}
            playerColor={playerColor}
            playerCount={playerCount}
            maxPlayers={maxPlayers}
            isHost={isHost}
            startDisabled={startDisabled}
            showStartTooltip={showStartTooltip}
            inviteCopied={inviteCopied}
            roomId={roomId}
            onHoverStart={(isHovering) => setShowStartTooltip(isHovering)}
            onStart={() => setGameState("game")}
            onInvite={handleInvite}
          />
        )}

        {gameState === "game" && (
          <GameView playerName={playerName} playerColor={playerColor} />
        )}

        {gameState === "results" && (
          <ResultsView
            playerName={playerName}
            onBackToLobby={() => setGameState("lobby")}
          />
        )}
      </main>
    </div>
  );
}

export default App;
