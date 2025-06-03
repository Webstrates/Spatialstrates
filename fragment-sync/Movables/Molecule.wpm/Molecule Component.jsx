import React from 'react';
const { useMemo } = React;
import { ErrorBoundary } from 'react-error-boundary';
import * as THREE from 'three';
import { PDBLoader } from 'three/addons/loaders/PDBLoader.js';
import { useLoader } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import { Text as UIText, Root } from '@react-three/uikit';
import { Defaults, Card } from '@react-three/uikit-apfel';
import { useProperty } from '#VarvReact';

import { Movable } from '#Spatialstrates .movable';
import { Text } from '#Spatialstrates .text';



function Molecule() {
    const [selected] = useProperty('selected');
    const [url] = useProperty('url');
    const [note] = useProperty('note');
    const [scale] = useProperty('scale');
    const pdb = useLoader(PDBLoader, url);

    // Create meshes from PDB data and extract atom data for labels
    const { moleculeObject, atomLabels } = useMemo(() => {
        if (!pdb) return { moleculeObject: null, atomLabels: [] };

        const root = new THREE.Group();
        const offset = new THREE.Vector3();
        const atomLabels = [];

        const geometryAtoms = pdb.geometryAtoms;
        const geometryBonds = pdb.geometryBonds;
        const json = pdb.json;

        const sphereGeometry = new THREE.IcosahedronGeometry(1, 3);
        const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

        // Center the molecule
        geometryAtoms.computeBoundingBox();
        geometryAtoms.boundingBox.getCenter(offset).negate();

        geometryAtoms.translate(offset.x, offset.y, offset.z);
        geometryBonds.translate(offset.x, offset.y, offset.z);

        // Create atom meshes
        let positions = geometryAtoms.getAttribute('position');
        const colors = geometryAtoms.getAttribute('color');

        const position = new THREE.Vector3();
        const color = new THREE.Color();

        // Add atoms
        for (let i = 0; i < positions.count; i++) {
            position.x = positions.getX(i);
            position.y = positions.getY(i);
            position.z = positions.getZ(i);

            color.r = colors.getX(i);
            color.g = colors.getY(i);
            color.b = colors.getZ(i);

            // Use MeshStandardMaterial instead which responds better to lighting
            const material = new THREE.MeshStandardMaterial({
                color: color,
                roughness: 0.4,
                metalness: 0.1
            });

            const object = new THREE.Mesh(sphereGeometry, material);

            object.position.copy(position);
            object.position.multiplyScalar(75);
            object.scale.multiplyScalar(25);
            root.add(object);

            // Store atom label data if JSON data is available
            if (json && json.atoms && json.atoms[i]) {
                const atom = json.atoms[i];
                atomLabels.push({
                    position: [
                        object.position.x + 30, // Offset slightly from the atom
                        object.position.y + 30,
                        object.position.z
                    ],
                    text: atom[4], // Element symbol
                    color: `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`,
                });
            }
        }

        // Add bonds
        positions = geometryBonds.getAttribute('position');

        const start = new THREE.Vector3();
        const end = new THREE.Vector3();

        for (let i = 0; i < positions.count; i += 2) {
            start.x = positions.getX(i);
            start.y = positions.getY(i);
            start.z = positions.getZ(i);

            end.x = positions.getX(i + 1);
            end.y = positions.getY(i + 1);
            end.z = positions.getZ(i + 1);

            start.multiplyScalar(75);
            end.multiplyScalar(75);

            // Use MeshStandardMaterial for bonds too
            const object = new THREE.Mesh(boxGeometry, new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.5,
                metalness: 0.1
            }));

            object.position.copy(start);
            object.position.lerp(end, 0.5);
            object.scale.set(5, 5, start.distanceTo(end));
            object.lookAt(end);
            root.add(object);
        }

        return { moleculeObject: root, atomLabels };
    }, [pdb]);

    const handle = useMemo(() => (<>
        <group scale={[scale, scale, scale]}>
            {moleculeObject && <primitive object={moleculeObject} />}

            {atomLabels.map((label, index) => (
                <Text
                    key={index}
                    position={label.position}
                    fontSize={10}
                    color={label.color}
                    anchorX="center"
                    anchorY="middle">
                    {label.text}
                </Text>
            ))}
        </group>
    </>), [moleculeObject, atomLabels, scale]);

    const title = useMemo(() => <Text position={[0, 0.075, 0]}
        fontSize={0.05}
        textAlign="center"
        anchorX="center"
        anchorY="top"
        color="black"
        outlineWidth="5%"
        outlineColor="white">{url}</Text>, [url]);

    return <Movable handle={handle} upright={false}>
        <Billboard position={[0, -0.375, 0]}>
            {title}
            {selected && note ? <Defaults>
                <Root anchorX="center" anchorY="top" flexDirection="column" pixelSize={0.0005} padding={15}>
                    <Card borderRadius={24} padding={24} gap={16} flexDirection="column">
                        <UIText fontSize={24}>{note}</UIText>
                    </Card>
                </Root>
            </Defaults> : null}
        </Billboard>
    </Movable>;
}

export function Main() {
    const [conceptType] = useProperty('concept::name');
    return conceptType === 'Molecule' ? <ErrorBoundary fallback={null}>
        <Molecule />
    </ErrorBoundary> : null;
}
