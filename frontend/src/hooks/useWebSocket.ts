import { useEffect, useRef, useState } from "react";

export function useWebSocket(url: string) {
  const socketRef = useRef<WebSocket | null>(null);
  const [message, setMessage] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsOpen(true);
    };

    socket.onmessage = (event) => {
      setMessage(event.data);
    };

    socket.onclose = () => {
      setIsOpen(false);
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    // cleanup when component unmounts
    return () => {
      socket.close();
    };
  }, [url]);

  // send helper
  const sendMessage = (msg: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(msg);
    }
  };

  return { message, sendMessage, isOpen };
}
