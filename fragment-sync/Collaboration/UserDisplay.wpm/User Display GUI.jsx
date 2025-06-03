import React from 'react';
const { useState, useEffect } = React;
import { Varv, useProperty } from '#VarvReact';



function UserUpdater() {
    const [localUser] = useProperty('localUser');
    const [locationHash] = useProperty('locationHash'); // SpaceManager
    const [previousLocalUser, setPreviousLocalUser] = useState(false);

    useEffect(() => {
        if (previousLocalUser && previousLocalUser !== localUser) {
            VarvEngine.getConceptFromType('User').setPropertyValue(previousLocalUser, 'space', '');
        }
    }, [previousLocalUser, localUser]);

    useEffect(() => {
        if (!locationHash) return;

        if (localUser) {
            VarvEngine.getConceptFromType('User').setPropertyValue(localUser, 'space', locationHash);
        }

        setPreviousLocalUser(localUser);
    }, [localUser, locationHash]);
}

function UserIcon() {
    const [localUser] = useProperty('localUser');
    const [userUUID] = useProperty('concept::uuid');
    const [locationHash] = useProperty('locationHash'); // SpaceManager
    const [space] = useProperty('space');
    const [name] = useProperty('name');

    return space == locationHash ? <div className={`user-icon ${localUser == userUUID ? 'local-user' : ''}`}>{name || ''}</div> : null;
}

export function Main() {
    return <Varv concept="UserManager">
        <Varv concept="SpaceManager">
            <UserUpdater />
            <div className="user-display">
                <Varv concept="User">
                    <UserIcon />
                </Varv>
            </div>
        </Varv>
    </Varv>;
}
