import { Vector3 } from 'three';

import { devicePositionWithOffset, deviceRotation } from '#Spatialstrates .device-helpers';
import { getSpaceManagerUUID, getCurrentSpaceUUID } from '#Spatialstrates .space-helpers';
import { updatePointFromCanvas, CANVAS_SCALE } from '#Spatialstrates .projection-helpers';



const selectedFilter = FilterAction.constructFilter({
    property: 'selected',
    equals: true
});

const selectedAndNotDraggedFilter = FilterAction.constructFilter({
    and: [
        {
            property: 'selected',
            equals: true
        },
        {
            property: 'beingDragged',
            equals: false
        }
    ]
});

export const deselectMovables = async () => {
    const ids = await VarvEngine.getAllUUIDsFromType('Movable', true);
    for (const id of ids) {
        if (await selectedAndNotDraggedFilter.filter({ target: id })) {
            await VarvEngine.getConceptFromUUID(id).setPropertyValue(id, 'selected', false);
        }
    }
};

export const createMovable = async (conceptName, properties = {}) => {
    const spaceManager = await getSpaceManagerUUID();
    const currentSpace = await getCurrentSpaceUUID();
    const currentView = await VarvEngine.getConceptFromType('SpaceManager').getPropertyValue(spaceManager, 'currentView');
    let x, y, z, rx, ry, rz = 0;

    if (currentView === '3D') {
        [x, y, z] = devicePositionWithOffset(window.moduleDeviceManager.camera, 0.5);
        [rx, ry, rz] = deviceRotation(window.moduleDeviceManager.camera);
    } else if (currentView === '2D' && window.tldrawEditor) {
        const pageCoordinates = window.tldrawEditor.screenToPage({
            x: (window.innerWidth / 2),
            y: (window.innerHeight / 2)
        });

        const projectionPlane = await VarvEngine.getConceptFromType('Space').getPropertyValue(currentSpace, 'projectionPlane');

        [x, y, z] = updatePointFromCanvas(
            [projectionPlane[0], projectionPlane[1], projectionPlane[2]],
            [pageCoordinates.x / CANVAS_SCALE, -pageCoordinates.y / CANVAS_SCALE],
            projectionPlane
        );

        // const xAxis = new Vector3().fromArray(projectionPlane.slice(3, 6));
        // const yAxis = new Vector3().fromArray(projectionPlane.slice(6, 9));
        const zAxis = new Vector3().fromArray(projectionPlane.slice(9, 12));

        // const rotationMatrix = new Matrix4().makeBasis(xAxis, yAxis, zAxis);
        // const rotation = new Euler().setFromRotationMatrix(rotationMatrix);
        // [rx, ry, rz] = [rotation.x, rotation.y, rotation.z];

        // Always spawn new movables upright
        zAxis.y = 0;
        zAxis.normalize();
        const angleY = Math.atan2(zAxis.x, zAxis.z);
        [rx, ry, rz] = [0, angleY, 0];
    }

    const currentMovables = await VarvEngine.getConceptFromType('Space').getPropertyValue(currentSpace, 'movables');

    await deselectMovables();
    const concept = await VarvEngine.getConceptFromType(conceptName);
    const newInstance = await concept.create(null, {
        selected: true,
        position: [x, y, z],
        rotation: [rx, ry, rz],
        space: currentSpace,
        ...properties
    });
    await VarvEngine.getConceptFromType('Space').setPropertyValue(currentSpace, 'movables', [...currentMovables, newInstance]);

    return newInstance;
};

export const deleteMovable = async (uuid) => {
    // TODO: Take care of nested concepts like in DashSpace groups
    await VarvEngine.getConceptFromUUID(uuid).delete(uuid);
};

export const deleteSelectedMovable = async () => {
    const uuids = await VarvEngine.getAllUUIDsFromType('Movable', true);
    for (const uuid of uuids) {
        if (await selectedFilter.filter({ target: uuid })) {
            await deleteMovable(uuid);
        }
    }
};

export const cloneSelectedMovable = async () => {
    const ids = await VarvEngine.getAllUUIDsFromType('Movable', true);
    for (const id of ids) {
        if (await selectedFilter.filter({ target: id })) {
            // FIXME: This only creates a shallow clone right now
            const newClone = await VarvEngine.getConceptFromUUID(id).clone(id, false);

            // Move the clone up a bit so it doesn't overlap with the original
            const oldPosition = await VarvEngine.getConceptFromUUID(newClone).getPropertyValue(newClone, 'position');
            await VarvEngine.getConceptFromUUID(newClone).setPropertyValue(newClone, 'position', [
                oldPosition[0],
                oldPosition[1] + 0.2,
                oldPosition[2]
            ]);

            // Add to the space as the original
            const space = await VarvEngine.getConceptFromUUID(newClone).getPropertyValue(newClone, 'space');
            const currentMovables = await VarvEngine.getConceptFromType('Space').getPropertyValue(space, 'movables');
            await VarvEngine.getConceptFromType('Space').setPropertyValue(space, 'movables', [...currentMovables, newClone]);

            // Set the new clone as selected
            await deselectMovables();
            await VarvEngine.getConceptFromUUID(newClone).setPropertyValue(newClone, 'selected', true);
        }
    }
};
