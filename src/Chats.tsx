import { useContext, useEffect, useRef } from "react";
import { ChatContext } from "./context/ChatProvider";
// import Logo from ''

const ChatList = () => {
    const { chats } = useContext(ChatContext);

    const chatContainerRef = useRef(null);
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
                chatContainerRef.current.scrollHeight;
        }
    }, [chats]);

    if (!chats || chats.length == 0)
        return (
            <div className="h-[500px] flex flex-col justify-center items-center text-neutral-700">
                <img className="h-16 w-16 mb-8" src="/icons/icon48.png" />
                <p className="text-4xl font-semibold">Start Q&A</p>
                <p className="text-sm">Ask the AI anythig about the video</p>
            </div>
        );

    return (
        <div
            className="h-[500px] overflow-y-auto flex flex-col pb-4"
            ref={chatContainerRef}
        >
            <div className="flex-grow flex flex-col justify-end gap-4">
                {chats.map((chat, index) => (
                    <div
                        key={index}
                        className={`w-full flex flex-col ${
                            chat.from === "user" ? "items-end" : "items-start"
                        }`}
                    >
                        <p
                            className={`${
                                chat.from === "user"
                                    ? "bg-sky-500 text-white"
                                    : "bg-neutral-200 text-black"
                            } w-max p-1.5 px-4 rounded-2xl break-words text-sm`}
                            style={{ maxWidth: "80%" }}
                        >
                            {chat.message}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChatList;
