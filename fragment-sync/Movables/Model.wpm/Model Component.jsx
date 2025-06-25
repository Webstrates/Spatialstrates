import React from 'react';
const { useMemo, useState } = React;
import { ErrorBoundary } from 'react-error-boundary';
import { Box3 } from 'three';
import { Gltf, Billboard } from '@react-three/drei';
import { Text as UIText, Root, Container as UIContainer } from '@react-three/uikit';
import { Defaults, Card, Button, Slider } from '@react-three/uikit-apfel';
import { useProperty } from '#VarvReact';

import { Movable } from '#Spatialstrates .movable';



const DEFAULT_MODEL_SCALE = 0.001;

function CustomModel() {
    const [selected] = useProperty('selected');
    const [beingDragged] = useProperty('beingDragged');
    const [url] = useProperty('url');
    const [scale, setScale] = useProperty('scale');
    const [upright, setUpright] = useProperty('upright');

    const [boundingBoxMinY, setBoundingBoxMinY] = useState(0);

    const fallback = useMemo(() => <mesh castShadow receiveShadow>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshStandardMaterial color={'#ccc'} />
    </mesh>, []);

    const handle = useMemo(() => {
        if (!!url && url != '') {
            return <ErrorBoundary key={url} fallback={fallback}>
                <group scale={scale || DEFAULT_MODEL_SCALE} position={[0, -boundingBoxMinY, 0]}>
                    <Gltf
                        src={url}
                        castShadow
                        receiveShadow
                        onLoad={(gltf) => {
                            const box = new Box3().setFromObject(gltf.scene || gltf);
                            setBoundingBoxMinY(box.min.y * (scale || DEFAULT_MODEL_SCALE));
                        }}
                    />
                </group>
            </ErrorBoundary>;
        } else {
            return fallback;
        }
    }, [url, scale, boundingBoxMinY, fallback]);

    return <Movable handle={handle} upright={upright}>
        {selected && !beingDragged ? <Billboard position={[0, -0.1, 0]}>
            <Defaults>
                <Root anchorX="center" anchorY="top" flexDirection="column" pixelSize={0.0005} padding={15}>
                    <Card borderRadius={24} padding={24} gap={16} flexDirection="column">
                        <UIText fontSize={32}>{url || 'No Model Selected'}</UIText>
                        <UIContainer flexDirection="row" gap={8} alignItems="center">
                            <UIText>Scale</UIText>
                            <Button platter onClick={() => setScale(DEFAULT_MODEL_SCALE)}>
                                <UIText>Reset</UIText>
                            </Button>
                            <Slider
                                min={1}
                                max={100}
                                step={1}
                                width={512}
                                value={(scale * 10000 || DEFAULT_MODEL_SCALE * 10000)}
                                onValueChange={(value) => setScale(value / 10000)} />
                        </UIContainer>
                        <UIContainer flexDirection="row" gap={8} alignItems="center">
                            <UIText>Upright</UIText>
                            <Button platter onClick={() => setUpright(!upright)}>
                                <UIText>{upright ? 'Yes' : 'No'}</UIText>
                            </Button>
                        </UIContainer>
                    </Card>
                </Root>
            </Defaults>
        </Billboard> : null}
    </Movable>;
}

export function Main() {
    const [conceptType] = useProperty('concept::name');
    return conceptType === 'Model' ? <ErrorBoundary fallback={null}>
        <CustomModel />
    </ErrorBoundary> : null;
}
