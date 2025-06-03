import React from 'react';
const { useState, useEffect, useRef, useCallback } = React;
import { useEditor } from 'tldraw';
import { Varv, useProperty } from '#VarvReact';

import { useTransform } from '#Spatialstrates .movable';
import { projectToCanvas, CANVAS_SCALE } from '#Spatialstrates .projection-helpers';



function AvatarCanvasController({ parent }) {
    const [conceptUUID] = useProperty('concept::uuid');
    const [shapeID, setShapeID] = useState();
    const transform = useTransform();
    const [projectionPlane] = useProperty('projectionPlane');
    const [boundaryOrigin] = useProperty('boundaryOrigin');
    const [type] = useProperty('type');

    const editor = useEditor();
    const isBeingUpdated = useRef(false);

    // Dragging: Varv -> tldraw
    // Create or update the shape when the position of the concept changes
    const updateTldrawFromVarv = useCallback(() => {
        if (!editor) return;
        if (shapeID == undefined) return;
        if (!transform.initialized) return;
        if (!editor.shapeUtils.hasOwnProperty('Avatar')) return;
        if (isBeingUpdated.current) return;
        if (!type) return;

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
                isLocked: true,
                type: 'Avatar',
                x: x * CANVAS_SCALE,
                y: -y * CANVAS_SCALE,
                props: {
                    conceptUUID: conceptUUID,
                    conceptType: 'Avatar',
                    avatarType: type,
                    zIndex: transform.position[2]
                },
                parentId: parent || 'page:page'
            });
        } else {
            isBeingUpdated.current = true;
            editor.updateShape({
                id: shapeID,
                isLocked: false
            });
            editor.updateShape({
                id: shapeID,
                type: 'Avatar',
                isLocked: true,
                x: x * CANVAS_SCALE,
                y: -y * CANVAS_SCALE,
                props: {
                    zIndex: transform.position[2]
                },
                parentId: parent || 'page:page'
            });
            isBeingUpdated.current = false;
        }
    }, [editor, shapeID, conceptUUID, transform.initialized, projectionPlane, boundaryOrigin, type]);

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

            editor.updateShape({
                id: shapeID,
                isLocked: false
            });
            editor.deleteShape(shapeID);
        };
    }, [editor, shapeID]);
}

function AvatarChecker() {
    const [currentSpace] = useProperty('locationHash');
    const [space] = useProperty('space');

    return currentSpace && currentSpace == space ? <AvatarCanvasController /> : null;
}

export function Main() {
    return <Varv concept="AvatarManager" if="enabled">
        <Varv property="locationHash">
            <Varv concept="Avatar" if="!isMine">
                <AvatarChecker />
            </Varv>
            {/* <Varv concept="Avatar" if="isMine">
            <AvatarRemoteController />
        </Varv> */}
        </Varv>
    </Varv>;
}
