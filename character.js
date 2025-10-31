import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Character {
    constructor(scene) {
        this.scene = scene;
        this.gltfLoader = new GLTFLoader();

        this.model = new THREE.Object3D();
        this.model.position.y = 0;
        this.scene.add(this.model);

        this.mixer = null;
        this.animations = {};
        
        this.speed = 10;
        this.rotationSpeed = 4;
        this.currentAction = null;

        this._createPlaceholder();
    }
    
    _createPlaceholder() {
        // A placeholder so we can see something before a model is loaded
        const geometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
        const material = new THREE.MeshStandardMaterial({ color: 0xffff00 });
        const capsule = new THREE.Mesh(geometry, material);
        capsule.position.y = 0.5;
        capsule.castShadow = true;
        this.model.add(capsule);
    }

    loadModel(url, onLoaded) {
        this.gltfLoader.load(url, (gltf) => {
            // Remove previous model
            if (this.model.children.length > 0) {
                this.scene.remove(this.model);
            }
            
            this.model = gltf.scene;
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            this.scene.add(this.model);

            this.mixer = new THREE.AnimationMixer(this.model);
            this.animations = {};
            gltf.animations.forEach((clip) => {
                const action = this.mixer.clipAction(clip);
                this.animations[clip.name.toLowerCase()] = action;
            });

            console.log('Loaded animations:', Object.keys(this.animations));
            if (onLoaded) onLoaded();
        });
    }

    update(deltaTime, moveState) {
        const moveDirection = new THREE.Vector3(0, 0, 0);
        if (moveState.forward) moveDirection.z -= 1;
        if (moveState.backward) moveDirection.z += 1;
        if (moveState.left) moveDirection.x -= 1;
        if (moveState.right) moveDirection.x += 1;

        const isMoving = moveDirection.lengthSq() > 0;
        
        if (this.mixer) {
            const walkAction = this.animations['walk'];
            if (isMoving && walkAction) {
                if (this.currentAction !== walkAction) {
                    walkAction.reset().fadeIn(0.2).play();
                    this.currentAction = walkAction;
                }
            } else if (this.currentAction) {
                this.currentAction.fadeOut(0.2);
                this.currentAction = null;
            }
            this.mixer.update(deltaTime);
        }

        if (isMoving) {
            moveDirection.normalize();
            
            // Rotate model to face move direction
            const targetQuaternion = new THREE.Quaternion();
            const targetAngle = Math.atan2(moveDirection.x, moveDirection.z);
            targetQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngle);
            this.model.quaternion.slerp(targetQuaternion, this.rotationSpeed * deltaTime);

            // Move the model
            this.model.position.add(moveDirection.multiplyScalar(this.speed * deltaTime));
        }
    }
}