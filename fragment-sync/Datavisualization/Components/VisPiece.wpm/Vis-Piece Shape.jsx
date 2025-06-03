import React from 'react';
const { useState, useEffect, useRef, useMemo, useCallback } = React;
import { HTMLContainer, stopEventPropagation } from 'tldraw';
import { useProperty } from '#VarvReact';

import { useGlobalEvents } from '#Spatialstrates .global-events';
import { MovableShapeUtil, MovableVarvScope } from '#Spatialstrates .movable-shape';
import { CANVAS_SCALE } from '#Spatialstrates .projection-helpers';
import { deselectMovables } from '#Spatialstrates .movable-helpers';

import { getOptionsForPath } from '#VisModule .vis-helpers';
import { getVisComponentById } from '#VisModule .vis-component-manager';
import { EnumEditor, NumberEditor, BooleanEditor, ColorEditor, FieldEditor, DatasetEditor, AxisEditor } from '#VisPiece .vis-editors-canvas';
import { visThemes, useIsVisible, SpeechToVisPiece2D, getPieceTheme, onDragEndGroupingCallback, onDragEndResetGroupingHighlight, onDraggingUpdateProximityAuthoring, useUpdateProximityAuthoringOnSpaceChange } from '#VisPiece .vis-helpers';




function DatasetDisplay() {
    const [path] = useProperty('path');
    const [content] = useProperty('content');
    const [text, setText] = useState('');

    const updatePreview = useCallback((dataset) => {
        setText(JSON.stringify(dataset.slice(0, 5), null, 3));
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

    return <div className="dataset-display" onPointerDown={stopEventPropagation} onScroll={stopEventPropagation} style={{
        width: `${CANVAS_SCALE * 0.25}px`,
        height: `${CANVAS_SCALE * 0.25}px`
    }}>{text}</div>;
}

function ValueEditor() {
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

    return editor;
}



function VisPieceShape({ shape, isEditing }) {
    const [conceptUUID] = useProperty('concept::uuid');
    const [path, setPath] = useProperty('path');
    const [content, setContent] = useProperty('content');
    const [locked, setLocked] = useProperty('locked');
    const [showDataset, setShowDataset] = useProperty('showDataset');
    const [selected, setSelected] = useProperty('selected');
    // TODO Add drop highlight
    const [dropHighlight] = useProperty('dropHighlight');

    const visible = useIsVisible();
    const theme = useMemo(() => getPieceTheme(path), [path]);

    const [editMode, setEditMode] = useProperty('editMode');
    const [hideEditor, setHideEditor] = useState();
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

    const [editModeAxis, setEditModeAxis] = useProperty('editModeAxis');
    const [axisEditable, setAxisEditable] = useState(false);
    useEffect(() => {
        if (!path) return;
        setAxisEditable(path.startsWith('encoding.'));
    }, [path]);

    const { subscribeEvent } = useGlobalEvents();

    useEffect(() => {
        const unsubscribe = subscribeEvent('drag-end', async (data) => {
            if (data.target != conceptUUID) return;

            await onDragEndResetGroupingHighlight();
            await onDraggingUpdateProximityAuthoring(conceptUUID);
            await onDragEndGroupingCallback(conceptUUID);
        });

        return () => unsubscribe();
    }, [subscribeEvent, conceptUUID]);

    useUpdateProximityAuthoringOnSpaceChange();

    // TODO: Add onDragging
    // }} onDragging={async () => {
    //     await onDraggingUpdateGroupingHighlight(conceptUUID);
    //     await onDraggingUpdateProximityAuthoring(conceptUUID);
    // }}

    const pathRef = useRef(null);
    const contentRef = useRef(null);
    const pathCursorRef = useRef(0);
    const contentCursorRef = useRef(0);

    useEffect(() => {
        if (pathRef.current) {
            pathRef.current.selectionStart = pathCursorRef.current;
            pathRef.current.selectionEnd = pathCursorRef.current;
        }
    }, [path]);

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.selectionStart = contentCursorRef.current;
            contentRef.current.selectionEnd = contentCursorRef.current;
        }
    }, [content]);

    return visible ? <HTMLContainer className={`vis-piece-shape theme-${theme || 'non'}`} style={{
        transform: 'translate(-50%, -50%)',
        width: shape.props.w + 'px',
        height: shape.props.h + 'px',
        backgroundColor: visThemes[theme].primary,
        borderColor: visThemes[theme].secondary,
        pointerEvents: 'all'
    }}>
        {isEditing ? <>
            <textarea
                ref={pathRef}
                className="path" value={path}
                onChange={(e) => {
                    pathCursorRef.current = e.target.selectionStart;
                    setPath(e.target.value);
                }}
                onPointerDown={stopEventPropagation}
                onPointerMove={stopEventPropagation}
            />
            <textarea
                ref={contentRef}
                className="content" value={content}
                onChange={(e) => {
                    contentCursorRef.current = e.target.selectionStart;
                    setContent(e.target.value);
                }}
                onPointerDown={stopEventPropagation}
                onPointerMove={stopEventPropagation}
            />
        </> : <>
            <div className="path" title={path}>{path}</div>
            <div className="content" title={content}>{content}</div>
        </>}


        {path?.startsWith('data') && (selected || showDataset) ? <div className={`dataset-button button ${showDataset ? 'active' : ''}`}
            onPointerDown={async (e) => {
                stopEventPropagation(e);
                setShowDataset(!showDataset);
                await deselectMovables();
                setSelected(true);
            }}>Show Dataset</div> : null}
        {path?.startsWith('data') && showDataset ? <DatasetDisplay /> : null}

        {selected ? <div className={`lock-button button ${locked ? 'active' : ''}`} onPointerDown={async (e) => {
            stopEventPropagation(e);
            setLocked(!locked);
            await deselectMovables();
            setSelected(true);
        }}>No Grouping</div> : null}

        {(selected || editModeAxis) && axisEditable ? <div className={`edit-axis-button button ${editModeAxis ? 'active' : ''}`}
            onPointerDown={async (e) => {
                stopEventPropagation(e);
                setEditModeAxis(!editModeAxis);
                await deselectMovables();
                setSelected(true);
            }}>Edit Axis</div> : null}
        {editModeAxis ? <AxisEditor /> : null}

        {(selected || editMode) && !hideEditor ? <div className={`edit-value-button button ${editMode ? 'active' : ''}`}
            onPointerDown={async (e) => {
                stopEventPropagation(e);
                setEditMode(!editMode);
                await deselectMovables();
                setSelected(true);
            }}>Edit Value</div> : null}
        {editMode ? <ValueEditor /> : null}

        {selected ? <SpeechToVisPiece2D /> : null}
    </HTMLContainer> : null;
}

class VisPieceShapeUtil extends MovableShapeUtil {
    static type = 'VisPiece';

    getDefaultProps() {
        return Object.assign(super.getDefaultProps(), {
            w: CANVAS_SCALE * 0.125,
            h: CANVAS_SCALE * 0.125
        });
    }

    canEdit = () => true;

    component(shape) {
        const isEditing = this.editor.getEditingShapeId() === shape.id;

        return <MovableVarvScope shape={shape}>
            <VisPieceShape shape={shape} isEditing={isEditing} />
        </MovableVarvScope>;
    }
}

export const Main = VisPieceShapeUtil;
