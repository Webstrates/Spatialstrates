import React from 'react';
let { useState, useEffect } = React;
import { Cone, Gltf, useGLTF, Box, Billboard } from '@react-three/drei';
import { Varv, useProperty } from '#VarvReact';

import { Text } from '#Spatialstrates .text';



let VideoStream;
if (Fragment.one('#VideoStream .default')) {
    const videoStreamModule = await Fragment.one('#VideoStream .default').require();
    VideoStream = videoStreamModule.VideoStream;
}
let AudioStream;
if (Fragment.one('#AudioStream .default')) {
    const audioStreamModule = await Fragment.one('#AudioStream .default').require();
    AudioStream = audioStreamModule.AudioStream;
}


useGLTF.preload('avatar-models.zip/model-camera.glb');
useGLTF.preload('avatar-models.zip/model-phone.glb');
useGLTF.preload('avatar-models.zip/model-headset-quest.glb');
useGLTF.preload('avatar-models.zip/model-headset-vision-pro.glb');
useGLTF.preload('https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0.20/dist/profiles/meta-quest-touch-plus/left.glb');
useGLTF.preload('https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0.20/dist/profiles/meta-quest-touch-plus/right.glb');
useGLTF.preload('https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0.20/dist/profiles/generic-hand/left.glb');
useGLTF.preload('https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0.20/dist/profiles/generic-hand/right.glb');

const cameraModel = <Gltf src='avatar-models.zip/model-camera.glb' scale={1} rotation={[0, Math.PI, 0]} />;
const phoneModel = <Gltf src='avatar-models.zip/model-phone.glb' scale={0.01} />;
const headsetQuestModel = <Gltf src='avatar-models.zip/model-headset-quest.glb' scale={0.9} rotation={[0, Math.PI, 0]} position={[0, 0.04, 0.11]} />;
const headsetVisionProModel = <Gltf src='avatar-models.zip/model-headset-vision-pro.glb' scale={0.32} rotation={[0, Math.PI / 2, 0]} position={[0, -0.01, 0.115]} />;

const controllerLeftModel = <Gltf src='https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0.20/dist/profiles/meta-quest-touch-plus/left.glb' />;
const controllerRightModel = <Gltf src='https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0.20/dist/profiles/meta-quest-touch-plus/right.glb' />;
const handLeftModel = <Gltf src='https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0.20/dist/profiles/generic-hand/left.glb' rotation={[Math.PI / 2, -Math.PI / 2, -Math.PI / 8]} />;
const handRightModel = <Gltf src='https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0.20/dist/profiles/generic-hand/right.glb' rotation={[Math.PI / 2, Math.PI / 2, Math.PI / 8]} />;

const viewCone = <Cone args={[0.1, 0.1, 32]} position={[0, 0, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
    <meshStandardMaterial color="skyblue" transparent={true} opacity={0.66} />
</Cone>;

const cursorModel = <Box args={[0.005, 0.005, 2]} position={[0, 0, 0]}>
    <meshBasicMaterial color="skyblue" />
</Box>;



function AvatarModel() {
    const [userName] = useProperty('userName');
    const [client] = useProperty('client');
    const [view] = useProperty('view');
    const [type] = useProperty('type');
    const [avatarXRPlatform] = useProperty('avatarXRPlatform');
    const [inputSourceProfile] = useProperty('inputSourceProfile');

    const [model, setModel] = useState(cameraModel);

    useEffect(() => {
        switch (type) {
            case 'camera':
                if (avatarXRPlatform === 'Quest') {
                    setModel(<> {headsetQuestModel} {viewCone} </>);
                } else if (avatarXRPlatform === 'Vision Pro') {
                    setModel(<> {headsetVisionProModel} {viewCone} </>);
                } else if (avatarXRPlatform === 'Android Mobile') {
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
            case 'cursor':
                setModel(cursorModel);
                break;
            default:
                setModel(cameraModel);
        }
    }, [type, avatarXRPlatform, inputSourceProfile]);

    // TODO: This feature needs to be re-implemented
    // const [remoteControlled, setRemoteControlled] = useProperty('remoteControlled');
    // const [remoteControllingClient, setRemoteControllingClient] = useProperty('remoteControllingClient');

    // const remoteControlCallback = (newValue) => {
    //     setRemoteControlled(newValue);
    //     setRemoteControllingClient(newValue ? webstrate.clientId : '');
    // };

    return <>
        {view == '3D' || type == 'cursor' ? <>
            {/* {type == 'camera' ? <group
                onPointerDown={() => remoteControlCallback(true)}
                onPointerUp={() => remoteControlCallback(false)}> */}
            {model}
            {/* </group> : model} */}
            {type == 'camera' || type == 'cursor' ? <Billboard position={type == 'camera' ? [0, 0.11, 0] : [0, 0.05, 0.0]}>
                <Text
                    textAlign="center"
                    anchorX="center"
                    anchorY="middle"
                    color="black"
                    outlineWidth="5%"
                    outlineColor="white"
                    fontSize={0.05}>
                    {userName}
                </Text>
            </Billboard> : null}
            {type == 'camera' && VideoStream ? <Varv property="clientVideoStream">
                <VideoStream client={client} />
            </Varv> : null}
        </> : null}
        {AudioStream ? <Varv property="clientAudioStream">
            <AudioStream client={client} />
        </Varv> : null}
    </>;
}

function AvatarInSameSpace() {
    const [position] = useProperty('position');
    const [rotation] = useProperty('rotation');

    return <group position={position} rotation={rotation}>
        <AvatarModel />
    </group>;
}

// FIXME: Skip this case for now as it requires to also work in the other direction
// function AvatarInOtherSpace() {
//     const [boundaryOrigin] = useProperty('boundaryOrigin');
//     const [otherSpaceRelativePosition] = useProperty('otherSpaceRelativePosition');
//     const [otherSpaceRelativeRotation] = useProperty('otherSpaceRelativeRotation');

//     return <group position={boundaryOrigin}>
//         <group position={otherSpaceRelativePosition} rotation={otherSpaceRelativeRotation}>
//             <AvatarModel />
//         </group>
//     </group>;
// }

function AvatarInOtherContainer() {
    const [position] = useProperty('position'); // From container
    const [rotation] = useProperty('rotation'); // From container
    const [otherSpaceRelativePosition] = useProperty('otherSpaceRelativePosition');
    const [otherSpaceRelativeRotation] = useProperty('otherSpaceRelativeRotation');

    return <group position={position} rotation={rotation}>
        <group position={otherSpaceRelativePosition} rotation={otherSpaceRelativeRotation}>
            <AvatarModel />
        </group>
    </group>;
}

function Avatar() {
    const [space] = useProperty('space');
    const [otherSpace] = useProperty('otherSpace');
    const [currentSpace] = useProperty('locationHash');
    const [active] = useProperty('active');

    const [location, setLocation] = useState('');
    const [targetContainer, setTargetContainer] = useState(null);

    useEffect(() => {
        if (!space || !currentSpace) {
            setLocation('');
            return;
        }

        const runAsync = async () => {
            if (space == currentSpace) {
                // Avatar is in the current space
                setLocation('same');
            } else if (otherSpace == currentSpace) {
                // Avatar is in another space but close to a container
                // that contains the current space
                setLocation('other');
            } else {
                const containerConcept = await VarvEngine.getConceptFromType('Container');

                const containersInCurrentSpace = await VarvEngine.lookupInstances(['Container'], FilterAction.constructFilter({
                    and: [
                        { property: 'space', equals: currentSpace },
                        { property: 'containedSpace', unequals: '' },
                        { property: 'collaborationLevel', equals: 'close' }
                    ]
                }));

                const containersWithOtherSpace = await Promise.all(containersInCurrentSpace.map(async container => {
                    return {
                        container: container,
                        containedSpace: await containerConcept.getPropertyValue(container, 'containedSpace')
                    };
                })).then(containers => containers.filter(container => {
                    return otherSpace == container.containedSpace;
                }));

                const newTargetContainer = containersWithOtherSpace.find(container => container.containedSpace == otherSpace);


                if (newTargetContainer) {
                    // Avatar is in another space but close to a container
                    // that contained space is also contained in the current scene
                    setTargetContainer(newTargetContainer.container);
                    setLocation('otherContainer');
                } else {
                    // Avatar is not visible
                    setTargetContainer(null);
                    setLocation('');
                }
            }
        };

        runAsync();
    }, [space, otherSpace, currentSpace]);

    return active && location ? <>
        {location == 'same' ? <AvatarInSameSpace /> : null}
        {/* {location == 'other' ? <Varv property="locationHash">
            <AvatarInOtherSpace />
        </Varv> : null} */}
        {location == 'otherContainer' ? <Varv target={targetContainer}>
            <AvatarInOtherContainer />
        </Varv> : null}
    </> : null;
}

// FIXME: This does not work with the container case anymore
// function AvatarRemoteController() {
//     const [remoteControlled] = useProperty('remoteControlled');
//     const [position] = useProperty('position');
//     const [rotation] = useProperty('rotation');

//     const camera = useThree(state => state.camera);

//     useFrame(() => {
//         if (remoteControlled) {
//             camera.position.set(position[0], position[1], position[2]);
//             camera.rotation.set(rotation[0], rotation[1], rotation[2]);
//         }
//     });
// }

function Avatars() {
    return <>
        <Varv concept="Avatar" if="!isMine">
            <Avatar />
        </Varv>
        {/* <Varv concept="Avatar" if="isMine">
            <AvatarRemoteController />
        </Varv> */}
    </>;
}



export function Main() {
    return <Varv concept="AvatarManager" if="enabled">
        <Avatars />
    </Varv>;
}
