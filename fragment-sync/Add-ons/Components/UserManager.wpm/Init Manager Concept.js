const initConcept = async () => {
    try {
        const managers = await VarvEngine.lookupInstances('UserManager');
        if (managers.length == 0) {
            await VarvEngine.getConceptFromType('UserManager').create(null, {});
        }
    } catch (e) {
        // Ignore
    }
};

VarvEngine.registerEventCallback('engineReloaded', () => {
    initConcept();
});

initConcept();
