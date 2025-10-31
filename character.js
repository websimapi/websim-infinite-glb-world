import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Character {
    constructor(scene) {
        this.scene = scene;
        this.gltfLoader = new GLTFLoader();

        this.model = new THREE.Object3D();
        this.model.position.y = 0; // The character container is what moves
        this.scene.add(this.model);

        this.mixer = null;
        this.animations = {};
        
        this.speed = 10;
        this.rotationSpeed = 4;
        this.currentAction = null;

        // A wrapper for the loaded model to handle initial rotation
        this.modelWrapper = new THREE.Object3D();
        this.model.add(this.modelWrapper);

        this._createPlaceholder();
    }
    
    _createPlaceholder() {
        // A placeholder so we can see something before a model is loaded
        const geometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8); // Total height is 2
        const material = new THREE.MeshStandardMaterial({ color: 0xffff00 });
        const capsule = new THREE.Mesh(geometry, material);
        capsule.position.y = 1; // Sit on the ground
        capsule.castShadow = true;
        this.modelWrapper.add(capsule);
    }

    parseGLB(glbData, onLoaded) {
        this.gltfLoader.parse(glbData, '', (gltf) => {
            // Remove previous model
            if (this.modelWrapper.children.length > 0) {
                this.modelWrapper.remove(this.modelWrapper.children[0]);
            }
            
            const loadedModel = gltf.scene;

            // --- Position model on the ground ---
            const box = new THREE.Box3().setFromObject(loadedModel);
            const verticalOffset = -box.min.y;
            loadedModel.position.y = verticalOffset;
            // --- End positioning ---

            loadedModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            this.modelWrapper.add(loadedModel);
            // Reset wrapper rotation
            this.modelWrapper.rotation.y = 0;
            this.modelWrapper.scale.set(1, 1, 1);
            if (document.getElementById('rotation-slider')) {
                document.getElementById('rotation-slider').value = 0;
                document.getElementById('rotation-value').textContent = 0;
            }
            if (document.getElementById('scale-slider')) {
                document.getElementById('scale-slider').value = 1;
                document.getElementById('scale-value').textContent = '1.0';
            }


            this.mixer = new THREE.AnimationMixer(loadedModel);
            this.animations = {};
            gltf.animations.forEach((clip) => {
                const action = this.mixer.clipAction(clip);
                this.animations[clip.name.toLowerCase()] = action;
            });

            console.log('Loaded animations:', Object.keys(this.animations));
            if (onLoaded) onLoaded();
        });
    }

    loadModel(url, onLoaded) {
        this.gltfLoader.load(url, (gltf) => {
            // Remove previous model
            if (this.modelWrapper.children.length > 0) {
                this.modelWrapper.remove(this.modelWrapper.children[0]);
            }
            
            const loadedModel = gltf.scene;

            // --- Position model on the ground ---
            const box = new THREE.Box3().setFromObject(loadedModel);
            const verticalOffset = -box.min.y;
            loadedModel.position.y = verticalOffset;
            // --- End positioning ---

            loadedModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            this.modelWrapper.add(loadedModel);
            // Reset wrapper rotation
            this.modelWrapper.rotation.y = 0;
            this.modelWrapper.scale.set(1, 1, 1);
            if (document.getElementById('rotation-slider')) {
                document.getElementById('rotation-slider').value = 0;
                document.getElementById('rotation-value').textContent = 0;
            }
            if (document.getElementById('scale-slider')) {
                document.getElementById('scale-slider').value = 1;
                document.getElementById('scale-value').textContent = '1.0';
            }


            this.mixer = new THREE.AnimationMixer(loadedModel);
            this.animations = {};
            gltf.animations.forEach((clip) => {
                const action = this.mixer.clipAction(clip);
                this.animations[clip.name.toLowerCase()] = action;
            });

            console.log('Loaded animations:', Object.keys(this.animations));
            if (onLoaded) onLoaded();
        });
    }

    setInitialRotation(radians) {
        this.modelWrapper.rotation.y = radians;
    }

    setScale(scale) {
        this.modelWrapper.scale.set(scale, scale, scale);
    }

    update(deltaTime, moveState) {
        const moveDirection = new THREE.Vector3(0, 0, 0);
        if (moveState.forward) moveDirection.z -= 1;
        if (moveState.backward) moveDirection.z += 1;
        if (moveState.left) moveDirection.x -= 1;
        if (moveState.right) moveDirection.x += 1;

        const isMoving = moveDirection.lengthSq() > 0;
        
        if (this.mixer) {
            const walkAction = this.animations['walk'] || this.animations['walk_baked'];
            if (isMoving && walkAction) {
                if (this.currentAction !== walkAction) {
                    if (this.currentAction) {
                        this.currentAction.fadeOut(0.2);
                    }
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
            // Combine with initial wrapper rotation
            targetQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngle);
            this.model.quaternion.slerp(targetQuaternion, this.rotationSpeed * deltaTime);

            // Move the model
            this.model.position.add(moveDirection.multiplyScalar(this.speed * deltaTime));
        }
    }
}