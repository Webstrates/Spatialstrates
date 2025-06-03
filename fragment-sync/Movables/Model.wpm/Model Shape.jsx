import React from 'react';
import { HTMLContainer } from 'tldraw';

import { MovableShapeUtil, MovableVarvScope } from '#Spatialstrates .movable-shape';



function ModelShape({ shape, isEditing }) {
    return <HTMLContainer style={{
        transform: 'translate(-50%, -50%)',
        width: shape.props.w + 'px',
        height: shape.props.h + 'px',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid green',
        padding: '8px'
    }}>Implement {shape.props.conceptType}</HTMLContainer>;
}

class ModelShapeUtil extends MovableShapeUtil {
    static type = 'Model';

    canEdit = () => true;

    component(shape) {
        const isEditing = this.editor.getEditingShapeId() === shape.id;

        return <MovableVarvScope shape={shape}>
            <ModelShape shape={shape} isEditing={isEditing} />
        </MovableVarvScope>;
    }
}

export const Main = ModelShapeUtil;
