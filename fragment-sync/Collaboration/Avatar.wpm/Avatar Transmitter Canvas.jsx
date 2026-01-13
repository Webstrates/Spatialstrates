import React from 'react';
let { useEffect, useRef, useState, useMemo } = React;
import { Vector3, Matrix4, Euler } from 'three';
import { useEditor } from 'tldraw';
import { Varv, useProperty } from '#VarvReact';

import { updatePointFromCanvas, CANVAS_SCALE } from '#Spatialstrates .projection-helpers';



const FAST_WRITEBACK_TIMEOUT = 33;

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

function UserNameForwarder({ setUserName }) {
    const [name] = useProperty('name');

    useEffect(() => {
        setUserName(name);
    }, [name]);
}

function AvatarTransmitter({ type }) {
    const conceptRef = useRef(null);
    const avatarConcept = VarvEngine.getConceptFromType('Avatar');
    const [currentSpace] = useProperty('locationHash');
    const [xrPlatform] = useProperty('xrPlatform');
    const [userName, setUserName] = useState('');
    const editor = useEditor();
    const [projectionPlane] = useProperty('projectionPlane');

    useEffect(() => {
        return () => {
            if (conceptRef.current) {
                avatarConcept.setPropertyValue(conceptRef.current, 'active', false);
            }
        };
    }, []);

    useEffect(() => {
        if (!xrPlatform) return;

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
                    avatarXRPlatform: xrPlatform,
                    client: webstrate.clientId,
                    isMine: true
                });
            }
            conceptRef.current = uuid;
        };

        runAsync();
    }, [type, xrPlatform]);

    useEffect(() => {
        if (!conceptRef.current) return;
        avatarConcept.setPropertyValue(conceptRef.current, 'space', currentSpace || '');
        avatarConcept.setPropertyValue(conceptRef.current, 'userName', userName || '');
        avatarConcept.setPropertyValue(conceptRef.current, 'view', '2D');

        avatarConcept.setPropertyValue(conceptRef.current, 'otherSpace', '');
        avatarConcept.setPropertyValue(conceptRef.current, 'otherSpaceRelativePosition', [0, 0, 0]);
        avatarConcept.setPropertyValue(conceptRef.current, 'otherSpaceRelativeRotation', [0, 0, 0]);
    }, [currentSpace, userName]);

    useEffect(() => {
        if (type !== 'cursor') return;
        if (!editor) return;
        if (!projectionPlane) return;

        let lastInvocation = 0;
        const throttledUpdate = (e) => {
            if (e.name != 'pointer_move') return;
            if (!conceptRef.current) return;

            const now = Date.now();
            if (now - lastInvocation >= FAST_WRITEBACK_TIMEOUT) {
                const pageCoordinates = editor.screenToPage({ x: e.point.x, y: e.point.y });

                const newPosition = updatePointFromCanvas(
                    [0, 0, 0],
                    [pageCoordinates.x / CANVAS_SCALE, -pageCoordinates.y / CANVAS_SCALE],
                    projectionPlane
                );
                avatarConcept.setPropertyValue(conceptRef.current, 'active', true);
                avatarConcept.setPropertyValue(conceptRef.current, 'position', newPosition);

                lastInvocation = now;
            }
        };

        editor.on('event', throttledUpdate);
        return () => editor.off('event', throttledUpdate);
    }, [editor, projectionPlane]);

    useEffect(() => {
        if (type !== 'cursor') return;
        if (!editor) return;
        if (!projectionPlane) return;
        if (!conceptRef.current) return;

        const xAxis = new Vector3().fromArray(projectionPlane.slice(3, 6));
        const yAxis = new Vector3().fromArray(projectionPlane.slice(6, 9));
        const zAxis = new Vector3().fromArray(projectionPlane.slice(9, 12));

        const rotationMatrix = new Matrix4().makeBasis(xAxis, yAxis, zAxis);
        const rotation = new Euler().setFromRotationMatrix(rotationMatrix);

        avatarConcept.setPropertyValue(conceptRef.current, 'rotation', [rotation.x, rotation.y, rotation.z]);
    }, [projectionPlane]);

    const forwarderMemo = useMemo(() => <Varv concept="UserManager">
        <Varv property="localUser">
            <UserNameForwarder setUserName={setUserName} />
        </Varv>
    </Varv>, [setUserName]);

    return forwarderMemo;
}

function AvatarTransmitters() {
    useEffect(() => {
        webstrate.on('clientPart', cleanup);
        cleanup();
        return () => webstrate.off('clientPart', cleanup);
    }, []);

    return <Varv concept="SpaceManager">
        <Varv property="locationHash">
            <AvatarTransmitter type="camera" />
            <AvatarTransmitter type="cursor" />
        </Varv>
    </Varv>;
}

export function Main() {
    return <Varv concept="AvatarManager" if="enabled">
        <AvatarTransmitters />
    </Varv>;
}
