import React from 'react';
const { useEffect, useRef } = React;
import { useEditor, HTMLContainer } from 'tldraw';
import { useProperty } from '#VarvReact';

import { CANVAS_SCALE } from '#Spatialstrates .projection-helpers';
import { MovableShapeUtil, MovableVarvScope } from '#Spatialstrates .movable-shape';



const MAX_SIZE = 0.75;

function ScreenStreamShape({ shape }) {
    const [client] = useProperty('client');
    const editor = useEditor();
    const videoRef = useRef();

    useEffect(() => {
        if (!client) return;

        const mediaStream = moduleScreenStreamManager?.streamShare?.clientStreams?.get(client);
        if (!mediaStream) return;

        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();

        videoRef.current.onloadedmetadata = () => {
            const aspectRatio = videoRef.current.videoWidth / videoRef.current.videoHeight || 1;
            let newWidth, newHeight;
            if (aspectRatio > 1) {
                newWidth = MAX_SIZE;
                newHeight = MAX_SIZE / aspectRatio;
            } else {
                newWidth = MAX_SIZE * aspectRatio;
                newHeight = MAX_SIZE
            }

            editor.updateShape({
                id: shape.id,
                props: {
                    w: newWidth * CANVAS_SCALE,
                    h: newHeight * CANVAS_SCALE
                }
            });
        };
    }, [client]);

    return <HTMLContainer style={{
        transform: 'translate(-50%, -50%)',
        width: shape.props.w + 'px',
        height: shape.props.h + 'px',
        background: '#999',
        borderRadius: '8px',
        boxShadow: 'rgba(100, 100, 111, 0.4) 0px 0px 4px 0px'
    }}>
        <video ref={videoRef} style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '8px',
        }} />
    </HTMLContainer>;
}

class ScreenStreamShapeUtil extends MovableShapeUtil {
    static type = 'ScreenStream';

    getDefaultProps() {
        return Object.assign(super.getDefaultProps(), {
            w: CANVAS_SCALE * MAX_SIZE,
            h: CANVAS_SCALE * MAX_SIZE
        });
    }

    component(shape) {
        return <MovableVarvScope shape={shape}>
            <ScreenStreamShape shape={shape} />
        </MovableVarvScope>;
    }
}

export const Main = ScreenStreamShapeUtil;
