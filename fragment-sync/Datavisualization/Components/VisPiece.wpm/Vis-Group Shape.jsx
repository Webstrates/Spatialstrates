import React from 'react';
const { useState, useEffect, useRef, useMemo } = React;
import { useEditor, HTMLContainer, stopEventPropagation } from 'tldraw';
import { Varv, useProperty } from '#VarvReact';

import { useGlobalEvents } from '#Spatialstrates .global-events';
import { getCurrentSpaceUUID, CANVAS_SCALE } from '#Spatialstrates .projection-helpers';
import { MovableShapeUtil, MovableVarvScope } from '#Spatialstrates .movable-shape';
import { deselectMovables } from '#Spatialstrates .movable-helpers';
import { moveMovableToNewSpace } from '#Spatialstrates .container-helpers';

import { isPieceOverwritten } from '#VisModule .vis-composer';
import { getVisComponentById } from '#VisModule .vis-component-manager';
import { visThemes, useIsVisible, SpeechToVisGroup2D, getPieceTheme, onDragEndGroupingCallback, onDragEndResetGroupingHighlight, onDraggingUpdateProximityAuthoring, useUpdateProximityAuthoringOnSpaceChange } from '#VisPiece .vis-helpers';
import { SpecComposer } from '#VisPiece .vis-group';
import { VegaLite2DVisualizationCanvas } from '#Visualization .vega-lite-2d-canvas';




const CONCEPT_TYPE_PIECE = 'VisPiece';
const CONCEPT_TYPE_GROUP = 'VisGroup';

function VisGroupConnector({ sourceConceptUUID }) {
    const [pieceConceptUUID] = useProperty('concept::uuid');
    const editor = useEditor();

    useEffect(() => {
        if (!editor) return;
        if (!sourceConceptUUID) return;
        if (!pieceConceptUUID) return;

        const sourceShapeId = `shape:${sourceConceptUUID}`;
        const targetShapeId = `shape:${pieceConceptUUID}`;
        const newShapeId = `shape:${sourceConceptUUID}:${pieceConceptUUID}`;
        const sourceBindingId = `binding:source:${sourceConceptUUID}:${pieceConceptUUID}`;
        const targetBindingId = `binding:target:${sourceConceptUUID}:${pieceConceptUUID}`;

        if (!editor.getShape(sourceShapeId)) return;
        if (!editor.getShape(targetShapeId)) return;

        editor.createShape({
            type: 'arrow',
            id: newShapeId,
            isLocked: true,
            props: {
                color: 'yellow',
                arrowheadStart: 'none',
                arrowheadEnd: 'none'
            }
        });
        editor.createBinding({
            type: 'arrow',
            id: sourceBindingId,
            fromId: newShapeId,
            toId: sourceShapeId,
            props: {
                terminal: 'start'
            }
        });
        editor.createBinding({
            type: 'arrow',
            id: targetBindingId,
            fromId: newShapeId,
            toId: targetShapeId,
            props: {
                terminal: 'end'
            }
        });

        return () => {
            editor.deleteBinding(targetBindingId);
            editor.deleteBinding(sourceBindingId);
            editor.updateShape({
                id: newShapeId,
                isLocked: false
            });
            editor.deleteShape(newShapeId);
        }
    }, [editor, sourceConceptUUID, pieceConceptUUID]);
}

function VisualizationDisplay() {
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
        <div className="visualization-display" style={{
            width: `${CANVAS_SCALE * 0.5}px`,
            height: `${CANVAS_SCALE * 0.5}px`
        }}>
            <VegaLite2DVisualizationCanvas mergedSpec={finalSpec} />
        </div>
    </>;
}

function SpecDisplay() {
    const [composedSpec, setComposedSpec] = useState({});
    const composer = useMemo(() => <SpecComposer setComposedSpec={setComposedSpec} />, []);

    return <>
        {composer}
        <div className="spec-display" style={{
            width: `${CANVAS_SCALE * 0.25}px`,
            height: `${CANVAS_SCALE * 0.25}px`
        }}>
            {composedSpec ? JSON.stringify(composedSpec, null, 3) : ''}
        </div>
    </>;
}

function VisPieceDummyTitle({ setTheme, setTitle, setOverwritten, groupUUID, updateOverwritten, setUpdateOverwritten }) {
    const [path] = useProperty('path');
    const [content] = useProperty('content');
    const [pieceUUID] = useProperty('concept::uuid');
    const theme = useMemo(() => getPieceTheme(path), [path]);

    useEffect(() => {
        setTheme(theme);
    }, [theme]);

    useEffect(() => {
        if (!groupUUID) return;
        if (!pieceUUID) return;
        const asyncFunc = async () => {
            const overwritten = await isPieceOverwritten(groupUUID, pieceUUID);
            setOverwritten(overwritten);
        };
        asyncFunc();
    }, [pieceUUID, groupUUID, updateOverwritten]);

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

function VisMovableDummy({ groupPosition, updateOverwritten, setUpdateOverwritten, groupSelected }) {
    const [conceptUUID] = useProperty('concept::uuid');
    const [conceptType] = useProperty('concept::name');
    const [disabled, setDisabled] = useProperty('disabled');
    const [groupUUID, setGroup] = useProperty('group');
    const [position, setPosition] = useProperty('position');
    const [theme, setTheme] = useState('bookshelf');

    const [overwritten, setOverwritten] = useState(false);
    const [title, setTitle] = useState('...');

    const selectStartHandler = async (e) => {
        stopEventPropagation(e);

        const visGroupConcept = VarvEngine.getConceptFromType('VisGroup');

        const groupPieces = await visGroupConcept.getPropertyValue(groupUUID, 'pieces');
        await visGroupConcept.setPropertyValue(groupUUID, 'pieces', groupPieces.filter(piece => piece !== conceptUUID));

        if (groupPosition) setPosition(groupPosition);
        setGroup('');
        await moveMovableToNewSpace(conceptUUID, await getCurrentSpaceUUID());
    };

    useEffect(() => {
        setUpdateOverwritten(updateOverwritten + 1);
    }, [disabled]);

    return <div className={`vis-piece-dummy ${overwritten ? 'overwritten' : ''} ${disabled ? 'disabled' : ''}`}>
        {conceptType == CONCEPT_TYPE_PIECE ? <VisPieceDummyTitle setTheme={setTheme} setTitle={setTitle} setOverwritten={setOverwritten} groupUUID={groupUUID} updateOverwritten={updateOverwritten} setUpdateOverwritten={setUpdateOverwritten} /> : null}
        {conceptType == CONCEPT_TYPE_GROUP ? <VisGroupDummyTitle setTitle={setTitle} setOverwritten={setOverwritten} /> : null}

        <div className={`vis-piece-dummy-icon theme-${theme || 'non'}`}
            onPointerDown={selectStartHandler}
            style={{
                backgroundColor: visThemes[theme].primary,
                borderColor: visThemes[theme].secondary,
            }} />

        <div className="vis-piece-dummy-title">
            {title}
        </div>

        {groupSelected ? <div className="dummy-disable-toggle"
            onPointerDown={(e) => {
                e.stopPropagation();
                setDisabled(!disabled);
            }}
        /> : null}
    </div >;
}

const MAX_PIECES = 8;
function VisGroupViewPieces({ isEditing }) {
    const [pieces] = useProperty('pieces');
    const [proximityAuthoring] = useProperty('proximityAuthoring');
    const [proximityPieces] = useProperty('proximityPieces');
    const [name, setName] = useProperty('name');
    const [selected] = useProperty('selected');
    const [paginationStartIndex, setPaginationStartIndex] = useProperty('paginationStartIndex');
    const [position] = useProperty('position');

    const inputRef = useRef(null);
    const cursorRef = useRef(0);
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.selectionStart = cursorRef.current;
            inputRef.current.selectionEnd = cursorRef.current;
        }
    }, [name]);

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

    return <>
        <div className="group-title">
            <div className="group-title-icon" />
            {isEditing ? <input ref={inputRef} type="text" value={name}
                onChange={(e) => {
                    cursorRef.current = e.target.selectionStart;
                    setName(e.target.value);
                }}
                onPointerDown={stopEventPropagation}
                onPointerMove={stopEventPropagation}
            /> : <div className="group-name">
                {name || 'New Group'}
            </div>}
        </div>

        <div className="pieces-list">
            {piecesToRender?.map((piece, index) => {
                return <Varv target={piece} key={index}>
                    <VisMovableDummy
                        groupPosition={position}
                        updateOverwritten={updateOverwritten}
                        setUpdateOverwritten={setUpdateOverwritten}
                        groupSelected={selected} />
                </Varv>;
            })}
        </div>

        {showPagination ? <div className="group-pagination">
            <div className="button" onPointerDown={(e) => {
                stopEventPropagation(e);
                setPaginationStartIndex(Math.max(0, paginationStartIndex - MAX_PIECES + 1));
            }}>Previous</div>
            <div className="pagination-text">
                {paginationStartIndex + 1}–{Math.min(pieces.length, paginationStartIndex + MAX_PIECES)} of {pieces.length}
            </div>
            <div className="button" onPointerDown={(e) => {
                stopEventPropagation(e);
                setPaginationStartIndex(Math.min(pieces.length - MAX_PIECES, paginationStartIndex + MAX_PIECES - 1));
            }}>Next</div>
        </div> : null}
    </>;
}



function VisGroupShape({ shape, isEditing }) {
    const [conceptUUID] = useProperty('concept::uuid');
    const visible = useIsVisible();
    const [pieces] = useProperty('pieces');
    const [locked, setLocked] = useProperty('locked');
    const [selected, setSelected] = useProperty('selected');

    const [name] = useProperty('name');
    const [showVisualization, setShowVisualization] = useProperty('showVisualization');
    const [showSpec, setShowSpec] = useProperty('showSpec');
    const [proximityAuthoring, setProximityAuthoring] = useProperty('proximityAuthoring');

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
    // onDragging={async () => {
    //     await onDraggingUpdateGroupingHighlight(conceptUUID);
    //     await onDraggingUpdateProximityAuthoring(conceptUUID);
    // }}

    return visible ? <HTMLContainer className={`vis-group-shape ${locked ? 'locked' : ''}`} style={{
        transform: 'translate(-50%, -50%)',
        width: shape.props.w + 'px',
        height: shape.props.h + 'px',
        pointerEvents: 'all'
    }}>
        {!locked ? <VisGroupViewPieces isEditing={isEditing} /> : <div className="group-name">{name}</div>}

        {(selected || showSpec) && !locked ? <div className={`spec-button button ${showSpec ? 'active' : ''}`}
            onPointerDown={async (e) => {
                stopEventPropagation(e);
                setShowSpec(!showSpec);
                await deselectMovables();
                setSelected(true);
            }}>Show Spec</div> : null}
        {showSpec ? <SpecDisplay /> : null}

        {(selected || showVisualization) && !locked ? <div className={`visualization-button button ${showVisualization ? 'active' : ''}`}
            onPointerDown={async (e) => {
                stopEventPropagation(e);
                setShowVisualization(!showVisualization);
                await deselectMovables();
                setSelected(true);
            }}>Show Visualization</div> : null}
        {showVisualization ? <VisualizationDisplay /> : null}

        {(selected && !locked) || proximityAuthoring ? <div className={`proximity-authoring-button button ${proximityAuthoring ? 'active' : ''}`} onPointerDown={async (e) => {
            stopEventPropagation(e);
            setProximityAuthoring(!proximityAuthoring);
            await deselectMovables();
            setSelected(true);
        }}>Proximity Authoring</div> : null}
        {proximityAuthoring ? <Varv property="proximityPieces">
            <VisGroupConnector sourceConceptUUID={conceptUUID} />
        </Varv> : null}

        {selected || locked ? <div className={`lock-button button ${locked ? 'active' : ''}`} onPointerDown={async (e) => {
            stopEventPropagation(e);
            setLocked(!locked);
            await deselectMovables();
            setSelected(true);
        }}>Lock Group</div> : null}

        {selected && !proximityAuthoring && !locked ? <SpeechToVisGroup2D /> : null}
    </HTMLContainer> : null;
}

class VisGroupShapeUtil extends MovableShapeUtil {
    static type = 'VisGroup';

    getDefaultProps() {
        return Object.assign(super.getDefaultProps(), {
            w: CANVAS_SCALE * 0.4,
            h: CANVAS_SCALE * 0.4
        });
    }

    canEdit = () => true;

    component(shape) {
        const isEditing = this.editor.getEditingShapeId() === shape.id;

        return <MovableVarvScope shape={shape}>
            <VisGroupShape shape={shape} isEditing={isEditing} />
        </MovableVarvScope>;
    }
}

export const Main = VisGroupShapeUtil;
