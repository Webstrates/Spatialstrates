import { Vector3 } from 'three';



export const devicePositionWithOffset = (device, offset = 0) => {
    let x = 0;
    let y = 0;
    let z = 0;

    if (device) {
        let position = device.position;

        // If the distance option is given we move the position in the direction the device is looking
        if (offset != 0) {
            const direction = new Vector3(0, 0, -1);
            direction.normalize();
            direction.applyQuaternion(device.quaternion);

            position = new Vector3();
            position.copy(device.position).add(direction.multiplyScalar(offset));
        }

        x = position.x;
        y = position.y;
        z = position.z;
    }

    return [x, y, z];
};

export const deviceRotation = (device) => {
    let x = 0;
    let y = 0;
    let z = 0;

    if (device) {
        x = device.rotation._x;
        y = device.rotation._y;
        z = device.rotation._z;
    }

    return [x, y, z];
};

export const getDeviceFromInputEvent = (e) => {
    let device;

    if (e.nativeEvent?.inputSource?.handedness) {
        if (e.nativeEvent?.inputSource?.hand === null) {
            device = e.nativeEvent.inputSource.handedness === 'right' ? window.moduleDeviceManager.controllerRight?.object : window.moduleDeviceManager.controllerLeft?.object;
        } else {
            device = e.nativeEvent.inputSource.handedness === 'right' ? window.moduleDeviceManager.handRight?.object : window.moduleDeviceManager.handLeft?.object;
        }
    } else {
        device = window.moduleDeviceManager.camera;
    }

    if (!device) {
        console.warn('No device found.');
        return;
    } else {
        return device;
    }
};
