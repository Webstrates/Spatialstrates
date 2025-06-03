export const SPEC_COMPONENT_TYPE = 'spec';
export const DATASET_COMPONENT_TYPE = 'dataset';
export const UNKNOWN_COMPONENT_TYPE = 'unknown';

export const COMPONENT_CONTAINER_SELECTOR = '#vis-component-container';
export const SPEC_CONTAINER_SELECTOR = '#vis-component-container .spec-container';
export const DATASET_CONTAINER_SELECTOR = '#vis-component-container .dataset-container';

export const GROUPS_CONTAINER_SELECTOR = '#vis-group-container';

export const generateComponentId = () => {
    return `vis-component-${crypto.randomUUID().replaceAll('-', '').slice(0, 20)}`;
};

export const getVegaLiteSchema = async () => {
    if (window.vegaLiteSchema) {
        return window.vegaLiteSchema;
    }

    const response = await fetch('https://vega.github.io/schema/vega-lite/v5.json');
    const vegaLiteSchema = await response.json();
    window.vegaLiteSchema = vegaLiteSchema;

    return vegaLiteSchema;
};

// Has to match the options set in getDefaultVisPiecesLibrary
export const getOptionsForPath = async (path) => {
    const schema = await getVegaLiteSchema();

    switch (path) {
        case 'data.fragment':
            return { type: 'dataset' };
        case 'mark':
        case 'mark.type':
            return {
                type: 'enum',
                // enum: schema.definitions.Mark.enum
                enum: ['bar', 'line', 'point', 'area', 'rect', 'square', 'circle']
            };
        case 'mark.opacity':
            return {
                type: 'number',
                min: 0,
                max: 1
            };
        case 'mark.filled':
            return { type: 'boolean' };
        case 'mark.color':
        case 'mark.fill':
        case 'mark.stroke':
            return { type: 'color' };

        case 'encoding.x.type':
        case 'encoding.y.type':
        case 'encoding.z.type':
        case 'encoding.color.type':
            return {
                type: 'enum',
                enum: schema.definitions.StandardType.enum
            };
        case 'encoding.x.field':
        case 'encoding.y.field':
        case 'encoding.z.field':
        case 'encoding.color.field':
            return { type: 'field' };
        case 'encoding.x.aggregate':
        case 'encoding.y.aggregate':
        case 'encoding.z.aggregate':
        case 'encoding.color.aggregate':
            return {
                type: 'enum',
                // enum: schema.definitions.AggregateOp.enum
                enum: ['count', 'mean', 'median', 'min', 'max', 'sum', 'average']
            };
        case 'encoding.x.sort':
        case 'encoding.y.sort':
        case 'encoding.z.sort':
        case 'encoding.color.sort':
            return {
                type: 'enum',
                // enum: schema.definitions.SortOrder.enum
                enum: ['ascending', 'descending', 'true', 'false']
            };
        case 'encoding.x.color':
        case 'encoding.y.color':
        case 'encoding.z.color':
        case 'encoding.color.color':
            return { type: 'color' };

        // TODO: Add transforms?

        default:
            return null;
    }
};

class VisPiece {
    constructor(path, content) {
        this.path = path;
        this.content = content;
    }
}

export const getDefaultVisPiecesLibrary = () => {
    const library = [];

    // Mark properties
    library.push(new VisPiece('mark.type', 'bar'));
    library.push(new VisPiece('mark.opacity', '0.7'));
    library.push(new VisPiece('mark.color', '#1f77b4'));
    library.push(new VisPiece('mark.filled', 'true'));
    library.push(new VisPiece('mark.fill', '#1f77b4'));
    library.push(new VisPiece('mark.stroke', '#000000'));

    // Encoding properties
    // const encodings = ['x', 'y', 'z', 'color', 'size'];
    const encodings = ['x'];
    for (const encoding of encodings) {
        library.push(new VisPiece(`encoding.${encoding}.type`, 'nominal'));
        library.push(new VisPiece(`encoding.${encoding}.field`, ''));
        library.push(new VisPiece(`encoding.${encoding}.aggregate`, ''));
        library.push(new VisPiece(`encoding.${encoding}.sort`, 'ascending'));
        library.push(new VisPiece(`encoding.${encoding}.color`, 'blue'));
    }

    // Transforms
    library.push(new VisPiece('transform', '[{"aggregate":""}]'));
    library.push(new VisPiece('transform', '[{"calculate":""}]'));
    library.push(new VisPiece('transform', '[{"filter":""}]'));

    return library;
};
