import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
  read: number;
}

export interface Conversation {
  id: number;
  username: string;
  avatar: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export function useSocket(token: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (!token) return;

    const socket = io("http://localhost:5000", {
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("receive_message", (message: Message) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      socket.emit("get_conversations");
    });

    socket.on("messages_history", (msgs: Message[]) => {
      setMessages(msgs);
    });

    socket.on("conversations", (convs: Conversation[]) => {
      setConversations(convs);
    });

    socket.emit("get_conversations");

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const sendMessage = (receiverId: number, content: string) => {
    socketRef.current?.emit("send_message", { receiverId, content });
  };

  const getMessages = (otherUserId: number) => {
    setMessages([]);
    socketRef.current?.emit("get_messages", { otherUserId });
  };

  const getConversations = () => {
    socketRef.current?.emit("get_conversations");
  };

  return { connected, messages, conversations, sendMessage, getMessages, getConversations };
}