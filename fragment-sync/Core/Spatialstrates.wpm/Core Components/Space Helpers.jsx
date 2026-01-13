export const getSpaceManagerUUID = async () => {
    const spaceManagerUUIDs = await VarvEngine.getAllUUIDsFromType('SpaceManager');
    if (spaceManagerUUIDs.length === 0) {
        console.log('No space manager found');
        return false;
    }
    return spaceManagerUUIDs[0];
};

export const getCurrentSpaceUUID = async () => {
    const spaceManagerUUID = await getSpaceManagerUUID();
    const spaceUUID = await VarvEngine.getConceptFromType('SpaceManager').getPropertyValue(spaceManagerUUID, 'locationHash');
    if (!spaceUUID) {
        console.log('No space found');
        return false;
    }
    return spaceUUID;
};
