import React from 'react';
const { useEffect, useState, useRef, useCallback } = React;
import { Varv, useProperty } from '#VarvReact';

import { addControllerSubMenu, addItemToControllerSubMenu, ControllerMenuTitle, ControllerMenuSpacer, ControllerMenuButton } from '#ControllerMenu .default';
import { transcribeAudio } from '#AIHelpers .default';



function GoBackControllerButton() {
    const [, setCurrentSpace] = useProperty('locationHash');
    const historyRef = useRef([]);
    const programmaticHashRef = useRef(null);

    const handleHashChange = useCallback((e) => {
        const newHash = new URL(e.newURL).hash;
        const oldHash = new URL(e.oldURL).hash;

        // If this is a navigation we initiated, don't record it
        if (programmaticHashRef.current === newHash) {
            programmaticHashRef.current = null;
            return;
        }

        // Otherwise, record the old hash in history
        historyRef.current.push(oldHash);
    }, []);

    useEffect(() => {
        window.addEventListener('hashchange', handleHashChange);
        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, [handleHashChange]);

    const goBack = useCallback(() => {
        const lastSpace = historyRef.current.pop();
        if (lastSpace) {
            const targetHash = '#' + lastSpace.slice(1);
            programmaticHashRef.current = targetHash;
            setCurrentSpace(lastSpace.slice(1));
        }
    }, [setCurrentSpace]);

    return <ControllerMenuButton onClick={goBack}>Go Back</ControllerMenuButton>;
}

function SpaceSelectionButton() {
    const [currentSpace, setCurrentSpace] = useProperty('locationHash');
    const [name] = useProperty('name');
    const [uuid] = useProperty('concept::uuid');

    return <ControllerMenuButton
        onClick={() => setCurrentSpace(uuid)}
        toggled={currentSpace === uuid}
    >{name || 'Loading ...'}</ControllerMenuButton>;
}

function SpaceCreator() {
    const [, setCurrentSpace] = useProperty('locationHash');

    return <ControllerMenuButton onClick={async () => {
        const newSpaceUUID = await VarvEngine.getConceptFromType('Space').create(null, {
            name: 'New Space'
        });
        setCurrentSpace(newSpaceUUID);
    }}>Add Space</ControllerMenuButton>;
}

function SpaceRenamer() {
    const [, setName] = useProperty('name');
    const [listening, setListening] = useState(false);


    async function updateName() {
        if (listening) return;

        setListening(true);
        const newName = await transcribeAudio(5000, false, () => { setListening(false); });
        if (newName) setName(newName);
    }

    return <ControllerMenuButton onClick={updateName}>{listening ? 'Speak Now' : 'Record New Name'}</ControllerMenuButton>;
}

function SpaceColorChanger() {
    const [color, setColor] = useProperty('color');

    return <>
        <ControllerMenuButton toggled={color === ''} onClick={() => setColor('')}>Default</ControllerMenuButton>
        <ControllerMenuButton toggled={color === 'red'} onClick={() => setColor('red')}>Red</ControllerMenuButton>
        <ControllerMenuButton toggled={color === 'green'} onClick={() => setColor('green')}>Green</ControllerMenuButton>
        <ControllerMenuButton toggled={color === 'blue'} onClick={() => setColor('blue')}>Blue</ControllerMenuButton>
        <ControllerMenuButton toggled={color === 'yellow'} onClick={() => setColor('yellow')}>Yellow</ControllerMenuButton>
        <ControllerMenuButton toggled={color === 'purple'} onClick={() => setColor('purple')}>Purple</ControllerMenuButton>
        <ControllerMenuButton toggled={color === 'orange'} onClick={() => setColor('orange')}>Orange</ControllerMenuButton>
        <ControllerMenuButton toggled={color === 'pink'} onClick={() => setColor('pink')}>Pink</ControllerMenuButton>
    </>;
}

function EnvironmentButton({ currentEnvironment, setEnvironment }) {
    const [name] = useProperty('name');
    const [uuid] = useProperty('concept::uuid');

    return <ControllerMenuButton
        toggled={currentEnvironment === uuid}
        onClick={() => setEnvironment(uuid)}
    >{name || 'Unnamed'}</ControllerMenuButton>;
}

function SpaceEnvironmentChanger() {
    const [environment, setEnvironment] = useProperty('environment');

    return <>
        <ControllerMenuButton toggled={!environment} onClick={() => setEnvironment('')}>None</ControllerMenuButton>
        <Varv concept="Environment">
            <EnvironmentButton currentEnvironment={environment} setEnvironment={setEnvironment} />
        </Varv>
    </>;
}

addControllerSubMenu('spaces', 900, false);
addItemToControllerSubMenu('spaces', 'title', <ControllerMenuTitle title="Spaces" />, 0);
addItemToControllerSubMenu('spaces', 'go-back', <Varv concept="SpaceManager">
    <GoBackControllerButton />
</Varv>, 100);
addItemToControllerSubMenu('spaces', 'spacer', <ControllerMenuSpacer />, 150);
addItemToControllerSubMenu('spaces', 'spaces-list', <Varv concept="SpaceManager">
    <Varv concept="Space">
        <SpaceSelectionButton />
    </Varv>
</Varv>, 200);
addItemToControllerSubMenu('spaces', 'spacer2', <ControllerMenuSpacer />, 250);
addItemToControllerSubMenu('spaces', 'spaces-creator', <Varv concept="SpaceManager">
    <SpaceCreator />
</Varv>, 300);

addControllerSubMenu('currentSpace', 1000, false);
addItemToControllerSubMenu('currentSpace', 'title', <ControllerMenuTitle title="Current Space" />, 0);
addItemToControllerSubMenu('currentSpace', 'spaces-renamer', <Varv concept="SpaceManager">
    <Varv property="locationHash">
        <SpaceRenamer />
    </Varv>
</Varv>, 200);
addItemToControllerSubMenu('currentSpace', 'spacer', <ControllerMenuSpacer />, 250);
addItemToControllerSubMenu('currentSpace', 'spaces-color-changer', <Varv concept="SpaceManager">
    <Varv property="locationHash">
        <SpaceColorChanger />
    </Varv>
</Varv>, 300);
addItemToControllerSubMenu('currentSpace', 'spacer2', <ControllerMenuSpacer />, 350);
addItemToControllerSubMenu('currentSpace', 'spaces-environment-changer', <Varv concept="SpaceManager">
    <Varv property="locationHash">
        <SpaceEnvironmentChanger />
    </Varv>
</Varv>, 400);
