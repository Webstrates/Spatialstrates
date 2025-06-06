import React from 'react';
let { useState, useEffect, useMemo } = React;
import { useGLTF, Outlines } from '@react-three/drei';
import { MeshStandardMaterial, Vector3, Vector2 } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { useFrame } from '@react-three/fiber';
import { stopEventPropagation } from 'tldraw';
import { useProperty } from '#VarvReact';

import { Text } from '#Spatialstrates .text';
import { getSpaceManagerUUID, projectToCanvas } from '#Spatialstrates .projection-helpers';
import { createMovable } from '#Spatialstrates .movable-helpers';
import { moveMovableToNewSpace } from '#Spatialstrates .container-helpers';
import { transcribeAudio, sendGPTPrompt, getGPTContent } from '#AIHelpers .default';
import { Icon, SELECTED_COLOR_PRIMARY, SELECTED_COLOR_SECONDARY, HOVERED_SELECTED_COLOR_PRIMARY, HOVERED_SELECTED_COLOR_SECONDARY } from '#Icon .default';

import { composeSpecFromGroup, decomposeSpec, integrateVisPiecesIntoGroup, findAllFields } from '#VisModule .vis-composer';
import { getVisComponentById } from '#VisModule .vis-component-manager';



export function useIsVisible() {
    const [group] = useProperty('group');
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(!(group && group != 'null'));
    }, [group]);

    return visible;
}

export const visThemes = {
    'bookshelf': { primary: 'hsl(200, 18%, 50%)', secondary: 'hsl(198, 16%, 84%)' },
    'bookshelf:hovered': { primary: 'hsl(200, 18%, 80%)', secondary: 'hsl(198, 16%, 84%)' },
    'bookshelf:selected': { primary: SELECTED_COLOR_PRIMARY, secondary: SELECTED_COLOR_SECONDARY },
    'bookshelf:selected:hovered': { primary: HOVERED_SELECTED_COLOR_PRIMARY, secondary: HOVERED_SELECTED_COLOR_SECONDARY },

    'visualization': { primary: 'hsl(262, 52%, 50%)', secondary: 'hsl(291, 96%, 62%)' },
    'visualization:hovered': { primary: 'hsl(262, 52%, 80%)', secondary: 'hsl(291, 96%, 82%)' },
    'visualization:selected': { primary: SELECTED_COLOR_PRIMARY, secondary: SELECTED_COLOR_SECONDARY },
    'visualization:selected:hovered': { primary: HOVERED_SELECTED_COLOR_PRIMARY, secondary: HOVERED_SELECTED_COLOR_SECONDARY },

    'vegaLite_2D': { primary: 'hsl(262, 52%, 50%)', secondary: 'hsl(291, 96%, 62%)' },
    'vegaLite_2D:hovered': { primary: 'hsl(262, 52%, 80%)', secondary: 'hsl(291, 96%, 82%)' },
    'vegaLite_25D': { primary: 'hsl(262, 52%, 50%)', secondary: 'hsl(291, 96%, 62%)' },
    'vegaLite_25D:hovered': { primary: 'hsl(262, 52%, 80%)', secondary: 'hsl(291, 96%, 82%)' },
    'optomancy': { primary: 'hsl(262, 52%, 50%)', secondary: 'hsl(291, 96%, 62%)' },
    'optomancy:hovered': { primary: 'hsl(262, 52%, 80%)', secondary: 'hsl(291, 96%, 82%)' },

    'spec': { primary: 'hsl(199, 100%, 50%)', secondary: 'hsl(198, 100%, 75%)', line: 'hsl(199, 100%, 50%)' },
    'spec:hovered': { primary: 'hsl(199, 100%, 80%)', secondary: 'hsl(198, 100%, 85%)' },
    'spec:selected': { primary: SELECTED_COLOR_PRIMARY, secondary: SELECTED_COLOR_SECONDARY },
    'spec:selected:hovered': { primary: HOVERED_SELECTED_COLOR_PRIMARY, secondary: HOVERED_SELECTED_COLOR_SECONDARY },
    'd3Spec': { primary: 'hsl(174, 65%, 50%)', secondary: 'hsl(166, 100%, 70%)', line: 'hsl(174, 65%, 50%)' },
    'd3Spec:hovered': { primary: 'hsl(174, 65%, 80%)', secondary: 'hsl(166, 100%, 80%)' },
    'd3Spec:selected': { primary: SELECTED_COLOR_PRIMARY, secondary: SELECTED_COLOR_SECONDARY },
    'd3Spec:selected:hovered': { primary: HOVERED_SELECTED_COLOR_PRIMARY, secondary: HOVERED_SELECTED_COLOR_SECONDARY },
    'dataset': { primary: 'hsl(88, 50%, 50%)', secondary: 'hsl(93, 100%, 50%)', line: 'hsl(88, 50%, 50%)' },
    'dataset:hovered': { primary: 'hsl(88, 50%, 80%)', secondary: 'hsl(93, 100%, 60%)' },
    'dataset:selected': { primary: SELECTED_COLOR_PRIMARY, secondary: SELECTED_COLOR_SECONDARY },
    'dataset:selected:hovered': { primary: HOVERED_SELECTED_COLOR_PRIMARY, secondary: HOVERED_SELECTED_COLOR_SECONDARY },
    'piece': { primary: 'hsl(45, 100%, 50%)', secondary: 'hsl(60, 100%, 50%)', line: 'hsl(45, 100%, 50%)' },
    'piece:hovered': { primary: 'hsl(45, 100%, 80%)', secondary: 'hsl(60, 100%, 60%)' },
    'piece:selected': { primary: SELECTED_COLOR_PRIMARY, secondary: SELECTED_COLOR_SECONDARY },
    'piece:selected:hovered': { primary: HOVERED_SELECTED_COLOR_PRIMARY, secondary: HOVERED_SELECTED_COLOR_SECONDARY }
};



export const metalnessValue = 0.5;
export const roughnessValue = 0.5;
export const visMaterials = {
    'bookshelf': new MeshStandardMaterial({ color: visThemes['bookshelf'].primary, metalness: metalnessValue, roughness: roughnessValue }),
    'bookshelf:hovered': new MeshStandardMaterial({ color: visThemes['bookshelf:hovered'].primary, metalness: metalnessValue, roughness: roughnessValue }),
    'visualizations': new MeshStandardMaterial({ color: visThemes['visualization'].primary, metalness: metalnessValue, roughness: roughnessValue }),
    'visualizations:hovered': new MeshStandardMaterial({ color: visThemes['visualization:hovered'].primary, metalness: metalnessValue, roughness: roughnessValue }),
    'spec': new MeshStandardMaterial({ color: visThemes['spec'].primary, metalness: metalnessValue, roughness: roughnessValue }),
    'spec:hovered': new MeshStandardMaterial({ color: visThemes['spec:hovered'].primary, metalness: metalnessValue, roughness: roughnessValue }),
    'd3Spec': new MeshStandardMaterial({ color: visThemes['d3Spec'].primary, metalness: metalnessValue, roughness: roughnessValue }),
    'd3Spec:hovered': new MeshStandardMaterial({ color: visThemes['d3Spec:hovered'].primary, metalness: metalnessValue, roughness: roughnessValue }),
    'dataset': new MeshStandardMaterial({ color: visThemes['dataset'].primary, metalness: metalnessValue, roughness: roughnessValue }),
    'dataset:hovered': new MeshStandardMaterial({ color: visThemes['dataset:hovered'].primary, metalness: metalnessValue, roughness: roughnessValue }),
    'piece': new MeshStandardMaterial({ color: visThemes['piece'].primary, metalness: metalnessValue, roughness: roughnessValue }),
    'piece:hovered': new MeshStandardMaterial({ color: visThemes['piece:hovered'].primary, metalness: metalnessValue, roughness: roughnessValue }),
    'piece:secondary': new MeshStandardMaterial({ color: visThemes['piece'].secondary, metalness: metalnessValue, roughness: roughnessValue }),
    'selectedPrimary': new MeshStandardMaterial({ color: SELECTED_COLOR_PRIMARY, metalness: metalnessValue, roughness: roughnessValue }),
    'selectedSecondary': new MeshStandardMaterial({ color: SELECTED_COLOR_SECONDARY, metalness: metalnessValue, roughness: roughnessValue })
};
export const frameGeometry = new RoundedBoxGeometry(1, 1, 0.005, 1);
export const frameMaterial = new MeshStandardMaterial({ color: 'hsl(200, 18%, 50%)', metalness: metalnessValue, roughness: roughnessValue });
export const frameMaterialDisabled = new MeshStandardMaterial({ color: 'hsl(200, 0%, 80%)', metalness: metalnessValue, roughness: roughnessValue });


export const getPieceTheme = (path) => {
    if (!path) return 'piece';
    if (path.startsWith('data')) {
        return 'dataset';
    } else if (path.startsWith('encoding')) {
        return 'visualization';
    } else if (path.startsWith('transform')) {
        return 'd3Spec';
    } else {
        return 'piece';
    }
};



export const visButtonGeometry = window.visButtonGeometry || new RoundedBoxGeometry(0.8, 0.4, 0.1);
window.visButtonGeometry = visButtonGeometry;
export function VisButton({ callback, position, rotation, scale, active, title, materialPrimary, materialHovered, outlineColor = '#4CAF50', fontSizeMultiplicator = 1 }) {
    const [hovered, setHovered] = useState(false);
    const hoverCallback = () => { setHovered(true); };
    const blurCallback = () => { setHovered(false); };

    const materialPrimaryInternal = useMemo(() => materialPrimary || visMaterials['spec'], [materialPrimary]);
    const materialHoveredInternal = useMemo(() => materialHovered || visMaterials['spec:hovered'], [materialHovered]);

    return <group position={position} scale={scale} rotation={rotation} autoUpdateMatrix={false}>
        <mesh geometry={visButtonGeometry}
            material={hovered ? materialHoveredInternal : materialPrimaryInternal}
            scale={[0.1, 0.1, 0.1]}
            autoUpdateMatrix={false}
            onPointerOver={hoverCallback}
            onPointerOut={blurCallback}
            onClick={() => callback()}>
            {active ? <Outlines screenspace={true} thickness={0.05} color={outlineColor} opacity={0.8} transparent={true} /> : null}
        </mesh>
        {title ? <Text position={[0, 0, 0.006]}
            autoUpdateMatrix={false}
            textAlign="center"
            anchorX="center"
            anchorY="middle"
            color="white"
            maxWidth={0.07}
            fontSize={fontSizeMultiplicator * 0.01}>
            {title.replace(/\b(\w{13})(?!\s|$)/g, '$1- ')}
        </Text> : null}
    </group>;
}

const booleanToggleGeometry = new RoundedBoxGeometry(0.03, 0.03, 0.01);
export function VisToggle({ value, setValue, invert, position, rotation, scale, callback }) {
    const actualValue = useMemo(() => invert ? !value : value, [value, invert]);
    return <group position={position} rotation={rotation} scale={scale} autoUpdateMatrix={false}>
        <VisButton callback={() => {
            setValue(!value);
            if (callback) callback(!value);
        }} />
        <mesh geometry={booleanToggleGeometry}
            material={actualValue ? frameMaterial : frameMaterialDisabled}
            autoUpdateMatrix={false}
            position={[actualValue ? 0.02 : -0.022, 0, 0.005]}>
            <Text
                position={[0, 0.012, 0.0075]}
                autoUpdateMatrix={false}
                textAlign="center"
                anchorX="center"
                anchorY="center"
                color="white"
                fontSize={0.02}>
                {actualValue ? 'I' : 'O'}
            </Text>
        </mesh>
    </group>;
}



/* LLM Speech-to-Vis Integration */

useGLTF.preload('microphone.glb');

function MicrophoneIcon({ callback, active }) {
    const microphoneIcon = useGLTF('microphone.glb');
    const [scale, setScale] = useState(new Vector3(0.5, 0.5, 0.5));

    useFrame((state, delta) => {
        const scaleSpeed = 3;
        const minScale = 0.4;
        const maxScale = 0.6;
        const targetScale = active ? minScale + (maxScale - minScale) * (Math.sin(state.clock.elapsedTime * 5) * 0.5 + 0.5) : 0.5;
        const newScale = scale.clone().lerp(new Vector3(targetScale, targetScale, targetScale), scaleSpeed * delta);
        setScale(newScale);
    });

    return <Icon model={microphoneIcon} rotation={[0, -Math.PI, 0]} scale={scale} onClick={callback} />;
}

export function TranscribeIcon({ setValue, ...props }) {
    const [listening, setListening] = useState(false);

    const callback = async () => {
        setListening(true);
        let text = await transcribeAudio(5000, false, () => { setListening(false); });

        if (text[text.length - 1] === '.') {
            text = text.slice(0, -1);
        }
        text = text.replace(/\b\w/g, (char) => char.toUpperCase());

        setValue(text);
    };

    return <group {...props} autoUpdateMatrix={false}>
        <MicrophoneIcon callback={callback} active={listening} />
    </group>;
}

export function SpeechToVisPiece(props) {
    const [listening, setListening] = useState(false);
    const [path, setPath] = useProperty('path');
    const [content, setContent] = useProperty('content');

    const callback = async () => {
        setListening(true);
        const text = await transcribeAudio(5000, false, () => { setListening(false); });

        const fields = await findAllFields();

        const gptData = await sendGPTPrompt({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: `You are an visualization assistant. You help users change their Vega-Lite specifications. You will receive a path to a key of a Vega-Lite property (e.g., 'mark.type') and its content (e.g., 'bar'). You change either the content or both the path and content according to the user request. If the content is normally in an array, like a 'transform', you have to wrap it in an array like this: transform: [{"filter": "datum.x > 5"}]. You always reply in the following JSON format: { "newPath": "your-new-path", "newContent": "your-new-content" }` },
                { role: 'user', content: `Here are the available fields: ${fields.join(', ')}` },
                { role: 'user', content: `My current path is "${path}" and content is "${content}".` },
                { role: 'user', content: text }
            ],
            temperature: 0.05,
            max_tokens: 1000,
            response_format: { 'type': 'json_object' }
        });

        const result = getGPTContent(gptData);

        try {
            const json = JSON.parse(result);
            if (json.hasOwnProperty('newPath')) setPath(json.newPath);
            if (json.hasOwnProperty('newContent')) {
                if (typeof json.newContent === 'object') {
                    setContent(JSON.stringify(json.newContent));
                } else {
                    setContent(json.newContent);
                }
            }
        } catch (e) {
            console.error('Error parsing GPT-4o response:', e);
        }
    };

    return <group {...props} autoUpdateMatrix={false}>
        <MicrophoneIcon callback={callback} active={listening} />
    </group>;
}

export function SpeechToVisGroup(props) {
    const [listening, setListening] = useState(false);
    const [conceptUUID] = useProperty('concept::uuid');

    const callback = async () => {
        setListening(true);
        const text = await transcribeAudio(5000, false, () => { setListening(false); });
        setListening(false);

        const spec = await composeSpecFromGroup(conceptUUID);

        let dataSchema = '';
        if (spec.hasOwnProperty('data')) {
            if (spec.data.hasOwnProperty('values')) {
                dataSchema = spec.data.values[0];
            } else if (spec.data.hasOwnProperty('url')) {
                const response = await fetch(spec.data.url);
                const values = await response.json();
                dataSchema = values[0];
            } else if (spec.data.hasOwnProperty('fragment')) {
                const fragment = spec.data.fragment;
                const component = getVisComponentById(fragment);
                if (component) {
                    dataSchema = component.getContentAsJSON()[0];
                }
            }
        }

        const gptData = await sendGPTPrompt({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: `You are an visualization assistant. You help users change their Vega-Lite specifications. You will receive a Vega-Lite specification and change it according to the user request. You always reply in the following JSON format with the full Vega-Lite specification: { "newSpec": { "mark": "..." }}` },
                { role: 'user', content: `My current specification is "${JSON.stringify(spec)}".` },
                { role: "user", content: dataSchema ? `Here is an example datapoint of the data: ${JSON.stringify(dataSchema)}` : '' },
                { role: 'user', content: text }
            ],
            temperature: 0.05,
            max_tokens: 1000,
            response_format: { 'type': 'json_object' }
        });

        const result = getGPTContent(gptData);

        try {
            const json = JSON.parse(result);
            if (json.hasOwnProperty('newSpec')) {
                const newSpec = json.newSpec;
                const pieces = decomposeSpec(newSpec);
                await integrateVisPiecesIntoGroup(conceptUUID, pieces);
            }
        } catch (e) {
            console.error('Error parsing GPT-4o response:', e);
        }
    };

    return <group {...props} autoUpdateMatrix={false}>
        <MicrophoneIcon callback={callback} active={listening} />
    </group>;
}

export function SpeechToVisPiece2D(props) {
    const [listening, setListening] = useState(false);
    const [path, setPath] = useProperty('path');
    const [content, setContent] = useProperty('content');

    const callback = async (e) => {
        stopEventPropagation(e);
        setListening(true);
        const text = await transcribeAudio(5000, false, () => { setListening(false); });

        const fields = await findAllFields();

        const gptData = await sendGPTPrompt({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: `You are an visualization assistant. You help users change their Vega-Lite specifications. You will receive a path to a key of a Vega-Lite property (e.g., 'mark.type') and its content (e.g., 'bar'). You change either the content or both the path and content according to the user request. If the content is normally in an array, like a 'transform', you have to wrap it in an array like this: transform: [{"filter": "datum.x > 5"}]. You always reply in the following JSON format: { "newPath": "your-new-path", "newContent": "your-new-content" }` },
                { role: 'user', content: `Here are the available fields: ${fields.join(', ')}` },
                { role: 'user', content: `My current path is "${path}" and content is "${content}".` },
                { role: 'user', content: text }
            ],
            temperature: 0.05,
            max_tokens: 1000,
            response_format: { 'type': 'json_object' }
        });

        const result = getGPTContent(gptData);

        try {
            const json = JSON.parse(result);
            if (json.hasOwnProperty('newPath')) setPath(json.newPath);
            if (json.hasOwnProperty('newContent')) {
                if (typeof json.newContent === 'object') {
                    setContent(JSON.stringify(json.newContent));
                } else {
                    setContent(json.newContent);
                }
            }
        } catch (e) {
            console.error('Error parsing GPT-4o response:', e);
        }
    };

    return <div {...props} className={`speech-to-vis-piece-icon ${listening ? 'listening' : ''}`} onPointerDown={callback} />;
}

export function SpeechToVisGroup2D(props) {
    const [listening, setListening] = useState(false);
    const [conceptUUID] = useProperty('concept::uuid');

    const callback = async (e) => {
        stopEventPropagation(e);
        setListening(true);
        const text = await transcribeAudio(5000, false, () => { setListening(false); });
        setListening(false);

        const spec = await composeSpecFromGroup(conceptUUID);

        let dataSchema = '';
        if (spec.hasOwnProperty('data')) {
            if (spec.data.hasOwnProperty('values')) {
                dataSchema = spec.data.values[0];
            } else if (spec.data.hasOwnProperty('url')) {
                const response = await fetch(spec.data.url);
                const values = await response.json();
                dataSchema = values[0];
            } else if (spec.data.hasOwnProperty('fragment')) {
                const fragment = spec.data.fragment;
                const component = getVisComponentById(fragment);
                if (component) {
                    dataSchema = component.getContentAsJSON()[0];
                }
            }
        }

        const gptData = await sendGPTPrompt({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: `You are an visualization assistant. You help users change their Vega-Lite specifications. You will receive a Vega-Lite specification and change it according to the user request. You always reply in the following JSON format with the full Vega-Lite specification: { "newSpec": { "mark": "..." }}` },
                { role: 'user', content: `My current specification is "${JSON.stringify(spec)}".` },
                { role: "user", content: dataSchema ? `Here is an example datapoint of the data: ${JSON.stringify(dataSchema)}` : '' },
                { role: 'user', content: text }
            ],
            temperature: 0.05,
            max_tokens: 1000,
            response_format: { 'type': 'json_object' }
        });

        const result = getGPTContent(gptData);

        try {
            const json = JSON.parse(result);
            if (json.hasOwnProperty('newSpec')) {
                const newSpec = json.newSpec;
                const pieces = decomposeSpec(newSpec);
                await integrateVisPiecesIntoGroup(conceptUUID, pieces);
            }
        } catch (e) {
            console.error('Error parsing GPT-4o response:', e);
        }
    };

    return <div {...props} className={`speech-to-vis-group-icon ${listening ? 'listening' : ''}`} onPointerDown={callback} />;
}



const MAX_DISTANCE_GROUPING = 0.125;

const dragEndGroupingFilter = FilterAction.constructFilter({
    and: [
        {
            property: 'locked',
            equals: false
        },
        {
            property: 'group',
            equals: ''
        }
    ]
});
const is2D = async () => {
    const spaceManagerUUID = await getSpaceManagerUUID();
    const currentView = await VarvEngine.getConceptFromType('SpaceManager').getPropertyValue(spaceManagerUUID, 'currentView');

    return currentView === '2D';
};
const getPositionVector = async (uuid) => {
    // FIXME: This might be bad for performance:
    if (await is2D()) {
        const concept = await VarvEngine.getConceptFromUUID(uuid);
        const position = await concept.getPropertyValue(uuid, 'position');

        const spaceUUID = await concept.getPropertyValue(uuid, 'space');
        const projectionPlane = await VarvEngine.getConceptFromType('Space').getPropertyValue(spaceUUID, 'projectionPlane');
        const position2D = await projectToCanvas(position, projectionPlane);
        return new Vector2(...position2D);
    } else {
        const concept = await VarvEngine.getConceptFromUUID(uuid);
        const position = await concept.getPropertyValue(uuid, 'position');
        return new Vector3(...position);
    }
};
export const onDragEndGroupingCallback = async (ownUUID) => {
    const ownConcept = await VarvEngine.getConceptFromUUID(ownUUID);
    const ownPositionVector = await getPositionVector(ownUUID);

    const visMovableUUIDs = await VarvEngine.lookupInstances(['VisPiece', 'VisGroup'], dragEndGroupingFilter);
    const otherUUIDs = visMovableUUIDs.filter(uuid => uuid !== ownUUID);

    const otherPositions = await Promise.all(otherUUIDs.map(async (uuid) => {
        return {
            uuid: uuid,
            positionVector: await getPositionVector(uuid)
        };
    }));

    const movablesWithinDistance = otherPositions.map(otherPosition => {
        return { uuid: otherPosition.uuid, distance: ownPositionVector.distanceTo(otherPosition.positionVector) };
    }).filter(otherPosition => otherPosition.distance < MAX_DISTANCE_GROUPING);

    if (movablesWithinDistance.length > 0) {
        const closestUUID = movablesWithinDistance.sort((a, b) => a.distance - b.distance)[0].uuid;
        const closestConcept = await VarvEngine.getConceptFromUUID(closestUUID);

        if (closestConcept.name == 'VisPiece') {
            const newVisGroupUUID = await createMovable('VisGroup', {
                pieces: [closestUUID, ownUUID],
                position: await closestConcept.getPropertyValue(closestUUID, 'position'),
                rotation: await closestConcept.getPropertyValue(closestUUID, 'rotation')
            });

            await closestConcept.setPropertyValue(closestUUID, 'group', newVisGroupUUID);
            await closestConcept.setPropertyValue(closestUUID, 'disabled', false);
            await moveMovableToNewSpace(closestUUID, '');

            await ownConcept.setPropertyValue(ownUUID, 'group', newVisGroupUUID);
        } else if (closestConcept.name == 'VisGroup') {
            await closestConcept.setPropertyValue(closestUUID, 'pieces', [...await closestConcept.getPropertyValue(closestUUID, 'pieces'), ownUUID]);
            await ownConcept.setPropertyValue(ownUUID, 'group', closestUUID);
        }

        await ownConcept.setPropertyValue(ownUUID, 'disabled', false);
        await moveMovableToNewSpace(ownUUID, '');
    }
};

const dragEndResetHighlightFilter = FilterAction.constructFilter({
    property: 'dropHighlight',
    equals: true
});
export const onDragEndResetGroupingHighlight = async () => {
    const visMovableUUIDs = await VarvEngine.lookupInstances(['VisPiece', 'VisGroup'], dragEndResetHighlightFilter);
    await Promise.all(visMovableUUIDs.map(uuid => {
        const concept = VarvEngine.getConceptFromUUID(uuid);
        concept.setPropertyValue(uuid, 'dropHighlight', false);
    }));
};

export const onDraggingUpdateGroupingHighlight = async (ownUUID) => {
    await onDragEndResetGroupingHighlight();
    const ownPositionVector = await getPositionVector(ownUUID);

    const visMovableUUIDs = await VarvEngine.lookupInstances(['VisPiece', 'VisGroup'], dragEndGroupingFilter);
    const otherUUIDs = visMovableUUIDs.filter(uuid => uuid !== ownUUID);

    const otherPositions = await Promise.all(otherUUIDs.map(async (uuid) => {
        return {
            uuid: uuid,
            positionVector: await getPositionVector(uuid)
        };
    }));

    const movablesWithinDistance = otherPositions.map(otherPosition => {
        return { uuid: otherPosition.uuid, distance: ownPositionVector.distanceTo(otherPosition.positionVector) };
    }).filter(otherPosition => otherPosition.distance < MAX_DISTANCE_GROUPING);

    if (movablesWithinDistance.length > 0) {
        const closestUUID = movablesWithinDistance.sort((a, b) => a.distance - b.distance)[0].uuid;
        const closestConcept = await VarvEngine.getConceptFromUUID(closestUUID);

        await closestConcept.setPropertyValue(closestUUID, 'dropHighlight', true);
    }
};



const PROXIMITY_AUTHORING_DISTANCE = 0.75;

const updateProximityPiecesOfGroup = async (groupUUID) => {
    const groupConcept = await VarvEngine.getConceptFromType('VisGroup');
    const groupProximityAuthoring = await groupConcept.getPropertyValue(groupUUID, 'proximityAuthoring');

    if (!groupProximityAuthoring) {
        groupConcept.setPropertyValue(groupUUID, 'proximityPieces', []);
        return;
    }

    const ownPositionVector = await getPositionVector(groupUUID);

    const spaceOfGroup = await groupConcept.getPropertyValue(groupUUID, 'space');
    const visMovableUUIDs = await VarvEngine.lookupInstances(['VisPiece', 'VisGroup'], FilterAction.constructFilter({
        and: [
            {
                property: 'group',
                equals: ''
            },
            {
                property: 'space',
                equals: spaceOfGroup
            }
        ]
    }));
    const otherUUIDs = visMovableUUIDs.filter(uuid => uuid !== groupUUID);

    const otherPositions = await Promise.all(otherUUIDs.map(async (uuid) => {
        return {
            uuid: uuid,
            positionVector: await getPositionVector(uuid)
        };
    }));

    const movablesWithinDistance = otherPositions.map(otherPosition => {
        return { uuid: otherPosition.uuid, distance: ownPositionVector.distanceTo(otherPosition.positionVector) };
    }).filter(otherPosition => otherPosition.distance < PROXIMITY_AUTHORING_DISTANCE);

    groupConcept.setPropertyValue(groupUUID, 'proximityPieces', movablesWithinDistance.map(movable => movable.uuid));
};

const checkIfMovableIsInProximity = async (groupUUID, movableUUID, movableSpace) => {
    const groupPositionVector = await getPositionVector(groupUUID);
    const movablePositionVector = await getPositionVector(movableUUID);

    const groupConcept = await VarvEngine.getConceptFromUUID(groupUUID);
    const groupSpace = await groupConcept.getPropertyValue(groupUUID, 'space');
    const groupProximityPieces = await groupConcept.getPropertyValue(groupUUID, 'proximityPieces');
    if (movableSpace != groupSpace
        || groupPositionVector.distanceTo(movablePositionVector) > PROXIMITY_AUTHORING_DISTANCE) {
        await groupConcept.setPropertyValue(groupUUID, 'proximityPieces', groupProximityPieces.filter(uuid => uuid !== movableUUID));
    } else if (!groupProximityPieces.includes(movableUUID)) {
        await groupConcept.setPropertyValue(groupUUID, 'proximityPieces', [...groupProximityPieces, movableUUID]);
    }
};

export const onDraggingUpdateProximityAuthoring = async (ownUUID) => {
    const ownConcept = await VarvEngine.getConceptFromUUID(ownUUID);

    // Check if own pieces need to be updated
    if (ownConcept.name == 'VisGroup') {
        await updateProximityPiecesOfGroup(ownUUID);
    }

    // Update other groups that have proximity authoring enabled
    const proximityAuthoringGroupUUIDs = await VarvEngine.lookupInstances(['VisGroup'], FilterAction.constructFilter({
        and: [
            {
                property: 'locked',
                equals: false
            },
            {
                property: 'group',
                equals: ''
            },
            {
                property: 'proximityAuthoring',
                equals: true
            }
        ]
    }));
    const ownSpace = await ownConcept.getPropertyValue(ownUUID, 'space');
    await Promise.all(proximityAuthoringGroupUUIDs.filter(uuid => uuid !== ownUUID).map(async (groupUUID) => {
        await checkIfMovableIsInProximity(groupUUID, ownUUID, ownSpace);
    }));
};

export function useUpdateProximityAuthoringOnSpaceChange() {
    const [conceptUUID] = useProperty('concept::uuid');
    const [space] = useProperty('space');

    useEffect(() => {
        if (!conceptUUID) return;
        onDraggingUpdateProximityAuthoring(conceptUUID);
    }, [conceptUUID, space]);
}
