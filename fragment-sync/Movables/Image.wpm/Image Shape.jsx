import React from 'react';
const { useEffect } = React;
import { useEditor, HTMLContainer, stopEventPropagation } from 'tldraw';
import { useProperty } from '#VarvReact';

import { MovableShapeUtil, MovableVarvScope } from '#Spatialstrates .movable-shape';
import { CANVAS_SCALE } from '#Spatialstrates .projection-helpers';



const MAX_SIZE = 0.42;

function ImageShape({ shape, isEditing }) {
    const [url, setUrl] = useProperty('url');
    const editor = useEditor();

    useEffect(() => {
        if (!url) return;

        const img = new Image();
        img.src = url;
        img.onload = () => {
            const aspectRatio = img.width / img.height || 1;
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
    }, [url]);

    return <HTMLContainer style={{
        transform: 'translate(-50%, -50%)',
        width: shape.props.w + 'px',
        height: shape.props.h + 'px',
        background: '#222',
        borderRadius: '8px',
        boxShadow: 'rgba(100, 100, 111, 0.4) 0px 0px 4px 0px',
        pointerEvents: isEditing ? 'all' : 'none'
    }}>
        {url ? <img src={url} style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '8px',
        }} /> : 'No image'}
        {isEditing && <input type="text" value={url} onChange={e => setUrl(e.target.value)} onPointerDown={stopEventPropagation} onPointerMove={stopEventPropagation} />}
    </HTMLContainer>;
}

class ImageShapeUtil extends MovableShapeUtil {
    static type = 'Image';

    getDefaultProps() {
        return Object.assign(super.getDefaultProps(), {
            w: CANVAS_SCALE * MAX_SIZE,
            h: CANVAS_SCALE * MAX_SIZE
        });
    }

    canEdit = () => true;

    component(shape) {
        const isEditing = this.editor.getEditingShapeId() === shape.id;

        return <MovableVarvScope shape={shape}>
            <ImageShape shape={shape} isEditing={isEditing} />
        </MovableVarvScope>;
    }
}

export const Main = ImageShapeUtil;
