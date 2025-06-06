import React from 'react';
let { useState, useEffect, useRef, useMemo } = React;
import { MeshStandardMaterial, Vector3 } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { useThree } from '@react-three/fiber';
import { Sphere, Line, useGLTF } from '@react-three/drei';
import { Root, Container, Text as UIText } from "@react-three/uikit";
import { Varv, useProperty } from '#VarvReact';

import { Movable } from '#Spatialstrates .movable';
import { Text } from '#Spatialstrates .text';
import { deselectMovables } from '#Spatialstrates .movable-helpers';
import { getDeviceFromInputEvent } from '#Spatialstrates .device-helpers';
import { useGlobalEvents } from '#Spatialstrates .global-events';
import { getCurrentSpaceUUID } from '#Spatialstrates .space-helpers';
import { moveMovableToNewSpace } from '#Spatialstrates .container-helpers';
import { Icon } from '#Icon .default';

import { composeSpecFromGroup, isPieceOverwritten } from '#VisModule .vis-composer';
import { getVisComponentById } from '#VisModule .vis-component-manager';
import { VisButton, VisToggle, visThemes, visMaterials, useIsVisible, SpeechToVisGroup, TranscribeIcon, frameGeometry, frameMaterial, metalnessValue, roughnessValue, getPieceTheme, onDragEndGroupingCallback, onDraggingUpdateGroupingHighlight, onDragEndResetGroupingHighlight, onDraggingUpdateProximityAuthoring, useUpdateProximityAuthoringOnSpaceChange } from '#VisPiece .vis-helpers';
import { Visualization } from '#Visualization .default';



const CONCEPT_TYPE_PIECE = 'VisPiece';
const CONCEPT_TYPE_GROUP = 'VisGroup';

const DISTANCE_TO_BOX = 0.045;


/* Group View with helpers for the grid */

const SHELF_WIDTH = 0.4;
const SHELF_HEIGHT = 0.4;
const SHELF_BOARD_THICKNESS = 0.005;
const SHELF_DEPTH = 0.05;

function VisPieceDummyTitle({ setTitle, setOverwritten, groupUUID, updateOverwritten, setUpdateOverwritten }) {
    const [path] = useProperty('path');
    const [content] = useProperty('content');
    const [pieceUUID] = useProperty('concept::uuid');

    useEffect(() => {
        if (!groupUUID) return;
        if (!pieceUUID) return;
        const asyncFunc = async () => {
            const overwritten = await isPieceOverwritten(groupUUID, pieceUUID);
            setOverwritten(overwritten);
        };
        asyncFunc();
    }, [pieceUUID, groupUUID, updateOverwritten]);

    // useEffect(() => {
    //     setTitle(`${path}:${content}`);
    // }, [path, content]);

    useEffect(() => {
        let contentTitle = content || '';

        if (path === 'data.fragment') {
            const component = getVisComponentById(content);
            if (component) {
                contentTitle = component.name;
            }
        }

        setTitle(`${path}:${contentTitle}`);
    }, [path, content]);

    useEffect(() => {
        setUpdateOverwritten(updateOverwritten + 1);
    }, [path]);
}

function VisGroupDummyTitle({ setTitle, setOverwritten }) {
    const [name] = useProperty('name');

    useEffect(() => {
        setTitle(name || 'New Group');
    }, [name]);
}

const disableButtonMaterial = new MeshStandardMaterial({ color: 'hsl(200, 0%, 70%)', metalness: metalnessValue, roughness: roughnessValue });
const disableButtonMaterialHovered = new MeshStandardMaterial({ color: 'hsl(200, 0%, 80%)', metalness: metalnessValue, roughness: roughnessValue });



useGLTF.preload('components_snippets.glb');
useGLTF.preload('components_specs.glb');

function VisMovableDummy({ position, updateOverwritten, setUpdateOverwritten, groupSelected }) {
    const visPieceIcon = useGLTF('components_snippets.glb');
    const visGroupIcon = useGLTF('components_specs.glb');
    const [conceptUUID] = useProperty('concept::uuid');
    const [conceptType] = useProperty('concept::name');
    const [disabled, setDisabled] = useProperty('disabled');
    const [groupUUID, setGroup] = useProperty('group');

    const [overwritten, setOverwritten] = useState(false);
    const [title, setTitle] = useState('...');
    const meshRef = useRef();
    const iconModel = useMemo(() => conceptType == 'VisPiece' ? visPieceIcon : visGroupIcon, [conceptType]);
    const { triggerEvent } = useGlobalEvents();
    const { camera } = useThree();

    const selectStartHandler = async (device, e) => {
        if (e) e.stopPropagation();

        const visPieceConcept = VarvEngine.getConceptFromType('VisPiece');
        const visGroupConcept = VarvEngine.getConceptFromType('VisGroup');

        const groupPieces = await visGroupConcept.getPropertyValue(groupUUID, 'pieces');
        await visGroupConcept.setPropertyValue(groupUUID, 'pieces', groupPieces.filter(piece => piece !== conceptUUID));

        // TODO: Cleanup group or not?

        await visPieceConcept.setPropertyValue(conceptUUID, 'position', [meshRef.current.matrixWorld.elements[12], meshRef.current.matrixWorld.elements[13], meshRef.current.matrixWorld.elements[14]]);
        await visPieceConcept.setPropertyValue(conceptUUID, 'rotation', [camera.rotation.x, camera.rotation.y, camera.rotation.z]);

        setGroup('');
        await moveMovableToNewSpace(conceptUUID, await getCurrentSpaceUUID());

        setTimeout(() => {
            triggerEvent('initiate-drag', { target: conceptUUID, e: e });
        }, 100); // HACK: This is a bit brittle
    };

    useEffect(() => {
        setUpdateOverwritten(updateOverwritten + 1);
    }, [disabled]);

    const [hovered, setHovered] = useState(false);
    const hoverCallback = () => {
        setHovered(true);
    };
    const blurCallback = () => {
        setHovered(false);
    };

    const icon = useMemo(() => <Icon theme={getPieceTheme(title) + (hovered ? ':hovered' : '')} model={iconModel} themesOverride={visThemes} />, [conceptType, hovered, title]);

    return <>
        {conceptType == CONCEPT_TYPE_PIECE ? <VisPieceDummyTitle setTitle={setTitle} setOverwritten={setOverwritten} groupUUID={groupUUID} updateOverwritten={updateOverwritten} setUpdateOverwritten={setUpdateOverwritten} /> : null}
        {conceptType == CONCEPT_TYPE_GROUP ? <VisGroupDummyTitle setTitle={setTitle} setOverwritten={setOverwritten} /> : null}

        <group position={position}>
            <group onPointerOver={hoverCallback}
                onPointerOut={blurCallback}
                onPointerDown={(e) => {
                    const device = getDeviceFromInputEvent(e);
                    selectStartHandler(device, e);
                }}
                ref={meshRef} position={[-0.4 * SHELF_WIDTH, 0, 0]} scale={0.25}
                autoUpdateMatrix={false}>
                {icon}
            </group>

            <Text position={[-0.325 * SHELF_WIDTH, 0, 0]}
                autoUpdateMatrix={false}
                textAlign="left"
                anchorX="left"
                anchorY="middle"
                color={disabled ? 'red' : overwritten ? '#555' : 'white'}
                outlineWidth="5%"
                outlineColor="black"
                fontSize={0.0175}>
                {groupSelected ? (title.length > 27 ? title.slice(0, 27) + '...' : title) : (title.length > 32 ? title.slice(0, 32) + '...' : title)}
            </Text>

            {groupSelected ? <VisToggle value={disabled} invert={true} setValue={setDisabled} position={[0.39 * SHELF_WIDTH, 0, 0]} scale={0.48} materialPrimary={disableButtonMaterial} materialHovered={disableButtonMaterialHovered} outlineColor="red" /> : null}

            {/* {groupSelected ? <VisButton active={disabled} position={[0.4 * SHELF_WIDTH, 0, 0]} scale={0.4} callback={() => {
                setDisabled(!disabled);
            }} materialPrimary={disableButtonMaterial} materialHovered={disableButtonMaterialHovered} outlineColor="red" /> : null} */}
        </group>
    </>;
}

const MAX_PIECES = 8;
const PIECES_SPACE_USED = 0.275;
function VisGroupViewPieces({ position }) {
    const [pieces] = useProperty('pieces');
    const [proximityAuthoring] = useProperty('proximityAuthoring');
    const [proximityPieces] = useProperty('proximityPieces');
    const [name, setName] = useProperty('name');
    const [selected] = useProperty('selected');
    const [paginationStartIndex, setPaginationStartIndex] = useProperty('paginationStartIndex');

    const [updateOverwritten, setUpdateOverwritten] = useState(1);

    const showPagination = useMemo(() => pieces && pieces.length > MAX_PIECES, [pieces]);

    useEffect(() => {
        setUpdateOverwritten(updateOverwritten + 1);
    }, [pieces, proximityPieces, proximityAuthoring]);

    useEffect(() => {
        if (!pieces) return;
        if (paginationStartIndex >= pieces.length - 1) {
            setPaginationStartIndex(Math.max(0, pieces.length - MAX_PIECES));
        }
    }, [pieces]);

    const piecesToRender = useMemo(() => {
        if (!pieces) return [];
        const piecesCopy = [...pieces];
        if (piecesCopy.length <= MAX_PIECES) {
            return piecesCopy;
        } else {
            return piecesCopy.reverse().slice(paginationStartIndex, paginationStartIndex + MAX_PIECES).reverse();
        }
    }, [pieces, paginationStartIndex]);

    return <group position={position}>
        <Text position={[0.067, 0.5 * SHELF_HEIGHT - 0.015, 0]}
            autoUpdateMatrix={false}
            maxWidth={SHELF_WIDTH}
            textAlign="left"
            anchorX="left"
            anchorY="top"
            color="white"
            outlineWidth="5%"
            outlineColor="black"
            fontSize={0.025}>
            {name ? (name.length > 23 ? name.slice(0, 23) + '...' : name) : 'New Group'}
        </Text>
        {selected ? <TranscribeIcon position={[0.040, 0.5 * SHELF_HEIGHT - 0.03, 0]} scale={0.7} setValue={setName} /> : null}

        {piecesToRender?.map((piece, index) => {
            const length = Math.min(piecesToRender.length, MAX_PIECES);
            return <Varv target={piece} key={index}>
                <VisMovableDummy
                    position={[
                        0.5 * SHELF_WIDTH,
                        - (length * (PIECES_SPACE_USED / MAX_PIECES)) + 0.295 * SHELF_HEIGHT + (index + 1) * (PIECES_SPACE_USED / MAX_PIECES),
                        0
                    ]}
                    updateOverwritten={updateOverwritten}
                    setUpdateOverwritten={setUpdateOverwritten}
                    groupSelected={selected} />
            </Varv>;
        })}

        {showPagination ? <>
            <VisButton position={[0.05, -(SHELF_HEIGHT - 0.23), 0]} scale={0.7} callback={() => {
                setPaginationStartIndex(Math.max(0, paginationStartIndex - MAX_PIECES + 1));
            }} title="Previous" />
            <Text position={[0.5 * SHELF_WIDTH, -(SHELF_HEIGHT - 0.24), 0]}
                autoUpdateMatrix={false}
                textAlign="center"
                anchorX="center"
                anchorY="center"
                color="white"
                outlineWidth="5%"
                outlineColor="black"
                fontSize={0.0175}>
                {paginationStartIndex + 1}–{Math.min(pieces.length, paginationStartIndex + MAX_PIECES)} of {pieces.length}
            </Text>
            <VisButton position={[SHELF_WIDTH - 0.05, -(SHELF_HEIGHT - 0.23), 0]} scale={0.7} callback={() => {
                setPaginationStartIndex(Math.min(pieces.length - MAX_PIECES, paginationStartIndex + MAX_PIECES - 1));
            }} title="Next" />
        </> : null}
    </group>;
}



/* Spec and Visualization Views */

function SpecComposerPieceUpdater({ updateSpec }) {
    const [path] = useProperty('path');
    const [content] = useProperty('content');
    const [disabled] = useProperty('disabled');
    const [position] = useProperty('position');

    useEffect(() => {
        updateSpec();
    }, [path, content, disabled, position]);
}

function SpecComposerGroupUpdater({ updateSpec }) {
    // const [proximityAuthoring] = useProperty('proximityAuthoring');
    // const [proximityPieces] = useProperty('proximityPieces');

    // useEffect(() => {
    //     if (proximityAuthoring) {
    //         updateSpec();
    //     }
    // }, [proximityPieces]);

    const [position] = useProperty('position');

    useEffect(() => {
        updateSpec();
    }, [position]);

    return <>
        <Varv property="pieces">
            <SpecComposerUpdater updateSpec={updateSpec} />
        </Varv>
        {/* {proximityAuthoring ? <Varv property="proximityPieces">
            <SpecComposerUpdater updateSpec={updateSpec} />
        </Varv> : null} */}
    </>;
}

// Update the spec when a piece or group is updated
function SpecComposerUpdater({ updateSpec }) {
    const [conceptUUID] = useProperty('concept::uuid');
    const [conceptType] = useProperty('concept::name');
    const [disabled] = useProperty('disabled');

    useEffect(() => {
        updateSpec();
    }, [disabled]);

    const pieceUpdater = useMemo(() => conceptType == CONCEPT_TYPE_PIECE ? <SpecComposerPieceUpdater updateSpec={updateSpec} /> : null, [conceptType]);
    const groupUpdater = useMemo(() => conceptType == CONCEPT_TYPE_GROUP ? <SpecComposerGroupUpdater updateSpec={updateSpec} /> : null, [conceptType]);

    const updater = useMemo(() => conceptUUID ? <Varv target={conceptUUID}>
        {pieceUpdater}
        {groupUpdater}
    </Varv> : null, [conceptUUID]);

    return updater;
}

// Utility function to compose a spec from a group
export function SpecComposer({ setComposedSpec }) {
    const [conceptUUID] = useProperty('concept::uuid');
    const [proximityAuthoring] = useProperty('proximityAuthoring');
    const [proximityPieces] = useProperty('proximityPieces');

    const throttleTimeout = useRef();
    const updateSpec = () => {
        if (throttleTimeout.current) {
            clearTimeout(throttleTimeout.current);
        }
        const timeout = setTimeout(async () => {
            try {
                const spec = await composeSpecFromGroup(conceptUUID, proximityAuthoring);
                setComposedSpec(spec);
            } catch (e) {
                console.error('Error composing spec:', e);
            }
        }, 100);
        throttleTimeout.current = timeout;
    };

    useEffect(() => {
        updateSpec();
    }, [proximityAuthoring, proximityPieces]);

    return <>
        <Varv property="pieces">
            <SpecComposerUpdater updateSpec={updateSpec} />
        </Varv>
        <Varv property="proximityPieces">
            <SpecComposerUpdater updateSpec={updateSpec} />
        </Varv>
    </>;
}

function VisGroupViewSpec({ position }) {
    const [composedSpec, setComposedSpec] = useState({});
    const composer = useMemo(() => <SpecComposer setComposedSpec={setComposedSpec} />, []);
    const cardRef = useRef();

    return <>
        {composer}
        <mesh geometry={frameGeometry}
            material={frameMaterial}
            scale={[0.25, 0.25, 1]}
            position={[position[0] - 0.125, position[1] - 0.125, -0.0026]}
            autoUpdateMatrix={false}>
        </mesh>
        <group position={[position[0], position[1], 0]} autoUpdateMatrix={false}>
            <Root anchorX="right" anchorY="top" flexDirection="column" pixelSize={0.0005} padding={15}>
                <Container borderRadius={16} gap={16} width={470} height={470} overflow="scroll" flexDirection="column" ref={cardRef}>
                    <UIText fontFamily="inter" textAlign="left" color="white" fontSize={16}>{composedSpec ? JSON.stringify(composedSpec, null, 3).replace(/^/gm, '|  ') : ''}</UIText>
                </Container>
            </Root>
        </group>
    </>;
}

function VisGroupViewVisualization({ position }) {
    const [composedSpec, setComposedSpec] = useState({});
    const composer = useMemo(() => <SpecComposer setComposedSpec={setComposedSpec} />, []);
    const [finalSpec, setFinalSpec] = useState({});

    const updateFragmentData = () => {
        const spec = structuredClone(composedSpec);

        const component = getVisComponentById(composedSpec.data.fragment);
        if (component) {
            delete spec.data.fragment;
            spec.data.values = component.getContentAsJSON();
        } else {
            spec.data.error = 'Could not find component for fragment: ' + composedSpec.data.fragment;
        }

        setFinalSpec(spec);
    };

    useEffect(() => {
        if (composedSpec?.data?.fragment) {
            const component = getVisComponentById(composedSpec.data.fragment);
            component?.addContentChangedListener(updateFragmentData);

            updateFragmentData();

            return () => {
                component?.removeContentChangedListener(updateFragmentData);
            };
        } else {
            setFinalSpec(composedSpec);
        }
    }, [composedSpec]);

    return <>
        {composer}
        <group position={position} autoUpdateMatrix={false}>
            <Visualization mergedSpec={finalSpec} />
        </group>
    </>;
}



/* Proximity Authoring */

const PROXIMITY_PIECE = 0.1;
const PROXIMITY_GROUP = 0.28;
const PROXIMITY_LOCKED_GROUP = 0.2;
function VisGroupConnector({ sourcePosition, sourceLocked }) {
    const color = useMemo(() => visThemes['piece']?.line || 'black', []);
    const [group] = useProperty('group');
    const [targetPosition] = useProperty('position');
    const [conceptType] = useProperty('concept::name');
    const [locked] = useProperty('locked');

    const targetPositionCorrected = useMemo(() => {
        if (!targetPosition) return;
        if (!sourcePosition) return;
        const targetPositionVector = new Vector3(...targetPosition);
        targetPositionVector.add(new Vector3(...sourcePosition).sub(targetPositionVector).normalize().multiplyScalar(conceptType == 'VisPiece' ? PROXIMITY_PIECE : locked ? PROXIMITY_LOCKED_GROUP : PROXIMITY_GROUP));
        return targetPositionVector;
    }, [targetPosition, locked, sourcePosition]);

    const sourcePositionCorrected = useMemo(() => {
        if (!targetPosition) return;
        if (!sourcePosition) return;
        const sourcePositionVector = new Vector3(...sourcePosition);
        sourcePositionVector.add(new Vector3(...targetPosition).sub(sourcePositionVector).normalize().multiplyScalar(sourceLocked ? PROXIMITY_LOCKED_GROUP : PROXIMITY_GROUP));
        return sourcePositionVector;
    }, [sourcePosition, sourceLocked, targetPosition]);

    return !group && sourcePositionCorrected && targetPositionCorrected ? <Line
        points={[...sourcePositionCorrected.toArray(), ...targetPositionCorrected.toArray()]}
        color={color}
        lineWidth={2}
    /> : null;
}

function VisGroupConnectors() {
    const [sourcePosition] = useProperty('position');
    const [locked] = useProperty('locked');

    return <Varv property="proximityPieces">
        <VisGroupConnector sourcePosition={sourcePosition} sourceLocked={locked} />
    </Varv>;
}



/* VisGroup Component */

function HandleIcon({ model, theme = '', themesOverride = '' }) {
    const [selected] = useProperty('selected');
    const [hovered] = useProperty('hovered');
    return <Icon theme={theme + (selected ? ':selected' : '') + (hovered ? ':hovered' : '')} model={model} themesOverride={themesOverride} />
}

useGLTF.preload('bookshelf.glb');

function VisGroup() {
    const bookshelfIcon = useGLTF('bookshelf.glb');
    const lockedGroupIcon = useGLTF('components_specs.glb');
    const visible = useIsVisible();
    const [pieces] = useProperty('pieces');

    const [showVisualization, setShowVisualization] = useProperty('showVisualization');
    const [showSpec, setShowSpec] = useProperty('showSpec');

    const [proximityAuthoring, setProximityAuthoring] = useProperty('proximityAuthoring');
    const [locked, setLocked] = useProperty('locked');

    const [selected, setSelected] = useProperty('selected');
    const [dropHighlight] = useProperty('dropHighlight');
    const [name] = useProperty('name');
    const [conceptUUID] = useProperty('concept::uuid');

    const handlePieces = useMemo(() => !locked ? <>
        <group scale={[2 * SHELF_WIDTH, 2 * SHELF_HEIGHT, 0.2]}
            position={[0, -0.5 * SHELF_HEIGHT - SHELF_BOARD_THICKNESS, 0]}
            autoUpdateMatrix={false}>
            <HandleIcon theme="piece" model={bookshelfIcon} themesOverride={visThemes} />
        </group>
        <mesh geometry={new RoundedBoxGeometry(1.02 * SHELF_WIDTH, 1.02 * SHELF_HEIGHT, SHELF_BOARD_THICKNESS, 10)} material={frameMaterial} position={[0, 0, -0.7 * SHELF_DEPTH * 0.2]} />
    </> : <group scale={3}>
        <HandleIcon theme="piece" model={lockedGroupIcon} themesOverride={visThemes} scale={2} autoUpdateMatrix={false} />
    </group>, [locked]);

    // Clean up pieces when the group is deleted
    useEffect(() => {
        const callback = (context) => {
            setTimeout(async () => {
                if (context.target === conceptUUID) {
                    for (let piece of pieces) {
                        await VarvEngine.getConceptFromUUID(piece).delete(piece);
                    }
                }
            }, 100);
        };

        const registeredCallback = VarvEngine.registerEventCallback('disappeared', callback);
        return () => { registeredCallback.delete(); };
    }, [conceptUUID, pieces]);

    useUpdateProximityAuthoringOnSpaceChange();

    return visible ? <>
        {proximityAuthoring ? <VisGroupConnectors positionAdjustment={locked ? [0, 0, 0] : [0.5 * SHELF_WIDTH + DISTANCE_TO_BOX, 0, 0]} /> : null}

        <Movable handle={handlePieces}
            onDragEnd={async () => {
                await onDragEndResetGroupingHighlight();
                await onDraggingUpdateProximityAuthoring(conceptUUID);
                await onDragEndGroupingCallback(conceptUUID);
            }}
            onDragging={async () => {
                await onDraggingUpdateGroupingHighlight(conceptUUID);
                await onDraggingUpdateProximityAuthoring(conceptUUID);
            }}>
            {!locked ? <VisGroupViewPieces position={[-0.5 * SHELF_WIDTH, 0, 0]} /> : null}

            {locked ? <Text position={[0, 0.5 * SHELF_HEIGHT + 1.5 * DISTANCE_TO_BOX, 0]}
                autoUpdateMatrix={false}
                textAlign="center"
                anchorX="center"
                anchorY="center"
                color="black"
                outlineWidth="5%"
                outlineColor="white"
                fontSize={0.04}>
                {name ? name : 'New Group'}
            </Text> : null}

            {(selected || showVisualization) && !locked ? <VisButton active={showVisualization} position={[0, 0.5 * SHELF_HEIGHT + DISTANCE_TO_BOX, 0]} callback={async () => {
                setShowVisualization(!showVisualization);
                await deselectMovables();
                setSelected(true);
            }} title="Visualization" /> : null}
            {showVisualization ? <>
                <VisGroupViewVisualization position={[-((0.5 * 0.25) + 0.375), 0.5 * SHELF_HEIGHT + 0.09, 0]} />
            </> : null}

            {(selected || showSpec) && !locked ? <VisButton active={showSpec} position={[-(0.5 * SHELF_WIDTH + DISTANCE_TO_BOX), 0, 0]} rotation={[0, 0, -Math.PI / 2]} callback={async () => {
                setShowSpec(!showSpec);
                await deselectMovables();
                setSelected(true);
            }} title="Spec" /> : null}
            {showSpec ? <VisGroupViewSpec position={[- (0.5 * SHELF_WIDTH + (1.9 * DISTANCE_TO_BOX)), 0.5 * 0.25, 0]} /> : null}

            {(selected || proximityAuthoring) && !locked ? <VisButton active={proximityAuthoring} position={[0.5 * SHELF_WIDTH + DISTANCE_TO_BOX, 0, 0]} rotation={[0, 0, Math.PI / 2]} callback={async () => {
                setProximityAuthoring(!proximityAuthoring);
                await onDraggingUpdateProximityAuthoring(conceptUUID);
                await deselectMovables();
                setSelected(true);
            }} title="Proximity Authoring" /> : null}

            {selected || locked ? <VisButton active={locked} position={[0 * SHELF_WIDTH, -0.5 * SHELF_HEIGHT - DISTANCE_TO_BOX, 0]} callback={async () => {
                setLocked(!locked);
                await deselectMovables();
                setSelected(true);
            }} title="Lock Group" /> : null}

            {selected && !proximityAuthoring && !locked ? <SpeechToVisGroup position={[-0.4 * SHELF_WIDTH, -0.5 * SHELF_HEIGHT - DISTANCE_TO_BOX, 0]} /> : null}

            {dropHighlight ? <Sphere position={[0, 0, 0]} args={[0.05, 16, 16]} material={visMaterials['selectedPrimary']} autoUpdateMatrix={false} /> : null}
        </Movable>
    </> : null;
}

export function Main() {
    const [conceptType] = useProperty('concept::name');
    return conceptType === 'VisGroup' ? <VisGroup /> : null;
}
