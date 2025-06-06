import React from 'react';
const { useState, useEffect } = React;
import { useProperty } from '#VarvReact';



// TODO: This clears the existing scope but instead should extend it
function MovableVarvScope({ uuid, children }) {
    const [scope, setScope] = useState([]);
    // const parentScope = useContext(window.VarvScope);

    useEffect(() => {
        if (!uuid) return;
        const asyncLookup = async () => {
            const concept = await VarvEngine.getConceptFromUUID(uuid);
            setScope([new ConceptInstanceBinding(concept, uuid)]);
        };
        asyncLookup();
    }, [uuid]);

    // Adding the parent scope causes flickering again, no idea why
    // return <VarvScope.Provider value={[...parentScope, ...scope]}>
    return <VarvScope.Provider value={scope}>
        {scope.length > 0 ? children : null}
    </VarvScope.Provider>;
}

// Use this over <Varv property="movables"> to set the correct key for each movable
// Otherwise, it will re-render all movables every time the list changes
export function SpaceMovables({ children }) {
    const [movables] = useProperty('movables');

    return Array.isArray(movables) ? movables.map((movable) => <group key={movable}>
        <MovableVarvScope uuid={movable}>
            {children}
        </MovableVarvScope>
    </group>) : null;
}
