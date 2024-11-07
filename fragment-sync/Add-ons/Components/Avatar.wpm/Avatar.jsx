import React from 'react';
let { useState, useEffect } = React;
import { Cone, Gltf, useGLTF } from '@react-three/drei';
import { useXR } from '@react-three/xr';
import { useFrame, useThree } from '@react-three/fiber';

import { Varv, useProperty } from '#VarvReact';
import { Text } from '#Text .default';
let VideoStream;
if (Fragment.one('#VideoStream .default')) {
    const videoStreamModule = await Fragment.one('#VideoStream .default').require();
    VideoStream = videoStreamModule.VideoStream;
}



useGLTF.preload("avatar-models.zip/model-camera.glb");
useGLTF.preload("avatar-models.zip/model-phone.glb");
useGLTF.preload("avatar-models.zip/model-headset.glb");
useGLTF.preload("https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0.16/dist/profiles/meta-quest-touch-plus/left.glb");
useGLTF.preload("https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0.16/dist/profiles/meta-quest-touch-plus/right.glb");
useGLTF.preload("https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0.16/dist/profiles/generic-hand/left.glb");
useGLTF.preload("https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0.16/dist/profiles/generic-hand/right.glb");

const cameraModel = <Gltf src="avatar-models.zip/model-camera.glb" scale={1} rotation={[0, Math.PI, 0]} />;
const phoneModel = <Gltf src="avatar-models.zip/model-phone.glb" scale={0.01} />;
const headsetModel = <Gltf src="avatar-models.zip/model-headset.glb" scale={0.9} rotation={[0, Math.PI, 0]} position={[0, 0.04, 0.11]} />;

const controllerLeftModel = <Gltf src="https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0.16/dist/profiles/meta-quest-touch-plus/left.glb" scale={1} rotation={[Math.PI / 4, 0, 0]} />;
const controllerRightModel = <Gltf src="https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0.16/dist/profiles/meta-quest-touch-plus/right.glb" scale={1} rotation={[Math.PI / 4, 0, 0]} />;
const handLeftModel = <Gltf src="https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0.16/dist/profiles/generic-hand/left.glb" scale={0.01} />;
const handRightModel = <Gltf src="https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0.16/dist/profiles/generic-hand/right.glb" scale={0.01} />;

const viewCone = <Cone args={[0.1, 0.1, 32]} position={[0, 0, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
    <meshStandardMaterial color="skyblue" transparent={true} opacity={0.66} />
</Cone>;



function Avatar() {
    const [type] = useProperty('type');
    const [userAgent] = useProperty('userAgent');
    const [inputSourceProfile] = useProperty('inputSourceProfile');
    const [position] = useProperty('position');
    const [rotation] = useProperty('rotation');
    const [userName] = useProperty('userName');
    const [client] = useProperty('client');

    const [remoteControlled, setRemoteControlled] = useProperty('remoteControlled');
    const [remoteControllingClient, setRemoteControllingClient] = useProperty('remoteControllingClient');

    const [model, setModel] = useState(cameraModel);

    useEffect(() => {
        switch (type) {
            case 'camera':
                if (userAgent.includes('OculusBrowser')) {
                    setModel(<> {headsetModel} {viewCone} </>);
                } else if (/(iPad|iPhone|iPod|Android)/i.test(userAgent)) {
                    setModel(<> {phoneModel} {viewCone} </>);
                } else {
                    setModel(<> {cameraModel} {viewCone} </>);
                }
                break;
            // TODO: Use the inputSourceProfile to determine the correct model
            case 'controllerLeft':
                setModel(controllerLeftModel);
                break;
            case 'controllerRight':
                setModel(controllerRightModel);
                break;
            case 'handLeft':
                setModel(handLeftModel);
                break;
            case 'handRight':
                setModel(handRightModel);
                break;
            default:
                setModel(cameraModel);
        }
    }, [type, userAgent, inputSourceProfile]);

    const remoteControlCallback = (newValue) => {
        // TODO: This feature needs to be re-implemented
        setRemoteControlled(newValue);
        setRemoteControllingClient(newValue ? webstrate.clientId : '');
    };

    return <group position={position} rotation={rotation}>
        {type == 'camera' ? <group
            onPointerDown={() => remoteControlCallback(true)}
            onPointerUp={() => remoteControlCallback(false)}>
            {model}
        </group> : model}
        {VideoStream ? <Varv property="clientVideoStream">
            <VideoStream client={client} />
        </Varv> : null}
        {type == 'camera' ? <Text
            position={[0, 0.11, 0]}
            rotation={[0, Math.PI, 0]}
            textAlign="center"
            anchorX="center"
            anchorY="middle"
            color="black"
            outlineWidth="5%"
            outlineColor="white"
            fontSize={0.05}>
            {userName}
        </Text> : null}
    </group >;
}

function AvatarRemoteController() {
    const [remoteControlled] = useProperty('remoteControlled');
    const [position] = useProperty('position');
    const [rotation] = useProperty('rotation');

    const camera = useThree(state => state.camera);

    useFrame(() => {
        if (remoteControlled) {
            camera.position.set(position[0], position[1], position[2]);
            camera.rotation.set(rotation[0], rotation[1], rotation[2]);
        }
    });
}

function Avatars() {
    return <>
        <Varv concept="Avatar" if="!isMine">
            <Avatar />
        </Varv>
        <Varv concept="Avatar" if="isMine">
            <AvatarRemoteController />
        </Varv>
    </>;
}



export function Main() {
    return <Varv concept="AvatarManager" if="enabled">
        <Avatars />
    </Varv>;
}
