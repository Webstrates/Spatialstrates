import React from 'react';
const { useMemo } = React;
import { Vector3, Box3 } from 'three';
import { useProperty } from '#VarvReact';



export function ClippedMovablesFilter({ children, clippingMode }) {
    // Space
    const [boundarySize] = useProperty('boundarySize');
    const [boundaryOrigin] = useProperty('boundaryOrigin');

    // Movable
    const [beingDragged] = useProperty('beingDragged');
    const [position] = useProperty('position');

    const positionVector = useMemo(() => new Vector3(), []);
    const boundingBox = useMemo(() => {
        if (!Array.isArray(boundarySize) || !Array.isArray(boundaryOrigin)) return false;

        const halfSize = new Vector3(boundarySize[0] / 2, boundarySize[1] / 2, boundarySize[2] / 2);
        const min = new Vector3(...boundaryOrigin).sub(halfSize);
        const max = new Vector3(...boundaryOrigin).add(halfSize);

        return new Box3(min, max);
    }, [boundarySize, boundaryOrigin]);

    const withinBounds = useMemo(() => {
        if (!boundingBox) return false;
        if (!Array.isArray(position)) return false;

        return boundingBox.containsPoint(positionVector.fromArray(position));
    }, [boundingBox, position]);

    // STUB: Implement a faded mode
    return clippingMode == 'show' || withinBounds || beingDragged ? children : null;
}

export const moveMovableToNewSpace = async (elementUUID, newSpaceUUID = '') => {
    const elementConcept = await VarvEngine.getConceptFromUUID(elementUUID);
    const spaceConcept = await VarvEngine.getConceptFromType('Space');

    const oldSpaceUUID = await elementConcept.getPropertyValue(elementUUID, 'space');

    elementConcept.setPropertyValue(elementUUID, 'space', newSpaceUUID);
    if (oldSpaceUUID) spaceConcept.setPropertyValue(oldSpaceUUID, 'movables', (await spaceConcept.getPropertyValue(oldSpaceUUID, 'movables')).filter(movable => movable !== elementUUID));
    if (newSpaceUUID) spaceConcept.setPropertyValue(newSpaceUUID, 'movables', [...(await spaceConcept.getPropertyValue(newSpaceUUID, 'movables')), elementUUID]);
};
