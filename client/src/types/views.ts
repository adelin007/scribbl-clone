export type GameState = "start" | "lobby" | "game" | "results";

export type StartViewProps = {
  playerName: string;
  playerColor: string;
  createDisabled: boolean;
  isGuest: boolean;
  drawTime: string;
  rounds: string;
  title: string;
  subtitle: string;
  actionLabel: string;
  onNameChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onDrawTimeChange: (value: string) => void;
  onRoundsChange: (value: string) => void;
  onCreate: () => void;
};

export type LobbyViewProps = {
  playerName: string;
  playerColor: string;
  playerCount: number;
  maxPlayers: number;
  isHost: boolean;
  isGuestReady: boolean;
  drawTime: string;
  rounds: string;
  startDisabled: boolean;
  showStartTooltip: boolean;
  inviteCopied: boolean;
  roomId: string;
  onDrawTimeChange: (value: string) => void;
  onRoundsChange: (value: string) => void;
  onHoverStart: (isHovering: boolean) => void;
  onStart: () => void;
  onInvite: () => void;
  onToggleReady: () => void;
};

export type GameViewProps = {
  playerName: string;
  playerColor: string;
};

export type ResultsViewProps = {
  playerName: string;
  onBackToLobby: () => void;
};
