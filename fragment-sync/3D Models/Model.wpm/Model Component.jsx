import React from 'react';
const { useMemo, useCallback, useRef } = React;
import { ErrorBoundary } from 'react-error-boundary';
import { Billboard } from '@react-three/drei';
import { Handle, HandleTarget } from '@react-three/handle';
import { Container, Text as UIText } from '@react-three/uikit';
import { Label } from '@react-three/uikit-default';
import { Panel, Button, Slider } from '@react-three/uikit-horizon';
import { useProperty } from '#VarvReact';

import { Movable } from '#Spatialstrates .movable';
import { ModelRenderer } from '#Model .model-renderer';



const DEFAULT_MODEL_SIZE = 0.5;
const MIN_MODEL_SIZE = 0.1;
const MAX_MODEL_SIZE = 1.0;

function CustomModel() {
    const [selected] = useProperty('selected');
    const [beingDragged] = useProperty('beingDragged');
    const [url] = useProperty('url');
    const [modelSize, setModelSize] = useProperty('modelSize');
    const [upright, setUpright] = useProperty('upright');
    const [sizeLocked, setSizeLocked] = useProperty('sizeLocked');

    const size = modelSize || DEFAULT_MODEL_SIZE;
    const initialSizeRef = useRef(size);
    const gestureActiveRef = useRef(false);
    const prevPointerAmountRef = useRef(0);

    // Apply function for the scale handle - updates modelSize directly
    const applyScale = useCallback((state, target) => {
        // Skip scaling if locked
        if (sizeLocked) {
            return;
        }

        const currentPointerAmount = state.current.pointerAmount;
        const prevPointerAmount = prevPointerAmountRef.current;

        // Capture the initial size at the start of the gesture or when transitioning from 1 to 2 pointers
        if (state.first || (prevPointerAmount === 1 && currentPointerAmount === 2)) {
            initialSizeRef.current = size;
            gestureActiveRef.current = true;
        }

        prevPointerAmountRef.current = currentPointerAmount;

        if (currentPointerAmount === 2) {
            console.log('Scaling state:', state, 'Initial size:', initialSizeRef.current);

            // Calculate new size based on the scale gesture from the initial size
            const scaleFactor = state.current.scale.x;
            // Clamp the new size to the min/max bounds
            const newSize = Math.max(MIN_MODEL_SIZE, Math.min(MAX_MODEL_SIZE, initialSizeRef.current * scaleFactor));

            // Update the model size directly to avoid flicker
            setModelSize(newSize);
            // Reset the handle's visual scale since we're updating the actual size
            target.scale.set(1, 1, 1);
        }


        if (state.last) {
            gestureActiveRef.current = false;
        }
    }, [setModelSize, size, sizeLocked]);

    // Panel position based on model size (half the height below the model center, plus some padding)
    const panelYPosition = -(size / 2) - 0.05;

    const handle = useMemo(() => {
        return (
            <HandleTarget>
                <Handle
                    targetRef="from-context"
                    scale={{ uniform: true }}
                    rotate={false}
                    translate={false}
                    apply={applyScale}
                    stopPropagation={false}
                >
                    <ModelRenderer url={url} size={[size, size, size]} />
                </Handle>
            </HandleTarget>
        );
    }, [url, size, applyScale]);

    return <Movable handle={handle} upright={upright}>
        {selected && !beingDragged ? <Billboard position={[0, panelYPosition, 0]}>
            <Panel anchorX="center" anchorY="top" padding={16} gap={16} flexDirection="column" pixelSize={0.0005}>
                <Label>
                    <UIText fontSize={32}>{url || 'No Model Selected'}</UIText>
                </Label>
                <Container flexDirection="row" gap={8}>
                    <Label>
                        <UIText>Size</UIText>
                    </Label>
                    <Button variant="secondary" onClick={() => setModelSize(DEFAULT_MODEL_SIZE)}>
                        <UIText>Reset</UIText>
                    </Button>
                    <Slider
                        min={MIN_MODEL_SIZE * 100}
                        max={MAX_MODEL_SIZE * 100}
                        step={1}
                        width={512}
                        value={(size * 100)}
                        onValueChange={(value) => setModelSize(value / 100)} />
                </Container>
                <Container flexDirection="row" gap={8}>
                    <Label>
                        <UIText>Upright</UIText>
                    </Label>
                    <Button variant="secondary" onClick={() => setUpright(!upright)}>
                        <UIText>{upright ? 'Yes' : 'No'}</UIText>
                    </Button>
                </Container>
                <Container flexDirection="row" gap={8}>
                    <Label>
                        <UIText>Size Locked</UIText>
                    </Label>
                    <Button variant="secondary" onClick={() => setSizeLocked(!sizeLocked)}>
                        <UIText>{sizeLocked ? 'Yes' : 'No'}</UIText>
                    </Button>
                </Container>
            </Panel>
        </Billboard> : null}
    </Movable>;
}

export function Main() {
    const [conceptType] = useProperty('concept::name');
    return conceptType === 'Model' ? <ErrorBoundary fallback={null}>
        <CustomModel />
    </ErrorBoundary> : null;
}
