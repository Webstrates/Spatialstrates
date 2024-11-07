const initConcept = async () => {
    try {
        const managers = await VarvEngine.lookupInstances('AvatarManager');
        if (managers.length == 0) {
            await VarvEngine.getConceptFromType('AvatarManager').create(null, {});
        }
    } catch (e) {
        // Ignore
    }
};

VarvEngine.registerEventCallback('engineReloaded', () => {
    initConcept();
});

initConcept();
