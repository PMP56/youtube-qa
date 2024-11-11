import React, { useState } from "react";

interface Chat {
    from: "user" | "ai";
    message: string;
    date?: number;
}

interface ChatContext {
    chats: Chat[];
    addChat: (chat: Chat) => void;
}

interface ChatProviderProps {
    children: React.ReactNode;
}

export const ChatContext = React.createContext<ChatContext | null>(null);
export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
    const [chats, setChats] = useState<Chat[]>([
        // { from: "ai", message: "Hi there" },
        // { from: "user", message: "Hellow" },
    ]);

    const addChat = (chat: Chat) => {
        setChats((prev) => [...prev, chat]);
    };

    return (
        <ChatContext.Provider
            value={{
                chats,
                addChat,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};
