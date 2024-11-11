chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.type === "ASK_QUESTION") {
      const videoId = await getCurrentVideoId();
      const transcript = await fetchTranscript(videoId);
      const transcriptText = await convertTranscriptStream(transcript)
      console.log(transcriptText, message.question)
      const answer = await askChatGPT(message.question, transcriptText);
      chrome.runtime.sendMessage({ type: "ANSWER", answer });
    }
  });
  
  async function getCurrentVideoId() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tab.url);
    return url.searchParams.get("v");
  }

  async function fetchTranscript(videoId) {
    const videoPageResponse = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`,
      {
        headers: {
          'Accept-Language': "en",
          'User-Agent': "USER_AGENT",
        },
      }
    );

    const videoPageBody = await videoPageResponse.text();

    const splittedHTML = videoPageBody.split('"captions":');

    console.log(videoPageBody, 'body')
    console.log(splittedHTML, 'html')

    const captions = (() => {
      try {
        return JSON.parse(
          splittedHTML[1].split(',"videoDetails')[0].replace('\n', '')
        );
      } catch (e) {
        return undefined;
      }
    })()?.['playerCaptionsTracklistRenderer'];

    console.log(captions, "captionms")

    if (!captions) {
      throw new Error("Transcript is disabled for the video");
    }

    if (!('captionTracks' in captions)) {
      throw new Error("Transcript not availbale for this video");
    }

    if (
      !captions.captionTracks.some(
        (track) => track.languageCode === "en"
      )
    ) {
      throw new Error("Transcript not available for English language")
    }

    const transcriptURL = (
      captions.captionTracks.find(
            (track) => track.languageCode === "en"
          )
        ?? captions.captionTracks[0]
    ).baseUrl;

    console.log("transcriptURL", transcriptURL)
    
    const transcriptResponse = await fetch(transcriptURL, {
      
      headers: {
        'Accept-Language': "en",
        'User-Agent': "USER_AGENT",
      },
      
    });
    console.log("transcriptRes", transcriptResponse)

    if (!transcriptResponse.ok) {
      throw new Error("Transcript not availbale for this video");
    }
    const transcriptBody = await transcriptResponse.text();

    const RE_XML_TRANSCRIPT =
      /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;
    const results = [...transcriptBody.matchAll(RE_XML_TRANSCRIPT)];
    const value = results.map((result) => ({
      text: result[3],
      duration: parseFloat(result[2]),
      offset: parseFloat(result[1]),
      lang: captions.captionTracks[0].languageCode,
    }));

    console.log(value, "value")
    return value
  }
  
  async function convertTranscriptStream(transcript) {
    if (!transcript || transcript.length === 0) {
      throw new Error("Transcript not found for this vide")
    }

    const res = transcript.map(obj => obj.text).join(" ")
    return res
  }

  // async function fetchTranscript(videoId) {
  //   try {
  //     // Step 1: Get the available captions for the video
  //     const response = await fetch(
  //       `https://www.googleapis.com/youtube/v3/captions?part=id&videoId=${videoId}&key=AIzaSyBF3aI9bvBOCy3YztrKlqraswXQQn0murk`
  //     );
  //     const data = await response.json();
  
  //     if (!data.items || data.items.length === 0) {
  //       console.log("No captions available for this video.");
  //       return "No captions available.";
  //     }
  
  //     console.log(data.items[0], "datas")
  //     // Step 2: Use the first available caption ID to get the transcript text
  //     const captionId = data.items[0].id;
  //     const captionResponse = await fetch(
  //       `https://www.googleapis.com/youtube/v3/captions/${captionId}?key=AIzaSyBF3aI9bvBOCy3YztrKlqraswXQQn0murk`
  //     );
  
  //     const captionData = await captionResponse.json();
  //     console.log(captionData)
  
  //     // Parse or process the captions if they’re in .srt/.vtt format (assuming plain text for simplicity)
  //     return captionData || "Transcript unavailable.";
  //   } catch (error) {
  //     console.error("Error fetching transcript:", error);
  //     return "Error fetching transcript.";
  //   }
  // }
  
  
  async function askChatGPT(question, context) {
    const config = await (await fetch(chrome.runtime.getURL("config.json"))).json()
    const OPENAI_API_KEY = config.OPENAI_API_KEY
    const HUGGINGFACE_API_KEY = config.HUGGINGFACE_API_KEY

    console.log(OPENAI_API_KEY)
    
    const prompt = `You are expert in answering questions regarding a video whose trancript/caption along with it timeline will be give. Based on the following transcript: ${context.substring(0, 2000)}\nAnswer the question: ${question}`;
    
    // const model = 'gpt2';
    // const apiUrl = `https://api-inference.huggingface.co/models/${model}`;
    // const response = await fetch(apiUrl, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     inputs: prompt,
    //   }),
    // });
  
    // const result = await response.json();
    // console.log(result)
    // return result[0].generated_text
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: prompt }]
      })
    });
    const result = await response.json();
    console.log(result)
    return result.choices[0].message.content;
  }
  