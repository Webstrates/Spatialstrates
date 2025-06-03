import React from 'react';
const { useEffect, useRef } = React;
// import { PositionalAudio } from '@react-three/drei';
// import { ErrorBoundary } from 'react-error-boundary';
import { Varv, useProperty } from '#VarvReact';

import { doIfClicked } from '#StreamManager .default';
import { streamShare } from '#AudioStreamManager .default';



function AudioStream3D({ client }) {
    const audioRef = useRef(new Audio());
    // const positionalAudioRef = useRef();
    // const boundaryRef = useRef();

    useEffect(() => {
        if (!client) return;
        const listener = (newStreamId, newStream) => {
            if (newStreamId == client) {
                // if (boundaryRef.current) boundaryRef.current.resetErrorBoundary();
                doIfClicked(() => {
                    audioRef.current.srcObject = newStream;
                    audioRef.current.muted = false;
                    audioRef.current.play();

                    // positionalAudioRef.current?.setMediaStreamSource(audioRef.current.srcObject);
                });
            }
        };

        streamShare.addStreamAddedListener(listener);

        return () => {
            streamShare.removeStreamAddedListener(listener);
            audioRef.current.srcObject = null;
        };
    }, [client]);

    // FIXME: For whatever reason this does not work anymore.
    // return <ErrorBoundary ref={boundaryRef} fallback={null}>
    //     <PositionalAudio ref={positionalAudioRef}
    //         rolloffFactor={1}
    //         distance={1} />
    // </ErrorBoundary>;
}

function AudioStream2D({ client }) {
    const audioRef = useRef(new Audio());

    useEffect(() => {
        if (!client) return;
        const listener = (newStreamId, newStream) => {
            if (newStreamId == client) {
                doIfClicked(() => {
                    audioRef.current.srcObject = newStream;
                    audioRef.current.muted = false;
                    audioRef.current.play();
                });
            }
        };

        streamShare.addStreamAddedListener(listener);

        return () => {
            streamShare.removeStreamAddedListener(listener);
        };
    }, [client]);

    return <audio ref={audioRef} autoPlay muted />;
}

function AudioSplitter({ client }) {
    const [currentView] = useProperty('currentView');

    return <>
        {currentView == '3D' ? <AudioStream3D client={client} /> : null}
        {currentView == '2D' ? <AudioStream2D client={client} /> : null}
    </>;
}

export function AudioStream({ client }) {
    return <Varv concept="SpaceManager">
        <AudioSplitter client={client} />
    </Varv>;
}
