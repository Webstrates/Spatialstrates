const LITE_LLM_BASE_URL = '';
const API_KEY_COOKIE_NAME = 'LITE_LLM_API_KEY_PAGE_SESSION';

const retrieveApiKey = () => {
    let apiKey;

    function getCookie(name) {
        const nameEQ = name + '=';
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
        return null;
    }

    function setCookie(name, value) {
        const path = window.location.pathname;
        document.cookie = `${name}=${encodeURIComponent(value)}; path=${path}; SameSite=Lax`;
    }

    apiKey = getCookie(API_KEY_COOKIE_NAME);
    if (!apiKey) {
        apiKey = prompt('Enter your API key for LiteLLM:');
        if (apiKey) {
            setCookie(API_KEY_COOKIE_NAME, apiKey);
            console.log('API key saved to cookie for this page session.');
        } else {
            throw new Error('API key not provided');
        }
    } else {
        console.log('API key loaded from cookie.');
    }

    return apiKey;
}


export const recordAudio = (duration) => {
    return new Promise((resolve, reject) => {
        let chunks = [];

        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            const mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (event) => {
                chunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(chunks, { type: 'audio/wav' });
                resolve(audioBlob);
            };

            mediaRecorder.start();

            setTimeout(() => {
                mediaRecorder.stop();
            }, duration);
        }).catch(error => {
            reject(error);
        });
    });
};

export const transcribeAudio = async (duration, audioBlob = false, recordingEndedCallback = false) => {
    const apiKey = retrieveApiKey();

    let audioBlobToTranscribe = audioBlob;
    if (!audioBlobToTranscribe) {
        audioBlobToTranscribe = await recordAudio(duration);
    }

    if (recordingEndedCallback) recordingEndedCallback();

    const formData = new FormData();
    formData.append('file', audioBlobToTranscribe, 'recording.wav');
    formData.append('model', 'whisper-1');

    const whisperResponse = await fetch(`${LITE_LLM_BASE_URL}/v1/audio/transcriptions`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: formData,
    });
    const whisperData = await whisperResponse.json();

    return whisperData.text;
};

export const sendGPTPrompt = async (body) => {
    if (!window.API_KEY) {
        window.API_KEY = prompt('Please enter your OpenAI API key:');
        if (!window.API_KEY) {
            console.error('An API_KEY is required to transcribe audio.');
            return;
        }
    }

    const options = {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(body)
    };
    console.log('OpenAI API call options:', options);

    const gptResponse = await fetch(`${LITE_LLM_BASE_URL}/v1/chat/completions`, options);
    const gptData = await gptResponse.json();
    return gptData;
};

export const getGPTContent = (gptData) => gptData.choices[0].message.content;
