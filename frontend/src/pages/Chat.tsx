import React, { useContext, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import { useSocket } from "../hooks/useSocket";
import "./Chat.css";

export default function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { token, username } = useContext(AuthContext);
  const { connected, messages, conversations, sendMessage, getMessages } = useSocket(token);
  const [input, setInput] = useState("");
  const [activeUserId, setActiveUserId] = useState<number | null>(userId ? parseInt(userId) : null);
  const [activeUsername, setActiveUsername] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeUserId) {
      getMessages(activeUserId);
    }
  }, [activeUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (userId && conversations.length > 0) {
      const conv = conversations.find((c) => c.id === parseInt(userId));
      if (conv) setActiveUsername(conv.username);
    }
  }, [conversations, userId]);

  const handleSend = () => {
    if (!input.trim() || !activeUserId) return;
    sendMessage(activeUserId, input.trim());
    setInput("");
  };

  const handleSelectConversation = (convUserId: number, convUsername: string) => {
    setActiveUserId(convUserId);
    setActiveUsername(convUsername);
    navigate(`/chat/${convUserId}`);
    getMessages(convUserId);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pl-PL");
  };

  return (
    <div className="chat-page">
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h3>Wiadomości</h3>
          <span className={`chat-status ${connected ? "online" : "offline"}`}>
            {connected ? "● Online" : "○ Offline"}
          </span>
        </div>
        <div className="chat-conversations">
          {conversations.length === 0 ? (
            <p className="chat-empty">Brak konwersacji</p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`chat-conversation-item ${activeUserId === conv.id ? "active" : ""}`}
                onClick={() => handleSelectConversation(conv.id, conv.username)}
              >
                <div className="chat-conv-avatar">
                  {conv.avatar ? (
                    <img src={`http://localhost:5000/server_pictures/avatars/${conv.avatar}`} alt={conv.username} />
                  ) : (
                    <div className="chat-conv-avatar-placeholder">
                      {conv.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {conv.unread_count > 0 && (
                    <span className="chat-unread-badge">{conv.unread_count}</span>
                  )}
                </div>
                <div className="chat-conv-info">
                  <div className="chat-conv-name">{conv.username}</div>
                  <div className="chat-conv-last">{conv.last_message}</div>
                </div>
                <div className="chat-conv-time">{formatTime(conv.last_message_at)}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="chat-main">
        {!activeUserId ? (
          <div className="chat-no-conversation">
            <p>Wybierz konwersację aby zacząć czatować</p>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <div className="chat-header-avatar">
                {conversations.find(c => c.id === activeUserId)?.avatar ? (
                  <img src={`http://localhost:5000/server_pictures/avatars/${conversations.find(c => c.id === activeUserId)?.avatar}`} alt={activeUsername} />
                ) : (
                  <div className="chat-conv-avatar-placeholder small">
                    {activeUsername.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="chat-header-name">{activeUsername}</div>
              <button className="chat-header-profile" onClick={() => navigate(`/user/${activeUserId}`)}>
                Zobacz profil
              </button>
            </div>

            <div className="chat-messages">
              {messages.length === 0 ? (
                <p className="chat-empty">Brak wiadomości — napisz coś!</p>
              ) : (
                messages.map((msg, i) => {
                  const isOwn = msg.sender_id !== activeUserId;
                  const showDate = i === 0 || formatDate(messages[i - 1].created_at) !== formatDate(msg.created_at);
                  return (
                    <React.Fragment key={msg.id}>
                      {showDate && (
                        <div className="chat-date-divider">{formatDate(msg.created_at)}</div>
                      )}
                      <div className={`chat-message ${isOwn ? "own" : "other"}`}>
                        <div className="chat-bubble">{msg.content}</div>
                        <div className="chat-time">{formatTime(msg.created_at)}</div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
              <input
                type="text"
                className="chat-input"
                placeholder="Napisz wiadomość..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button className="chat-send-btn" onClick={handleSend} disabled={!input.trim()}>
                Wyślij
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}