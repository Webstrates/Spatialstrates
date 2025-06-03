import React from 'react';
const { useState, useContext, createContext, useMemo, useEffect } = React;
import { useProperty } from '#VarvReact';

import { Main as StickyNote } from '#StickyNote .default';
import { Main as Image } from '#Image .default';
import { Main as Trashcan } from '#Trashcan .default';
import { Main as Flashlight } from '#Flashlight .default';
import { Main as Model } from '#Model .default';
import { Main as Molecule } from '#Molecule .default';
import { Main as Clemens } from '#Clemens .default';

import { Main as ScreenStream } from '#ScreenStream .default';

import { Main as VisPiece } from '#VisPiece .vis-piece';
import { Main as VisGroup } from '#VisPiece .vis-group';
import { Main as VisShelf } from '#VisShelf .default';



if (!window.SceneMovablesContext) window.SceneMovablesContext = createContext();

// One central location to import all custom space components with exception of containers
export const SceneMovablesProvider = ({ children }) => {
    const value = useMemo(() => <>
        <StickyNote />
        <Image />
        <Trashcan />
        <Flashlight />
        <Model />
        <Molecule />
        <Clemens />

        <ScreenStream />

        <VisPiece />
        <VisGroup />
        <VisShelf />
    </>, []);

    return (
        <SceneMovablesContext.Provider value={value}>
            {children}
        </SceneMovablesContext.Provider>
    );
};

export const useSceneMovables = () => useContext(SceneMovablesContext);

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
