const DEBUG = false;
const MAX_DISTANCE = 0.5;



let positionProperty = null;
VarvEngine.registerEventCallback('engineReloaded', (evt) => {
    positionProperty = null;
});

async function getMovablePosition(movable) {
    if (!positionProperty) {
        let movableType = VarvEngine.getConceptFromType('Movable');
        if (DEBUG) console.log('Getting is');
        positionProperty = movableType.getProperty('position');
    }

    const [x, y, z] = await positionProperty.getValue(movable, true);

    return [x, y, z];
};

class ClosestMovableAction extends Action {
    constructor(name, options, concept) {
        super(name, options, concept);
    }
    async apply(contexts, actionArguments) {
        const self = this;

        return this.forEachContext(contexts, actionArguments, async (context, options) => {
            const movable = options.movable || context.target;
            const otherMovables = options.otherMovables;

            const movablePosition = await getMovablePosition(movable);
            let closest = '';
            let closestDistance = false;

            for (let i = 0; i < otherMovables.length; i++) {
                const currentPosition = await getMovablePosition(otherMovables[i]);
                const a = movablePosition[0] - currentPosition[0];
                const b = movablePosition[1] - currentPosition[1];
                const c = movablePosition[2] - currentPosition[2];
                const currentDistance = Math.sqrt(a * a + b * b + c * c);
                if (!closestDistance || (closestDistance > currentDistance)) {
                    if (currentDistance < MAX_DISTANCE) {
                        closest = otherMovables[i];
                    }
                    closestDistance = currentDistance;
                }
            }

            let resultName = Action.defaultVariableName(self);
            if (options.as != null) {
                resultName = options.as;
            }

            Action.setVariable(context, resultName, closest);

            return context;
        });
    }
}
Action.registerPrimitiveAction('closestMovable', ClosestMovableAction);
window.ClosestMovableAction = ClosestMovableAction;



class MovablesInRangeAction extends Action {
    constructor(name, options, concept) {
        super(name, options, concept);
    }
    async apply(contexts, actionArguments) {
        const self = this;

        return this.forEachContext(contexts, actionArguments, async (context, options) => {
            const movable = options.movable || context.target;
            const otherMovables = options.otherMovables;

            const maxDistance = options.maxDistance || MAX_DISTANCE;

            const movablePosition = await getMovablePosition(movable);
            let inRange = [];

            for (let i = 0; i < otherMovables.length; i++) {
                const currentPosition = await getMovablePosition(otherMovables[i]);
                const a = movablePosition[0] - currentPosition[0];
                const b = movablePosition[1] - currentPosition[1];
                const c = movablePosition[2] - currentPosition[2];
                const currentDistance = Math.sqrt(a * a + b * b + c * c);
                if (currentDistance < maxDistance) {
                    inRange.push(otherMovables[i]);
                }
            }

            let resultName = Action.defaultVariableName(self);
            if (options.as != null) {
                resultName = options.as;
            }

            Action.setVariable(context, resultName, inRange);

            return context;
        });
    }
}
Action.registerPrimitiveAction('movablesInRange', MovablesInRangeAction);
window.MovablesInRangeAction = MovablesInRangeAction;
