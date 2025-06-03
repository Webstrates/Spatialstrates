import React from 'react';
const { useState, useEffect, useRef, useCallback } = React;
import { useEditor } from 'tldraw';
import { useProperty } from '#VarvReact';

import { useTransform } from '#Spatialstrates .movable';
import { projectToCanvas, updatePointFromCanvas, CANVAS_SCALE } from '#Spatialstrates .projection-helpers';



const FAST_WRITEBACK_TIMEOUT = 33;

export function MovableCanvasController({ parent }) {
    const [conceptUUID] = useProperty('concept::uuid');
    const [conceptType] = useProperty('concept::name');
    const [shapeID, setShapeID] = useState();
    const transform = useTransform();
    const [projectionPlane] = useProperty('projectionPlane');
    const [boundaryOrigin] = useProperty('boundaryOrigin');

    const editor = useEditor();
    const isBeingUpdated = useRef(false);

    // Dragging: Varv -> tldraw
    // Create or update the shape when the position of the concept changes
    const updateTldrawFromVarv = useCallback(() => {
        if (!editor) return;
        if (shapeID == undefined) return;
        if (!transform.initialized) return;
        if (!editor.shapeUtils.hasOwnProperty('Movable')) return;
        if (isBeingUpdated.current) return;

        const typeWithFallback = editor.shapeUtils.hasOwnProperty(conceptType) ? conceptType : 'Movable';

        let x;
        let y;

        if (parent) {
            // Center the projection plane around the origin of the boundary when in a container
            [x, y] = projectToCanvas(transform.position, [
                boundaryOrigin[0],
                boundaryOrigin[1],
                boundaryOrigin[2],
                projectionPlane[3],
                projectionPlane[4],
                projectionPlane[5],
                projectionPlane[6],
                projectionPlane[7],
                projectionPlane[8],
                projectionPlane[9],
                projectionPlane[10],
                projectionPlane[11]
            ]);
        } else {
            [x, y] = projectToCanvas(transform.position, projectionPlane);
        }

        if (!editor.getShape(shapeID)) {
            editor.createShape({
                id: shapeID,
                type: typeWithFallback,
                x: x * CANVAS_SCALE,
                y: -y * CANVAS_SCALE,
                props: {
                    conceptUUID: conceptUUID,
                    conceptType: conceptType,
                    zIndex: transform.position[2]
                },
                parentId: parent || 'page:page'
            });
        } else {
            isBeingUpdated.current = true;
            editor.updateShape({
                id: shapeID,
                type: typeWithFallback,
                x: x * CANVAS_SCALE,
                y: -y * CANVAS_SCALE,
                props: {
                    zIndex: transform.position[2]
                },
                parentId: parent || 'page:page'
            });
            isBeingUpdated.current = false;
        }
    }, [editor, shapeID, conceptUUID, transform.initialized, projectionPlane, boundaryOrigin]);

    // Set the shape ID based on the concept UUID
    useEffect(() => {
        if (!conceptUUID) return;
        setShapeID('shape:' + conceptUUID);

        const concept = VarvEngine.getConceptFromUUID(conceptUUID);
        if (!concept) return;

        const updatePosition = async (changeUUID) => {
            if (changeUUID !== conceptUUID) return;
            updateTldrawFromVarv();
        };

        updatePosition(conceptUUID);
        concept.getProperty('position').addUpdatedCallback(updatePosition);

        return () => {
            if (!concept) return;
            try {
                concept.getProperty('position').removeUpdatedCallback(updatePosition);
            } catch (e) {
                // Do nothing, this can crash when the VarvEngine restarts
            }
        };
    }, [conceptUUID, updateTldrawFromVarv]);

    // Removing: Varv -> tldraw
    // Delete the shape when the component unmounts/the concept is deleted
    useEffect(() => {
        return () => {
            if (!editor) return;
            if (shapeID == undefined) return;

            editor.deleteShape(shapeID);
        };
    }, [editor, shapeID]);

    // Dragging + Removing: tldraw -> Varv
    // Listen for changes to the shape and update the concept properties
    const fastWritebackTimeout = useRef();
    useEffect(() => {
        if (!editor) return;
        if (shapeID == undefined) return;
        if (!boundaryOrigin) return;
        if (!projectionPlane) return;

        const removeChangeHandler = editor.sideEffects.registerAfterChangeHandler('shape', (prev, next, source) => {
            if (isBeingUpdated.current) return;
            if (next.id !== shapeID) return;

            // Update the Varv state
            if (!fastWritebackTimeout.current) {
                isBeingUpdated.current = true;

                let newX, newY, newZ;
                if (parent) {
                    [newX, newY, newZ] = updatePointFromCanvas(transform.position, [next.x / CANVAS_SCALE, -next.y / CANVAS_SCALE], [
                        boundaryOrigin[0],
                        boundaryOrigin[1],
                        boundaryOrigin[2],
                        projectionPlane[3],
                        projectionPlane[4],
                        projectionPlane[5],
                        projectionPlane[6],
                        projectionPlane[7],
                        projectionPlane[8],
                        projectionPlane[9],
                        projectionPlane[10],
                        projectionPlane[11]
                    ]);
                } else {
                    [newX, newY, newZ] = updatePointFromCanvas(transform.position, [next.x / CANVAS_SCALE, -next.y / CANVAS_SCALE], projectionPlane);
                }

                if (newX !== transform.position[0] || newY !== transform.position[1] || newZ !== transform.position[2]) {
                    transform.position = [newX, newY, newZ];
                }
                isBeingUpdated.current = false;
                fastWritebackTimeout.current = setTimeout(() => {
                    fastWritebackTimeout.current = null;
                }, FAST_WRITEBACK_TIMEOUT);
            }
        });

        const removeDeleteHandler = editor.sideEffects.registerAfterDeleteHandler('shape', async (shape) => {
            if (shape.id !== shapeID) return;
            // FIXME: This sometimes triggers and deletes all elements
            // console.log('FIXME: deleting concept: ' + shape.props.conceptUUID);
            // const concept = await VarvEngine.getConceptFromUUID(shape.props.conceptUUID);
            // await concept?.delete(shape.props.conceptUUID);
        });

        return () => {
            removeChangeHandler();
            removeDeleteHandler();
        };
    }, [editor, shapeID, projectionPlane, boundaryOrigin]);
}
