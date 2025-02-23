import React from 'react';
const { useState, useEffect } = React;
import { Varv, useProperty } from '#VarvReact';



function UserRenamer() {
    const [name, setName] = useProperty('name');
    return <label>
        Rename User
        <input value={name ? name : ''} onChange={e => setName(e.target.value)} title='Rename User' />
    </label>;
}

function UserSelector({ selectUser }) {
    const [name] = useProperty('name');
    const [localUser] = useProperty('localUser');
    const [uuid] = useProperty('concept::uuid');

    const deleteUser = (e) => {
        e.stopPropagation();
        VarvEngine.getConceptFromType('User').delete(uuid);
    };

    return <div className='user' local={localUser == uuid ? 'true' : null} onClick={() => selectUser(uuid)} title={'Select User ' + name}>
        <span className="user-name">{name}</span>
        <span className="delete-icon material-icons-outlined" onClick={deleteUser} title="Delete User">delete</span>
    </div>;
}

function Login() {
    const [enabled, setEnabled] = useState(false);
    const [localUser, setLocalUser] = useProperty('localUser');
    const userConcept = VarvEngine.getConceptFromType('User');

    useEffect(() => {
        if (localUser) return;

        const runAsync = async () => {
            const users = await VarvEngine.lookupInstances('User');
            try {
                if (users.length > 0) {
                    await setLocalUser(users[0]);
                } else {
                    const uuid = await userConcept.create(null, { name: 'Guest' });
                    await setLocalUser(uuid);
                }
            } catch (e) {
                // Sometimes there are timing issues with `setLocalUser`
            }
        };

        runAsync();
    }, [setLocalUser]);

    const addUser = async () => {
        setLocalUser(await userConcept.create(null, { name: 'User ' + Math.floor(Math.random() * 1000) }));
    };

    const selectUser = (userId) => {
        setLocalUser(userId);
    };

    return <>
        {enabled ? <div className="user-manager-modal" onClick={() => setEnabled(false)}>
            <div className="user-manager" onClick={(e) => e.stopPropagation()}>
                <div className="user-headline">User Selection</div>
                <div className="user-menu">
                    <button title="Add User" onClick={addUser}>Add User</button>
                    <Varv property="localUser">
                        <UserRenamer />
                    </Varv>
                </div>
                <div className="user-list">
                    <Varv concept="User">
                        <UserSelector selectUser={selectUser} />
                    </Varv>
                </div>
            </div>
        </div> : null}

        <div className="user-manager-button" onClick={() => setEnabled(true)}>User Manager</div>
    </>;
}

export function Main() {
    return <Varv concept="UserManager">
        <Login />
    </Varv>;
}
