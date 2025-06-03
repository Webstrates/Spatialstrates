import React from 'react';
let { useEffect, useRef, useState, useMemo } = React;
import { Vector3, Quaternion, Euler } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useXRInputSourceState } from '@react-three/xr';
import { Varv, useProperty } from '#VarvReact';



// Remove other people's Avatars when clients leave or join
const cleanup = () => {
    setTimeout(async () => {
        const concept = await VarvEngine.getConceptFromType('Avatar');
        const avatars = await VarvEngine.lookupInstances('Avatar');
        for (let avatar of avatars) {
            if (!webstrate.clients.includes(await concept.getPropertyValue(avatar, 'client'))) {
                concept.delete(avatar);
            }
        }
    }, 0);
};

const MAX_DISTANCE = 1.5;

const findOtherAvatarSpaces = async (avatarUUID, currentSpaceUUID, avatarPosition, avatarRotation) => {
    if (!avatarUUID) return;
    if (!currentSpaceUUID) return;
    const avatarConcept = await VarvEngine.getConceptFromType('Avatar');
    const containerConcept = await VarvEngine.getConceptFromType('Container');

    const containers = await VarvEngine.lookupInstances(['Container'], FilterAction.constructFilter({
        and: [
            { property: 'space', equals: currentSpaceUUID },
            { property: 'containedSpace', unequals: '' },
            { property: 'collaborationLevel', equals: 'close' }
        ]
    }));

    // Use a Map to store spaces with their distances to prevent duplicates
    let closestSpace = null;
    let closestContainer = null;
    let minDistance = Infinity;

    for (let container of containers) {
        const containerPosition = await containerConcept.getPropertyValue(container, 'position');
        const distance = new Vector3(...containerPosition).distanceTo(new Vector3(...avatarPosition));

        if (distance < MAX_DISTANCE && distance < minDistance) {
            minDistance = distance;
            closestSpace = await containerConcept.getPropertyValue(container, 'containedSpace');
            closestContainer = container;
        }
    }

    const otherSpace = closestSpace || '';
    avatarConcept.setPropertyValue(avatarUUID, 'otherSpace', otherSpace);

    let otherSpaceRelativePosition = [0, 0, 0];
    let otherSpaceRelativeRotation = [0, 0, 0];

    if (closestContainer) {
        const containerPosition = await containerConcept.getPropertyValue(closestContainer, 'position');
        const containerRotation = await containerConcept.getPropertyValue(closestContainer, 'rotation');

        const containerQuaternion = new Quaternion().setFromEuler(new Euler(...containerRotation));

        const relativePosition = new Vector3(...avatarPosition).sub(new Vector3(...containerPosition));
        relativePosition.applyQuaternion(containerQuaternion.conjugate());
        otherSpaceRelativePosition = relativePosition.toArray();

        const relativeRotation = new Quaternion().copy(containerQuaternion).multiply(new Quaternion().setFromEuler(new Euler(...avatarRotation)));
        const relativeEuler = new Euler().setFromQuaternion(relativeRotation);
        otherSpaceRelativeRotation = [relativeEuler.x, relativeEuler.y, relativeEuler.z];
    }

    avatarConcept.setPropertyValue(avatarUUID, 'otherSpaceRelativePosition', otherSpaceRelativePosition);
    avatarConcept.setPropertyValue(avatarUUID, 'otherSpaceRelativeRotation', otherSpaceRelativeRotation);
};

function UserNameForwarder({ setUserName }) {
    const [name] = useProperty('name');

    useEffect(() => {
        setUserName(name);
    }, [name]);
}

const SLOW_WRITEBACK_TIMEOUT = 500;
function AvatarTransmitter({ device, type, inputSourceProfiles }) {
    const conceptRef = useRef(null);
    const avatarConcept = VarvEngine.getConceptFromType('Avatar');
    const [currentSpace] = useProperty('locationHash');
    const [userName, setUserName] = useState('');

    useEffect(() => {
        return () => {
            if (conceptRef.current) {
                avatarConcept.setPropertyValue(conceptRef.current, 'active', false);
            }
        };
    }, []);

    useEffect(() => {
        if (!device) return;

        const runAsync = async () => {
            let uuid;
            const ids = await VarvEngine.lookupInstances('Avatar', FilterAction.constructFilter({
                and: [
                    {
                        property: 'type',
                        equals: type
                    },
                    {
                        property: 'client',
                        equals: webstrate.clientId
                    }
                ]
            }));

            if (ids.length > 0) {
                // Reuse existing concept if available
                uuid = ids[0];
            } else {
                // Otherwise create a new one
                uuid = await avatarConcept.create(null, {
                    type: type,
                    userAgent: window.navigator.userAgent,
                    client: webstrate.clientId,
                    inputSourceProfile: inputSourceProfiles ? JSON.stringify(inputSourceProfiles) : '',
                    isMine: true
                });
            }
            conceptRef.current = uuid;
        };

        runAsync();
    }, [device, type]);

    const slowWritebackTimeout = useRef(null);
    useFrame(() => {
        if (!conceptRef.current) return;
        if (!device) {
            avatarConcept.setPropertyValue(conceptRef.current, 'active', false);
        };

        if (!slowWritebackTimeout.current) {
            let newPosition, newRotation;
            if (type === 'camera') {
                newPosition = device.position.toArray();
                newRotation = [device.rotation.x, device.rotation.y, device.rotation.z];
            } else {
                const tempPosition = new Vector3();
                device?.getWorldPosition(tempPosition);
                newPosition = tempPosition.toArray();
                const tempQuaternion = new Quaternion();
                device?.getWorldQuaternion(tempQuaternion);
                const tempEuler = new Euler().setFromQuaternion(tempQuaternion);
                newRotation = [tempEuler.x, tempEuler.y, tempEuler.z];
            }

            avatarConcept.setPropertyValue(conceptRef.current, 'active', true);
            avatarConcept.setPropertyValue(conceptRef.current, 'position', newPosition);
            avatarConcept.setPropertyValue(conceptRef.current, 'rotation', newRotation);
            avatarConcept.setPropertyValue(conceptRef.current, 'space', currentSpace || '');
            avatarConcept.setPropertyValue(conceptRef.current, 'userName', userName || '');
            avatarConcept.setPropertyValue(conceptRef.current, 'view', '3D');
            findOtherAvatarSpaces(conceptRef.current, currentSpace, newPosition, newRotation);

            slowWritebackTimeout.current = setTimeout(() => {
                slowWritebackTimeout.current = null;
            }, SLOW_WRITEBACK_TIMEOUT);
        }
    });

    const forwarderMemo = useMemo(() => <Varv concept="UserManager">
        <Varv property="localUser">
            <UserNameForwarder setUserName={setUserName} />
        </Varv>
    </Varv>, [setUserName]);

    return forwarderMemo;
}

function AvatarTransmitters() {
    const { camera } = useThree();
    const controllerRight = useXRInputSourceState('controller', 'right');
    const controllerLeft = useXRInputSourceState('controller', 'left');
    const handRight = useXRInputSourceState('hand', 'right');
    const handLeft = useXRInputSourceState('hand', 'left');

    // Ensure that Avatars are updated in the environement
    useEffect(() => {
        webstrate.on('clientPart', cleanup);
        cleanup();
        return () => webstrate.off('clientPart', cleanup);
    }, []);

    return <>
        <AvatarTransmitter device={camera} type="camera" />
        {controllerRight ? <AvatarTransmitter device={controllerRight.object} type="controllerRight" inputSourceProfiles={controllerRight.profiles} /> : null}
        {controllerLeft ? <AvatarTransmitter device={controllerLeft.object} type="controllerLeft" inputSourceProfiles={controllerLeft.profiles} /> : null}
        {handRight ? <AvatarTransmitter device={handRight.object} type="handRight" inputSourceProfiles={handRight.profiles} /> : null}
        {handLeft ? <AvatarTransmitter device={handLeft.object} type="handLeft" inputSourceProfiles={handLeft.profiles} /> : null}
    </>;
}



export function Main() {
    return <Varv concept="AvatarManager" if="enabled">
        <AvatarTransmitters />
    </Varv>;
}
