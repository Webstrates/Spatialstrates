import React from 'react';
const { useState, useMemo, useEffect, useCallback } = React;
import { MeshStandardMaterial, Vector3, Matrix4, Box3, Euler } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Text as UIText, Root, Container as UIContainer } from '@react-three/uikit';
import { Defaults, Card, Button, List, ListItem, Input } from '@react-three/uikit-apfel';
import { Varv, useProperty } from '#VarvReact';

import { useGlobalEvents } from '#Spatialstrates .global-events';
import { Text } from '#Spatialstrates .text';
import { BoundingBox, BoundaryResizer } from '#Spatialstrates .scene-helpers';
import { ProjectionPlanePreview } from '#Spatialstrates .projection-plane-preview';
import { ClippedMovablesFilter, moveMovableToNewSpace } from '#Spatialstrates .container-helpers';
import { Movable, useTransform } from '#Spatialstrates .movable';
import { transcribeAudio } from '#AIHelpers .default';



const frameGeometry = new RoundedBoxGeometry(1, 0.005, 1, 1);

const frameColoredMap = new Map();
frameColoredMap.set('default', new MeshStandardMaterial({ color: '#888', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.66 }));
frameColoredMap.set('red', new MeshStandardMaterial({ color: '#ff6666', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.66 }));
frameColoredMap.set('green', new MeshStandardMaterial({ color: '#66ff66', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.66 }));
frameColoredMap.set('blue', new MeshStandardMaterial({ color: '#6666ff', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.66 }));
frameColoredMap.set('yellow', new MeshStandardMaterial({ color: '#ffff66', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.66 }));
frameColoredMap.set('purple', new MeshStandardMaterial({ color: '#ff66ff', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.66 }));
frameColoredMap.set('orange', new MeshStandardMaterial({ color: '#ff9966', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.66 }));
frameColoredMap.set('pink', new MeshStandardMaterial({ color: '#ff66cc', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.66 }));

const frameColoredHoveredMap = new Map();
frameColoredHoveredMap.set('default', new MeshStandardMaterial({ color: '#aaa', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.66 }));
frameColoredHoveredMap.set('red', new MeshStandardMaterial({ color: '#ff8888', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.66 }));
frameColoredHoveredMap.set('green', new MeshStandardMaterial({ color: '#88ff88', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.66 }));
frameColoredHoveredMap.set('blue', new MeshStandardMaterial({ color: '#8888ff', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.66 }));
frameColoredHoveredMap.set('yellow', new MeshStandardMaterial({ color: '#ffff88', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.66 }));
frameColoredHoveredMap.set('purple', new MeshStandardMaterial({ color: '#ff88ff', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.66 }));
frameColoredHoveredMap.set('orange', new MeshStandardMaterial({ color: '#ffaa88', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.66 }));
frameColoredHoveredMap.set('pink', new MeshStandardMaterial({ color: '#ff88cc', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.66 }));

const frameColoredSelectedMap = new Map();
frameColoredSelectedMap.set('default', new MeshStandardMaterial({ color: '#666', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.8 }));
frameColoredSelectedMap.set('red', new MeshStandardMaterial({ color: '#ff4444', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.8 }));
frameColoredSelectedMap.set('green', new MeshStandardMaterial({ color: '#44ff44', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.8 }));
frameColoredSelectedMap.set('blue', new MeshStandardMaterial({ color: '#4444ff', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.8 }));
frameColoredSelectedMap.set('yellow', new MeshStandardMaterial({ color: '#ffff44', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.8 }));
frameColoredSelectedMap.set('purple', new MeshStandardMaterial({ color: '#ff44ff', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.8 }));
frameColoredSelectedMap.set('orange', new MeshStandardMaterial({ color: '#ff8844', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.8 }));
frameColoredSelectedMap.set('pink', new MeshStandardMaterial({ color: '#ff44cc', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.8 }));

const frameColoredHoveredSelectedMap = new Map();
frameColoredHoveredSelectedMap.set('default', new MeshStandardMaterial({ color: '#888', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.8 }));
frameColoredHoveredSelectedMap.set('red', new MeshStandardMaterial({ color: '#ff6666', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.8 }));
frameColoredHoveredSelectedMap.set('green', new MeshStandardMaterial({ color: '#66ff66', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.8 }));
frameColoredHoveredSelectedMap.set('blue', new MeshStandardMaterial({ color: '#6666ff', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.8 }));
frameColoredHoveredSelectedMap.set('yellow', new MeshStandardMaterial({ color: '#ffff66', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.8 }));
frameColoredHoveredSelectedMap.set('purple', new MeshStandardMaterial({ color: '#ff66ff', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.8 }));
frameColoredHoveredSelectedMap.set('orange', new MeshStandardMaterial({ color: '#ff9966', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.8 }));
frameColoredHoveredSelectedMap.set('pink', new MeshStandardMaterial({ color: '#ff66cc', metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.8 }));

const dummyFrameMaterial = new MeshStandardMaterial({ color: '#444', metalness: 0.2, roughness: 0.5 });
const dummyFrameMaterialHovered = new MeshStandardMaterial({ color: '#666', metalness: 0.2, roughness: 0.5 });
const dummyFrameMaterialSelected = new MeshStandardMaterial({ color: '#222', metalness: 0.2, roughness: 0.5 });
const dummyFrameMaterialHoveredSelected = new MeshStandardMaterial({ color: '#444', metalness: 0.2, roughness: 0.5 });


function SpaceOption({ currentSpace }) {
    const [containedSpace, setContainedSpace] = useProperty('containedSpace');
    const [uuid] = useProperty('concept::uuid');
    const [name] = useProperty('name');

    return currentSpace != uuid ? <ListItem selected={containedSpace === uuid} onClick={() => setContainedSpace(uuid)}>
        <UIText>{name || 'No Name'}</UIText>
    </ListItem> : null;
}

function SpaceRenamer() {
    const [name, setName] = useProperty('name');
    const [listening, setListening] = useState(false);

    async function updateName() {
        if (listening) return;

        setListening(true);
        const newName = await transcribeAudio(5000, false, () => { setListening(false); });
        if (newName) setName(newName);
    }

    return <UIContainer flexDirection="row" gap={8}>
        <UIText>Rename</UIText>
        <Button platter onClick={updateName}>
            <UIText textAlign="center">{listening ? 'Speak Now' : 'Record New Name'}</UIText>
        </Button>
        <Input value={name || ''} onValueChange={setName} placeholder="Space Name" />
    </UIContainer>;
}

function SpaceColorChanger() {
    const [color, setColor] = useProperty('color');

    return <UIContainer flexDirection="row" gap={8}>
        <UIText>Color</UIText>
        <List type="plain" flexDirection="row" gap={8}>
            <ListItem selected={color === ''} onClick={() => setColor('')}>
                <UIText>Default</UIText>
            </ListItem>
            <ListItem selected={color === 'red'} onClick={() => setColor('red')}>
                <UIText>Red</UIText>
            </ListItem>
            <ListItem selected={color === 'green'} onClick={() => setColor('green')}>
                <UIText>Green</UIText>
            </ListItem>
            <ListItem selected={color === 'blue'} onClick={() => setColor('blue')}>
                <UIText>Blue</UIText>
            </ListItem>
            <ListItem selected={color === 'yellow'} onClick={() => setColor('yellow')}>
                <UIText>Yellow</UIText>
            </ListItem>
            <ListItem selected={color === 'purple'} onClick={() => setColor('purple')}>
                <UIText>Purple</UIText>
            </ListItem>
            <ListItem selected={color === 'orange'} onClick={() => setColor('orange')}>
                <UIText>Orange</UIText>
            </ListItem>
            <ListItem selected={color === 'pink'} onClick={() => setColor('pink')}>
                <UIText>Pink</UIText>
            </ListItem>
        </List>
    </UIContainer>;
}

// FIXME: This is not nice, make it a condition in the other menu
function ContainerMenuBasic() {
    const [space] = useProperty('space');
    const [containedSpace, setContainedSpace] = useProperty('containedSpace');

    const createNewSpace = useCallback(async () => {
        const newSpaceUUID = await VarvEngine.getConceptFromType('Space').create(null, {
            name: 'New Space'
        });
        setTimeout(() => {
            setContainedSpace(newSpaceUUID);
        }, 100);
    }, [setContainedSpace]);

    return <group position={[0, -0.5 * 0.5, 0.5 * 0.5]} rotation={[-Math.PI * 0.1, 0, 0]}>
        <Defaults>
            <Root anchorX="center" anchorY="top" flexDirection="column" pixelSize={0.0005} padding={15}>
                <Card borderRadius={24} padding={24} gap={16} flexDirection="column">
                    <Button platter onPointerDown={() => createNewSpace()}>
                        <UIText>Create New Space</UIText>
                    </Button>
                    <List type="plain" flexDirection="row" gap={8}>
                        <Varv concept="Space">
                            <SpaceOption currentSpace={space} />
                        </Varv>
                    </List>
                </Card>
            </Root>
        </Defaults>
    </group>;
}

function ContainerMenu() {
    const [boundarySize] = useProperty('boundarySize');
    const [space] = useProperty('space');
    const [containedSpace, setContainedSpace] = useProperty('containedSpace');
    const [clippingMode, setClippingMode] = useProperty('clippingMode');
    const [collaborationLevel, setCollaborationLevel] = useProperty('collaborationLevel');

    const createNewSpace = useCallback(async () => {
        const newSpaceUUID = await VarvEngine.getConceptFromType('Space').create(null, {
            name: 'New Space'
        });
        setContainedSpace(newSpaceUUID);
    }, [setContainedSpace]);

    const enterSpace = useCallback(async () => {
        if (!containedSpace) return;
        const spaceManagerIds = await VarvEngine.getAllUUIDsFromType('SpaceManager');
        if (spaceManagerIds.length === 0) return;
        await VarvEngine.getConceptFromType('SpaceManager').setPropertyValue(spaceManagerIds[0], 'locationHash', containedSpace);
    }, [containedSpace]);

    return Array.isArray(boundarySize) ? <group position={[0, -0.5 * boundarySize[1], 0.5 * boundarySize[2]]} rotation={[-Math.PI * 0.1, 0, 0]}>
        <Defaults>
            <Root anchorX="center" anchorY="top" flexDirection="column" pixelSize={0.0005} padding={15}>
                <Card borderRadius={24} padding={24} gap={16} flexDirection="column">
                    <Button platter onPointerDown={() => createNewSpace()}>
                        <UIText>Create New Space</UIText>
                    </Button>
                    <UIContainer flexDirection="row" gap={8}>
                        <UIText>Space</UIText>
                        <List type="plain" flexDirection="row" gap={8}>
                            <ListItem selected={containedSpace === ''} onClick={() => setContainedSpace('')}>
                                <UIText>None</UIText>
                            </ListItem>
                            <Varv concept="Space">
                                <SpaceOption currentSpace={space} />
                            </Varv>
                        </List>
                    </UIContainer>
                    <Varv property="containedSpace">
                        <SpaceRenamer />
                        <SpaceColorChanger />
                        <Button platter onClick={enterSpace}>
                            <UIText>Enter Space</UIText>
                        </Button>
                    </Varv>
                    <UIContainer flexDirection="row" gap={8}>
                        <UIText>Clipping Mode</UIText>
                        <List type="plain" flexDirection="row" gap={8}>
                            <ListItem selected={clippingMode === 'hide'} onClick={() => setClippingMode('hide')}>
                                <UIText>Hide Outside</UIText>
                            </ListItem>
                            <ListItem selected={clippingMode === 'show'} onClick={() => setClippingMode('show')}>
                                <UIText>Show All</UIText>
                            </ListItem>
                        </List>
                    </UIContainer>
                    <UIContainer flexDirection="row" gap={8}>
                        <UIText>Collaboration</UIText>
                        <List type="plain" flexDirection="row" gap={8}>
                            <ListItem selected={collaborationLevel === 'close'} onClick={() => setCollaborationLevel('close')}>
                                <UIText>On</UIText>
                            </ListItem>
                            {/* <ListItem selected={collaborationLevel === 'loose'} onClick={() => setCollaborationLevel('loose')}>
                                <UIText>Loose Collaboration</UIText>
                            </ListItem> */}
                            <ListItem selected={collaborationLevel === 'none'} onClick={() => setCollaborationLevel('none')}>
                                <UIText>Off</UIText>
                            </ListItem>
                        </List>
                    </UIContainer>
                </Card>
            </Root>
        </Defaults>
    </group> : null;
}

function ContainerSizeAndNameForwarder({ setSizeContainer, setNameContainer, setColorContainer }) {
    const [boundarySize] = useProperty('boundarySize');
    const [name] = useProperty('name');
    const [color] = useProperty('color');

    useEffect(() => {
        if (!Array.isArray(boundarySize)) return;
        setSizeContainer(boundarySize);
    }, [boundarySize]);
    useEffect(() => {
        if (typeof name != 'string') return;
        setNameContainer(name);
    }, [name]);
    useEffect(() => {
        if (typeof color != 'string') return;
        setColorContainer(color);
    }, [color]);
}

function ContainerDummy() {
    const [conceptType] = useProperty('concept::name');
    const [selected] = useProperty('selected');
    const [hovered] = useProperty('hovered');

    const [size, setSize] = useState([0.5, 0.5, 0.5]);
    const [name, setName] = useState('Unnamed');
    const [color, setColor] = useState('');

    const handle = useMemo(() => Array.isArray(size) ? <mesh
        geometry={frameGeometry}
        material={selected ? (hovered ? dummyFrameMaterialHoveredSelected : dummyFrameMaterialSelected) : (hovered ? dummyFrameMaterialHovered : dummyFrameMaterial)}
        scale={[size[0], 1, size[2]]}
        position={[0, -0.5 * size[1], 0]}
        autoUpdateMatrix={false}
    /> : null, [hovered, selected, size]);

    return conceptType === 'Container' ? <>
        <Movable handle={handle} upright={true}>
            <BoundingBox scale={size} dummy={true} />
            <Text
                fontSize={0.07}
                position={[0, -0.49 * size[1], 0]}
                rotation={[-Math.PI * 0.5, 0, 0]}
                color="#222">
                {name}
            </Text>
            <Varv property="containedSpace">
                <ContainerSizeAndNameForwarder setSizeContainer={setSize} setNameContainer={setName} setColorContainer={setColor} />
            </Varv>
        </Movable>
    </> : null;
}

function ContainedSpace({ containerUUID, outerSpaceUUID, containerTransform, movableSceneComponents }) {
    const [innerSpaceUUID] = useProperty('concept::uuid');
    const [boundarySize] = useProperty('boundarySize');
    const [boundaryOrigin] = useProperty('boundaryOrigin');
    const [clippingMode] = useProperty('clippingMode');

    // Create a bounding box
    const boundingBox = useMemo(() => {
        if (!Array.isArray(boundarySize)) return null;

        // Create a box centered at origin with the correct size
        const halfSize = new Vector3(boundarySize[0] / 2, boundarySize[1] / 2, boundarySize[2] / 2);
        return new Box3(
            new Vector3(-halfSize.x, -halfSize.y, -halfSize.z),
            new Vector3(halfSize.x, halfSize.y, halfSize.z)
        );
    }, [boundarySize]);

    // React to drag-end events
    const onDragEnd = useCallback(async (data) => {
        if (data.target === containerUUID) {
            // console.log('Container dragged');
            return;
        }

        const boundaryOriginPosition = Array.isArray(boundaryOrigin) ? boundaryOrigin.slice(0, 3) : [0, 0, 0];

        const elementUUID = data.target;
        const elementConcept = await VarvEngine.getConceptFromUUID(elementUUID);
        const elementPosition = await elementConcept.getPropertyValue(elementUUID, 'position');
        const elementRotation = await elementConcept.getPropertyValue(elementUUID, 'rotation');
        const elementPositionVector = new Vector3(...elementPosition);
        const elementParentSpace = elementConcept.getPropertyValue(elementUUID, 'space');
        const wasPointInside = elementParentSpace === innerSpaceUUID;

        // Create volume's transformation matrices
        const containerEuler = new Euler(...containerTransform.rotation);
        const containerRotationMatrix = new Matrix4().makeRotationFromEuler(containerEuler);
        const inverseRotationMatrix = containerRotationMatrix.clone().invert();

        // Point to test in world space
        let worldPosition;
        if (wasPointInside) {
            // Convert from volume's local space to world space
            worldPosition = elementPositionVector.clone()
                .sub(new Vector3(...boundaryOriginPosition))
                .applyMatrix4(containerRotationMatrix)
                .add(new Vector3(...containerTransform.position));
        } else {
            worldPosition = elementPositionVector.clone();
        }

        // Convert world position to volume's local space for testing
        const localPosition = worldPosition.clone()
            .sub(new Vector3(...containerTransform.position))
            .applyMatrix4(inverseRotationMatrix);

        const isPointInside = boundingBox.containsPoint(localPosition);

        if ((isPointInside && wasPointInside) || (!isPointInside && !wasPointInside)) {
            // Position relative to current parent hasn't changed
        } else if (!isPointInside && wasPointInside) {
            console.log('Movable within container has moved outside');
            const newWorldPosition = elementPositionVector.clone()
                .sub(new Vector3(...boundaryOriginPosition))
                .applyMatrix4(containerRotationMatrix)
                .add(new Vector3(...containerTransform.position));

            // Convert local rotation to world rotation
            const movableEuler = new Euler(...elementRotation);
            const movableRotationMatrix = new Matrix4().makeRotationFromEuler(movableEuler);
            const newWorldRotationMatrix = containerRotationMatrix.clone().multiply(movableRotationMatrix);
            const newWorldRotation = new Euler().setFromRotationMatrix(newWorldRotationMatrix);

            elementConcept.setPropertyValue(elementUUID, 'position', [
                newWorldPosition.x,
                newWorldPosition.y,
                newWorldPosition.z
            ]);
            elementConcept.setPropertyValue(elementUUID, 'rotation', [
                newWorldRotation.x,
                newWorldRotation.y,
                newWorldRotation.z
            ]);

            moveMovableToNewSpace(elementUUID, outerSpaceUUID);
        } else if (isPointInside && !wasPointInside) {
            console.log('Movable outside container has moved inside');
            const newLocalPosition = worldPosition.clone()
                .sub(new Vector3(...containerTransform.position))
                .applyMatrix4(inverseRotationMatrix);

            // Convert world rotation to local rotation
            const movableEuler = new Euler(...elementRotation);
            const movableRotationMatrix = new Matrix4().makeRotationFromEuler(movableEuler);
            const newLocalRotationMatrix = inverseRotationMatrix.clone().multiply(movableRotationMatrix);
            const newLocalRotation = new Euler().setFromRotationMatrix(newLocalRotationMatrix);

            elementConcept.setPropertyValue(elementUUID, 'position', [
                newLocalPosition.x + boundaryOriginPosition[0],
                newLocalPosition.y + boundaryOriginPosition[1],
                newLocalPosition.z + boundaryOriginPosition[2]
            ]);
            elementConcept.setPropertyValue(elementUUID, 'rotation', [
                newLocalRotation.x,
                newLocalRotation.y,
                newLocalRotation.z
            ]);

            moveMovableToNewSpace(elementUUID, innerSpaceUUID);
        }
    }, [boundingBox, containerTransform, boundarySize, innerSpaceUUID, boundaryOrigin]);

    const { subscribeEvent } = useGlobalEvents();
    useEffect(() => {
        const unsubscribe = subscribeEvent('drag-end', onDragEnd);
        return () => unsubscribe();
    }, [subscribeEvent, onDragEnd]);

    return <>
        {/* FIXME: Fix this, caused by the <SpaceMovables> component that clears the Varv scope */}
        <Varv concept="SpaceManager">
            <ProjectionPlanePreview positionOverride={[0, 0, 0]} scaleOverride={0.5} />
        </Varv>
        <group position={Array.isArray(boundaryOrigin) ? [-boundaryOrigin[0], -boundaryOrigin[1], -boundaryOrigin[2]] : [0, 0, 0]}>
            <Varv property="movables">
                <ClippedMovablesFilter clippingMode={clippingMode}>
                    {movableSceneComponents.map((Component, index) => (
                        <Component key={index} />
                    ))}
                    <ContainerDummy />
                </ClippedMovablesFilter>
            </Varv>
        </group>
    </>;
}

function ContainerFiltered({ movableSceneComponents }) {
    const [containerUUID] = useProperty('concept::uuid');
    const [selected] = useProperty('selected');
    const [hovered] = useProperty('hovered');
    const [space] = useProperty('space');
    const transform = useTransform();
    const [containedSpace] = useProperty('containedSpace');

    const [size, setSize] = useState([0.5, 0.5, 0.5]);
    const [name, setName] = useState('');
    const [color, setColor] = useState('');

    const handle = useMemo(() => Array.isArray(size) ? <mesh
        geometry={frameGeometry}
        material={selected ? (hovered ? frameColoredHoveredSelectedMap.get(color || 'default') : frameColoredSelectedMap.get(color || 'default')) : (hovered ? frameColoredHoveredMap.get(color || 'default') : frameColoredMap.get(color || 'default'))}
        scale={[size[0], 1, size[2]]}
        position={[0, -0.5 * size[1], 0]}
        autoUpdateMatrix={false}
    /> : null, [hovered, selected, size, color]);

    const containerMenuBasicMemo = useMemo(() => !containedSpace && selected ? <ContainerMenuBasic /> : null, [containedSpace, selected]);

    const containerMenuMemo = useMemo(() => selected ? <Varv property="containedSpace">
        <ContainerMenu />
    </Varv> : null, [selected]);

    const containerMemo = useMemo(() => <Varv property="containedSpace">
        <ContainerSizeAndNameForwarder setSizeContainer={setSize} setNameContainer={setName} setColorContainer={setColor} />
        <ContainedSpace containerUUID={containerUUID} outerSpaceUUID={space} containerTransform={transform} movableSceneComponents={movableSceneComponents} />
    </Varv>, [containerUUID, space, transform, movableSceneComponents]);

    return <Movable handle={handle} upright={true}>
        {Array.isArray(size) ? <>
            <BoundingBox scale={size} />
            <Text text={name}
                fontSize={0.07}
                position={[0, -0.49 * size[1], 0]}
                rotation={[-Math.PI * 0.5, 0, 0]}
                color="#444" />
        </> : null}
        {selected ? <Varv property="containedSpace">
            <BoundaryResizer />
        </Varv> : null}
        {containerMenuBasicMemo}
        {containerMenuMemo}
        {containerMemo}
    </Movable>;
}

export function Container({ movableSceneComponents }) {
    const [conceptType] = useProperty('concept::name');
    return conceptType === 'Container' ? <ContainerFiltered movableSceneComponents={movableSceneComponents} /> : null;
}
