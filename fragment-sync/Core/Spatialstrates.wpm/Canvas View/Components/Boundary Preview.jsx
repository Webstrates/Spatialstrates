import React from 'react';
const { useEffect, useRef } = React;
import { useEditor } from 'tldraw';
import { useProperty } from '#VarvReact';

import { projectToCanvas, updatePointFromCanvas, CANVAS_SCALE } from '#Spatialstrates .projection-helpers';



const BOUNDARY_PREVIEW_ID = 'shape:space-boundary-preview';
const BOUNDARY_PREVIEW_WRITEBACK_TIMEOUT = 33;

export function BoundaryPreview() {
    const [showBoundary] = useProperty('showBoundary');
    const [boundarySize, setBoundarySize] = useProperty('boundarySize');
    const [boundaryOrigin, setBoundaryOrigin] = useProperty('boundaryOrigin');
    const [projectionPlane] = useProperty('projectionPlane');
    const editor = useEditor();
    const isBeingUpdated = useRef(false);

    // Varv -> tldraw
    useEffect(() => {
        if (!editor) return;
        if (!showBoundary) {
            editor.deleteShape(BOUNDARY_PREVIEW_ID);
            return;
        }
        if (!boundarySize || !boundaryOrigin) return;
        if (!projectionPlane) return;
        if (isBeingUpdated.current) return;

        let [x, y] = projectToCanvas(boundaryOrigin, projectionPlane);
        x = x - boundarySize[0] / 2;
        y = y + boundarySize[1] / 2;

        isBeingUpdated.current = true;
        if (!editor.getShape(BOUNDARY_PREVIEW_ID)) {
            editor.createShape({
                id: BOUNDARY_PREVIEW_ID,
                type: 'geo',
                opacity: 0.5,
                x: x * CANVAS_SCALE,
                y: -y * CANVAS_SCALE,
                props: {
                    w: boundarySize[0] * CANVAS_SCALE,
                    h: boundarySize[1] * CANVAS_SCALE,
                    color: 'black',
                    geo: 'rectangle'
                }
            });
            editor.sendToBack([BOUNDARY_PREVIEW_ID]);
        } else {
            editor.updateShape({
                id: BOUNDARY_PREVIEW_ID,
                x: x * CANVAS_SCALE,
                y: -y * CANVAS_SCALE,
                props: {
                    w: boundarySize[0] * CANVAS_SCALE,
                    h: boundarySize[1] * CANVAS_SCALE
                }
            });
        }
        isBeingUpdated.current = false;

        return () => {
            editor.deleteShape(BOUNDARY_PREVIEW_ID);
        };
    }, [showBoundary, boundarySize, boundaryOrigin, projectionPlane, editor]);

    // tldraw -> Varv
    const fastWritebackTimeout = useRef();
    useEffect(() => {
        if (!editor) return;
        if (!boundarySize || !boundaryOrigin) return;
        if (!projectionPlane) return;

        const updateChangeHandler = editor.sideEffects.registerAfterChangeHandler('shape', (prev, next, source) => {
            if (isBeingUpdated.current) return;
            if (prev.id !== BOUNDARY_PREVIEW_ID) return;
            if (next.id !== BOUNDARY_PREVIEW_ID) return;
            if (prev.props.w === next.props.w
                && prev.props.h === next.props.h
                && prev.x === next.x
                && prev.y === next.y) return;

            // Update the Varv state
            if (!fastWritebackTimeout.current) {
                isBeingUpdated.current = true;

                setBoundarySize([
                    next.props.w / CANVAS_SCALE,
                    next.props.h / CANVAS_SCALE,
                    boundarySize[2]
                ]);

                const [x, y, z] = updatePointFromCanvas(boundaryOrigin, [
                    next.x / CANVAS_SCALE + next.props.w / CANVAS_SCALE / 2,
                    -next.y / CANVAS_SCALE - next.props.h / CANVAS_SCALE / 2
                ], projectionPlane);
                setBoundaryOrigin([x, y, z]);

                isBeingUpdated.current = false;
                fastWritebackTimeout.current = setTimeout(() => {
                    fastWritebackTimeout.current = null;
                }, BOUNDARY_PREVIEW_WRITEBACK_TIMEOUT);
            }
        });

        return () => {
            updateChangeHandler();
        };
    }, [editor, boundarySize, boundaryOrigin, setBoundarySize, setBoundaryOrigin, projectionPlane]);
}
