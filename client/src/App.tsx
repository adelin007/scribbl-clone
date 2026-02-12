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
  joinRoom,
  leaveRoom,
  onClientEvent,
  startGame,
} from "./socket/config";
import { GameEvent, type GameEndedPayload } from "./types";
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
  const [room, setRoom] = useState<Room | null>(null);
  const [gameEndedMessage, setGameEndedMessage] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [showStartTooltip, setShowStartTooltip] = useState(false);
  const [isGuestReady, setIsGuestReady] = useState(false);
  const [drawTime, setDrawTime] = useState("");
  const [rounds, setRounds] = useState("");
  const inviteTimeoutRef = useRef<number | null>(null);
  const roomRef = useRef<Room | null>(null);

  const isHost = !roomIdFromUrl;
  const playerCount = 1;
  const maxPlayers = 8;
  const startDisabled =
    isHost &&
    (!drawTime || !rounds || !room?.players || room.players.length < 2);
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
    if (!roomIdFromUrl) return;
    joinRoom({
      roomId: roomIdFromUrl,
      playerData: { name: playerName, color: playerColor },
    });
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

  const handleStartGame = () => {
    const activeRoomId = room?.id ?? roomId;
    const hostId = room?.hostId;
    if (!activeRoomId || !hostId) return;
    startGame({ roomId: activeRoomId, playerId: hostId });
  };

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  useEffect(() => {
    connectSocket();

    const handleBeforeUnload = () => {
      const activeRoom = roomRef.current;
      if (activeRoom?.id) {
        leaveRoom();
      }
      disconnectSocket();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    const unsubscribeRoomCreated = onClientEvent(
      GameEvent.ROOM_CREATED,
      (payload) => {
        const room = payload?.data as Room | undefined;
        if (!room) return;
        setRoom(room);
        setRoomId(room.id);
        setDrawTime(String(room.settings.drawTime ?? ""));
        setRounds(String(room.settings.rounds ?? ""));
        void copyToClipboard(buildInviteUrl(room.id));
        setGameState("lobby");
      },
    );

    const unsubscribeJoinedRoom = onClientEvent(
      GameEvent.JOINED_ROOM,
      (payload) => {
        const room = payload?.data as Room | undefined;
        if (!room) return;
        setRoom(room);
        setRoomId(room.id);
        setDrawTime(String(room.settings.drawTime ?? ""));
        setRounds(String(room.settings.rounds ?? ""));
        setGameState("lobby");
      },
    );

    const unsubscribePlayerJoined = onClientEvent(
      GameEvent.PLAYER_JOINED,
      (payload) => {
        const room = payload?.data as Room | undefined;
        if (!room) return;
        setRoom(room);
      },
    );

    const unsubscribePlayerLeft = onClientEvent(
      GameEvent.PLAYER_LEFT,
      (payload) => {
        console.log("Player left event received: ", payload);
        const room = payload?.data as Room | undefined;
        if (!room) return;
        setRoom(room);
      },
    );

    const unsubscribeGameStarted = onClientEvent(
      GameEvent.GAME_STARTED,
      (payload) => {
        const room = payload?.data as Room | undefined;
        if (!room) return;
        setRoom(room);
        setGameState("game");
      },
    );

    const unsubscribeGuessMade = onClientEvent(
      GameEvent.GUESS_MADE,
      (payload) => {
        const room = payload?.data as Room | undefined;
        if (!room) return;
        setRoom(room);
      },
    );

    const unsubscribeGameEnded = onClientEvent(
      GameEvent.GAME_ENDED,
      (payload) => {
        const data = payload?.data as GameEndedPayload | undefined;
        if (!data) return;
        if (data.reason === "hostLeft") {
          setGameEndedMessage("The host left the game. The session ended.");
          setGameState("results");
        } else if (data.reason === "notEnoughPlayers") {
          setGameEndedMessage(
            "Not enough players to continue the game. The session ended.",
          );
          setGameState("results");
        }
      },
    );

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      unsubscribeRoomCreated();
      unsubscribeJoinedRoom();
      unsubscribePlayerJoined();
      unsubscribePlayerLeft();
      unsubscribeGameStarted();
      unsubscribeGuessMade();
      unsubscribeGameEnded();
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
            room={room}
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
            onStart={handleStartGame}
            onInvite={handleInvite}
            onToggleReady={() => setIsGuestReady((prev) => !prev)}
          />
        )}

        {gameState === "game" && (
          <GameView
            room={room}
            playerName={playerName}
            playerColor={playerColor}
          />
        )}

        {gameState === "results" && (
          <ResultsView
            playerName={playerName}
            message={gameEndedMessage ?? undefined}
            onBackToStart={() => setGameState("start")}
          />
        )}
      </main>
    </div>
  );
}

export default App;
