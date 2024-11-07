import React from 'react';
let { useEffect, useRef } = React;
import { useXRInputSourceState } from '@react-three/xr';
import { useFrame, useThree } from '@react-three/fiber';
import { Varv } from '#VarvReact';



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

const SLOW_WRITEBACK_TIMEOUT = 500;
function AvatarTransmitter({ device, type, inputSourceProfiles }) {
    const conceptRef = useRef(null);
    const avatarConcept = VarvEngine.getConceptFromType('Avatar');

    useEffect(() => {
        if (!device) return;

        const avatarFilter = FilterAction.constructFilter({
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
        });

        const runAsync = async () => {
            let uuid;
            const ids = await VarvEngine.lookupInstances('Avatar', avatarFilter);

            if (ids.length > 0) {
                // Reuse existing concept if available
                uuid = ids[0];
            } else {
                // Otherwise create a new one
                uuid = await avatarConcept.create(null, {
                    type: type,
                    userAgent: window.navigator.userAgent,
                    client: webstrate.clientId,
                    userName: webstrate.user.displayName || 'Anonymous',
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
        if (!device) return;
        if (!conceptRef.current) return;

        if (!slowWritebackTimeout.current) {
            avatarConcept.setPropertyValue(conceptRef.current, 'position', device.position.toArray());
            avatarConcept.setPropertyValue(conceptRef.current, 'rotation', [device.rotation.x, device.rotation.y, device.rotation.z]);

            slowWritebackTimeout.current = setTimeout(() => {
                slowWritebackTimeout.current = null;
            }, SLOW_WRITEBACK_TIMEOUT);
        }
    });
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
        {controllerRight ? <AvatarTransmitter device={controllerRight?.object} type="controllerRight" inputSourceProfiles={controllerRight.profiles} /> : null}
        {controllerLeft ? <AvatarTransmitter device={controllerLeft?.object} type="controllerLeft" inputSourceProfiles={controllerLeft.profiles} /> : null}
        {handRight ? <AvatarTransmitter device={handRight?.object} type="handRight" inputSourceProfiles={handRight.profiles} /> : null}
        {handLeft ? <AvatarTransmitter device={handLeft?.object} type="handLeft" inputSourceProfiles={handLeft.profiles} /> : null}
    </>;
}



export function Main() {
    return <Varv concept="AvatarManager" if="enabled">
        <AvatarTransmitters />
    </Varv>;
}
