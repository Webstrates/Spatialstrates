import React from 'react';
const { useMemo } = React;

import { VegaLite2DVisualization } from '#Visualization .vega-lite-2d';
import { VegaLite25DVisualization } from '#Visualization .vega-lite-25d';
import { OptomancyVisualization } from '#Visualization .optomancy';



export function Visualization({ mergedSpec }) {
    const visualization = useMemo(() => {
        if (mergedSpec.encoding?.z) {
            return <OptomancyVisualization mergedSpec={mergedSpec} />;
        // } else if (mergedSpec.mark == 'arc'
        //     || mergedSpec.mark == 'image'
        //     || mergedSpec.mark == 'text'
        //     || mergedSpec.mark == 'trail'
        //     || mergedSpec.mark == 'geoshape'
        //     || mergedSpec.mark?.type == 'arc'
        //     || mergedSpec.mark?.type == 'image'
        //     || mergedSpec.mark?.type == 'text'
        //     || mergedSpec.mark?.type == 'trail'
        //     || mergedSpec.mark?.type == 'geoshape'
        // ) {
        } else {
            return <VegaLite2DVisualization mergedSpec={mergedSpec} />;
        // } else {
        //     return <VegaLite25DVisualization mergedSpec={mergedSpec} />;
        }
    }, [mergedSpec]);

    return visualization;
}
