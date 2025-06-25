import React from 'react';
const { useState, useMemo, useRef } = React;
import { ErrorBoundary } from 'react-error-boundary';
import { MeshStandardMaterial } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Text as UIText, Root, Container as UIContainer } from '@react-three/uikit';
import { Defaults, Card, Button, List, ListItem } from '@react-three/uikit-apfel';
import { useProperty } from '#VarvReact';

import { Movable } from '#Spatialstrates .movable';
import { Text } from '#Spatialstrates .text';
import { Icon } from '#Icon .default';
import { transcribeAudio } from '#AIHelpers .default';




const frameGeometry = new RoundedBoxGeometry(0.15, 0.15, 0.005, 1);
useGLTF.preload('microphone.glb');

const frameMaterialMap = new Map();
frameMaterialMap.set('red', new MeshStandardMaterial({ color: 'hsl(0, 95%, 60%)', metalness: 0.2, roughness: 0.5 }));
frameMaterialMap.set('green', new MeshStandardMaterial({ color: 'hsl(120, 95%, 60%)', metalness: 0.2, roughness: 0.5 }));
frameMaterialMap.set('blue', new MeshStandardMaterial({ color: 'hsl(204, 95%, 60%)', metalness: 0.2, roughness: 0.5 }));
frameMaterialMap.set('yellow', new MeshStandardMaterial({ color: 'hsl(49, 98%, 60%)', metalness: 0.2, roughness: 0.5 }));
frameMaterialMap.set('purple', new MeshStandardMaterial({ color: 'hsl(250, 85%, 60%)', metalness: 0.2, roughness: 0.5 }));
frameMaterialMap.set('orange', new MeshStandardMaterial({ color: 'hsl(28, 95%, 60%)', metalness: 0.2, roughness: 0.5 }));
frameMaterialMap.set('pink', new MeshStandardMaterial({ color: 'hsl(310, 95%, 60%)', metalness: 0.2, roughness: 0.5 }));

const frameMaterialHoveredMap = new Map();
frameMaterialHoveredMap.set('red', new MeshStandardMaterial({ color: 'hsl(0, 95%, 70%)', metalness: 0.2, roughness: 0.5 }));
frameMaterialHoveredMap.set('green', new MeshStandardMaterial({ color: 'hsl(120, 95%, 70%)', metalness: 0.2, roughness: 0.5 }));
frameMaterialHoveredMap.set('blue', new MeshStandardMaterial({ color: 'hsl(204, 95%, 70%)', metalness: 0.2, roughness: 0.5 }));
frameMaterialHoveredMap.set('yellow', new MeshStandardMaterial({ color: 'hsl(49, 98%, 70%)', metalness: 0.2, roughness: 0.5 }));
frameMaterialHoveredMap.set('purple', new MeshStandardMaterial({ color: 'hsl(250, 85%, 70%)', metalness: 0.2, roughness: 0.5 }));
frameMaterialHoveredMap.set('orange', new MeshStandardMaterial({ color: 'hsl(28, 95%, 70%)', metalness: 0.2, roughness: 0.5 }));
frameMaterialHoveredMap.set('pink', new MeshStandardMaterial({ color: 'hsl(310, 95%, 70%)', metalness: 0.2, roughness: 0.5 }));



function StickyNote() {
    const iconRef = useRef();
    const microphoneIcon = useGLTF('microphone.glb');
    const [listening, setListening] = useState(false);
    const [text, setText] = useProperty('text');
    const [selected] = useProperty('selected');
    const [hovered] = useProperty('hovered');
    const [color, setColor] = useProperty('color');
    const [showColorOptions, setShowColorOptions] = useState(false);

    async function updateText() {
        if (listening) return;

        setListening(true);
        const newText = await transcribeAudio(5000, false, () => { setListening(false); });
        if (newText) setText(newText);
    }

    const handle = useMemo(() => <mesh
        geometry={frameGeometry}
        material={hovered ? frameMaterialHoveredMap.get(color || 'yellow') : frameMaterialMap.get(color || 'yellow')}
        position={[0, 0.025, 0]}
        autoUpdateMatrix={false}
    />, [hovered, selected, color]);

    useFrame((state) => {
        if (!iconRef.current) return;
        const minScale = 0.4;
        const maxScale = 0.6;
        const targetScale = listening ? minScale + (maxScale - minScale) * (Math.sin(state.clock.elapsedTime * 5) * 0.5 + 0.5) : 0.5;
        iconRef.current.scale.setScalar(targetScale);
    });

    return <Movable handle={handle} upright={false}>
        <Text
            position={[0, 0.025, 0.003]} autoUpdateMatrix={false}
            maxWidth={0.13}
            textAlign='center'
            anchorX='center'
            anchorY='middle'
            color='black'
            fontSize={0.01}>
            {text}
        </Text>
        {selected ? <>
            <group ref={iconRef} position={[0.1, 0.025, 0]} rotation={[0, -Math.PI, 0]}>
                <Icon model={microphoneIcon} onClick={updateText} />
            </group>
            <group position={[0, -0.05, 0]} rotation={[0, 0, 0]}>
                <Defaults>
                    <Root anchorX="center" anchorY="top" flexDirection="column" pixelSize={0.0005} padding={15}>
                        <Card borderRadius={24} padding={24} gap={16} flexDirection="column">
                            <UIContainer flexDirection="row" gap={8} alignItems="center">
                                <Button platter onClick={() => setShowColorOptions(!showColorOptions)}>
                                    <UIText>Show Colors</UIText>
                                </Button>
                                {showColorOptions ? <List type="plain" flexDirection="row" gap={8}>
                                    <ListItem selected={color === 'red'} onClick={() => setColor('red')}>
                                        <UIText>Red</UIText>
                                    </ListItem>
                                    <ListItem selected={color === 'green'} onClick={() => setColor('green')}>
                                        <UIText>Green</UIText>
                                    </ListItem>
                                    <ListItem selected={color === 'blue'} onClick={() => setColor('blue')}>
                                        <UIText>Blue</UIText>
                                    </ListItem>
                                    <ListItem selected={color === 'yellow'} onClick={() => setColor('yellow')}>
                                        <UIText>Yellow</UIText>
                                    </ListItem>
                                    <ListItem selected={color === 'purple'} onClick={() => setColor('purple')}>
                                        <UIText>Purple</UIText>
                                    </ListItem>
                                    <ListItem selected={color === 'orange'} onClick={() => setColor('orange')}>
                                        <UIText>Orange</UIText>
                                    </ListItem>
                                    <ListItem selected={color === 'pink'} onClick={() => setColor('pink')}>
                                        <UIText>Pink</UIText>
                                    </ListItem>
                                </List> : null}
                            </UIContainer>
                        </Card>
                    </Root>
                </Defaults>
            </group>
        </> : null}
    </Movable>;
}

export function Main() {
    const [conceptType] = useProperty('concept::name');
    return conceptType === 'StickyNote' ? <ErrorBoundary fallback={null}>
        <StickyNote />
    </ErrorBoundary> : null;
}
