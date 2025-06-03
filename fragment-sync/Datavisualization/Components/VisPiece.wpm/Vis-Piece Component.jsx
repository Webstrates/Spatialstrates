import React from 'react';
let { useState, useEffect, useMemo, useCallback } = React;
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Sphere, useGLTF } from '@react-three/drei';
import { Root, Container, Text as UIText } from "@react-three/uikit";
import { useProperty } from '#VarvReact';

import { Text } from '#Spatialstrates .text';
import { Movable, useTransform } from '#Spatialstrates .movable';
import { deselectMovables, createMovable } from '#Spatialstrates .movable-helpers';
import { Icon } from '#Icon .default';

import { getOptionsForPath } from '#VisModule .vis-helpers';
import { getVisComponentById } from '#VisModule .vis-component-manager';
import { EnumEditor, NumberEditor, BooleanEditor, ColorEditor, FieldEditor, DatasetEditor, AxisEditor } from '#VisPiece .vis-editors-scene';
import { VisButton, visThemes, visMaterials, useIsVisible, SpeechToVisPiece, TranscribeIcon, frameGeometry, frameMaterial, getPieceTheme, onDragEndGroupingCallback, onDraggingUpdateGroupingHighlight, onDragEndResetGroupingHighlight, onDraggingUpdateProximityAuthoring, useUpdateProximityAuthoringOnSpaceChange } from '#VisPiece .vis-helpers';



const VIS_PIECE_WIDTH = 0.125;
const VIS_PIECE_HEIGHT = 0.125;
const DISTANCE_TO_BOX = 0.04;

/* Hooks and Components */

function VisPieceEditor({ position }) {
    const [path] = useProperty('path');
    const [editor, setEditor] = useState();

    useEffect(() => {
        if (!path) {
            setEditor(null);
            return;
        }

        const asyncCallback = async () => {
            const newOptions = await getOptionsForPath(path);
            switch (newOptions?.type) {
                case 'enum':
                    setEditor(<EnumEditor options={newOptions} />);
                    break;
                case 'number':
                    setEditor(<NumberEditor options={newOptions} />);
                    break;
                case 'boolean':
                    setEditor(<BooleanEditor options={newOptions} />);
                    break;
                case 'color':
                    setEditor(<ColorEditor options={newOptions} />);
                    break;
                case 'field':
                    setEditor(<FieldEditor options={newOptions} />);
                    break;
                case 'dataset':
                    setEditor(<DatasetEditor options={newOptions} />);
                    break;
                default:
                    setEditor(null);
            }
        };
        asyncCallback();
    }, [path]);

    return <group position={position}>
        {editor}
    </group>;
}



function DatasetDisplay({ position }) {
    const [path] = useProperty('path');
    const [content] = useProperty('content');
    const [text, setText] = useState('');

    const updatePreview = useCallback((dataset) => {
        // setText(JSON.stringify(dataset.slice(0, 5), null, 2).replace(/^( +)/gm, match => match.replace(/ /g, '_')));
        setText(JSON.stringify(dataset.slice(0, 5), null, 3).replace(/^/gm, '|  '));
    }, [setText]);

    useEffect(() => {
        if (!path || !content || !path.startsWith('data')) {
            setText('');
            return;
        }

        if (path === 'data.fragment') {
            const component = getVisComponentById(content);
            if (component) {
                const dataset = component.getContentAsJSON();
                if (Array.isArray(dataset)) {
                    updatePreview(dataset);
                } else {
                    setText('');
                }
            } else {
                setText('');
            }
        } else if (path === 'data.url') {
            setText('Loading...');
            fetch(content)
                .then(response => response.json())
                .then(dataset => {
                    updatePreview(dataset);
                })
                .catch(() => {
                    setText('Error loading dataset from URL: ' + content);
                });
        } else if (path === 'data.values') {
            updatePreview(JSON.parse(content));
        }
    }, [path, content]);

    return <>
        <mesh geometry={frameGeometry}
            material={frameMaterial}
            scale={[0.25, 0.25, 1]}
            position={[position[0], position[1] + 0.125, -0.0026]}
            autoUpdateMatrix={false}>
        </mesh>
        <group position={[position[0], position[1], 0]} autoUpdateMatrix={false}>
            <Root anchorX="center" anchorY="bottom" flexDirection="column" pixelSize={0.0005} padding={15}>
                <Container borderRadius={16} gap={16} width={470} height={470} overflow="scroll" flexDirection="column">
                    <UIText textAlign="left" fontSize={16} color="white" whiteSpace="pre">{text}</UIText>
                </Container>
            </Root>
        </group>
    </>;
}



/* VisPiece Component */

function HandleIcon({ model, theme = '', themesOverride = '' }) {
    const [selected] = useProperty('selected');
    const [hovered] = useProperty('hovered');
    return <Icon theme={theme + (selected ? ':selected' : '') + (hovered ? ':hovered' : '')} model={model} themesOverride={themesOverride} />
}

useGLTF.preload('components_snippets.glb');
useGLTF.preload('bookshelf.glb');

function VisPiece() {
    const snippetIcon = useGLTF('components_snippets.glb');
    const groupIcon = useGLTF('bookshelf.glb');
    const visible = useIsVisible();
    const [path] = useProperty('path');
    const [content] = useProperty('content');
    const [editMode, setEditMode] = useProperty('editMode');
    const [dropHighlight] = useProperty('dropHighlight');
    const [selected, setSelected] = useProperty('selected');
    const [locked, setLocked] = useProperty('locked');
    const [showDataset, setShowDataset] = useProperty('showDataset');
    const [hideEditor, setHideEditor] = useState();
    const [conceptUUID] = useProperty('concept::uuid');
    const [group, setGroup] = useProperty('group');
    const transform = useTransform();

    useEffect(() => {
        if (!path) {
            setHideEditor(true);
            return;
        }

        const asyncCallback = async () => {
            const newOptions = await getOptionsForPath(path);
            if (!newOptions) {
                setHideEditor(true);
            } else {
                setHideEditor(false);
            }
        };
        asyncCallback();
    }, [path]);

    const title = useMemo(() => {
        let contentTitle = content || '';

        if (path === 'data.fragment') {
            const component = getVisComponentById(content);
            if (component) {
                contentTitle = component.name;
            }
        }

        if (!selected) {
            contentTitle = contentTitle.length > 15 ? contentTitle.slice(0, 15) + '...' : contentTitle;
        } else {
            contentTitle = contentTitle.length > 50 ? contentTitle.slice(0, 50) + '...' : contentTitle;
        }

        return `${path}:
${contentTitle}`;
    }, [path, content, selected]);

    const [editModeAxis, setEditModeAxis] = useProperty('editModeAxis');
    const [axisEditable, setAxisEditable] = useState(false);

    useEffect(() => {
        if (!path) return;
        setAxisEditable(path.startsWith('encoding.'));
    }, [path]);

    const handle = useMemo(() => <HandleIcon
        theme={getPieceTheme(path)}
        model={snippetIcon}
        themesOverride={visThemes}
    />, [path]);

    useUpdateProximityAuthoringOnSpaceChange();

    return visible ? <Movable handle={handle}
        onDragEnd={async () => {
            await onDragEndResetGroupingHighlight();
            await onDraggingUpdateProximityAuthoring(conceptUUID);
            await onDragEndGroupingCallback(conceptUUID);
        }} onDragging={async () => {
            await onDraggingUpdateGroupingHighlight(conceptUUID);
            await onDraggingUpdateProximityAuthoring(conceptUUID);
        }}>
        <Text position={[0, 0.025, 0.01]}
            autoUpdateMatrix={false}
            maxWidth={0.1}
            textAlign="center"
            anchorX="center"
            anchorY="center"
            color="white"
            outlineWidth="5%"
            outlineColor="black"
            lineHeight={2}
            fontSize={0.0125}>
            {title}
        </Text>

        {path?.startsWith('data') && (selected || showDataset) ? <VisButton
            position={[0, 0.5 * VIS_PIECE_HEIGHT + DISTANCE_TO_BOX, 0]}
            callback={async () => {
                setShowDataset(!showDataset);
                await deselectMovables();
                setSelected(true);
            }}
            active={showDataset} title="Show Dataset" /> : null}
        {path?.startsWith('data') && showDataset ? <DatasetDisplay position={[0, 0.5 * VIS_PIECE_HEIGHT + (2 * DISTANCE_TO_BOX), 0]} /> : null}

        {(selected || editMode) && !hideEditor ? <VisButton
            position={[0.5 * VIS_PIECE_WIDTH + DISTANCE_TO_BOX, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            callback={async () => {
                setEditMode(!editMode);
                await deselectMovables();
                setSelected(true);
            }}
            active={editMode} title="Edit Value" /> : null}
        {editMode ? <VisPieceEditor position={[0.5 * VIS_PIECE_WIDTH + (2 * DISTANCE_TO_BOX) + 0.04, 0, 0]} /> : null}

        {(selected || editModeAxis) && axisEditable ? <VisButton
            position={[-0.5 * VIS_PIECE_WIDTH - DISTANCE_TO_BOX, 0, 0]}
            rotation={[0, 0, -Math.PI / 2]}
            callback={async () => {
                setEditModeAxis(!editModeAxis);
                await deselectMovables();
                setSelected(true);
            }}
            active={editModeAxis} title="Edit Axis" /> : null}
        {editModeAxis ? <group position={[-0.5 * VIS_PIECE_WIDTH - (2 * DISTANCE_TO_BOX) - 0.04, 0, 0]} autoUpdateMatrix={false}>
            <AxisEditor />
        </group> : null}

        {selected ? <VisButton position={[0, -0.5 * VIS_PIECE_HEIGHT - DISTANCE_TO_BOX, 0]} callback={async () => {
            setLocked(!locked);
            await deselectMovables();
            setSelected(true);
        }} active={locked} title="No Grouping" /> : null}

        {selected ? <SpeechToVisPiece position={[-0.5 * VIS_PIECE_WIDTH, -0.5 * VIS_PIECE_HEIGHT - DISTANCE_TO_BOX, 0]} /> : null}

        {selected ? <group onClick={async () => {
            const visGroupUUID = await createMovable('VisGroup', {
                pieces: [conceptUUID],
                position: transform.position,
                rotation: transform.rotation
            });

            setGroup(visGroupUUID);
        }}>
            <Icon theme={'piece'} model={groupIcon} themesOverride={visThemes} scale={[0.07, 0.07, 0.035]}
                position={[0.5 * VIS_PIECE_WIDTH + 0.01, -0.5 * VIS_PIECE_HEIGHT - DISTANCE_TO_BOX - 0.02, 0]} />
            <mesh geometry={new RoundedBoxGeometry(1.02 * 0.035, 1.02 * 0.035, 0.001, 10)} material={frameMaterial} position={[0.5 * VIS_PIECE_WIDTH + 0.01, -0.5 * VIS_PIECE_HEIGHT - DISTANCE_TO_BOX - 0.0017, -0.001]} />
        </group> : null}

        {dropHighlight ? <Sphere position={[0, 0, 0]} args={[0.05, 16, 16]} material={visMaterials['selectedPrimary']} autoUpdateMatrix={false} /> : null}
    </Movable> : null;
}

export function Main() {
    const [conceptType] = useProperty('concept::name');
    return conceptType === 'VisPiece' ? <VisPiece /> : null;
}
