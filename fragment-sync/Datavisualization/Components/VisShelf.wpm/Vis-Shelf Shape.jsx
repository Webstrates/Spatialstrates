import React from 'react';
const { useState, useEffect, useMemo, useCallback } = React;
import { HTMLContainer, stopEventPropagation } from 'tldraw';
import { useProperty } from '#VarvReact';

import { useGlobalEvents } from '#Spatialstrates .global-events';
import { MovableShapeUtil, MovableVarvScope } from '#Spatialstrates .movable-shape';
import { createMovable } from '#Spatialstrates .movable-helpers';
import { CANVAS_SCALE } from '#Spatialstrates .projection-helpers';

import { getDefaultVisPiecesLibrary } from '#VisModule .vis-helpers';
import { createVarvVisPieces, decomposeComponent } from '#VisModule .vis-composer';
import {
    getSpecComponents,
    getDatasetComponents,
    addVisComponentAddedListener,
    removeVisComponentAddedListener,
    addVisComponentRemovedListener,
    removeVisComponentRemovedListener
} from '#VisModule .vis-component-manager';
import { visThemes, getPieceTheme } from '#VisPiece .vis-helpers';



const DEBUG = false;

const generateDummies = (shelfComponents, setTempTitle) => {
    const dummies = [];

    for (let i = 0; i < shelfComponents.length; i++) {
        const component = shelfComponents[i];
        dummies.push(<VisComponentDummy
            component={component}
            key={i}
            setTempTitle={setTempTitle}
        />);
    }

    return dummies;
};

function VisComponentDummy({ component, setTempTitle }) {
    const [type, setType] = useState('');
    const [title, setTitle] = useState('');
    const [position] = useProperty('position');
    const visPieceConcept = VarvEngine.getConceptFromType('VisPiece');

    useEffect(() => {
        if (component.constructor.name === 'VisComponent') {
            setType(component.type);
            setTitle(component.name);
            component.addNameChangedListener(setTitle);
        } else if (component.constructor.name === 'VisPiece') {
            setType(getPieceTheme(component.path));
            setTitle(`${component.path}:${component.content}`);
        } else {
            setType('');
            setTitle('');
        }
        return () => {
            if (component.constructor.name === 'VisComponent') {
                component.removeNameChangedListener(setTitle);
            }
        }
    }, [component]);

    const { triggerEvent } = useGlobalEvents();

    const selectStartHandler = useCallback(async (e) => {
        stopEventPropagation(e);

        let newMovable;

        if (component.constructor.name === 'VisComponent') {
            const pieces = decomposeComponent(component);

            if (pieces.length === 1) {
                newMovable = await createMovable('VisPiece', {
                    path: pieces[0].path,
                    content: pieces[0].content,
                    position: position
                });
            } else {
                const pieceUUIDs = await createVarvVisPieces(pieces);

                newMovable = await createMovable('VisGroup', {
                    name: component.name,
                    pieces: pieceUUIDs,
                    position: position
                });

                for (let pieceUUID of pieceUUIDs) {
                    visPieceConcept.setPropertyValue(pieceUUID, 'group', newMovable);
                }
            }
        } else if (component.constructor.name === 'VisPiece') {
            newMovable = await createMovable('VisPiece', {
                path: component.path,
                content: component.content,
                position: position
            });
        } else {
            console.error('Unknown component type');
        }
    }, [triggerEvent, component, position]);

    const hoverCallback = (e) => {
        setTempTitle(title);
    };
    const blurCallback = (e) => {
        setTempTitle('');
    };

    return <div className={`vis-component-dummy ${type}`}
        onPointerOver={hoverCallback}
        onPointerOut={blurCallback}
        onPointerDown={selectStartHandler}
        style={{
            backgroundColor: visThemes[type]?.primary,
            borderColor: visThemes[type]?.secondary,
            pointerEvents: 'all'
        }}>
        {title}
    </div>;
}

function ShelfTypeSelector({ shelfType }) {
    const [type, setType] = useProperty('type');

    return <div className={`shelf-type-selector ${shelfType} ${type === shelfType ? 'active' : ''}`}
        onPointerDown={(e) => {
            stopEventPropagation(e);
            setType(shelfType);
        }}
        style={{
            backgroundColor: visThemes[shelfType].primary
        }} />
}

function VisShelfShape({ shape }) {
    const [type] = useProperty('type');
    const [dummies, setDummies] = useState([]);
    const [tempTitle, setTempTitle] = useState('');
    const [rows, setRows] = useState(2);
    const [columns, setColumns] = useState(2);

    const updateShelfComponents = () => {
        let shelfComponents = [];
        switch (type) {
            case 'spec':
                shelfComponents = getSpecComponents();
                break;
            case 'dataset':
                shelfComponents = getDatasetComponents();
                break;
            case 'piece':
                shelfComponents = getDefaultVisPiecesLibrary();
                break;
            default:
                if (DEBUG) console.log('Unknown VisShelf type: ' + type);
        }

        const newRows = Math.max(Math.ceil(Math.sqrt(shelfComponents.length)), 2);
        setRows(newRows);
        setColumns(Math.max(Math.ceil(shelfComponents.length / newRows), 2));

        setDummies(generateDummies(shelfComponents, setTempTitle));
    };

    useEffect(() => {
        updateShelfComponents();

        addVisComponentAddedListener(updateShelfComponents);
        addVisComponentRemovedListener(updateShelfComponents);
        return () => {
            removeVisComponentAddedListener(updateShelfComponents);
            removeVisComponentRemovedListener(updateShelfComponents);
        };
    }, [type]);

    const title = useMemo(() => {
        switch (type) {
            case 'spec': return 'Specs';
            case 'dataset': return 'Datasets';
            case 'piece': return 'Pieces';
            default: return 'Unknown';
        }
    }, [type]);

    return <HTMLContainer className="vis-shelf-shape" style={{
        transform: 'translate(-50%, -50%)',
        width: shape.props.w + 'px',
        height: shape.props.h + 'px',
        pointerEvents: 'all'
    }}>
        <div className="title">{tempTitle ? tempTitle : title}</div>
        <div className="shelf-type-selectors">
            <ShelfTypeSelector shelfType="spec" />
            <ShelfTypeSelector shelfType="dataset" />
            <ShelfTypeSelector shelfType="piece" />
        </div>
        <div className="shelf" style={{
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`
        }}>
            {dummies}
        </div>
    </HTMLContainer>;
}

class VisShelfShapeUtil extends MovableShapeUtil {
    static type = 'VisShelf';

    getDefaultProps() {
        return Object.assign(super.getDefaultProps(), {
            w: CANVAS_SCALE * 0.5,
            h: CANVAS_SCALE * 0.5
        });
    }

    component(shape) {
        return <MovableVarvScope shape={shape}>
            <VisShelfShape shape={shape} />
        </MovableVarvScope>;
    }
}

export const Main = VisShelfShapeUtil;
