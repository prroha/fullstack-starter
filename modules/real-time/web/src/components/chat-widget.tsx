"use client";

/**
 * Chat Widget Component
 *
 * A real-time chat widget using core UI components for consistency.
 * Uses core Button, Input, and Spinner components.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useSocket, useRoom, useChat, UseSocketOptions } from "../hooks/use-socket";
import { ChatMessage } from "../lib/socket";

// =============================================================================
// Types
// =============================================================================

export interface ChatWidgetProps {
  room: string;
  userId: string;
  token?: string;
  socketOptions?: UseSocketOptions;
  className?: string;
  title?: string;
  placeholder?: string;
  showTimestamp?: boolean;
  showTypingIndicator?: boolean;
  maxMessages?: number;
  onMessageSent?: (content: string) => void;
  onError?: (error: string) => void;
  renderMessage?: (message: ChatMessage, isOwnMessage: boolean) => React.ReactNode;
  renderHeader?: (props: { isConnected: boolean; memberCount: number }) => React.ReactNode;
}

// =============================================================================
// Default Message Component
// =============================================================================

interface MessageItemProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showTimestamp: boolean;
}

function MessageItem({ message, isOwnMessage, showTimestamp }: MessageItemProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className={cn("flex mb-2", isOwnMessage ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[70%] rounded-lg px-4 py-2",
          isOwnMessage
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        {!isOwnMessage && (
          <div className="text-xs font-medium mb-1 opacity-70">
            {message.userId}
          </div>
        )}
        <div className="break-words">{message.content}</div>
        {showTimestamp && (
          <div
            className={cn(
              "text-xs mt-1",
              isOwnMessage ? "opacity-70" : "text-muted-foreground"
            )}
          >
            {formatTime(message.timestamp)}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Typing Indicator Component (uses core Spinner)
// =============================================================================

interface TypingIndicatorProps {
  users: string[];
}

function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const text =
    users.length === 1
      ? `${users[0]} is typing...`
      : users.length === 2
      ? `${users[0]} and ${users[1]} are typing...`
      : `${users.length} people are typing...`;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      <span>{text}</span>
    </div>
  );
}

// =============================================================================
// Connection Status Component
// =============================================================================

interface ConnectionStatusProps {
  status: string;
  reconnectAttempt: number;
}

function ConnectionStatus({ status, reconnectAttempt }: ConnectionStatusProps) {
  if (status === "connected") return null;

  const statusConfig: Record<string, { color: string; text: string }> = {
    connecting: { color: "bg-yellow-500", text: "Connecting..." },
    disconnected: { color: "bg-destructive", text: "Disconnected" },
    reconnecting: { color: "bg-yellow-500", text: `Reconnecting (${reconnectAttempt})...` },
    error: { color: "bg-destructive", text: "Connection error" },
  };

  const config = statusConfig[status] || { color: "bg-muted-foreground", text: status };

  return (
    <div className={cn(config.color, "text-white text-xs text-center py-1")}>
      {config.text}
    </div>
  );
}

// =============================================================================
// Chat Widget Component
// =============================================================================

export function ChatWidget({
  room,
  userId,
  token,
  socketOptions,
  className = "",
  title = "Chat",
  placeholder = "Type a message...",
  showTimestamp = true,
  showTypingIndicator = true,
  maxMessages = 100,
  onMessageSent,
  onError,
  renderMessage,
  renderHeader,
}: ChatWidgetProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Socket connection
  const { socket, status, isConnected, reconnectAttempt } = useSocket({
    token,
    ...socketOptions,
    onError: (error) => {
      onError?.(error.message);
      socketOptions?.onError?.(error);
    },
  });

  // Room management
  const { isJoined, isJoining, error: roomError, members } = useRoom({
    socket,
    room,
    autoJoin: true,
  });

  // Chat functionality
  const { messages, typingUsers, sendMessage, startTyping, stopTyping } = useChat({
    socket,
    room,
    maxMessages,
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle room error
  useEffect(() => {
    if (roomError) {
      onError?.(roomError);
    }
  }, [roomError, onError]);

  // Handle send message
  const handleSend = useCallback(() => {
    const content = inputValue.trim();
    if (!content || !isJoined) return;

    sendMessage(content);
    setInputValue("");
    stopTyping();
    onMessageSent?.(content);
  }, [inputValue, isJoined, sendMessage, stopTyping, onMessageSent]);

  // Handle input change with typing indicator
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
      if (e.target.value.trim()) {
        startTyping();
      }
    },
    [startTyping]
  );

  // Handle key press
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Filter out own user from typing users
  const filteredTypingUsers = typingUsers.filter((id) => id !== userId);

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-card rounded-lg shadow-lg overflow-hidden border",
        className
      )}
    >
      {/* Header */}
      {renderHeader ? (
        renderHeader({ isConnected, memberCount: members.length })
      ) : (
        <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">
              {title}
            </h3>
            {isJoined && (
              <span className="text-xs text-muted-foreground">
                ({members.length + 1} online)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? "bg-green-500" : "bg-destructive"
              )}
            />
          </div>
        </div>
      )}

      {/* Connection Status */}
      <ConnectionStatus status={status} reconnectAttempt={reconnectAttempt} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {!isJoined && isJoining && (
          <div className="flex items-center justify-center h-full gap-2">
            <Spinner size="sm" />
            <span className="text-muted-foreground">Joining room...</span>
          </div>
        )}

        {isJoined && messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">
              No messages yet. Start the conversation!
            </div>
          </div>
        )}

        {messages.map((message) => {
          const isOwnMessage = message.userId === userId;
          return renderMessage ? (
            <React.Fragment key={message.id}>
              {renderMessage(message, isOwnMessage)}
            </React.Fragment>
          ) : (
            <MessageItem
              key={message.id}
              message={message}
              isOwnMessage={isOwnMessage}
              showTimestamp={showTimestamp}
            />
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {showTypingIndicator && <TypingIndicator users={filteredTypingUsers} />}

      {/* Input - Using core Input and Button components */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onBlur={stopTyping}
            placeholder={placeholder}
            disabled={!isJoined}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!isJoined || !inputValue.trim()}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ChatWidget;
