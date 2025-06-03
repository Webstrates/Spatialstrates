import React from 'react';
const { useState, useEffect } = React;
import { ErrorBoundary } from 'react-error-boundary';
import { PDBLoader } from 'three/addons/loaders/PDBLoader.js';
import { useLoader } from '@react-three/fiber';
import { HTMLContainer, stopEventPropagation } from 'tldraw';
import { useProperty } from '#VarvReact';

import { MovableShapeUtil, MovableVarvScope } from '#Spatialstrates .movable-shape';
import { CANVAS_SCALE } from '#Spatialstrates .projection-helpers';



function MoleculeShape({ shape, isEditing }) {
    const [url] = useProperty('url');
    const [note, setNote] = useProperty('note');
    const pdb = useLoader(PDBLoader, url);
    const [statistics, setStatistics] = useState(null);

    useEffect(() => {
        const atoms = pdb?.json?.atoms;
        if (!atoms) return;
        const atomCounts = {};
        atoms.forEach(atom => {
            const atomType = atom[4];
            if (!atomCounts[atomType]) {
                atomCounts[atomType] = 0;
            }
            atomCounts[atomType]++;
        });
        const atomCountEntries = Object.entries(atomCounts).sort((a, b) => a[0].localeCompare(b[0]));
        const atomCountTable = (
            <table>
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Count</th>
                    </tr>
                </thead>
                <tbody>
                    {atomCountEntries.map(([atomType, count]) => (
                        <tr key={atomType}>
                            <td>{atomType}</td>
                            <td>{count}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
        setStatistics(atomCountTable);
    }, [pdb]);

    return <HTMLContainer className="molecule-shape" style={{
        transform: 'translate(-50%, -50%)',
        width: shape.props.w + 'px',
        height: shape.props.h + 'px'
    }}>
        <div className="molecule-shape-url">{url}</div>
        <div className="molecule-shape-note">
            {isEditing ? <textarea
                placeholder="Add a note..."
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onPointerDown={stopEventPropagation} /> : note || 'Add a note...'}
        </div>
        <div className="molecule-shape-statistics">
            {statistics}
        </div>
    </HTMLContainer>;
}

class MoleculeShapeUtil extends MovableShapeUtil {
    static type = 'Molecule';

    getDefaultProps() {
        return Object.assign(super.getDefaultProps(), {
            w: CANVAS_SCALE * 0.4,
            h: CANVAS_SCALE * 0.4
        });
    }

    canEdit = () => true;

    component(shape) {
        const isEditing = this.editor.getEditingShapeId() === shape.id;

        return <MovableVarvScope shape={shape}>
            <ErrorBoundary fallback={null}>
                <MoleculeShape shape={shape} isEditing={isEditing} />
            </ErrorBoundary>
        </MovableVarvScope>;
    }
}

export const Main = MoleculeShapeUtil;
