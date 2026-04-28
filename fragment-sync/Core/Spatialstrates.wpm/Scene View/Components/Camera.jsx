import React from 'react';
const { useRef, useEffect } = React;
import { Vector3 } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import { forwardHtmlEvents } from '@pmndrs/pointer-events';



const SPEED = 1.4;
const SYNTHETIC_POINTER_ID = 424242;

const createSyntheticPointerTarget = (canvas) => {
    const eventTarget = new EventTarget();
    const capturedPointerIds = new Set();

    return {
        addEventListener: (...args) => eventTarget.addEventListener(...args),
        removeEventListener: (...args) => eventTarget.removeEventListener(...args),
        dispatchEvent: (event) => eventTarget.dispatchEvent(event),
        getBoundingClientRect: () => canvas.getBoundingClientRect(),
        setPointerCapture: (pointerId) => capturedPointerIds.add(pointerId),
        hasPointerCapture: (pointerId) => capturedPointerIds.has(pointerId),
        releasePointerCapture: (pointerId) => capturedPointerIds.delete(pointerId)
    };
};

export function CustomCamera() {
    const controls = useRef();
    const crosshair = useRef(document.querySelector('.crosshair'));
    const moveDirection = useRef(new Vector3());
    const syntheticPointerEvents = useRef();
    const { gl, camera, scene } = useThree();

    // Track if we're currently dragging in pointer lock mode
    const isPointerLockDragging = useRef(false);

    useEffect(() => {
        window.moduleCameraControls = {
            controlsRef: controls,
            getCameraObject: () => controls.current?.getObject?.()
        };

        return () => {
            window.moduleCameraControls = {};
        };
    }, []);

    useEffect(() => {
        const target = createSyntheticPointerTarget(gl.domElement);
        const { destroy } = forwardHtmlEvents(target, () => camera, scene, {
            batchEvents: false,
            pointerTypePrefix: 'screen-'
        });

        syntheticPointerEvents.current = { target };

        return () => {
            syntheticPointerEvents.current = null;
            destroy();
        };
    }, [camera, gl, scene]);

    const getCrosshairClientPosition = () => {
        const canvas = gl.domElement;
        crosshair.current = crosshair.current || document.querySelector('.crosshair');
        const crosshairRect = crosshair.current?.getBoundingClientRect();

        if (crosshairRect && crosshairRect.width > 0 && crosshairRect.height > 0) {
            return {
                clientX: crosshairRect.left + crosshairRect.width / 2,
                clientY: crosshairRect.top + crosshairRect.height / 2
            };
        }

        const rect = canvas.getBoundingClientRect();
        return {
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2
        };
    };

    // Pointer lock keeps real pointer coordinates at the lock origin, so the
    // forwarded scene events are dispatched from the visible crosshair instead.
    const dispatchSyntheticPointerEvent = (eventType, buttons = 0) => {
        const canvas = gl.domElement;
        const { clientX, clientY } = getCrosshairClientPosition();
        const eventButton = eventType === 'pointermove' ? -1 : 0;

        const event = new PointerEvent(eventType, {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: clientX,
            clientY: clientY,
            screenX: window.screenX + clientX,
            screenY: window.screenY + clientY,
            pointerId: SYNTHETIC_POINTER_ID,
            pointerType: 'mouse',
            isPrimary: true,
            button: eventButton,
            buttons: buttons,
            pressure: buttons > 0 ? 0.5 : 0
        });

        event.synthetic = true;

        const syntheticTarget = syntheticPointerEvents.current?.target;
        if (syntheticTarget) {
            syntheticTarget.dispatchEvent(event);
        } else {
            canvas.dispatchEvent(event);
        }
    };

    // Block non-synthetic pointer events on the canvas when in pointer lock mode
    // This prevents flickering from both real and synthetic events being processed
    useEffect(() => {
        const canvas = gl.domElement;

        const blockNonSyntheticEvents = (event) => {
            if (!controls.current?.isLocked) return;

            if (event.synthetic) return;

            event.stopPropagation();
            event.stopImmediatePropagation();
        };

        canvas.addEventListener('pointermove', blockNonSyntheticEvents, true);
        canvas.addEventListener('pointerdown', blockNonSyntheticEvents, true);
        canvas.addEventListener('pointerup', blockNonSyntheticEvents, true);
        window.addEventListener('pointermove', blockNonSyntheticEvents, true);
        window.addEventListener('pointerdown', blockNonSyntheticEvents, true);
        window.addEventListener('pointerup', blockNonSyntheticEvents, true);
        document.addEventListener('pointermove', blockNonSyntheticEvents, true);
        document.addEventListener('pointerdown', blockNonSyntheticEvents, true);
        document.addEventListener('pointerup', blockNonSyntheticEvents, true);

        return () => {
            canvas.removeEventListener('pointermove', blockNonSyntheticEvents, true);
            canvas.removeEventListener('pointerdown', blockNonSyntheticEvents, true);
            canvas.removeEventListener('pointerup', blockNonSyntheticEvents, true);
            window.removeEventListener('pointermove', blockNonSyntheticEvents, true);
            window.removeEventListener('pointerdown', blockNonSyntheticEvents, true);
            window.removeEventListener('pointerup', blockNonSyntheticEvents, true);
            document.removeEventListener('pointermove', blockNonSyntheticEvents, true);
            document.removeEventListener('pointerdown', blockNonSyntheticEvents, true);
            document.removeEventListener('pointerup', blockNonSyntheticEvents, true);
        };
    }, [gl]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (!controls.current?.isLocked) return;
            switch (event.code) {
                case 'KeyW':
                    moveDirection.current.z = -1;
                    break;
                case 'KeyS':
                    moveDirection.current.z = 1;
                    break;
                case 'KeyA':
                    moveDirection.current.x = -1;
                    break;
                case 'KeyD':
                    moveDirection.current.x = 1;
                    break;
                case 'Space':
                    moveDirection.current.y = 1;
                    break;
                case 'ShiftLeft':
                    moveDirection.current.y = -1;
                    break;
                default:
                    break;
            }
        };

        const handleKeyUp = (event) => {
            switch (event.code) {
                case 'KeyW':
                case 'KeyS':
                    moveDirection.current.z = 0;
                    break;
                case 'KeyA':
                case 'KeyD':
                    moveDirection.current.x = 0;
                    break;
                case 'Space':
                case 'ShiftLeft':
                    moveDirection.current.y = 0;
                    break;
                default:
                    break;
            }
        };

        // Handle mouse events while in pointer lock
        // We dispatch synthetic pointer events at the crosshair.
        const handleMouseDown = (event) => {
            if (!controls.current?.isLocked) return;
            if (event.button !== 0) return; // Only left click

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            isPointerLockDragging.current = true;
            dispatchSyntheticPointerEvent('pointerdown', 1);
        };

        const handleMouseUp = (event) => {
            if (!controls.current?.isLocked) return;
            if (event.button !== 0) return;

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            if (isPointerLockDragging.current) {
                isPointerLockDragging.current = false;
                dispatchSyntheticPointerEvent('pointerup', 0);
            }
        };

        const handleClick = (event) => {
            if (!controls.current?.isLocked) return;

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        document.addEventListener('mousedown', handleMouseDown, true);
        document.addEventListener('mouseup', handleMouseUp, true);
        document.addEventListener('click', handleClick, true);

        if (controls.current?.camera) {
            controls.current.camera.position.set(0, 1.5, 1);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
            document.removeEventListener('mousedown', handleMouseDown, true);
            document.removeEventListener('mouseup', handleMouseUp, true);
            document.removeEventListener('click', handleClick, true);
        };
    }, [gl]);

    // Use useFrame with a higher priority (negative number = runs earlier)
    // This ensures camera matrix is updated before handles process their transforms
    useFrame((state, delta) => {
        const cameraObject = controls.current?.getObject?.();
        if (!cameraObject) return;

        // Apply movement
        if (moveDirection.current.x != 0 || moveDirection.current.y != 0 || moveDirection.current.z != 0) {
            const timeBasedSpeed = SPEED * delta;
            cameraObject.translateX(moveDirection.current.x * timeBasedSpeed);
            cameraObject.translateY(moveDirection.current.y * timeBasedSpeed * 0.5);
            cameraObject.translateZ(moveDirection.current.z * timeBasedSpeed);
        }

        // Update matrices - critical for handle compatibility
        cameraObject.updateMatrix();
        cameraObject.updateMatrixWorld(true);

        // Continuously send pointermove events while in pointer lock
        // This allows hover detection and dragging to work
        if (controls.current?.isLocked) {
            dispatchSyntheticPointerEvent('pointermove', isPointerLockDragging.current ? 1 : 0);
        }
    }, -100); // Priority -100 ensures this runs before handle updates

    const handleOnLock = () => {
        crosshair.current = crosshair.current || document.querySelector('.crosshair');
        if (crosshair.current) crosshair.current.style.display = 'block';
        dispatchSyntheticPointerEvent('pointermove', 0);
    };
    const handleOnUnlock = () => {
        crosshair.current = crosshair.current || document.querySelector('.crosshair');
        if (crosshair.current) crosshair.current.style.display = 'none';

        if (isPointerLockDragging.current) {
            isPointerLockDragging.current = false;
            dispatchSyntheticPointerEvent('pointerup', 0);
        }
    };

    return <PointerLockControls ref={controls} selector={'.do-not-use'} onLock={handleOnLock} onUnlock={handleOnUnlock} />;
}
