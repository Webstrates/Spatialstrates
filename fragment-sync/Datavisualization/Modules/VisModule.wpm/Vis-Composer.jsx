import * as mergeModule from 'lodash.mergewith';
const deepMerge = mergeModule.default;

// https://lodash.com/docs/4.17.15#mergeWith
// Merge arrays instead of overwriting them
function deepMergeCustomizer(objValue, srcValue) {
    if (_.isArray(objValue)) {
        return objValue.concat(srcValue);
    }
}

import { SPEC_COMPONENT_TYPE, DATASET_COMPONENT_TYPE } from '#VisModule .vis-helpers';
import { getVisComponentById } from '#VisModule .vis-component-manager';



/* Varv Helpers */

export const createVarvVisPieces = async (pieces) => {
    const concept = VarvEngine.getConceptFromType('VisPiece');
    const instanceUUIDs = [];

    for (let piece of pieces) {
        const uuid = await concept.create(null, {
            path: piece.path,
            content: piece.content,
        });
        instanceUUIDs.push(uuid);
    }

    return instanceUUIDs;
};

export const integrateVisPiecesIntoGroup = async (groupUUID, pieces) => {
    const existingPieces = await recursivelyFindPieces(groupUUID);
    const pieceConcept = VarvEngine.getConceptFromType('VisPiece');
    const groupConcept = VarvEngine.getConceptFromType('VisGroup');

    console.log('integrateVisPiecesIntoGroup', groupUUID, pieces, existingPieces)

    // Iterate backwards so that we do not set overwritten pieces
    for (let i = pieces.length - 1; i >= 0; i--) {
        const piece = pieces[i];
        const existingPiece = existingPieces.find(p => p.path === piece.path);

        if (existingPiece) {
            existingPiece.overwritten = true;
            await pieceConcept.getProperty('content').setValue(existingPiece.pieceUUID, piece.content);
            await pieceConcept.getProperty('disabled').setValue(existingPiece.pieceUUID, false);
        } else {
            const newPieceUUID = await pieceConcept.create(null, {
                path: piece.path,
                content: piece.content,
                group: groupUUID
            });
            const oldPieces = groupConcept.getProperty('pieces').getValue(groupUUID, true);
            oldPieces.push(newPieceUUID);
            await groupConcept.getProperty('pieces').setValue(groupUUID, oldPieces);
        }
    }

    // Disable not overwritten pieces
    for (let i = 0; i < existingPieces.length; i++) {
        const existingPiece = existingPieces[i];
        if (!existingPiece.overwritten) {
            await pieceConcept.getProperty('disabled').setValue(existingPiece.pieceUUID, true);
        }
    }
};

const recursivelyFindPieces = async (groupUUID, proximityAuthoring = false) => {
    const concept = VarvEngine.getConceptFromUUID(groupUUID);
    const pieces = [];
    const piecesToIterate = [];

    const groupPieces = await concept.getProperty('pieces').getValue(groupUUID, true);
    piecesToIterate.push(...groupPieces);

    if (proximityAuthoring) {
        const proximityPieces = await concept.getProperty('proximityPieces').getValue(groupUUID, true);
        piecesToIterate.push(...proximityPieces);
    }

    for (let i = 0; i < piecesToIterate.length; i++) {
        const pieceUUID = piecesToIterate[i];
        const conceptType = await VarvEngine.getConceptFromUUID(pieceUUID).name;

        if (conceptType === 'VisPiece') {
            const path = await VarvEngine.getConceptFromUUID(pieceUUID).getProperty('path').getValue(pieceUUID, true);
            const content = await VarvEngine.getConceptFromUUID(pieceUUID).getProperty('content').getValue(pieceUUID, true);
            const disabled = await VarvEngine.getConceptFromUUID(pieceUUID).getProperty('disabled').getValue(pieceUUID, true);
            pieces.push({ pieceUUID, path, content, disabled });
        } else if (conceptType === 'VisGroup') {
            const disabled = await VarvEngine.getConceptFromUUID(pieceUUID).getProperty('disabled').getValue(pieceUUID, true);
            if (!disabled) {
                const groupPieces = await recursivelyFindPieces(pieceUUID);
                pieces.push(...groupPieces);
            }
        }
    }

    return pieces;
};

export const isPieceOverwritten = async (groupUUID, pieceUUID) => {
    const proximityAuthoring = await VarvEngine.getConceptFromUUID(groupUUID).getProperty('proximityAuthoring').getValue(groupUUID, true);
    const pieces = await recursivelyFindPieces(groupUUID, proximityAuthoring);

    // Arrays are always merged
    const content = await VarvEngine.getConceptFromUUID(pieceUUID).getProperty('content').getValue(pieceUUID, true);
    if (content.startsWith('[')) return false;

    let targetPath = await VarvEngine.getConceptFromUUID(pieceUUID).getProperty('path').getValue(pieceUUID, true);

    // Data is always overwritten
    if (targetPath.startsWith('data.')) targetPath = 'data';

    const piecesWithSamePath = pieces.filter(p => (p.path.startsWith(targetPath) && !p.disabled));

    return piecesWithSamePath.length > 1 && piecesWithSamePath[piecesWithSamePath.length - 1].pieceUUID !== pieceUUID;
};

export const findAllFields = async () => {
    const pieces = await VarvEngine.getAllUUIDsFromType('VisPiece');
    const concept = VarvEngine.getConceptFromType('VisPiece');

    const fields = [];

    for (let i = 0; i < pieces.length; i++) {
        const pieceUUID = pieces[i];
        const path = await concept.getProperty('path').getValue(pieceUUID, true);

        if (path.startsWith('data.')) {
            const content = await concept.getProperty('content').getValue(pieceUUID, true);
            let values = [];

            switch (path) {
                case 'data.values':
                    values = JSON.parse(content);
                    break;
                case 'data.fragment':
                    const component = getVisComponentById(content);
                    if (!component) {
                        console.error('Component not found', content);
                    }
                    values = component.getContentAsJSON();
                    break;
                case 'data.url':
                    const response = await fetch(content);
                    values = await response.json();
                    break;
                default:
                    console.warn('Unhandled data path', path);
                    break;
            }

            const firstElement = values[0];
            if (typeof firstElement === 'object') {
                for (const key in firstElement) {
                    fields.push(key);
                }
            }
        }
    }

    // Remove duplicates
    return [...new Set(fields)];
}



/* Composition */

const convertPieceToObject = (piece) => {
    const object = {};
    const pathParts = piece.path.split('.');

    let currentObject = object;
    for (let i = 0; i < pathParts.length; i++) {
        const pathPart = pathParts[i];
        if (i === pathParts.length - 1) {
            try {
                // Arrays are stored as JSON strings
                // Numbers and booleans also need to be transformed
                const parsed = JSON.parse(piece.content);
                if (Array.isArray(parsed)) {
                    currentObject[pathPart] = parsed;
                } else if (typeof parsed == 'number') {
                    currentObject[pathPart] = parsed;
                } else if (typeof parsed == 'boolean') {
                    currentObject[pathPart] = parsed;
                } else {
                    throw new Error('Not an array');
                }
            } catch (e) {
                // Other values are plain strings
                currentObject[pathPart] = piece.content;
            }
        } else {
            currentObject[pathPart] = {};
            currentObject = currentObject[pathPart];
        }
    }

    return object;
};

const composeSpecFromGroupRecursively = async (groupUUID, proximityAuthoring = false) => {
    if (!groupUUID) return [];

    const pieces = [];

    const piecesToIterate = [];

    const groupPieces = await VarvEngine.getConceptFromUUID(groupUUID).getProperty('pieces').getValue(groupUUID, true);
    piecesToIterate.push(...groupPieces);

    if (proximityAuthoring) {
        const proximityPieces = await VarvEngine.getConceptFromUUID(groupUUID).getProperty('proximityPieces').getValue(groupUUID, true);

        const proximityPiecesObjects = [];
        for (let i = 0; i < proximityPieces.length; i++) {
            const pieceUUID = proximityPieces[i];
            const position = await VarvEngine.getConceptFromUUID(pieceUUID).getProperty('position').getValue(pieceUUID, true);
            const positionY = position[1];
            proximityPiecesObjects.push({ pieceUUID, positionY });
        }
        proximityPiecesObjects.sort((a, b) => a.positionY - b.positionY);
        const orderedProximityPieces = proximityPiecesObjects.map(p => p.pieceUUID);

        piecesToIterate.push(...orderedProximityPieces);
    }

    for (let i = 0; i < piecesToIterate.length; i++) {
        const pieceUUID = piecesToIterate[i];
        const conceptType = await VarvEngine.getConceptFromUUID(pieceUUID).name;
        const disabled = await VarvEngine.getConceptFromUUID(pieceUUID).getProperty('disabled').getValue(pieceUUID, true);

        if (!disabled) {
            if (conceptType === 'VisPiece') {
                const path = await VarvEngine.getConceptFromUUID(pieceUUID).getProperty('path').getValue(pieceUUID, true);
                const content = await VarvEngine.getConceptFromUUID(pieceUUID).getProperty('content').getValue(pieceUUID, true);
                pieces.push({
                    path: path,
                    content: content
                });
            } else if (conceptType === 'VisGroup') {
                const groupPieces = await composeSpecFromGroupRecursively(pieceUUID);
                pieces.push(...groupPieces);
            }
        }
    }

    return pieces;
};

export const composeSpecFromPieces = (pieces) => {
    let spec = {};

    for (let i = 0; i < pieces.length; i++) {
        const piece = pieces[i];
        const pieceObject = convertPieceToObject(piece);
        spec = deepMerge(spec, pieceObject, deepMergeCustomizer);
    }

    return spec;
};

export const composeSpecFromGroup = async (groupUUID, proximityAuthoring) => {
    const pieces = await composeSpecFromGroupRecursively(groupUUID, proximityAuthoring);
    return composeSpecFromPieces(pieces);
};



/* Decomposition */

export const decomposeComponent = (component) => {
    if (component.type === DATASET_COMPONENT_TYPE) {
        return decomposeDatasetComponent(component);
    } else if (component.type === SPEC_COMPONENT_TYPE) {
        return decomposeSpecComponent(component);
    } else {
        return [];
    }
};

const decomposeDatasetComponent = (datasetComponent) => {
    return [
        {
            path: 'data.fragment',
            content: datasetComponent.id
        }
    ];
};

const decomposeSpecComponent = (specComponent) => {
    const spec = specComponent.getContentAsJSON();

    // Split into piece objects
    return decomposeSpec(spec);
};

export const decomposeSpec = (spec) => {

    // Removed properties
    delete spec['$schema'];
    delete spec.background;
    delete spec.padding;
    delete spec.autosize;
    delete spec.config;
    delete spec.usermeta;

    delete spec.name;
    delete spec.description;
    delete spec.title;
    delete spec.params;

    delete spec.width;
    delete spec.height;
    delete spec.view;
    delete spec.projection;

    return recursivelyDecomposeSpec(spec);
};

const recursivelyDecomposeSpec = (spec, path = '') => {
    const pieces = [];

    for (const key in spec) {
        const value = spec[key];
        const currentPath = path ? `${path}.${key}` : key;

        if (currentPath === 'data.values') {
            const piece = {
                path: currentPath,
                content: JSON.stringify(value)
            };
            pieces.push(piece);
        } else if (Array.isArray(value)) {
            for (let i = 0; i < value.length; i++) {
                const subValue = value[i];
                const piece = {
                    path: currentPath,
                    content: JSON.stringify([subValue])
                };
                pieces.push(piece);
            }
        } else if (typeof value === 'object') {
            const subPieces = recursivelyDecomposeSpec(value, currentPath);
            pieces.push(...subPieces);
        } else if (typeof value === 'number' || typeof value === 'boolean') {
            const piece = {
                path: currentPath,
                content: JSON.stringify(value)
            };
            pieces.push(piece);
        } else {
            const piece = {
                path: currentPath,
                content: value
            };
            pieces.push(piece);
        }
    }

    return pieces;
};
