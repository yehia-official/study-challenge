import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

let socket: Socket;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("Connected to WebSocket Server:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket Server");
    });
  }
  return socket;
};
