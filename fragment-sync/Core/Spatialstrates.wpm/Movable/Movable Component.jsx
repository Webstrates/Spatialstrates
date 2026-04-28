import React from 'react';
const { useRef, useState, useEffect, useCallback, useMemo } = React;
import { Euler, Quaternion, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { isXRInputSourceState } from '@react-three/xr';
import { Handle, HandleTarget, defaultApply } from '@react-three/handle';
import { create } from 'zustand';
import { useProperty } from '#VarvReact';

import { useGlobalEvents } from '#Spatialstrates .global-events';
import { deselectMovables } from '#Spatialstrates .movable-helpers';



const FAST_WRITEBACK_TIMEOUT = 33;
const SLOW_WRITEBACK_TIMEOUT = 333;
const POINTER_LOCK_EULER_ORDER = 'YXZ';

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

const vibrateOnEvent = (e) => {
    if (isXRInputSourceState(e.pointerState) && e.pointerState.type === 'controller') {
        e.pointerState.inputSource.gamepad?.hapticActuators[0]?.pulse(0.3, 50);
    }
};

const normalizeAngle = (angle) => {
    return Math.atan2(Math.sin(angle), Math.cos(angle));
};

const getPointerLockCameraObject = () => {
    const controls = window.moduleCameraControls?.controlsRef?.current;
    if (!controls?.isLocked) return null;

    return window.moduleCameraControls?.getCameraObject?.() || controls.getObject?.() || controls.camera || null;
};

const applyWorldQuaternion = (target, worldQuaternion, parentWorldQuaternion, localQuaternion) => {
    if (!target) return;

    if (target.parent) {
        target.parent.updateMatrixWorld(true);
        target.parent.getWorldQuaternion(parentWorldQuaternion);
        localQuaternion.copy(parentWorldQuaternion).invert().multiply(worldQuaternion);
        target.quaternion.copy(localQuaternion);
    } else {
        target.quaternion.copy(worldQuaternion);
    }

    target.updateMatrix();
    target.updateMatrixWorld(true);
};

const applyWorldPosition = (target, worldPosition, localPosition) => {
    if (!target) return;

    if (target.parent) {
        target.parent.updateMatrixWorld(true);
        localPosition.copy(worldPosition);
        target.parent.worldToLocal(localPosition);
        target.position.copy(localPosition);
    } else {
        target.position.copy(worldPosition);
    }
};

/**
 * Make a group of children moveable with a handle that allows
 * selecting them and dragging them around
 */
export function Movable({ children, handle, upright = true, onDragStart, onDragEnd, onDragging }) {
    // Create a store for this specific instance of Movable
    const useMovableStore = useMemo(() => create(() => ({
        position: [0, 0, 0],
        rotation: [0, 0, 0]
    })), []);

    const transform = useTransform();
    const [selected, setSelected] = useProperty('selected');
    const [hovered, setHovered] = useProperty('hovered');
    const [beingDragged, setBeingDragged] = useProperty('beingDragged');

    // Setup dragging devices
    const [uuid] = useProperty('concept::uuid');

    const { triggerEvent, subscribeEvent } = useGlobalEvents();

    // Update the transformation of the movable
    const fastWritebackTimeout = useRef();
    const slowWritebackTimeout = useRef();
    const handleRef = useRef();
    const handleTargetRef = useRef(null);
    const pointerLockDragRef = useRef({
        active: false,
        relativePosition: new Vector3(),
        cameraWorldPosition: new Vector3(),
        targetWorldPosition: new Vector3(),
        cameraWorldQuaternion: new Quaternion(),
        targetWorldQuaternion: new Quaternion(),
        relativeQuaternion: new Quaternion(),
        inverseCameraWorldQuaternion: new Quaternion(),
        parentWorldQuaternion: new Quaternion(),
        localPosition: new Vector3(),
        localQuaternion: new Quaternion(),
        cameraEuler: new Euler(0, 0, 0, POINTER_LOCK_EULER_ORDER),
        targetWorldEuler: new Euler(0, 0, 0, POINTER_LOCK_EULER_ORDER),
        baseWorldEuler: new Euler(0, 0, 0, POINTER_LOCK_EULER_ORDER),
        relativeYaw: 0
    });

    useEffect(() => {
        if (!transform.initialized) return;
        useMovableStore.setState({
            position: transform.position,
            rotation: transform.rotation
        });
        const updateRefTransform = (state) => {
            handleTargetRef.current?.position.set(...state.position);
            handleTargetRef.current?.rotation.set(...state.rotation);
        };
        updateRefTransform(useMovableStore.getState());
        return useMovableStore.subscribe((state) => updateRefTransform(state));
    }, [transform]);

    // Handle input events for dragging and hovering
    const select = useCallback(() => {
        setSelected(true);
        deselectMovables();
    }, [setSelected]);

    const remoteInitiateDrag = useCallback((payload) => {
        if (payload.target === uuid) {
            // FIXME: This does not capture the pointer properly
            // handleRef.current?.capture(payload.e.pointerId, payload.e.object);
            select();
        }
    }, [uuid]);

    useEffect(() => {
        const unsubscribe = subscribeEvent('initiate-drag', remoteInitiateDrag);
        return () => unsubscribe();
    }, [remoteInitiateDrag, subscribeEvent, uuid]);

    const startDrag = useCallback(() => {
        setBeingDragged(true);

        triggerEvent('drag-start', { target: uuid });
        if (typeof onDragStart === 'function') onDragStart();
    }, [setBeingDragged, onDragStart, triggerEvent, uuid]);

    const stopDrag = useCallback(() => {
        setBeingDragged(false);

        triggerEvent('drag-end', { target: uuid });
        if (typeof onDragEnd === 'function') onDragEnd();
    }, [setBeingDragged, onDragEnd, triggerEvent, uuid]);

    const beginPointerLockDrag = useCallback((target) => {
        const cameraObject = getPointerLockCameraObject();
        const pointerLockDrag = pointerLockDragRef.current;

        if (!cameraObject || !target) {
            pointerLockDrag.active = false;
            return;
        }

        cameraObject.updateMatrixWorld(true);
        target.updateMatrixWorld(true);
        cameraObject.getWorldPosition(pointerLockDrag.cameraWorldPosition);
        cameraObject.getWorldQuaternion(pointerLockDrag.cameraWorldQuaternion);
        target.getWorldPosition(pointerLockDrag.targetWorldPosition);
        target.getWorldQuaternion(pointerLockDrag.targetWorldQuaternion);

        pointerLockDrag.relativePosition
            .subVectors(pointerLockDrag.targetWorldPosition, pointerLockDrag.cameraWorldPosition)
            .applyQuaternion(pointerLockDrag.inverseCameraWorldQuaternion.copy(pointerLockDrag.cameraWorldQuaternion).invert());

        if (upright) {
            pointerLockDrag.cameraEuler.setFromQuaternion(pointerLockDrag.cameraWorldQuaternion, POINTER_LOCK_EULER_ORDER);
            pointerLockDrag.targetWorldEuler.setFromQuaternion(pointerLockDrag.targetWorldQuaternion, POINTER_LOCK_EULER_ORDER);
            pointerLockDrag.baseWorldEuler.copy(pointerLockDrag.targetWorldEuler);
            pointerLockDrag.relativeYaw = normalizeAngle(pointerLockDrag.targetWorldEuler.y - pointerLockDrag.cameraEuler.y);
        } else {
            pointerLockDrag.relativeQuaternion.copy(pointerLockDrag.cameraWorldQuaternion).invert().multiply(pointerLockDrag.targetWorldQuaternion);
        }

        pointerLockDrag.active = true;
    }, [upright]);

    const applyPointerLockTransform = useCallback((target) => {
        const cameraObject = getPointerLockCameraObject();
        const pointerLockDrag = pointerLockDragRef.current;

        if (!pointerLockDrag.active) {
            return false;
        }

        if (!cameraObject || !target) {
            pointerLockDrag.active = false;
            return false;
        }

        cameraObject.updateMatrixWorld(true);
        cameraObject.getWorldPosition(pointerLockDrag.cameraWorldPosition);
        cameraObject.getWorldQuaternion(pointerLockDrag.cameraWorldQuaternion);
        pointerLockDrag.targetWorldPosition
            .copy(pointerLockDrag.relativePosition)
            .applyQuaternion(pointerLockDrag.cameraWorldQuaternion)
            .add(pointerLockDrag.cameraWorldPosition);

        if (upright) {
            pointerLockDrag.cameraEuler.setFromQuaternion(pointerLockDrag.cameraWorldQuaternion, POINTER_LOCK_EULER_ORDER);
            pointerLockDrag.targetWorldEuler.set(
                pointerLockDrag.baseWorldEuler.x,
                pointerLockDrag.cameraEuler.y + pointerLockDrag.relativeYaw,
                pointerLockDrag.baseWorldEuler.z,
                POINTER_LOCK_EULER_ORDER
            );
            pointerLockDrag.targetWorldQuaternion.setFromEuler(pointerLockDrag.targetWorldEuler);
        } else {
            pointerLockDrag.targetWorldQuaternion.copy(pointerLockDrag.cameraWorldQuaternion).multiply(pointerLockDrag.relativeQuaternion);
        }

        applyWorldPosition(target, pointerLockDrag.targetWorldPosition, pointerLockDrag.localPosition);
        applyWorldQuaternion(
            target,
            pointerLockDrag.targetWorldQuaternion,
            pointerLockDrag.parentWorldQuaternion,
            pointerLockDrag.localQuaternion
        );

        return true;
    }, [upright]);

    const applyTransform = useCallback((state, target) => {
        defaultApply(state, target);

        if (state.first) {
            beginPointerLockDrag(target);
            startDrag();
        }

        applyPointerLockTransform(target);

        if (state.last) {
            // Always write back on last frame to ensure final position/rotation persists
            transform.position = target.position.toArray();
            transform.rotation = target.rotation.toArray();
            pointerLockDragRef.current.active = false;
            stopDrag();
        }
    }, [transform, startDrag, stopDrag, beginPointerLockDrag, applyPointerLockTransform]);

    useFrame(() => {
        const pointerLockActive = pointerLockDragRef.current.active;

        if (pointerLockActive && handleTargetRef.current) {
            applyPointerLockTransform(handleTargetRef.current);
        }

        if (beingDragged) {
            if (handleTargetRef.current) {
                if (!fastWritebackTimeout.current) {
                    transform.position = handleTargetRef.current.position.toArray();
                    fastWritebackTimeout.current = setTimeout(() => {
                        fastWritebackTimeout.current = null;
                    }, FAST_WRITEBACK_TIMEOUT);
                }

                if (!slowWritebackTimeout.current) {
                    transform.rotation = handleTargetRef.current.rotation.toArray();
                    if (typeof onDragging === 'function') onDragging();
                    slowWritebackTimeout.current = setTimeout(() => {
                        slowWritebackTimeout.current = null;
                    }, SLOW_WRITEBACK_TIMEOUT);
                }
            }
        } else if (!pointerLockActive) {
            useMovableStore.setState({
                position: transform.position,
                rotation: transform.rotation
            });
        }
    });

    return <HandleTarget ref={handleTargetRef}>
        <Handle ref={handleRef}
            targetRef="from-context"
            rotate={upright ? 'y' : true}
            scale={false}
            apply={applyTransform}
        >
            <group
                onPointerDown={select}
                onPointerOver={(e) => {
                    setHovered(true);
                    vibrateOnEvent(e);
                }}
                onPointerOut={() => setHovered(false)}
            >
                {handle}
            </group>
        </Handle>
        {children}
    </HandleTarget>;
}
