import React from 'react';
const { useRef, useState, useEffect, useCallback } = React;
import * as THREE from 'three';
import { useXRInputSourceEvent } from '@react-three/xr';
import { useFrame } from '@react-three/fiber';
import { useProperty } from '#VarvReact';

import { useGlobalEvents } from '#Spatialstrates .global-events';
import { getDeviceFromInputEvent } from '#Spatialstrates .transform-helpers';
import { Icon } from '#Icon .default';
import { deselectMovables } from '#Movable .helpers';



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

    useEffect(() => {
        if (!uuid) return;
        const concept = VarvEngine.getConceptFromUUID(uuid);
        if (!concept) return;

        const updatePosition = async (changeUUID) => {
            if (changeUUID !== uuid) return;
            positionRef.current = await concept.getPropertyValue(uuid, 'position');
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
    }, [uuid]);

    const setPosition = useCallback((pos) => {
        const concept = VarvEngine.getConceptFromUUID(uuid);
        if (!concept) return;
        concept.setPropertyValue(uuid, 'position', [pos.x, pos.y, pos.z], true);
    }, [uuid]);

    const setRotation = useCallback((rot) => {
        const concept = VarvEngine.getConceptFromUUID(uuid);
        if (!concept) return;
        concept.setPropertyValue(uuid, 'rotation', [rot.x, rot.y, rot.z], true);
    }, [uuid]);

    const transform = {
        get position() { return positionRef.current },
        set position(pos) { setPosition(pos) },
        get rotation() { return rotationRef.current },
        set rotation(rot) { setRotation(rot) },
    };

    return transform;
}

/**
 * Sugar wrapper for icons used inside movables that are
 * selectable and hoverable
 */
export function HandleIcon({ model, theme = '', themesOverride = '' }) {
    const [selected] = useProperty('selected');
    const [hovered] = useProperty('hovered');
    return <Icon theme={theme + (selected ? ':selected' : '') + (hovered ? ':hovered' : '')} model={model} themesOverride={themesOverride} />
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
                previousTransform.copy(grabbingController.current.matrixWorld).invert();
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
            transform.position = dragRef.current.position;
            transform.rotation = dragRef.current.rotation;
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

    // Update the transformation of the movable
    const previousTransform = React.useMemo(() => new THREE.Matrix4(), []);
    const fastWritebackTimeout = useRef();
    const slowWritebackTimeout = useRef();

    useFrame(() => {
        if (!beingDragged && dragRef.current) {
            dragRef.current.position.fromArray(transform.position);
            dragRef.current.rotation.fromArray(transform.rotation);
            dragRef.current.updateMatrix();
            return;
        }
        const controller = grabbingController.current;
        if (!controller) return;

        dragRef.current.applyMatrix4(previousTransform);
        dragRef.current.applyMatrix4(controller.matrixWorld);
        dragRef.current.rotation.reorder('YXZ');
        if (upright) {
            dragRef.current.rotation.x = 0;
            dragRef.current.rotation.z = 0;
        }
        dragRef.current.updateMatrix();
        previousTransform.copy(controller.matrixWorld).invert();

        // Update the Varv state
        if (!fastWritebackTimeout.current) {
            transform.position = dragRef.current.position;
            fastWritebackTimeout.current = setTimeout(() => {
                fastWritebackTimeout.current = null;
            }, FAST_WRITEBACK_TIMEOUT);
        }
        if (!slowWritebackTimeout.current) {
            transform.rotation = dragRef.current.rotation;
            if (typeof onDragging === 'function') onDragging();
            slowWritebackTimeout.current = setTimeout(() => {
                slowWritebackTimeout.current = null;
            }, SLOW_WRITEBACK_TIMEOUT);
        }
    });

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
