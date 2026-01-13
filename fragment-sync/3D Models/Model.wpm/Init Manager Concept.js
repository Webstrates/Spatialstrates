const initConcept = async () => {
    try {
        const managers = await VarvEngine.lookupInstances('ModelManager');
        if (managers.length === 0) {
            await VarvEngine.getConceptFromType('ModelManager').create(null, {});
        }
    } catch (e) {
        // Ignore
    }
};

VarvEngine.registerEventCallback('engineReloaded', () => {
    initConcept();
});
