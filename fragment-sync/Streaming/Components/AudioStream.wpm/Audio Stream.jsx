import React from 'react';
const { useState, useEffect } = React;
import { Varv, useProperty } from '#VarvReact';

import { QUERY_PREFIX, streamShare } from '#AudioStreamManager .default';



function AudioStream() {
    const [client] = useProperty('client');
    const [muted] = useProperty('muted');

    const [audio, setAudio] = useState(document.querySelector(QUERY_PREFIX + client));

    useEffect(() => {
        // Make sure to catch stream updates
        let listener = function (newStreamId) {
            if (newStreamId == client) setAudio(document.querySelector(QUERY_PREFIX + client));
        };
        streamShare.addStreamAddedListener(listener);

        return () => {
            streamShare.removeStreamAddedListener(listener);
        };
    }, [audio, client]);

    useEffect(() => {
        if (audio && (client != webstrate.clientId)) {
            audio.muted = muted;
        }
    }, [muted, client]);
}

export function Main() {
    return <Varv concept="AudioStream">
        <AudioStream />
    </Varv>;
}
