import React from 'react';
const { useState, useEffect, useRef, useMemo, useCallback } = React;
import { useEditor, HTMLContainer, stopEventPropagation } from 'tldraw';
import { Varv, useProperty } from '#VarvReact';

import { projectToScene, CANVAS_SCALE, shapeToConceptId } from '#Spatialstrates .projection-helpers';
import { MovableCanvasController } from '#Spatialstrates .movable-canvas-controller';
import { ClippedMovablesFilter, moveMovableToNewSpace } from '#Spatialstrates .container-helpers';
import { MovableShapeUtil, MovableVarvScope } from '#Spatialstrates .movable-shape';



const FAST_WRITEBACK_TIMEOUT = 33;

function ShapeMovementHandler({ shape, containerUUID, outerSpaceUUID }) {
    const [innerSpaceUUID] = useProperty('concept::uuid');
    const [boundarySize] = useProperty('boundarySize');
    const [boundaryOrigin] = useProperty('boundaryOrigin');

    const editor = useEditor();

    const moveElementsInAndOut = useCallback(async (e) => {
        if (e.type != 'pointer' || e.name != 'pointer_up') return;
        const spaceConcept = await VarvEngine.getConceptFromType('Space');

        const containerPosition2D = {
            x: shape.x / CANVAS_SCALE,
            y: -shape.y / CANVAS_SCALE
        };
        const halfSize2D = {
            width: boundarySize[0] / 2,
            height: boundarySize[1] / 2
        };

        const innerSpaceProjectionPlane = await spaceConcept.getPropertyValue(innerSpaceUUID, 'projectionPlane');
        const outerSpaceProjectionPlane = await spaceConcept.getPropertyValue(outerSpaceUUID, 'projectionPlane');


        const selectedShapes = editor.getSelectedShapeIds();
        for (const elementShapeId of selectedShapes) {
            const elementShape = editor.getShape(elementShapeId);
            const elementPosition2D = {
                x: elementShape.x / CANVAS_SCALE,
                y: -elementShape.y / CANVAS_SCALE
            };

            const elementUUID = shapeToConceptId(elementShapeId);
            const elementConcept = await VarvEngine.getConceptFromUUID(elementUUID);
            const elementParentSpace = await elementConcept.getPropertyValue(elementUUID, 'space');

            if (elementShapeId === shape.id) {
                // console.log('Container has moved', currentShape);

                // TODO: Check all movables if they are inside the container or not
            } else if (elementParentSpace === innerSpaceUUID) {
                // console.log('Movable within container has moved', currentShape);

                if (elementPosition2D.x > halfSize2D.width
                    || elementPosition2D.x < -halfSize2D.width
                    || elementPosition2D.y > halfSize2D.height
                    || elementPosition2D.y < -halfSize2D.height
                ) {
                    console.log('Movable within container has moved outside');

                    const newElementPosition3D = projectToScene([
                        elementPosition2D.x + containerPosition2D.x,
                        elementPosition2D.y + containerPosition2D.y
                    ], outerSpaceProjectionPlane);
                    await elementConcept.setPropertyValue(elementUUID, 'position', newElementPosition3D);

                    moveMovableToNewSpace(elementUUID, outerSpaceUUID);
                } else {
                    // console.log('Movable within container has moved inside'); // Do othing
                }
            } else if (elementParentSpace === outerSpaceUUID) {
                // console.log('Movable outside container has moved', currentShape);

                if (elementPosition2D.x < containerPosition2D.x + halfSize2D.width
                    && elementPosition2D.x > containerPosition2D.x - halfSize2D.width
                    && elementPosition2D.y < containerPosition2D.y + halfSize2D.height
                    && elementPosition2D.y > containerPosition2D.y - halfSize2D.height
                ) {
                    console.log('Movable outside container has moved inside');

                    let newElementPosition3D = projectToScene([
                        elementPosition2D.x - containerPosition2D.x,
                        elementPosition2D.y - containerPosition2D.y
                    ], [
                        boundaryOrigin[0],
                        boundaryOrigin[1],
                        boundaryOrigin[2],
                        innerSpaceProjectionPlane[3],
                        innerSpaceProjectionPlane[4],
                        innerSpaceProjectionPlane[5],
                        innerSpaceProjectionPlane[6],
                        innerSpaceProjectionPlane[7],
                        innerSpaceProjectionPlane[8],
                        innerSpaceProjectionPlane[9],
                        innerSpaceProjectionPlane[10],
                        innerSpaceProjectionPlane[11]
                    ]);

                    await elementConcept.setPropertyValue(elementUUID, 'position', newElementPosition3D);

                    moveMovableToNewSpace(elementUUID, innerSpaceUUID);
                } else {
                    // console.log('Movable outside container has moved outside'); // Do othing
                }
            } else {
                // Ignore this case for now
                // TODO: Handle this case
                // console.log('Movables parent is not container or space');
                // const parentConcept = await VarvEngine.getConceptFromUUID(currentParent);
                // const currentParentPosition = {
                //     x: parentConcept.getPropertyValue(currentParent, 'position')[0],
                //     y: parentConcept.getPropertyValue(currentParent, 'position')[1]
                // };
                // if (currentPosition.x + currentParentPosition.x < containerPosition.x + halfSize.width
                //     && currentPosition.x + currentParentPosition.x > containerPosition.x - halfSize.width
                //     && currentPosition.y + currentParentPosition.y < containerPosition.y + halfSize.height
                //     && currentPosition.y + currentParentPosition.y > containerPosition.y - halfSize.height
                // ) {
                //     console.log('Movable outside container has moved inside');
                //     currentConcept.setPropertyValue(currentConceptId, 'space', containerUUID);
                //     currentConcept.setPropertyValue(currentConceptId, 'position', [
                //         currentPosition.x - (1 * containerPosition.x),
                //         currentPosition.y - (1 * containerPosition.y),
                //         0
                //     ]);
                //     setMovables([...movables, currentConceptId]);
                // }
            }
        }
    }, [shape, containerUUID, outerSpaceUUID, editor, innerSpaceUUID, boundarySize, boundaryOrigin]);

    useEffect(() => {
        editor.on('event', moveElementsInAndOut);
        return () => { editor.off('event', moveElementsInAndOut); };
    }, [editor, moveElementsInAndOut]);
}

function ShapeSizeHandler({ shape }) {
    const [boundarySize, setBoundarySize] = useProperty('boundarySize');

    const editor = useEditor();
    // Size: Varv -> tldraw
    const isBeingUpdated = useRef(false);
    useEffect(() => {
        if (!Array.isArray(boundarySize)) return;
        if (!editor) return;
        if (isBeingUpdated.current) return;

        // FIXME: This does only take the x and y size of a container but does not consider the projection plane
        isBeingUpdated.current = true;
        editor.updateShape({
            id: shape.id,
            props: {
                w: boundarySize[0] * CANVAS_SCALE,
                h: boundarySize[1] * CANVAS_SCALE
            }
        });
        isBeingUpdated.current = false;
    }, [boundarySize, editor]);

    // Size: tldraw -> Varv
    const fastWritebackTimeout = useRef();
    useEffect(() => {
        if (!editor) return;

        const updateChangeHandler = editor.sideEffects.registerAfterChangeHandler('shape', (prev, next, source) => {
            if (isBeingUpdated.current) return;
            if (prev.id !== shape.id) return;
            if (next.id !== shape.id) return;
            if (prev.props.w === next.props.w && prev.props.h === next.props.h) return;

            // Update the Varv state
            if (!fastWritebackTimeout.current) {
                isBeingUpdated.current = true;

                setBoundarySize([
                    next.props.w / CANVAS_SCALE,
                    next.props.h / CANVAS_SCALE,
                    boundarySize[2]
                ]);

                isBeingUpdated.current = false;
                fastWritebackTimeout.current = setTimeout(() => {
                    fastWritebackTimeout.current = null;
                }, FAST_WRITEBACK_TIMEOUT);
            }
        });

        return () => {
            updateChangeHandler();
        };
    }, [editor, shape, boundarySize]);
}



function ContainedSpaceTitle() {
    const [name] = useProperty('name');
    return <div className="container-title">{name}</div>;
}

function SpaceOption({ currentSpace }) {
    const [uuid] = useProperty('concept::uuid');
    const [name] = useProperty('name');

    return currentSpace != uuid ? <option value={uuid}>{name}</option> : null;
}

function SpaceRenamer() {
    const [name, setName] = useProperty('name');

    return <label>
        <span>Rename:</span>
        <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Space Name" />
    </label>;
}

function SpaceColorChanger() {
    const [color, setColor] = useProperty('color');

    return <label>
        <span>Color:</span>
        <select
            value={color}
            onChange={e => setColor(e.target.value)}
        >
            <option value="">Default</option>
            <option value="red">Red</option>
            <option value="green">Green</option>
            <option value="blue">Blue</option>
            <option value="yellow">Yellow</option>
            <option value="purple">Purple</option>
            <option value="orange">Orange</option>
            <option value="pink">Pink</option>
        </select>
    </label>;
}

// TODO: Use the style menu from tldraw instead:
// https://tldraw.dev/examples/shapes/tools/shape-with-custom-styles
function SpaceMenu() {
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

    return <div className="container-menu" style={{
        pointerEvents: 'all'
    }}
        onPointerDown={stopEventPropagation}
        onPointerMove={stopEventPropagation}>
        <button onClick={createNewSpace}>Create New Space</button>
        <label>
            <span>Space:</span>
            <select
                value={containedSpace}
                onChange={e => setContainedSpace(e.target.value)}>
                <option value="">None</option>
                <Varv concept="Space">
                    <SpaceOption currentSpace={space} />
                </Varv>
            </select>
        </label>
        <Varv property="containedSpace">
            <SpaceRenamer />
            <SpaceColorChanger />
            <button onClick={enterSpace}>Enter Space</button>
        </Varv>
        <label>
            <span>Clipping Mode:</span>
            <select
                value={clippingMode}
                onChange={e => setClippingMode(e.target.value)}
            >
                <option value="hide">Hide Outside</option>
                <option value="show">Show All</option>
            </select>
        </label>
        <label>
            <span>Collaboration Level:</span>
            <select
                value={collaborationLevel}
                onChange={e => setCollaborationLevel(e.target.value)}
            >
                <option value="close">Close</option>
                {/* <option value="loose">Loose Collaboration</option> */}
                <option value="none">None</option>
            </select>
        </label>
    </div>;
}

function ColorForwarder({ setColor }) {
    const [color] = useProperty('color');

    useEffect(() => {
        setColor(color);
    }, [color]);
}

function ContainerShape({ shape, isEditing }) {
    const [containerUUID] = useProperty('concept::uuid');
    const [space] = useProperty('space');
    const [containedSpace] = useProperty('containedSpace');
    const [clippingMode] = useProperty('clippingMode');
    const [color, setColor] = useState('');
    const editor = useEditor();

    const isInMainSpace = useMemo(() => shape?.parentId === 'page:page', [shape]);

    // Reset size if no space is contained
    useEffect(() => {
        if (!containedSpace) {
            editor?.updateShape({
                id: shape.id,
                props: {
                    w: 0.5 * CANVAS_SCALE,
                    h: 0.5 * CANVAS_SCALE
                }
            });
        }
    }, [editor, containedSpace]);

    return <HTMLContainer className={`container-shape ${isEditing ? 'editing' : ''} ${isInMainSpace ? '' : 'nested'} color-${color || 'default'}`} style={{
        transform: 'translate(-50%, -50%)',
        width: shape.props.w + 'px',
        height: shape.props.h + 'px'
    }}>
        <Varv property="containedSpace">
            <ContainedSpaceTitle />
            <ColorForwarder setColor={setColor} />
            <ShapeSizeHandler shape={shape} />
            {isInMainSpace && !isEditing ? <>
                <Varv property="movables">
                    <ClippedMovablesFilter clippingMode={clippingMode}>
                        <MovableCanvasController parent={shape.id} />
                    </ClippedMovablesFilter>
                </Varv>
                <ShapeMovementHandler
                    shape={shape}
                    containerUUID={containerUUID}
                    outerSpaceUUID={space} />
            </> : null}
        </Varv>
        {isEditing ? <SpaceMenu /> : null}
    </HTMLContainer>;
}

class ContainerShapeUtil extends MovableShapeUtil {
    static type = 'Container';

    getDefaultProps() {
        return Object.assign(super.getDefaultProps(), {
            w: CANVAS_SCALE * 0.35,
            h: CANVAS_SCALE * 0.35
        });
    }

    canResize = () => true;
    isAspectRatioLocked = () => false;
    canEdit = () => true;

    component(shape) {
        const isEditing = this.editor.getEditingShapeId() === shape.id;

        return <MovableVarvScope shape={shape}>
            <ContainerShape shape={shape} isEditing={isEditing} />
        </MovableVarvScope>;
    }
}

export const Main = ContainerShapeUtil;
