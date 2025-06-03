import React from 'react';
const { useEffect, useCallback } = React;
import { Vector2 } from 'three';
import { HTMLContainer } from 'tldraw';
import { useProperty } from '#VarvReact';

import { MovableShapeUtil, MovableVarvScope } from '#Spatialstrates .movable-shape';
import { deleteMovable } from '#Spatialstrates .movable-helpers';
import { useGlobalEvents } from '#Spatialstrates .global-events';
import { projectToCanvas, CANVAS_SCALE } from '#Spatialstrates .projection-helpers';



const MAX_DISTANCE = 0.2;

function TrashcanShape({ shape }) {
    const [position] = useProperty('position');
    const [uuid] = useProperty('concept::uuid');
    const [space] = useProperty('space');

    const { subscribeEvent } = useGlobalEvents();

    const onDragEnd = useCallback(async (data) => {
        if (data.target === uuid) return;
        if (!space) return;

        const movablePositionArray = await VarvEngine.getConceptFromUUID(data.target).getPropertyValue(data.target, 'position');

        const projectionPlane = await VarvEngine.getConceptFromType('Space').getPropertyValue(space, 'projectionPlane');
        const position2DArray = await projectToCanvas(position, projectionPlane);
        const movablePosition2DArray = await projectToCanvas(movablePositionArray, projectionPlane);

        const trashcanPosition = new Vector2(...position2DArray);
        const movablePosition = new Vector2(...movablePosition2DArray);

        if (trashcanPosition.distanceTo(movablePosition) < MAX_DISTANCE) {
            await deleteMovable(data.target);
        }
    }, [position, space]);

    useEffect(() => {
        const unsubscribe = subscribeEvent('drag-end', onDragEnd);
        return () => unsubscribe();
    }, [subscribeEvent, position]);


    return <HTMLContainer style={{
        transform: 'translate(-50%, -50%)',
        width: shape.props.w + 'px',
        height: shape.props.h + 'px',
        backgroundColor: '#444',
        borderRadius: '8px',
        boxShadow: `rgba(100, 100, 111, 0.4) 0px 0px 4px 0px`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    }}>
        <span style={{
            fontFamily: 'Material Icons',
            color: '#ddd',
            fontSize: '48px'
        }}>delete</span>
    </HTMLContainer>;
}

class TrashcanShapeUtil extends MovableShapeUtil {
    static type = 'Trashcan';

    getDefaultProps() {
        return Object.assign(super.getDefaultProps(), {
            w: CANVAS_SCALE * 0.15,
            h: CANVAS_SCALE * 0.185
        });
    }

    component(shape) {
        return <MovableVarvScope shape={shape}>
            <TrashcanShape shape={shape} />
        </MovableVarvScope>;
    }
}

export const Main = TrashcanShapeUtil;
