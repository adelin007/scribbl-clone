export type GameState = "start" | "lobby" | "game" | "results";

export type StartViewProps = {
  playerName: string;
  playerColor: string;
  createDisabled: boolean;
  onNameChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onCreate: () => void;
};

export type LobbyViewProps = {
  playerName: string;
  playerColor: string;
  playerCount: number;
  maxPlayers: number;
  isHost: boolean;
  startDisabled: boolean;
  showStartTooltip: boolean;
  inviteCopied: boolean;
  roomId: string;
  onHoverStart: (isHovering: boolean) => void;
  onStart: () => void;
  onInvite: () => void;
};

export type GameViewProps = {
  playerName: string;
  playerColor: string;
};

export type ResultsViewProps = {
  playerName: string;
  onBackToLobby: () => void;
};
