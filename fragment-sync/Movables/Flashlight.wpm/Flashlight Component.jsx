import React from 'react';
const { useRef, useMemo } = React;
import { MeshStandardMaterial } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { useFrame } from '@react-three/fiber';
import { Cone, Billboard } from '@react-three/drei';
import { Text as UIText, Root, Container as UIContainer } from '@react-three/uikit';
import { Defaults, Card, List, ListItem } from '@react-three/uikit-apfel';
import { useProperty } from '#VarvReact';

import { Movable, SELECTED_COLOR_PRIMARY, HOVERED_SELECTED_COLOR_PRIMARY } from '#Spatialstrates .movable';



// Reuseable geometry for the image frame
const frameGeometry = new RoundedBoxGeometry(0.1, 0.1, 0.4, 2);
const frameMaterial = new MeshStandardMaterial({ color: '#222', metalness: 0.2, roughness: 0.5 });
const frameMaterialHovered = new MeshStandardMaterial({ color: '#444', metalness: 0.2, roughness: 0.5 });
const frameMaterialSelected = new MeshStandardMaterial({ color: SELECTED_COLOR_PRIMARY, metalness: 0.2, roughness: 0.5 });
const frameMaterialHoveredSelected = new MeshStandardMaterial({ color: HOVERED_SELECTED_COLOR_PRIMARY, metalness: 0.2, roughness: 0.5 });

const DEFAULT_COLOR = 'white';
const DEFAULT_INTENSITY = 5;
const DEFAULT_ANGLE = Math.PI / 8;

function Flashlight() {
    const [selected] = useProperty('selected');
    const [hovered] = useProperty('hovered');
    const [beingDragged] = useProperty('beingDragged');
    const [color, setColor] = useProperty('color');
    const [intensity, setIntensity] = useProperty('intensity');
    const [angle, setAngle] = useProperty('angle');

    const groupRef = useRef();
    const mainLightRef = useRef();
    const wideLightRef = useRef();
    const focusLightRef = useRef();

    const handle = useMemo(() => <mesh
        scale={0.5}
        geometry={frameGeometry}
        material={selected ? (hovered ? frameMaterialHoveredSelected : frameMaterialSelected) : (hovered ? frameMaterialHovered : frameMaterial)}
        position={[0, 0, 0.1]}
        autoUpdateMatrix={false}>
    </mesh>, [selected, hovered]);

    useFrame(() => {
        if (!groupRef.current || !mainLightRef.current) return;
        const lights = [mainLightRef.current, wideLightRef.current, focusLightRef.current];
        lights.forEach(light => {
            if (!light) return;
            groupRef.current.add(light);
            groupRef.current.add(light.target);
            light.target.position.z = -1;
        });
    });

    const viewCone = useMemo(() => intensity ? <Cone args={[0.15 * Math.tan(angle || DEFAULT_ANGLE), 0.15, 32]} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color={color || DEFAULT_COLOR} transparent={true} opacity={typeof intensity === 'number' ? intensity / 15 : DEFAULT_INTENSITY / 15} />
    </Cone> : null, [color, angle, intensity]);

    const currentIntensity = typeof intensity === 'number' ? intensity : DEFAULT_INTENSITY;
    const currentAngle = angle || DEFAULT_ANGLE;
    const currentColor = color || DEFAULT_COLOR;

    return <>
        <Movable handle={handle} upright={false}>
            {viewCone}
            <group ref={groupRef} />
            {selected & !beingDragged ? <Billboard position={[0, 0, 0.1]}>
                <group position={[0, 0.1, 0]}>
                    <Defaults>
                        <Root anchorX="center" anchorY="bottom" flexDirection="column" pixelSize={0.0005} padding={15}>
                            <Card borderRadius={24} padding={24} gap={16} flexDirection="column">
                                <UIContainer flexDirection="row" gap={8} alignItems="center">
                                    <UIText>Color</UIText>
                                    <List type="plain" flexDirection="row" gap={8}>
                                        <ListItem selected={color === 'white'} onClick={() => setColor('white')}>
                                            <UIText>White</UIText>
                                        </ListItem>
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
                                    </List>
                                </UIContainer>
                                <UIContainer flexDirection="row" gap={8} alignItems="center">
                                    <UIText>Intensity</UIText>
                                    <List type="plain" flexDirection="row" gap={8}>
                                        <ListItem selected={intensity === 0} onClick={() => setIntensity(0)}>
                                            <UIText>Off</UIText>
                                        </ListItem>
                                        <ListItem selected={intensity === 1} onClick={() => setIntensity(1)}>
                                            <UIText>Weak</UIText>
                                        </ListItem>
                                        <ListItem selected={intensity === DEFAULT_INTENSITY} onClick={() => setIntensity(DEFAULT_INTENSITY)}>
                                            <UIText>Normal</UIText>
                                        </ListItem>
                                        <ListItem selected={intensity === 10} onClick={() => setIntensity(10)}>
                                            <UIText>Strong</UIText>
                                        </ListItem>
                                    </List>
                                </UIContainer>
                                <UIContainer flexDirection="row" gap={8} alignItems="center">
                                    <UIText>Angle</UIText>
                                    <List type="plain" flexDirection="row" gap={8}>
                                        <ListItem selected={angle === Math.PI / 16} onClick={() => setAngle(Math.PI / 16)}>
                                            <UIText>Narrow</UIText>
                                        </ListItem>
                                        <ListItem selected={angle === DEFAULT_ANGLE} onClick={() => setAngle(DEFAULT_ANGLE)}>
                                            <UIText>Normal</UIText>
                                        </ListItem>
                                        <ListItem selected={angle === Math.PI / 4} onClick={() => setAngle(Math.PI / 4)}>
                                            <UIText>Wide</UIText>
                                        </ListItem>
                                    </List>
                                </UIContainer>
                            </Card>
                        </Root>
                    </Defaults>
                </group>
            </Billboard> : null}
        </Movable>
        <spotLight
            ref={mainLightRef}
            position={[0, 0, 0]}
            color={currentColor}
            angle={currentAngle}
            intensity={currentIntensity * 0.6}
            distance={2}
            penumbra={0.2}
            // Only one light can cast shadows at a time or GPU overloads
            castShadow
            shadow-mapSize={256}
        />
        <spotLight
            ref={wideLightRef}
            position={[0, 0, 0]}
            color={currentColor}
            angle={currentAngle * 1.5}
            intensity={currentIntensity * 0.3}
            distance={1.5}
            penumbra={0.5}
        />
        <spotLight
            ref={focusLightRef}
            position={[0, 0, 0]}
            color={currentColor}
            angle={currentAngle * 0.5}
            intensity={currentIntensity * 0.4}
            distance={2.5}
            penumbra={0.2}
        />
    </>;
}

export function Main() {
    const [conceptType] = useProperty('concept::name');
    return conceptType === 'Flashlight' ? <Flashlight /> : null;
}
