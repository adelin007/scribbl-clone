export type ServerActionEvent =
  | "joinedRoom"
  | "leftRoom"
  | "gameStarted"
  | "gameEnded"
  | "playerJoined"
  | "playerLeft"
  | "playerReady"
  | "playerUnready"
  | "settingsChanged"
  | "wordSelected"
  | "drawingData"
  | "guessMade";
