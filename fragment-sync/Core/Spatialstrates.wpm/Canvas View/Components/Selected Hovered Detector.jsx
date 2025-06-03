import React from 'react';
const { useEffect } = React;
import { useEditor } from 'tldraw';



export function SelectedHoveredDetector() {
    const editor = useEditor();

    useEffect(() => {
        if (!editor) return;
        const movableConcepts = VarvEngine.getAllImplementingConceptNames('Movable');

        const detectSelectionChange = async (e) => {
            // FIXME: If not filtered this might be bad for performance
            // if (e.type != 'pointer') return;

            const selectedShapes = editor.getSelectedShapeIds();
            const hoveredShape = editor.getHoveredShapeId();

            const allMovableInstances = await VarvEngine.lookupInstances(movableConcepts);

            allMovableInstances.forEach(async (instance) => {
                await VarvEngine.getConceptFromUUID(instance).setPropertyValue(instance, 'selected', selectedShapes.includes('shape:' + instance));
                await VarvEngine.getConceptFromUUID(instance).setPropertyValue(instance, 'hovered', hoveredShape == 'shape:' + instance);
            });
        };

        editor.on('event', detectSelectionChange);
        return () => { editor.off('event', detectSelectionChange); };
    }, [editor]);
}
