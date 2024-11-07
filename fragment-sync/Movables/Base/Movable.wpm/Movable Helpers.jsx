import { devicePositionWithOffset, deviceRotation } from '#Spatialstrates .transform-helpers';



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

export const createMovable = async (device, conceptName, properties = {}) => {
    if (!device) {
        console.warn('No device found, cannot create movable.');
        return;
    }

    const [x, y, z] = devicePositionWithOffset(device, 0.5);
    const [rx, ry, rz] = deviceRotation(device);

    await deselectMovables();
    const concept = await VarvEngine.getConceptFromType(conceptName);
    return await concept.create(null, {
        selected: true,
        position: [x, y, z],
        rotation: [rx, ry, rz],
        ...properties
    });
};

export const deleteMovable = async (uuid) => {
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
            // Clone and move it up by 20cm
            console.warn('Cloning not implemented yet');
            // TODO: Re-implement this feature
        }
    }
};
