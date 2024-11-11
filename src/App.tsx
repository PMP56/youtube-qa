import { useEffect, useState } from "react";
import ChatList from "./Chats";
import ChatForm from "./Form";
import ErrorIcon from "./assets/error.svg";

class TranscriptError extends Error {
    constructor(message) {
        super(message);
        this.name = "TranscriptError";
    }
}

class URLError extends Error {
    constructor(message) {
        super(message);
        this.name = "URLError";
    }
}

function App() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<null | TranscriptError>(null);
    const [transcript, setTranscript] = useState<any>();

    const getCurrentVideoId = async () => {
        // return "WYQxG4KEzvo";
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        const url = new URL(tab.url);
        const isYouTube =
            url.hostname === "www.youtube.com" ||
            url.hostname === "youtube.com" ||
            url.hostname === "m.youtube.com";

        if (!isYouTube) {
            throw new URLError("The URL does not belong to YouTube");
        }
        const videoId = url.searchParams.get("v");

        if (!videoId) {
            throw new URLError("Open a video to get started");
        }

        return videoId;
    };

    const fetchTranscript = async (videoId) => {
        // console.log(videoId);
        const videoPageResponse = await fetch(
            `https://www.youtube.com/watch?v=${videoId}`,
            {
                headers: {
                    "Accept-Language": "en",
                    "User-Agent": "USER_AGENT",
                },
            }
        );

        const videoPageBody = await videoPageResponse.text();
        const splittedHTML = videoPageBody.split('"captions":');

        const captions = (() => {
            try {
                return JSON.parse(
                    splittedHTML[1].split(',"videoDetails')[0].replace("\n", "")
                );
            } catch (e) {
                return undefined;
            }
        })()?.["playerCaptionsTracklistRenderer"];

        if (!captions) {
            throw new TranscriptError("Transcript is disabled for the video");
        }

        if (!("captionTracks" in captions)) {
            throw new TranscriptError(
                "Transcript not availbale for this video"
            );
        }

        if (
            !captions.captionTracks.some((track) => track.languageCode === "en")
        ) {
            throw new TranscriptError(
                "Transcript not available for English language"
            );
        }

        const transcriptURL = (
            captions.captionTracks.find(
                (track) => track.languageCode === "en"
            ) ?? captions.captionTracks[0]
        ).baseUrl;

        const transcriptResponse = await fetch(
            transcriptURL.includes("youtube.com")
                ? transcriptURL
                : "https://www.youtube.com" + transcriptURL,
            {
                headers: {
                    "Accept-Language": "en",
                    "User-Agent": "USER_AGENT",
                },
            }
        );

        if (!transcriptResponse.ok) {
            throw new TranscriptError(
                "Transcript not availbale for this video"
            );
        }
        const transcriptBody = await transcriptResponse.text();
        const RE_XML_TRANSCRIPT =
            /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;
        const results = [...transcriptBody.matchAll(RE_XML_TRANSCRIPT)];

        const value = results.map((result) => ({
            text: result[3],
            duration: parseFloat(result[2]),
            startTime: parseFloat(result[1]),
            lang: captions.captionTracks[0].languageCode,
        }));

        return value;
    };

    const convertTranscriptStream = async (transcript) => {
        if (!transcript || transcript.length === 0) {
            throw new TranscriptError("Transcript not found for this video");
        }

        const res = transcript.map((obj) => obj.text).join(" ");
        return res;
    };

    useEffect(() => {
        const fetch = async () => {
            try {
                setLoading(true);
                const videoId = await getCurrentVideoId();
                const transcript = await fetchTranscript(videoId);

                setTranscript(JSON.stringify(transcript));
                setLoading(false);
            } catch (e) {
                if (e.name == "TranscriptError") {
                    setError(new TranscriptError(e.message));
                } else if (e.name == "URLError") {
                    setError(new URLError(e.message));
                }
            } finally {
                setLoading(false);
            }
        };

        fetch();
    }, []);

    return (
        <div className="flex items-center justify-center">
            <div className="w-[480px] bg-neutral-100 p-4">
                {loading ? (
                    <div className="h-[500px] flex flex-col items-center justify-center gap-2">
                        <div
                            className=" inline-block h-[48px] w-[48px] animate-spin rounded-full border-[3px] border-solid border-sky-400 border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
                            role="status"
                        ></div>
                        <p className="text-sm">Fetching video transcript</p>
                    </div>
                ) : !error ? (
                    <>
                        <ChatList />
                        <ChatForm transcript={transcript} />
                    </>
                ) : (
                    <div className="h-[500px] overflow-y-auto flex flex-col items-center justify-center gap-2">
                        <img className="text-red-500" src={ErrorIcon} />
                        <p className="text-4xl font-semibold text-red-500">
                            Error
                        </p>
                        <p className="text-red-600 w-2/3 text-center text-sm">
                            {error.message}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
