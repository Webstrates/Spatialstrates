import React from 'react';
const { useRef, useState, useEffect, useCallback, useMemo } = React;
import { Matrix4 } from 'three';
import { useFrame } from '@react-three/fiber';
import { useXRInputSourceEvent } from '@react-three/xr';
import { useProperty } from '#VarvReact';

import { useGlobalEvents } from '#Spatialstrates .global-events';
import { getDeviceFromInputEvent } from '#Spatialstrates .device-helpers';
import { deselectMovables } from '#Spatialstrates .movable-helpers';



const FAST_WRITEBACK_TIMEOUT = 33;
const SLOW_WRITEBACK_TIMEOUT = 500;

export const SELECTED_COLOR_PRIMARY = 'hsl(14, 100%, 50%)';
export const SELECTED_COLOR_SECONDARY = 'hsl(26, 100%, 60%)';
export const HOVERED_SELECTED_COLOR_PRIMARY = 'hsl(14, 100%, 65%)';
export const HOVERED_SELECTED_COLOR_SECONDARY = 'hsl(26, 100%, 75%)';



// Generic wrapper for Movable concept properties into ThreeJS transform properties
export function useTransform() {
    const [uuid] = useProperty('concept::uuid');

    const positionRef = useRef([0, 0, 0]);
    const rotationRef = useRef([0, 0, 0]);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (!uuid) return;
        const concept = VarvEngine.getConceptFromUUID(uuid);
        if (!concept) return;

        const updatePosition = async (changeUUID) => {
            if (changeUUID !== uuid) return;
            positionRef.current = await concept.getPropertyValue(uuid, 'position');
            if (!initialized) setInitialized(true);
        };

        const updateRotation = async (changeUUID) => {
            if (changeUUID !== uuid) return;
            rotationRef.current = await concept.getPropertyValue(uuid, 'rotation');
        };

        updatePosition(uuid);
        updateRotation(uuid);

        concept.getProperty('position').addUpdatedCallback(updatePosition);
        concept.getProperty('rotation').addUpdatedCallback(updateRotation);

        return () => {
            if (!concept) return;
            try {
                concept.getProperty('position').removeUpdatedCallback(updatePosition);
                concept.getProperty('rotation').removeUpdatedCallback(updateRotation);
            } catch (e) {
                // Do nothing, this can crash when the VarvEngine restarts
            }
        };
    }, [uuid, initialized]);

    const setPosition = useCallback((pos) => {
        const concept = VarvEngine.getConceptFromUUID(uuid);
        if (!concept) return;
        if (!Array.isArray(pos)) return;
        concept.setPropertyValue(uuid, 'position', [pos[0], pos[1], pos[2]], true);
    }, [uuid]);

    const setRotation = useCallback((rot) => {
        const concept = VarvEngine.getConceptFromUUID(uuid);
        if (!concept) return;
        if (!Array.isArray(rot)) return;
        concept.setPropertyValue(uuid, 'rotation', [rot[0], rot[1], rot[2]], true);
    }, [uuid]);

    const transform = useMemo(() => {
        return {
            get initialized() { return initialized },
            get position() { return positionRef.current },
            set position(pos) { setPosition(pos) },
            get rotation() { return rotationRef.current },
            set rotation(rot) { setRotation(rot) },
        };
    }, [setPosition, setRotation, initialized]);

    return transform;
}

/**
 * Make a group of children moveable with a handle that allows
 * selecting them and dragging them around
 */
export function Movable({ children, handle, upright = true, onDragStart, onDragEnd, onDragging }) {
    const transform = useTransform();
    const [selected, setSelected] = useProperty('selected');
    const [hovered, setHovered] = useProperty('hovered');
    const [beingDragged, setBeingDragged] = useProperty('beingDragged');

    // Setup refs for dragging
    const grabbingController = useRef();
    const dragRef = useRef();

    // Setup dragging devices
    const [currentXRInputSource, setCurrentXRInputSource] = useState(null);
    const [uuid] = useProperty('concept::uuid');

    const { triggerEvent, subscribeEvent } = useGlobalEvents();

    // Update the transformation of the movable
    const previousTransform = useMemo(() => new Matrix4(), []);
    const parentTransform = useMemo(() => new Matrix4(), []);
    const finalTransform = useMemo(() => new Matrix4(), []);
    const fastWritebackTimeout = useRef();
    const slowWritebackTimeout = useRef();

    const updatePreviousTransform = useCallback(() => {
        parentTransform.copy(dragRef.current.parent.matrixWorld).invert();
        previousTransform
            .copy(parentTransform) // Convert to parent space
            .multiply(grabbingController.current.matrixWorld) // Get controller in parent space
            .invert(); // Invert for future use
    }, []);

    // Handle input events for dragging and hovering
    const selectAndStartDrag = useCallback((e) => {
        if (e) e.stopPropagation();
        if (grabbingController.current) return;
        setSelected(true);
        setBeingDragged(true);
        setCurrentXRInputSource(e?.nativeEvent?.inputSource);

        deselectMovables();

        if (dragRef && dragRef.current) {
            triggerEvent('drag-start', { target: uuid });
            if (typeof onDragStart === 'function') onDragStart();
            grabbingController.current = getDeviceFromInputEvent(e);
            if (grabbingController.current) {
                updatePreviousTransform();
            }
        }
    }, [setSelected, setBeingDragged]);

    const remoteInitiateDrag = useCallback((payload) => {
        if (payload.target === uuid) selectAndStartDrag(payload.e);
    }, [uuid]);

    useEffect(() => {
        const unsubscribe = subscribeEvent('initiate-drag', remoteInitiateDrag);
        return () => unsubscribe();
    }, [remoteInitiateDrag, subscribeEvent, uuid]);

    const stopDrag = useCallback((e) => {
        if (e) e.stopPropagation();
        setBeingDragged(false);
        setCurrentXRInputSource(null);

        if (grabbingController.current) {
            grabbingController.current = undefined;
            transform.position = dragRef.current.position.toArray();
            transform.rotation = dragRef.current.rotation.toArray();
            triggerEvent('drag-end', { target: uuid });
            if (typeof onDragEnd === 'function') onDragEnd();
        }
    }, [setBeingDragged, currentXRInputSource, setCurrentXRInputSource]);

    const startHover = useCallback((e) => {
        if (e) e.stopPropagation();
        setHovered(true);
    }, [setHovered]);

    const stopHover = useCallback(() => {
        setHovered(false);
    }, [setHovered]);

    // Always stop dragging when anything lets go
    useXRInputSourceEvent(currentXRInputSource, 'selectend', stopDrag, [stopDrag, currentXRInputSource]);
    useEffect(() => {
        document.body.addEventListener('pointerup', stopDrag);
        return () => {
            document.body.removeEventListener('pointerup', stopDrag);
        };
    }, [stopDrag]);

    useFrame(() => {
        if (!beingDragged && dragRef.current) {
            dragRef.current.position.fromArray(transform.position);
            dragRef.current.rotation.fromArray(transform.rotation);
            dragRef.current.updateMatrix();
            return;
        }
        if (!grabbingController.current) return;

        finalTransform
            .copy(parentTransform) // Convert to parent space
            .multiply(grabbingController.current.matrixWorld); // Get controller in parent space

        dragRef.current.applyMatrix4(previousTransform); // Apply inverse of original position
        dragRef.current.applyMatrix4(finalTransform); // Apply new position

        if (upright) {
            dragRef.current.rotation.reorder('YXZ');
            dragRef.current.rotation.x = 0;
            dragRef.current.rotation.z = 0;
        }
        dragRef.current.updateMatrix();
        updatePreviousTransform();

        // Update the Varv state
        if (!fastWritebackTimeout.current) {
            transform.position = dragRef.current.position.toArray();
            fastWritebackTimeout.current = setTimeout(() => {
                fastWritebackTimeout.current = null;
            }, FAST_WRITEBACK_TIMEOUT);
        }
        if (!slowWritebackTimeout.current) {
            transform.rotation = dragRef.current.rotation.toArray();
            if (typeof onDragging === 'function') onDragging();
            slowWritebackTimeout.current = setTimeout(() => {
                slowWritebackTimeout.current = null;
            }, SLOW_WRITEBACK_TIMEOUT);
        }
    });

    // useEffect(() => {
    //     if (upright && dragRef.current && transform.initialized) {
    //         dragRef.current.rotation.reorder('YXZ');
    //         dragRef.current.rotation.x = 0;
    //         dragRef.current.rotation.z = 0;
    //         dragRef.current.updateMatrix();
    //         transform.rotation = dragRef.current.rotation.toArray();
    //     }
    // }, [upright, transform.initialized]);

    return <group ref={dragRef}
        matrixAutoUpdate={false}
        matrixWorldAutoUpdate={true}>
        <group
            onPointerDown={selectAndStartDrag}
            onPointerUp={stopDrag}
            onPointerOver={startHover}
            onPointerOut={stopHover}>
            {handle}
        </group>
        {children}
    </group>;
}
