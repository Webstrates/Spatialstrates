import React from 'react';
const { useState, useEffect, useRef, useMemo, useCallback } = React;
import { Color, Object3D, Matrix4, MeshStandardMaterial, InstancedMesh } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { useGLTF } from '@react-three/drei';
import { useProperty } from '#VarvReact';

import { useGlobalEvents } from '#Spatialstrates .global-events';
import { createMovable } from '#Spatialstrates .movable-helpers';
import { Movable } from '#Spatialstrates .movable';
import { Text } from '#Spatialstrates .text';
import { Icon } from '#Icon .default';

import {
    getSpecComponents,
    getDatasetComponents,
    addVisComponentAddedListener,
    removeVisComponentAddedListener,
    addVisComponentRemovedListener,
    removeVisComponentRemovedListener
} from '#VisModule .vis-component-manager';
import {
    getDefaultVisPiecesLibrary
} from '#VisModule .vis-helpers';
import {
    createVarvVisPieces,
    decomposeComponent
} from '#VisModule .vis-composer';
import { visThemes, visMaterials, getPieceTheme } from '#VisPiece .vis-helpers';

const DEBUG = false;



const defaultShelfMaterial = new MeshStandardMaterial({ metalness: 0.7, roughness: 0.3 });
const defaultGraphBoxGeometry = new RoundedBoxGeometry();
const defaultShelfBoxGeometry = new RoundedBoxGeometry(1, 1, 1, 10);
const defaultShelfColor = visThemes['bookshelf'].primary;

const SHELF_WIDTH = 0.5;
const SHELF_HEIGHT = 0.5;
const SHELF_BOARD_THICKNESS = 0.01;
const SHELF_DEPTH = 0.1;



const generateDummies = (columns, rows, shelfComponents, setTempTitle) => {
    const dummies = [];

    for (let i = 0; i < shelfComponents.length; i++) {
        const component = shelfComponents[i];
        const x = i % columns;
        const y = Math.floor(i / columns);
        const scale = Math.min(1.2 / columns, 0.8);
        dummies.push(<VisComponentDummy
            component={component}
            key={i}
            position={[(x + 0.5) * SHELF_WIDTH / columns, ((rows - y - 0.5) * SHELF_HEIGHT / rows) - 0.05 * scale, 0]}
            scale={[scale, scale, scale]}
            setTempTitle={setTempTitle}
        />);
    }

    return dummies;
};

useGLTF.preload('components_specs.glb');
useGLTF.preload('components_snippets.glb');

function VisComponentDummy({ component, position, scale, setTempTitle }) {
    const specIcon = useGLTF('components_specs.glb');
    const d3SpecIcon = useGLTF('components_snippets.glb');
    const datasetIcon = useGLTF('components_snippets.glb');
    const pieceIcon = useGLTF('components_snippets.glb');
    const visualizationIcon = useGLTF('components_snippets.glb');
    const [type, setType] = useState('');
    const iconModel = useMemo(() => {
        switch (type) {
            case 'spec': return specIcon;
            case 'd3Spec': return d3SpecIcon;
            case 'dataset': return datasetIcon;
            case 'piece': return pieceIcon;
            case 'visualization': return visualizationIcon;
            default: return null;
        }
    }, [type]);
    const [title, setTitle] = useState('');
    const meshRef = useRef();
    const visPieceConcept = VarvEngine.getConceptFromType('VisPiece');

    useEffect(() => {
        if (component.constructor.name === 'VisComponent') {
            setType(component.type);
            setTitle(component.name);
            component.addNameChangedListener(setTitle);
        } else if (component.constructor.name === 'VisPiece') {
            setType(getPieceTheme(component.path));
            setTitle(`${component.path}:${component.content}`);
        } else {
            setType('');
            setTitle('');
        }
        return () => {
            if (component.constructor.name === 'VisComponent') {
                component.removeNameChangedListener(setTitle);
            }
        }
    }, [component]);

    const { triggerEvent } = useGlobalEvents();

    const selectStartHandler = useCallback(async (e) => {
        if (e) e.stopPropagation();
        const position = [meshRef.current.matrixWorld.elements[12], meshRef.current.matrixWorld.elements[13], meshRef.current.matrixWorld.elements[14]];

        let newMovable;

        if (component.constructor.name === 'VisComponent') {
            const pieces = decomposeComponent(component);

            if (pieces.length === 1) {
                newMovable = await createMovable('VisPiece', {
                    path: pieces[0].path,
                    content: pieces[0].content,
                    position: position
                });
            } else {
                const pieceUUIDs = await createVarvVisPieces(pieces);

                newMovable = await createMovable('VisGroup', {
                    name: component.name,
                    pieces: pieceUUIDs,
                    position: position
                });

                for (let pieceUUID of pieceUUIDs) {
                    visPieceConcept.setPropertyValue(pieceUUID, 'group', newMovable);
                }
            }
        } else if (component.constructor.name === 'VisPiece') {
            newMovable = await createMovable('VisPiece', {
                path: component.path,
                content: component.content,
                position: position
            });
        } else {
            console.error('Unknown component type');
        }

        setTimeout(() => {
            triggerEvent('initiate-drag', { target: newMovable, e: e });
        }, 100); // HACK: This is a bit brittle
    }, [triggerEvent, component]);

    const [hovered, setHovered] = useState(false);
    const hoverCallback = () => {
        setTempTitle(title);
        setHovered(true);
    };
    const blurCallback = () => {
        setTempTitle('');
        setHovered(false);
    };

    const icon = useMemo(() => <Icon theme={type + (hovered ? ':hovered' : '')} model={iconModel} themesOverride={visThemes} />, [type, hovered]);

    return <group position={position} scale={scale} autoUpdateMatrix={false}>
        <group ref={meshRef}
            autoUpdateMatrix={false}
            onPointerOver={hoverCallback}
            onPointerOut={blurCallback}
            onPointerDown={selectStartHandler}>
            {icon}
        </group>
        <Text position={[0, 0.1, 0]} autoUpdateMatrix={false}
            textAlign="center"
            anchorX="center"
            anchorY="middle"
            color="white"
            fontSize={0.03}>
            {title.length > 15 ? title.slice(0, 15) + '...' : title}
        </Text>
    </group>;
}

function ShelfTypeSelector({ shelfType, position }) {
    const [type, setType] = useProperty('type');

    const [hovered, setHovered] = useState(false);
    const hoverCallback = () => {
        setHovered(true);
    };
    const blurCallback = () => {
        setHovered(false);
    };

    return <mesh geometry={defaultGraphBoxGeometry}
        material={hovered ? visMaterials[shelfType + ':hovered'] : visMaterials[shelfType]}
        scale={type == shelfType ? [0.06, 0.06, 0.06] : [0.05, 0.05, 0.05]}
        position={position}
        onPointerOver={hoverCallback}
        onPointerOut={blurCallback}
        onClick={() => setType(shelfType)}>
    </mesh>;
}

function HandleIcon({ model, theme = '', themesOverride = '' }) {
    const [selected] = useProperty('selected');
    const [hovered] = useProperty('hovered');
    return <Icon theme={theme + (selected ? ':selected' : '') + (hovered ? ':hovered' : '')} model={model} themesOverride={themesOverride} />
}

useGLTF.preload('bookshelf.glb');

const matrixProvider = new Object3D();
function VisShelf() {
    const bookshelfIcon = useGLTF('bookshelf.glb');
    const [type] = useProperty('type');
    const [dummies, setDummies] = useState([]);

    const [tempTitle, setTempTitle] = useState('');

    const maxMeshes = 50;
    const boxRefs = useMemo(() => {
        const instancer = new InstancedMesh(defaultShelfBoxGeometry, defaultShelfMaterial, maxMeshes);
        // Clean up matrices to avoid flicker on initial grow
        const m = new Matrix4();
        m.set(0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0);
        for (let i = 0; i < maxMeshes; i++) {
            instancer.setMatrixAt(i, m);
        }
        return instancer;
    }, []);

    const updateShelves = (columns, rows) => {
        if (!boxRefs) return;
        let count = 0;
        for (let i = 1; i < columns; i++) {
            matrixProvider.position.set(i * SHELF_WIDTH / columns, 0.5 * SHELF_HEIGHT - 0.5 * SHELF_BOARD_THICKNESS, 0);
            matrixProvider.scale.set(SHELF_BOARD_THICKNESS, SHELF_HEIGHT + SHELF_BOARD_THICKNESS, SHELF_DEPTH * 0.95);
            matrixProvider.updateMatrix();
            boxRefs.setMatrixAt(count, matrixProvider.matrix)
            boxRefs.setColorAt(count, new Color(defaultShelfColor));
            count++;
        };
        for (let i = 1; i < rows; i++) {
            matrixProvider.position.set(0.5 * SHELF_WIDTH, i * SHELF_HEIGHT / rows, 0);
            matrixProvider.scale.set(SHELF_WIDTH + SHELF_BOARD_THICKNESS, SHELF_BOARD_THICKNESS, SHELF_DEPTH * 0.9);
            matrixProvider.updateMatrix();
            boxRefs.setMatrixAt(count, matrixProvider.matrix)
            boxRefs.setColorAt(count, new Color(defaultShelfColor));
            count++;
        };

        boxRefs.instanceMatrix.needsUpdate = true;
        if (boxRefs.instanceColor) boxRefs.instanceColor.needsUpdate = true;
        boxRefs.count = count;
    };

    const updateShelfComponents = () => {
        let shelfComponents = [];
        switch (type) {
            case 'spec':
                shelfComponents = getSpecComponents();
                break;
            case 'dataset':
                shelfComponents = getDatasetComponents();
                break;
            case 'piece':
                shelfComponents = getDefaultVisPiecesLibrary();
                break;
            default:
                if (DEBUG) console.log('Unknown VisShelf type: ' + type);
        }

        const rows = Math.max(Math.ceil(Math.sqrt(shelfComponents.length)), 2);
        const columns = Math.max(Math.ceil(shelfComponents.length / rows), 2);
        updateShelves(columns, rows);
        setDummies(generateDummies(columns, rows, shelfComponents, setTempTitle));
    };

    useEffect(() => {
        updateShelfComponents();

        addVisComponentAddedListener(updateShelfComponents);
        addVisComponentRemovedListener(updateShelfComponents);
        return () => {
            removeVisComponentAddedListener(updateShelfComponents);
            removeVisComponentRemovedListener(updateShelfComponents);
        };
    }, [type]);

    const handle = useMemo(() => <group position={[0, -0.5 * SHELF_HEIGHT, 0]}>
        <HandleIcon theme="bookshelf" model={bookshelfIcon} themesOverride={visThemes} />
        <mesh geometry={new RoundedBoxGeometry(1.02 * SHELF_WIDTH, 1.02 * SHELF_HEIGHT, SHELF_BOARD_THICKNESS, 10)} material={visMaterials['bookshelf:hovered']} position={[0, 0.52 * SHELF_HEIGHT, -0.45 * SHELF_DEPTH]} />
    </group>, []);

    const title = useMemo(() => {
        switch (type) {
            case 'spec': return 'Specs';
            case 'dataset': return 'Datasets';
            case 'piece': return 'Pieces';
            default: return 'Unknown';
        }
    }, [type]);

    return <Movable handle={handle}>
        <group position={[-0.5 * SHELF_WIDTH, (SHELF_BOARD_THICKNESS * 1.5) - (0.5 * SHELF_HEIGHT), 0]}>
            <Text position={[0.5 * SHELF_WIDTH, SHELF_HEIGHT + 0.1, 0]}
                autoUpdateMatrix={false}
                maxWidth={SHELF_WIDTH}
                textAlign="center"
                anchorX="center"
                anchorY="bottom"
                color="black"
                outlineWidth="5%"
                outlineColor="white"
                fontSize={0.03}>
                {tempTitle ? tempTitle : title}
            </Text>

            <ShelfTypeSelector shelfType='spec' position={[0.25 * SHELF_WIDTH, SHELF_HEIGHT + 0.05, 0]} />
            <ShelfTypeSelector shelfType='dataset' position={[0.5 * SHELF_WIDTH, SHELF_HEIGHT + 0.05, 0]} />
            <ShelfTypeSelector shelfType='piece' position={[0.75 * SHELF_WIDTH, SHELF_HEIGHT + 0.05, 0]} />

            <primitive object={boxRefs} />
            {dummies}
        </group>
    </Movable>;
}

export function Main() {
    const [conceptType] = useProperty('concept::name');
    return conceptType === 'VisShelf' ? <VisShelf /> : null;
}
