import React from 'react';
import { HTMLContainer, } from 'tldraw';

import { MovableShapeUtil, MovableVarvScope } from '#Spatialstrates .movable-shape';
import { CANVAS_SCALE } from '#Spatialstrates .projection-helpers';



function ClemensShape({ shape }) {
    return <HTMLContainer className="clemens-shape" style={{
        transform: 'translate(-50%, -50%)',
        width: shape.props.w + 'px',
        height: shape.props.h + 'px'
    }}>
        <img src="clemens.jpg"
            style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
            }} />
    </HTMLContainer>;
}

class ClemensShapeUtil extends MovableShapeUtil {
    static type = 'Clemens';

    getDefaultProps() {
        return Object.assign(super.getDefaultProps(), {
            w: CANVAS_SCALE * 0.3,
            h: CANVAS_SCALE * 0.3
        });
    }

    component(shape) {
        return <MovableVarvScope shape={shape}>
            <ClemensShape shape={shape} />
        </MovableVarvScope>;
    }
}

export const Main = ClemensShapeUtil;
