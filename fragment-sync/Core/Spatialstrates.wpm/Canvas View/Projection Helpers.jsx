import { Vector3 } from 'three';
import { PCA } from 'ml-pca';



export const CANVAS_SCALE = 500;

export const shapeToConceptId = shapeId => shapeId.replace('shape:', '');

export const projectToCanvas = (point3D, projectionPlane) => {
    const point = new Vector3().fromArray(point3D);
    const origin = new Vector3().fromArray(projectionPlane.slice(0, 3));
    const xAxis = new Vector3().fromArray(projectionPlane.slice(3, 6));
    const yAxis = new Vector3().fromArray(projectionPlane.slice(6, 9));

    const pointToOrigin = point.clone().sub(origin);

    const x = pointToOrigin.dot(xAxis);
    const y = pointToOrigin.dot(yAxis);

    return [x, y];
};

export const projectToScene = (point2D, projectionPlane) => {
    const origin = new Vector3().fromArray(projectionPlane.slice(0, 3));
    const xAxis = new Vector3().fromArray(projectionPlane.slice(3, 6));
    const yAxis = new Vector3().fromArray(projectionPlane.slice(6, 9));

    const point = origin.clone()
        .add(xAxis.clone().multiplyScalar(point2D[0]))
        .add(yAxis.clone().multiplyScalar(point2D[1]));

    return point.toArray();
};

export const projectToCanvasIn3D = (point3D, projectionPlane) => {
    const point = new Vector3().fromArray(point3D);
    const origin = new Vector3().fromArray(projectionPlane.slice(0, 3));
    const xAxis = new Vector3().fromArray(projectionPlane.slice(3, 6));
    const yAxis = new Vector3().fromArray(projectionPlane.slice(6, 9));
    const zAxis = new Vector3().fromArray(projectionPlane.slice(9, 12));

    const pointToOrigin = point.clone().sub(origin);

    const x = pointToOrigin.dot(xAxis);
    const y = pointToOrigin.dot(yAxis);
    const z = pointToOrigin.dot(zAxis);

    return [x, y, z];
};

export const updatePointFromCanvas = (oldPoint3D, newPoint2D, projectionPlane) => {
    const oldPoint = new Vector3().fromArray(oldPoint3D);
    const origin = new Vector3().fromArray(projectionPlane.slice(0, 3));
    const xAxis = new Vector3().fromArray(projectionPlane.slice(3, 6));
    const yAxis = new Vector3().fromArray(projectionPlane.slice(6, 9));
    const zAxis = new Vector3().fromArray(projectionPlane.slice(9, 12));

    // move the point in 3D space along the projection plane keeping the distance to it
    const pointToOrigin = oldPoint.clone().sub(origin);

    const newPoint = origin.clone()
        .add(xAxis.clone().multiplyScalar(newPoint2D[0]))
        .add(yAxis.clone().multiplyScalar(newPoint2D[1]))
        .add(zAxis.clone().multiplyScalar(pointToOrigin.dot(zAxis)));

    return newPoint.toArray();
};


export const getSpaceManagerUUID = async () => {
    const spaceManagerUUIDs = await VarvEngine.getAllUUIDsFromType('SpaceManager');
    if (spaceManagerUUIDs.length === 0) {
        console.log('No space manager found');
        return false;
    }
    return spaceManagerUUIDs[0];
};

export const getCurrentSpaceUUID = async () => {
    const spaceManagerUUID = await getSpaceManagerUUID();
    const spaceUUID = await VarvEngine.getConceptFromType('SpaceManager').getPropertyValue(spaceManagerUUID, 'locationHash');
    if (!spaceUUID) {
        console.log('No space found');
        return false;
    }
    return spaceUUID;
};

export const computeProjectionPlaneUsingPCA = async (spaceUUIDParam, movableUUIDsParam) => {
    const spaceUUID = spaceUUIDParam || await getCurrentSpaceUUID();

    let movablesUUIDs = movableUUIDsParam;
    if (!movablesUUIDs) {
        movablesUUIDs = await VarvEngine.getConceptFromType('Space').getPropertyValue(spaceUUID, 'movables');
    }

    if (!Array.isArray(movablesUUIDs) || movablesUUIDs.length < 3) {
        console.log('Not enough movables to calculate projection plane');
        return false;
    }

    const movables = await Promise.all(movablesUUIDs.map(uuid => {
        const concept = VarvEngine.getConceptFromUUID(uuid);
        return {
            uuid,
            type: concept.name,
            position: concept.getPropertyValue(uuid, 'position'),
            rotation: concept.getPropertyValue(uuid, 'rotation')
        };
    }));

    const points = movables.map(movable => [movable.position[0], movable.position[1], movable.position[2]]);

    // Calculate centroid
    const origin = points.reduce((acc, point) => {
        return acc.map((coord, i) => coord + point[i] / points.length);
    }, [0, 0, 0]);

    // Project points onto X-Z plane and center them
    const xzPoints = points.map(point => [
        point[0] - origin[0],
        point[2] - origin[2]  // Now using only X and Z components
    ]);

    // Calculate PCA on X-Z projected points to get main horizontal direction
    const xzPca = new PCA(xzPoints);
    const xzComponents = xzPca.getEigenvectors().to2DArray();

    // Get main horizontal direction (in X-Z plane)
    const mainDir = new Vector3(xzComponents[0][0], 0, xzComponents[0][1]).normalize();

    // Center the original points for full 3D PCA
    const centeredPoints = points.map(point =>
        point.map((coord, i) => coord - origin[i])
    );

    // Calculate full 3D PCA
    const pca = new PCA(centeredPoints);
    const components = pca.getEigenvectors().to2DArray();

    // Get the second principal component
    const secondComponent = new Vector3(...components[1]);

    // Project second component to be orthogonal to mainDir
    const secondDir = secondComponent.clone()
        .sub(mainDir.clone().multiplyScalar(secondComponent.dot(mainDir)))
        .normalize();

    // Calculate normal from main and second directions
    const normal = new Vector3().crossVectors(mainDir, secondDir);

    // Ensure secondDir has positive Y component (points somewhat upward)
    if (secondDir.y < 0) {
        secondDir.multiplyScalar(-1);
        normal.multiplyScalar(-1);
    }

    // Check if normal is pointing away from scene origin
    const originToPlane = new Vector3().fromArray(origin);
    if (normal.dot(originToPlane) > 0) {
        // Flip x and z axes to maintain right-handed coordinate system
        mainDir.multiplyScalar(-1);
        normal.multiplyScalar(-1);
    }

    const newProjectionPlane = [
        ...origin,
        ...mainDir.toArray(),
        ...secondDir.toArray(),
        ...normal.toArray()
    ];

    VarvEngine.getConceptFromType('Space').setPropertyValue(spaceUUID, 'projectionPlane', newProjectionPlane);

    return newProjectionPlane;
};

export const getProjectionPlaneFromTransform = async (spaceUUID, position, rotation) => {
    const normal = new Vector3(0, 1, 0).applyEuler(new Euler().fromArray(rotation));
    const origin = new Vector3().fromArray(position);

    const mainDir = new Vector3(1, 0, 0).applyEuler(new Euler().fromArray(rotation));
    const secondDir = new Vector3().crossVectors(normal, mainDir);

    const newProjectionPlane = [
        ...origin.toArray(),
        ...mainDir.toArray(),
        ...secondDir.toArray(),
        ...normal.toArray()
    ];

    VarvEngine.getConceptFromType('Space').setPropertyValue(spaceUUID, 'projectionPlane', newProjectionPlane);

    return newProjectionPlane;
};


export const toggleProjectionPlanePreview = async () => {
    const spaceManagerUUID = await getSpaceManagerUUID();

    const showProjectionPlane = await VarvEngine.getConceptFromType('SpaceManager').getPropertyValue(spaceManagerUUID, 'showProjectionPlane');

    VarvEngine.getConceptFromType('SpaceManager').setPropertyValue(spaceManagerUUID, 'showProjectionPlane', !showProjectionPlane);
};

export const toggleBoundaryPreview = async () => {
    const spaceManagerUUID = await getSpaceManagerUUID();

    const showBoundary = await VarvEngine.getConceptFromType('SpaceManager').getPropertyValue(spaceManagerUUID, 'showBoundary');

    VarvEngine.getConceptFromType('SpaceManager').setPropertyValue(spaceManagerUUID, 'showBoundary', !showBoundary);
};

export const resetProjectionPlane = async (spaceUUIDParam) => {
    const spaceUUID = spaceUUIDParam || await getCurrentSpaceUUID();

    VarvEngine.getConceptFromType('Space').setPropertyValue(spaceUUID, 'projectionPlane', [ 0, 1.5, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1 ]);
};

export const resetBoundary = async (spaceUUIDParam) => {
    const spaceUUID = spaceUUIDParam || await getCurrentSpaceUUID();

    VarvEngine.getConceptFromType('Space').setPropertyValue(spaceUUID, 'boundaryOrigin', [ 0, 1.5, 0 ]);
    VarvEngine.getConceptFromType('Space').setPropertyValue(spaceUUID, 'boundarySize', [ 0.5, 0.5, 0.5 ]);
};
