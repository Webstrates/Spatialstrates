import { StreamShare, addCleanupConceptType } from '#StreamManager .default';



const STREAM_ELEMENT = 'audio-signaling';
let DOM_ELEMENT = document.querySelector(STREAM_ELEMENT);
if (!DOM_ELEMENT) {
    DOM_ELEMENT = document.createElement(STREAM_ELEMENT);
    document.body.appendChild(DOM_ELEMENT);
    WPMv2.stripProtection(DOM_ELEMENT);
}
const CONCEPT_NAME = 'AudioStream';
const ID_PREFIX = CONCEPT_NAME + '-';
export const QUERY_PREFIX = '#' + ID_PREFIX;



// Hook up new streams with a video element
if (!window.moduleAudioStreamManager) {
    window.moduleAudioStreamManager = {
        streamShare: new StreamShare(DOM_ELEMENT)
    };

    addCleanupConceptType(CONCEPT_NAME);

    window.moduleAudioStreamManager.streamShare.addStreamAddedListener((client) => {
        console.log('Got audioStream from ' + client);
    });

    // Convenience functions for managing Varv spawning and despawning
    window.stopSharingMyAudio = async () => {
        window.moduleAudioStreamManager.streamShare.stopSharing();
        const concept = VarvEngine.getConceptFromType(CONCEPT_NAME);
        const instances = await VarvEngine.lookupInstances(CONCEPT_NAME, new FilterProperty('client', FilterOps.equals, webstrate.clientId));
        instances.forEach(instance => concept.delete(instance));
    };
    window.shareMyAudio = async () => {
        const instances = await VarvEngine.lookupInstances(CONCEPT_NAME, new FilterProperty('client', FilterOps.equals, webstrate.clientId));
        if (instances.length > 0) {
            console.log('Already sharing audio');
            return;
        }
        const stream = await window.moduleAudioStreamManager.streamShare.shareStream('userMedia', {
            video: false,
            audio: true
        });
        if (stream) {
            stream.getAudioTracks()[0].addEventListener('ended', () => {
                window.stopSharingMyAudio();
            });
            return VarvEngine.getConceptFromType(CONCEPT_NAME).create(null, { client: webstrate.clientId });
        }
    };
}



export const streamShare = window.moduleAudioStreamManager.streamShare;
