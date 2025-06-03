import { doIfClicked, StreamShare, addCleanupConceptType } from '#StreamManager .default';



const STREAM_ELEMENT = 'video-signaling';
let DOM_ELEMENT = document.querySelector(STREAM_ELEMENT);
if (!DOM_ELEMENT) {
    DOM_ELEMENT = document.createElement(STREAM_ELEMENT);
    document.body.appendChild(DOM_ELEMENT);
    WPMv2.stripProtection(DOM_ELEMENT);
}
const CONCEPT_NAME = 'VideoStream';
const ID_PREFIX = CONCEPT_NAME + '-';
export const QUERY_PREFIX = '#' + ID_PREFIX;



// Hook up new streams with a video element
if (!window.moduleVideoStreamManager) {
    window.moduleVideoStreamManager = {
        streamShare: new StreamShare(DOM_ELEMENT)
    };

    addCleanupConceptType(CONCEPT_NAME);

    window.moduleVideoStreamManager.streamShare.addStreamAddedListener((client, stream) => {
        console.log('Got videoStream from ' + client);

        // Find or create their element
        let element = document.querySelector(QUERY_PREFIX + client);
        if (!element) {
            element = document.createElement('video');
            element.style.position = 'fixed';
            element.style.width = '0px';
            element.id = ID_PREFIX + client;
            element.muted = true;
            document.body.appendChild(element);
        }
        element.srcObject = stream;
        doIfClicked(() => { element.play(); });
    });

    // Convenience functions for managing Varv spawning and despawning
    window.stopSharingMyVideo = async () => {
        window.moduleVideoStreamManager.streamShare.stopSharing();
        const concept = VarvEngine.getConceptFromType(CONCEPT_NAME);
        const instances = await VarvEngine.lookupInstances(CONCEPT_NAME, new FilterProperty('client', FilterOps.equals, webstrate.clientId));
        instances.forEach(instance => concept.delete(instance));
    };
    window.shareMyVideo = async () => {
        const instances = await VarvEngine.lookupInstances(CONCEPT_NAME, new FilterProperty('client', FilterOps.equals, webstrate.clientId));
        if (instances.length > 0) {
            console.log('Already sharing video');
            return;
        }
        const stream = await window.moduleVideoStreamManager.streamShare.shareStream('userMedia', {
            video: true,
            audio: false
        });
        if (stream) {
            stream.getVideoTracks()[0].addEventListener('ended', () => {
                window.stopSharingMyVideo();
            });
            return VarvEngine.getConceptFromType(CONCEPT_NAME).create(null, { client: webstrate.clientId });
        }
    };
}

export const streamShare = window.moduleVideoStreamManager.streamShare;
