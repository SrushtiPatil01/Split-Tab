import { useEffect, useRef } from "react";
import { connectSocket, disconnectSocket } from "../services/socket";

/**
 * Join a Socket.io room for a group and call onUpdate when group:updated fires.
 */
export function useSocket(groupId: string | null, onUpdate: () => void) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!groupId) return;

    const socket = connectSocket();

    socket.emit("join:group", groupId);

    const handler = () => onUpdateRef.current();
    socket.on("group:updated", handler);

    return () => {
      socket.off("group:updated", handler);
      socket.emit("leave:group", groupId);
      disconnectSocket();
    };
  }, [groupId]);
}