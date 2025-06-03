import React from 'react';
const { useState, useEffect } = React;
import { Vega } from 'react-vega';



const VIS_SIZE = 190;

export const createStringHash = (string) => {
    return crypto.subtle.digest('SHA-1', new TextEncoder().encode(string)).then(hashBuffer => {
        return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    });
}

export function VegaLite2DVisualizationCanvas({ mergedSpec }) {
    const [specHash, setSpecHash] = useState('');
    const [finalSpec, setFinalSpec] = useState({});

    useEffect(() => {
        if (mergedSpec) {
            const newHash = createStringHash(JSON.stringify(mergedSpec));
            if (newHash !== specHash) {
                setSpecHash(newHash);

                mergedSpec.width = VIS_SIZE;
                mergedSpec.height = VIS_SIZE;

                setFinalSpec(mergedSpec);
            }
        } else {
            setFinalSpec({});
        }
    }, [mergedSpec]);

    return <Vega actions={false} spec={finalSpec} />;
}
