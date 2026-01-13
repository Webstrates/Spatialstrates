import React from 'react';
const { useState, useEffect, useRef, useMemo, useCallback } = React;
import { ErrorBoundary } from 'react-error-boundary';
import { Color, Object3D, Matrix4, MeshStandardMaterial, InstancedMesh } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { useGLTF } from '@react-three/drei';
import { Varv, useProperty } from '#VarvReact';

import { useGlobalEvents } from '#Spatialstrates .global-events';
import { createMovable } from '#Spatialstrates .movable-helpers';
import { Movable } from '#Spatialstrates .movable';
import { Text } from '#Spatialstrates .text';
import { Icon, SELECTED_COLOR_PRIMARY, SELECTED_COLOR_SECONDARY, HOVERED_SELECTED_COLOR_PRIMARY, HOVERED_SELECTED_COLOR_SECONDARY } from '#Icon .default';
import { ModelRenderer } from '#Model .model-renderer';



const modelShelfThemes = {
    'modelshelf': { primary: 'hsl(30, 50%, 50%)', secondary: 'hsl(30, 50%, 75%)' },
    'modelshelf:hovered': { primary: 'hsl(30, 50%, 70%)', secondary: 'hsl(30, 50%, 85%)' },
    'modelshelf:selected': { primary: SELECTED_COLOR_PRIMARY, secondary: SELECTED_COLOR_SECONDARY },
    'modelshelf:selected:hovered': { primary: HOVERED_SELECTED_COLOR_PRIMARY, secondary: HOVERED_SELECTED_COLOR_SECONDARY },
    'model': { primary: 'hsl(30, 60%, 55%)', secondary: 'hsl(30, 60%, 75%)' },
    'model:hovered': { primary: 'hsl(30, 60%, 75%)', secondary: 'hsl(30, 60%, 85%)' },
};

const metalnessValue = 0.5;
const roughnessValue = 0.5;
const modelShelfMaterials = {
    'modelshelf': new MeshStandardMaterial({ color: modelShelfThemes['modelshelf'].primary, metalness: metalnessValue, roughness: roughnessValue }),
    'modelshelf:hovered': new MeshStandardMaterial({ color: modelShelfThemes['modelshelf:hovered'].primary, metalness: metalnessValue, roughness: roughnessValue }),
    'model': new MeshStandardMaterial({ color: modelShelfThemes['model'].primary, metalness: metalnessValue, roughness: roughnessValue }),
    'model:hovered': new MeshStandardMaterial({ color: modelShelfThemes['model:hovered'].primary, metalness: metalnessValue, roughness: roughnessValue }),
};

const defaultShelfMaterial = new MeshStandardMaterial({ metalness: 0.7, roughness: 0.3 });
const defaultShelfBoxGeometry = new RoundedBoxGeometry(1, 1, 1, 10);
const defaultShelfColor = modelShelfThemes['modelshelf'].primary;

const SHELF_WIDTH = 0.5;
const SHELF_HEIGHT = 0.5;
const SHELF_BOARD_THICKNESS = 0.01;
const SHELF_DEPTH = 0.1;



const generateModelDummies = (columns, rows, models, setTempTitle) => {
    const dummies = [];

    for (let i = 0; i < models.length; i++) {
        const model = models[i];
        const x = i % columns;
        const y = Math.floor(i / columns);
        const scale = Math.min(1.2 / columns, 0.8);
        dummies.push(<ModelDummy
            modelUrl={model}
            key={i}
            position={[(x + 0.5) * SHELF_WIDTH / columns, ((rows - y - 0.5) * SHELF_HEIGHT / rows) - 0.05 * scale, 0]}
            scale={[scale, scale, scale]}
            setTempTitle={setTempTitle}
        />);
    }

    return dummies;
};

useGLTF.preload('bookshelf.glb');

function ModelDummy({ modelUrl, position, scale, setTempTitle }) {
    const meshRef = useRef();
    const { triggerEvent } = useGlobalEvents();

    // Cache models after first load to avoid flicker when in use for the first time
    const [cached, setCached] = useState(false);

    // Extract display name from the URL (filename with extension)
    const displayName = useMemo(() => {
        if (!modelUrl) return 'Unknown';
        const parts = modelUrl.split('/');
        const filename = parts[parts.length - 1];
        return filename;
    }, [modelUrl]);

    const selectStartHandler = useCallback(async (e) => {
        if (e) e.stopPropagation();
        const position = [meshRef.current.matrixWorld.elements[12], meshRef.current.matrixWorld.elements[13], meshRef.current.matrixWorld.elements[14]];

        const newMovable = await createMovable('Model', {
            url: modelUrl,
            position: position
        });

        setTimeout(() => {
            triggerEvent('initiate-drag', { target: newMovable, e: e });
        }, 100);
    }, [triggerEvent, modelUrl]);

    const [hovered, setHovered] = useState(false);
    const hoverCallback = () => {
        setTempTitle(displayName);
        setHovered(true);
    };
    const blurCallback = () => {
        setTempTitle('');
        setHovered(false);
    };

    // Calculate model preview size based on shelf cell scale
    const modelPreviewSize = useMemo(() => {
        const baseSize = 0.2 * scale[0];
        return [baseSize, baseSize, baseSize];
    }, [scale]);

    const model = useMemo(() => {
        return <ModelRenderer url={modelUrl} size={modelPreviewSize} />;
    }, [modelUrl, modelPreviewSize]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setCached(true);
        }, 1000);
        return () => clearTimeout(timer);
    }, [modelUrl]);

    return <group position={position} scale={scale} autoUpdateMatrix={false}>
        <group ref={meshRef}
            onPointerOver={hoverCallback}
            onPointerOut={blurCallback}
            onPointerDown={selectStartHandler}>
            {hovered || !cached ? model : <mesh geometry={new RoundedBoxGeometry(modelPreviewSize[0], modelPreviewSize[1], modelPreviewSize[2], 4, modelPreviewSize[0] * 0.1)}>
                <meshStandardMaterial color={'hsl(30, 30%, 70%)'} />
            </mesh>}
            <mesh visible={false}>
                <boxGeometry args={modelPreviewSize} />
                <meshStandardMaterial transparent={true} opacity={0} />
            </mesh>
        </group>
        <Text position={[0, 0.1, 0]} autoUpdateMatrix={false}
            textAlign="center"
            anchorX="center"
            anchorY="middle"
            color="white"
            fontSize={0.03}>
            {displayName.length > 15 ? displayName.slice(0, 15) + '...' : displayName}
        </Text>
    </group>;
}

function HandleIcon({ model, theme = '', themesOverride = '' }) {
    const [selected] = useProperty('selected');
    const [hovered] = useProperty('hovered');
    return <Icon theme={theme + (selected ? ':selected' : '') + (hovered ? ':hovered' : '')} model={model} themesOverride={themesOverride} />
}

function ModelForwarder({ setModels }) {
    const [models] = useProperty('models');

    useEffect(() => {
        setModels(models || []);
    }, [models]);
}

const matrixProvider = new Object3D();

function ModelShelf() {
    const bookshelfIcon = useGLTF('bookshelf.glb');
    const [dummies, setDummies] = useState([]);
    const [tempTitle, setTempTitle] = useState('');
    const [models, setModels] = useState([]);

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

    useEffect(() => {
        const modelList = models || [];
        const rows = Math.max(Math.ceil(Math.sqrt(modelList.length)), 2);
        const columns = Math.max(Math.ceil(modelList.length / rows), 2);
        updateShelves(columns, rows);
        setDummies(generateModelDummies(columns, rows, modelList, setTempTitle));
    }, [models]);

    const handle = useMemo(() => <group position={[0, -0.5 * SHELF_HEIGHT, 0]}>
        <HandleIcon theme="modelshelf" model={bookshelfIcon} themesOverride={modelShelfThemes} />
        <mesh geometry={new RoundedBoxGeometry(1.02 * SHELF_WIDTH, 1.02 * SHELF_HEIGHT, SHELF_BOARD_THICKNESS, 10)} material={modelShelfMaterials['modelshelf:hovered']} position={[0, 0.52 * SHELF_HEIGHT, -0.45 * SHELF_DEPTH]} />
    </group>, []);

    const title = 'Models';

    return <>
        <Movable handle={handle}>
            <group position={[-0.5 * SHELF_WIDTH, (SHELF_BOARD_THICKNESS * 1.5) - (0.5 * SHELF_HEIGHT), 0]}>
                <Text position={[0.5 * SHELF_WIDTH, SHELF_HEIGHT + 0.04, 0]}
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

                <primitive object={boxRefs} />
                {dummies}
            </group>
        </Movable>
        <Varv concept="ModelManager">
            <ModelForwarder setModels={setModels} />
        </Varv>
    </>;
}

export function Main() {
    const [conceptType] = useProperty('concept::name');
    return conceptType === 'ModelShelf' ? <ErrorBoundary fallback={null}>
        <ModelShelf />
    </ErrorBoundary> : null;
}
