import React from 'react';
const { useState, useEffect } = React;
import { HTMLContainer, Rectangle2d, BaseBoxShapeUtil, T } from 'tldraw';

import { CANVAS_SCALE } from '#Spatialstrates .projection-helpers';



// Workaround because <Varv target="conceptUUID" /> causes flicker
export function MovableVarvScope({ shape, children }) {
    const [scope, setScope] = useState([]);

    useEffect(() => {
        if (!shape.props.conceptUUID) return;
        const asyncLookup = async () => {
            const concept = await VarvEngine.getConceptFromUUID(shape.props.conceptUUID);
            setScope([new ConceptInstanceBinding(concept, shape.props.conceptUUID)]);
        };
        asyncLookup();
    }, [shape.props.conceptUUID]);

    return <VarvScope.Provider value={scope}>
        {scope.length > 0 ? children : null}
    </VarvScope.Provider>;
}

export class MovableShapeUtil extends BaseBoxShapeUtil {
    static type = 'Movable';
    static props = {
        conceptUUID: T.string,
        conceptType: T.string,
        w: T.number,
        h: T.number,
        zIndex: T.number
    };

    getDefaultProps() {
        return {
            conceptUUID: false,
            conceptType: false,
            w: CANVAS_SCALE * 0.25,
            h: CANVAS_SCALE * 0.25,
            zIndex: 0
        };
    }

    canBind = () => true;
    canCrop = () => false;
    canEdit = () => false;
    canResize = () => false;
    canScroll = () => false;
    canSnap = () => false;
    isAspectRatioLocked = () => true;
    hideRotateHandle = () => true;

    getGeometry(shape) {
        return new Rectangle2d({
            x: -shape.props.w / 2,
            y: -shape.props.h / 2,
            width: shape.props.w,
            height: shape.props.h,
            isFilled: true,
        });
    }

    indicator(shape) {
        return <rect
            x={-shape.props.w / 2}
            y={-shape.props.h / 2}
            width={shape.props.w}
            height={shape.props.h}
        />;
    }

    component(shape) {
        return <HTMLContainer style={{
            transform: 'translate(-50%, -50%)',
            width: shape.props.w + 'px',
            height: shape.props.h + 'px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid red',
            padding: '8px'
        }}>Unsupported Movable of type {shape.props.conceptType}</HTMLContainer>;
    }
}

export const Main = MovableShapeUtil;
