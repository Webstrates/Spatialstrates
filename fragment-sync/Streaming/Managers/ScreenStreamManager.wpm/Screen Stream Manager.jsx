import { doIfClicked, StreamShare, addCleanupConceptType } from '#StreamManager .default';
import { createMovable } from '#Spatialstrates .movable-helpers';



const STREAM_ELEMENT = 'screen-signaling';
let DOM_ELEMENT = document.querySelector(STREAM_ELEMENT);
if (!DOM_ELEMENT) {
    DOM_ELEMENT = document.createElement(STREAM_ELEMENT);
    document.body.appendChild(DOM_ELEMENT);
    WPMv2.stripProtection(DOM_ELEMENT);
}
const CONCEPT_NAME = 'ScreenStream';
const ID_PREFIX = CONCEPT_NAME + '-';
export const QUERY_PREFIX = '#' + ID_PREFIX;



// Hook up new streams with a video element
if (!window.moduleScreenStreamManager) {
    window.moduleScreenStreamManager = {
        streamShare: new StreamShare(DOM_ELEMENT)
    };

    addCleanupConceptType(CONCEPT_NAME);

    window.moduleScreenStreamManager.streamShare.addStreamAddedListener((client, stream) => {
        console.log('Got screenStream from ' + client);

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
    window.stopSharingMyScreen = async () => {
        window.moduleScreenStreamManager.streamShare.stopSharing();
        const concept = VarvEngine.getConceptFromType(CONCEPT_NAME);
        const instances = await VarvEngine.lookupInstances(CONCEPT_NAME, new FilterProperty('client', FilterOps.equals, webstrate.clientId));
        instances.forEach(instance => concept.delete(instance));
    };
    window.shareMyScreen = async () => {
        const stream = await window.moduleScreenStreamManager.streamShare.shareStream('displayMedia', {
            video: {
                displaySurface: 'browser',
            },
            audio: {
                suppressLocalAudioPlayback: false,
            },
            preferCurrentTab: false,
            selfBrowserSurface: 'exclude',
            systemAudio: 'exclude',
            surfaceSwitching: 'include',
            monitorTypeSurfaces: 'include',
        });
        if (stream) {
            stream.getVideoTracks()[0].addEventListener('ended', () => {
                window.stopSharingMyScreen();
            });
            return createMovable(CONCEPT_NAME, { client: webstrate.clientId });
        }
    };
}

export const streamShare = window.moduleScreenStreamManager.streamShare;
