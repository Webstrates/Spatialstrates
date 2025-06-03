import {
    SPEC_COMPONENT_TYPE,
    DATASET_COMPONENT_TYPE,
    UNKNOWN_COMPONENT_TYPE,
    COMPONENT_CONTAINER_SELECTOR,
    SPEC_CONTAINER_SELECTOR,
    DATASET_CONTAINER_SELECTOR,
    generateComponentId
} from '#VisModule .vis-helpers';

let visComponentContainer = document.querySelector(COMPONENT_CONTAINER_SELECTOR);
let specContainer = document.querySelector(SPEC_CONTAINER_SELECTOR);
let datasetContainer = document.querySelector(DATASET_CONTAINER_SELECTOR);

// Setup folders if not available
if (!visComponentContainer) {
    visComponentContainer = document.createElement('code-folder');
    visComponentContainer.id = 'vis-component-container';
    visComponentContainer.setAttribute('name', 'Vis-Components');
    document.body.appendChild(visComponentContainer);
    WPMv2.stripProtection(visComponentContainer);
}
if (!specContainer) {
    specContainer = document.createElement('code-folder');
    specContainer.classList.add('spec-container');
    specContainer.setAttribute('name', 'Specs');
    visComponentContainer.appendChild(specContainer);
    WPMv2.stripProtection(specContainer);
}
if (!datasetContainer) {
    datasetContainer = document.createElement('code-folder');
    datasetContainer.classList.add('dataset-container');
    datasetContainer.setAttribute('name', 'Datasets');
    visComponentContainer.appendChild(datasetContainer);
    WPMv2.stripProtection(datasetContainer);
}



export class VisComponent {
    constructor(fragmentElement) {
        if (!!fragmentElement.closest(SPEC_CONTAINER_SELECTOR)) {
            this.type = SPEC_COMPONENT_TYPE;
        } else if (!!fragmentElement.closest(DATASET_CONTAINER_SELECTOR)) {
            this.type = DATASET_COMPONENT_TYPE;
        } else {
            this.type = UNKNOWN_COMPONENT_TYPE;
        }
        this.fragmentElement = fragmentElement;
        this.fragment = Fragment.one(this.fragmentElement)
        this.name = this.fragmentElement.getAttribute('name') || this.fragmentElement.id;
        this.uuid = this.fragmentElement.getAttribute('transient-fragment-uuid');

        this.id = this.fragmentElement.id;
        if (!this.id) {
            this.id = generateComponentId();
            this.fragmentElement.id = this.id;
        }

        this.contentChangedListener = [];
        this.nameChangedListener = [];

        this.fragmentChangedCallback = () => {
            this._contentChanged();
        };
        this.fragment.registerOnFragmentChangedHandler(this.fragmentChangedCallback);

        this.observer = new MutationObserver((mutationsList, observer) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'name') {
                    this.name = this.fragmentElement.getAttribute('name');
                    this._nameChanged();
                }
            }
        });

        this.observer.observe(this.fragmentElement, { attributes: true });
    }
    disconnect() {
        this.fragment.unRegisterOnFragmentChangedHandler(this.fragmentChangedCallback);
        this.observer.disconnect();
    }
    remove() {
        this.fragmentElement.remove();
    }

    getContentRaw() {
        return this.fragment.raw;
    }
    getContentAsJSON() {
        if (this.type === DATASET_COMPONENT_TYPE || this.type === SPEC_COMPONENT_TYPE) {
            try {
                return JSON.parse(this.getContentRaw());
            } catch (e) {
                console.warn(`getContentAsJSON -> Failed to parse content as JSON: ${e.message}`);
                return this.type === DATASET_COMPONENT_TYPE ? [] : {};
            }
        } else {
            return null;
        }
    }

    _contentChanged() {
        this.contentChangedListener.forEach(listener => {
            listener(this);
        });
    }
    addContentChangedListener(listener) {
        this.contentChangedListener.push(listener);
    }
    removeContentChangedListener(listener) {
        const index = this.contentChangedListener.indexOf(listener);
        if (index > -1) {
            this.contentChangedListener.splice(index, 1);
        }
    }

    _nameChanged() {
        this.nameChangedListener.forEach(listener => {
            listener(this.name);
        });
    }
    addNameChangedListener(listener) {
        this.nameChangedListener.push(listener);
    }
    removeNameChangedListener(listener) {
        const index = this.nameChangedListener.indexOf(listener);
        if (index > -1) {
            this.nameChangedListener.splice(index, 1);
        }
    }
}

class VisComponentManager {
    constructor() {
        this.visComponents = new Map();
        this.addedListeners = [];
        this.removedListeners = [];
    }

    addVisComponent(fragmentElement) {
        const visComponent = new VisComponent(fragmentElement);
        this.visComponents.set(visComponent.uuid, visComponent);
        this._visComponentAdded(visComponent);
        return visComponent;
    }
    removeVisComponent(fragmentElement) {
        const visComponent = this.visComponents.get(fragmentElement.getAttribute('transient-fragment-uuid'));
        visComponent.disconnect();
        this.visComponents.delete(visComponent.uuid);
        this._visComponentRemoved(visComponent);
    }

    getVisComponent(uuid) {
        return this.visComponents.get(uuid);
    }
    getVisComponentById(id) {
        for (const visComponent of this.visComponents.values()) {
            if (visComponent.id === id) {
                return visComponent;
            }
        }
        return null;
    }
    getVisComponents() {
        return Array.from(this.visComponents.values());
    }
    getSpecComponents() {
        return this.getVisComponents().filter(fragment => fragment.type === SPEC_COMPONENT_TYPE);
    }
    getDatasetComponents() {
        return this.getVisComponents().filter(fragment => fragment.type === DATASET_COMPONENT_TYPE);
    }

    _visComponentAdded(visComponent) {
        this.addedListeners.forEach(listener => {
            listener(visComponent);
        });
    }
    addVisComponentAddedListener(listener) {
        this.addedListeners.push(listener);
    }
    removeVisComponentAddedListener(listener) {
        const index = this.addedListeners.indexOf(listener);
        if (index > -1) {
            this.addedListeners.splice(index, 1);
        }
    }

    _visComponentRemoved(visComponent) {
        this.removedListeners.forEach(listener => {
            listener(visComponent);
        });
    }
    addVisComponentRemovedListener(listener) {
        this.removedListeners.push(listener);
    }
    removeVisComponentRemovedListener(listener) {
        const index = this.removedListeners.indexOf(listener);
        if (index > -1) {
            this.removedListeners.splice(index, 1);
        }
    }
}


if (!window.moduleVisComponentManager) {
    window.moduleVisComponentManager = {
        visComponentManager: new VisComponentManager()
    }

    cQuery(visComponentContainer).liveQuery('code-fragment', {
        'added': (fragmentElement) => {
            window.moduleVisComponentManager.visComponentManager.addVisComponent(fragmentElement);
        },
        'removed': (fragmentElement) => {
            window.moduleVisComponentManager.visComponentManager.removeVisComponent(fragmentElement);
        }
    });
}
const visComponentManager = window.moduleVisComponentManager.visComponentManager;


const createFragmentElement = (content = '', name = 'New Component') => {
    const dataType = 'application/json';
    const fragment = Fragment.create(dataType);
    fragment.raw = content;
    fragment.html[0].setAttribute('name', name);
    fragment.html[0].id = generateComponentId();
    WPMv2.stripProtection(fragment.html[0]);

    return fragment.html[0];
};
export const createSpecVisComponent = (content, name) => {
    const fragmentElement = createFragmentElement(content, name);
    specContainer.appendChild(fragmentElement);
    const visComponent = visComponentManager.addVisComponent(fragmentElement);
    return visComponent;
};
export const createDatasetVisComponent = (content, name) => {
    const fragmentElement = createFragmentElement(content, name);
    datasetContainer.appendChild(fragmentElement);
    const visComponent = visComponentManager.addVisComponent(fragmentElement);
    return visComponent;
};



export const getVisComponent = visComponentManager.getVisComponent.bind(visComponentManager);
export const getVisComponentById = visComponentManager.getVisComponentById.bind(visComponentManager);

export const getVisComponents = visComponentManager.getVisComponents.bind(visComponentManager);
export const getSpecComponents = visComponentManager.getSpecComponents.bind(visComponentManager);
export const getDatasetComponents = visComponentManager.getDatasetComponents.bind(visComponentManager);

export const addVisComponentAddedListener = visComponentManager.addVisComponentAddedListener.bind(visComponentManager);
export const removeVisComponentAddedListener = visComponentManager.removeVisComponentAddedListener.bind(visComponentManager);
export const addVisComponentRemovedListener = visComponentManager.addVisComponentRemovedListener.bind(visComponentManager);
export const removeVisComponentRemovedListener = visComponentManager.removeVisComponentRemovedListener.bind(visComponentManager);
