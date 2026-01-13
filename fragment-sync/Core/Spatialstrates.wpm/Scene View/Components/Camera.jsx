import React from 'react';
const { useRef, useEffect } = React;
import { Vector3, Matrix4 } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';



const SPEED = 1.4;

export function CustomCamera() {
    const controls = useRef();
    const crosshair = useRef(document.querySelector('.crosshair'));
    const moveDirection = useRef(new Vector3());
    const { gl } = useThree();

    // Track if we're currently dragging in pointer lock mode
    const isPointerLockDragging = useRef(false);

    // Store camera transform info for handle compatibility
    const cameraTransform = useRef({
        position: new Vector3(),
        previousPosition: new Vector3(),
        deltaPosition: new Vector3(),
        worldMatrix: new Matrix4()
    });

    useEffect(() => {
        window.moduleCameraControls = {
            controlsRef: controls
        };

        return () => {
            window.moduleCameraControls = {};
        };
    }, []);

    // Helper to create and dispatch a synthetic pointer event to the canvas
    // This works with @pmndrs/pointer-events by sending events at screen center
    const dispatchSyntheticPointerEvent = (eventType, buttons = 0) => {
        const canvas = gl.domElement;
        const rect = canvas.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const event = new PointerEvent(eventType, {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: centerX,
            clientY: centerY,
            screenX: centerX,
            screenY: centerY,
            pointerId: 1,
            pointerType: 'mouse',
            isPrimary: true,
            button: 0,
            buttons: buttons,
            pressure: buttons > 0 ? 0.5 : 0
        });

        event.synthetic = true;

        canvas.dispatchEvent(event);
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

        return () => {
            canvas.removeEventListener('pointermove', blockNonSyntheticEvents, true);
            canvas.removeEventListener('pointerdown', blockNonSyntheticEvents, true);
            canvas.removeEventListener('pointerup', blockNonSyntheticEvents, true);
        };
    }, [gl]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (!controls.current.isLocked) return;
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
        // We dispatch synthetic pointer events at the center of the screen
        const handleMouseDown = (event) => {
            if (!controls.current?.isLocked) return;
            if (event.button !== 0) return; // Only left click

            isPointerLockDragging.current = true;
            dispatchSyntheticPointerEvent('pointerdown', 1);
        };

        const handleMouseUp = (event) => {
            if (!controls.current?.isLocked) return;
            if (event.button !== 0) return;

            if (isPointerLockDragging.current) {
                isPointerLockDragging.current = false;
                dispatchSyntheticPointerEvent('pointerup', 0);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);

        controls.current.camera.position.set(0, 1.5, 1);

        // Initialize camera transform tracking
        cameraTransform.current.position.copy(controls.current.camera.position);
        cameraTransform.current.previousPosition.copy(controls.current.camera.position);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [gl]);

    // Use useFrame with a higher priority (negative number = runs earlier)
    // This ensures camera matrix is updated before handles process their transforms
    useFrame((state, delta) => {
        const cameraObject = controls.current.getObject();

        // Store previous position for delta calculation
        cameraTransform.current.previousPosition.copy(cameraTransform.current.position);

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

        // Update camera transform tracking
        cameraObject.getWorldPosition(cameraTransform.current.position);
        cameraTransform.current.worldMatrix.copy(cameraObject.matrixWorld);

        // Calculate delta position (useful for handles that need to follow camera movement)
        cameraTransform.current.deltaPosition.subVectors(
            cameraTransform.current.position,
            cameraTransform.current.previousPosition
        );

        // Continuously send pointermove events while in pointer lock
        // This allows hover detection and dragging to work
        if (controls.current?.isLocked) {
            dispatchSyntheticPointerEvent('pointermove', isPointerLockDragging.current ? 1 : 0);
        }
    }, -100); // Priority -100 ensures this runs before handle updates

    const handleOnLock = () => {
        crosshair.current.style.display = 'block';
    };
    const handleOnUnlock = () => {
        crosshair.current.style.display = 'none';

        if (isPointerLockDragging.current) {
            isPointerLockDragging.current = false;
            dispatchSyntheticPointerEvent('pointerup', 0);
        }
    };

    return <PointerLockControls ref={controls} selector={'.do-not-use'} onLock={handleOnLock} onUnlock={handleOnUnlock} />;
}
