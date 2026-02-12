import { useEffect, useRef, useState } from "react";
import { GameView } from "./components/GameView";
import { LobbyView } from "./components/LobbyView";
import { ResultsView } from "./components/ResultsView";
import { StartView } from "./components/StartView";
import {
  changeRoomSettings,
  connectSocket,
  createRoom,
  disconnectSocket,
  onClientEvent,
} from "./socket/config";
import type { Room } from "./types";
import type { GameState } from "./types/views";
import "./App.css";

function App() {
  const roomIdFromUrl = new URLSearchParams(window.location.search).get(
    "roomId",
  );
  const isGuest = Boolean(roomIdFromUrl);
  const [gameState, setGameState] = useState<GameState>("start");
  const [playerName, setPlayerName] = useState("");
  const [playerColor, setPlayerColor] = useState("");
  const [roomId, setRoomId] = useState(roomIdFromUrl || "");
  const [inviteCopied, setInviteCopied] = useState(false);
  const [showStartTooltip, setShowStartTooltip] = useState(false);
  const [isGuestReady, setIsGuestReady] = useState(false);
  const [drawTime, setDrawTime] = useState("");
  const [rounds, setRounds] = useState("");
  const inviteTimeoutRef = useRef<number | null>(null);

  const isHost = !roomIdFromUrl;
  const playerCount = 1;
  const maxPlayers = 8;
  const startDisabled = isHost && (!drawTime || !rounds);
  const createDisabled =
    playerName.length === 0 ||
    playerColor.length === 0 ||
    (isHost && (!drawTime || !rounds));

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
    createRoom({
      name: playerName,
      color: playerColor,
      drawTime: Number(drawTime),
      rounds: Number(rounds),
    });
  };

  const handleJoinRoom = () => {
    if (createDisabled) return;
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

  const handleLobbyDrawTimeChange = (value: string) => {
    setDrawTime(value);
    if (!value) return;
    changeRoomSettings({
      roomId,
      newSettings: {
        maxPlayers,
        drawTime: Number(value),
        roundTime: Number(value),
        rounds: rounds ? Number(rounds) : undefined,
      },
    });
  };

  const handleLobbyRoundsChange = (value: string) => {
    setRounds(value);
    if (!value) return;
    changeRoomSettings({
      roomId,
      newSettings: {
        maxPlayers,
        drawTime: drawTime ? Number(drawTime) : undefined,
        roundTime: drawTime ? Number(drawTime) : undefined,
        rounds: Number(value),
      },
    });
  };

  useEffect(() => {
    connectSocket();

    const unsubscribeRoomCreated = onClientEvent("roomCreated", (payload) => {
      console.log("Room created with payload: ", payload);
      const room = payload?.data as Room | undefined;
      if (!room) return;
      setRoomId(room.id);
      setDrawTime(String(room.settings.drawTime ?? ""));
      setRounds(String(room.settings.rounds ?? ""));
      void copyToClipboard(buildInviteUrl(room.id));
      setGameState("lobby");
    });

    return () => {
      unsubscribeRoomCreated();
      disconnectSocket();
      if (inviteTimeoutRef.current) {
        window.clearTimeout(inviteTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">Scribbl</div>
        {/* <div className="app-subtitle">Client UI preview</div> */}
      </header>

      <main className="app-main">
        {gameState === "start" && (
          <StartView
            playerName={playerName}
            playerColor={playerColor}
            createDisabled={createDisabled}
            isGuest={isGuest}
            drawTime={drawTime}
            rounds={rounds}
            title={isGuest ? "Join Room" : "Create a Private Room"}
            subtitle={
              isGuest
                ? "Pick a name and color before getting ready."
                : "Pick a name and color to start. We will copy your invite link."
            }
            actionLabel={isGuest ? "Continue" : "Create Private Room"}
            onNameChange={setPlayerName}
            onColorChange={setPlayerColor}
            onDrawTimeChange={setDrawTime}
            onRoundsChange={setRounds}
            onCreate={isGuest ? handleJoinRoom : handleCreateRoom}
          />
        )}

        {gameState === "lobby" && (
          <LobbyView
            playerName={playerName}
            playerColor={playerColor}
            playerCount={playerCount}
            maxPlayers={maxPlayers}
            isHost={isHost}
            isGuestReady={isGuestReady}
            drawTime={drawTime}
            rounds={rounds}
            startDisabled={startDisabled}
            showStartTooltip={showStartTooltip}
            inviteCopied={inviteCopied}
            roomId={roomId}
            onDrawTimeChange={handleLobbyDrawTimeChange}
            onRoundsChange={handleLobbyRoundsChange}
            onHoverStart={(isHovering) => setShowStartTooltip(isHovering)}
            onStart={() => setGameState("game")}
            onInvite={handleInvite}
            onToggleReady={() => setIsGuestReady((prev) => !prev)}
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
