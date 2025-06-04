const initConcept = async () => {
    try {
        const managers = await VarvEngine.lookupInstances('SpaceManager');
        if (managers.length == 0) {
            await VarvEngine.getConceptFromType('SpaceManager').create(null, {});
        }
    } catch (e) {
        // Ignore
    }
};

VarvEngine.registerEventCallback('engineReloaded', () => {
    initConcept();
});

initConcept();
