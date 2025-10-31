import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this._createGround();
    }

    _createGround() {
        const groundGeo = new THREE.PlaneGeometry(1000, 1000);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
        this.ground = new THREE.Mesh(groundGeo, groundMat);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);

        this.grid = new THREE.GridHelper(1000, 100, 0x000000, 0x000000);
        this.grid.material.opacity = 0.2;
        this.grid.material.transparent = true;
        this.scene.add(this.grid);
    }

    update(playerPosition) {
        // Center the grid and ground on the player for the "infinite" effect
        const gridOffset = 50;
        this.grid.position.x = Math.floor(playerPosition.x / gridOffset) * gridOffset;
        this.grid.position.z = Math.floor(playerPosition.z / gridOffset) * gridOffset;
        
        this.ground.position.copy(this.grid.position);
    }
}