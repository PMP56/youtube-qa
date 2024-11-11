import { useContext, useRef, useState } from "react";
import SendIcon from "./assets/send.svg";
import StopIcon from "./assets/stop.svg";
import { ChatContext } from "./context/ChatProvider";

const ChatForm = ({ transcript }: { transcript: any }) => {
    const [pending, setPending] = useState(false);
    const [text, setText] = useState("");
    const { addChat } = useContext(ChatContext);

    async function askChatGPT(question) {
        const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
        // const prompt = `You are expert in answering questions regarding a video whose trancript/caption along with it timeline will be give. Based on the following transcript: ${transcript}\nAnswer the question: ${question}`;
        const prompt = `You are an expert in analyzing video content and answering questions based on provided transcripts. You will receive the video's transcript in JSON format, with each segment containing text, start time, and duration. Using this data, answer the question as accurately as possible based on the timeline of the video.

            Transcript JSON: ${transcript}
            Question: ${question}

            Please provide a concise, relevant response based on the transcript data. If the answer depends on specific parts of the video, reference those timestamps.
        `;

        try {
            const response = await fetch(
                "https://api.openai.com/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${OPENAI_API_KEY}`,
                    },
                    body: JSON.stringify({
                        model: "gpt-4o-mini",
                        messages: [{ role: "system", content: prompt }],
                    }),
                    // signal: options.signal,
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Error: ${response.status} ${response.statusText}`
                );
            }

            const result = await response.json();
            console.log(result);
            return result.choices[0].message.content;
        } catch (error) {
            if (error.name === "AbortError") {
                return "Request aborted";
            } else {
                console.error("An error occurred:", error);
                return "Request aborted. An error occured";
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            setText("");
            setPending(true);
            addChat({
                from: "user",
                message: text,
            });

            const answer = await askChatGPT(text);
            addChat({
                from: "ai",
                message: answer,
            });
        } catch (error) {
            if (error.name === "AbortError") {
                console.log("Request aborted due to a new submission.");
            } else {
                console.error("An error occurred:", error.message);
            }
        } finally {
            setPending(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-[40px] rounded-md border-2 px-2 text-sm"
            />
            <button
                disabled={!text || text.length == 0}
                type="submit"
                className="relative cursor-pointer"
            >
                <div
                    className="absolute top-0 left-0 inline-block h-[36px] w-[36px] animate-spin rounded-full border-[3px] border-solid border-sky-400 border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
                    role="status"
                ></div>
                <div
                    className={`h-[36px] w-[36px] flex items-center justify-center bg-sky-400 p-1 ${
                        pending && "bg-transparent"
                    } rounded-full text-white cursor-pointer`}
                >
                    {!pending ? <img src={SendIcon} /> : <img src={StopIcon} />}
                </div>
            </button>
        </form>
    );
};

export default ChatForm;
