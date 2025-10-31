import * as THREE from 'three';

export class Controls {
    constructor(camera, domElement, character) {
        this.camera = camera;
        this.domElement = domElement;
        this.character = character;

        this.moveState = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };

        this.cameraOffset = new THREE.Vector3(0, 5, 10);
        this.lookAtOffset = new THREE.Vector3(0, 2, 0);

        this.isMouseDown = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.cameraRotation = { horizontal: 0, vertical: 0 };

        this._setupEventListeners();
    }

    _setupEventListeners() {
        document.addEventListener('keydown', this._onKeyDown.bind(this));
        document.addEventListener('keyup', this._onKeyUp.bind(this));

        this.domElement.addEventListener('mousedown', this._onMouseDown.bind(this));
        this.domElement.addEventListener('mouseup', this._onMouseUp.bind(this));
        this.domElement.addEventListener('mousemove', this._onMouseMove.bind(this));
    }

    _onKeyDown(event) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.moveState.forward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.moveState.backward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.moveState.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.moveState.right = true;
                break;
        }
    }

    _onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.moveState.forward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.moveState.backward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.moveState.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.moveState.right = false;
                break;
        }
    }

    _onMouseDown(event) {
        this.isMouseDown = true;
        this.previousMousePosition.x = event.clientX;
        this.previousMousePosition.y = event.clientY;
    }

    _onMouseUp() {
        this.isMouseDown = false;
    }

    _onMouseMove(event) {
        if (!this.isMouseDown) return;

        const deltaX = event.clientX - this.previousMousePosition.x;
        const deltaY = event.clientY - this.previousMousePosition.y;

        this.cameraRotation.horizontal -= deltaX * 0.005;
        this.cameraRotation.vertical -= deltaY * 0.005;

        // Clamp vertical rotation to prevent flipping
        this.cameraRotation.vertical = Math.max(-Math.PI / 4, Math.min(Math.PI / 2.5, this.cameraRotation.vertical));

        this.previousMousePosition.x = event.clientX;
        this.previousMousePosition.y = event.clientY;
    }

    update(deltaTime) {
        // Calculate camera position based on character position and mouse rotation
        const characterPosition = this.character.model.position;
        const targetCameraPosition = new THREE.Vector3().copy(this.cameraOffset);

        // Apply horizontal rotation
        const horizontalQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraRotation.horizontal);
        targetCameraPosition.applyQuaternion(horizontalQuat);

        // Apply vertical rotation
        const verticalQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0).applyQuaternion(horizontalQuat), this.cameraRotation.vertical);
        targetCameraPosition.applyQuaternion(verticalQuat);

        targetCameraPosition.add(characterPosition);

        this.camera.position.lerp(targetCameraPosition, 10 * deltaTime);

        // Make camera look at character
        const lookAtPosition = new THREE.Vector3().copy(characterPosition).add(this.lookAtOffset);
        this.camera.lookAt(lookAtPosition);
    }
}