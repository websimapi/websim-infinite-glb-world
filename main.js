import * as THREE from 'three';
import { World } from './world.js';
import { Character } from './character.js';
import { Controls } from './controls.js';

class App {
    constructor() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.camera.position.set(0, 5, 10);

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 100, 500);

        this.renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#c'), antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;

        this.clock = new THREE.Clock();

        this._addLights();
        
        this.world = new World(this.scene);
        this.character = new Character(this.scene, this.camera);
        this.controls = new Controls(this.camera, this.renderer.domElement, this.character);
        
        this._setupFileUpload();
        this._setupRotationControls();
        this._setupScaleControls();

        window.addEventListener('resize', this._onWindowResize.bind(this));
        this.renderer.setAnimationLoop(this._animate.bind(this));
    }

    _addLights() {
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2);
        hemiLight.position.set(0, 20, 0);
        this.scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 3);
        dirLight.position.set(50, 50, 50);
        dirLight.castShadow = true;
        dirLight.shadow.camera.top = 30;
        dirLight.shadow.camera.bottom = -30;
        dirLight.shadow.camera.left = -30;
        dirLight.shadow.camera.right = 30;
        dirLight.shadow.camera.near = 0.1;
        dirLight.shadow.camera.far = 200;
        dirLight.shadow.mapSize.width = 4096;
        dirLight.shadow.mapSize.height = 4096;
        this.scene.add(dirLight);
    }

    _setupFileUpload() {
        const fileInput = document.getElementById('glb-upload');
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.character.parseGLB(e.target.result, () => {
                        document.getElementById('rotation-controls').style.display = 'block';
                        document.getElementById('scale-controls').style.display = 'block';
                    });
                };
                reader.readAsArrayBuffer(file);
            }
        });
    }

    _setupRotationControls() {
        const slider = document.getElementById('rotation-slider');
        const valueSpan = document.getElementById('rotation-value');

        slider.addEventListener('input', (event) => {
            const degrees = parseInt(event.target.value);
            valueSpan.textContent = degrees;
            const radians = THREE.MathUtils.degToRad(degrees);
            this.character.setInitialRotation(radians);
        });
    }

    _setupScaleControls() {
        const slider = document.getElementById('scale-slider');
        const valueSpan = document.getElementById('scale-value');

        slider.addEventListener('input', (event) => {
            const scale = parseFloat(event.target.value);
            valueSpan.textContent = scale.toFixed(1);
            this.character.setScale(scale);
        });
    }

    _onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    _animate() {
        const deltaTime = this.clock.getDelta();
        
        this.controls.update(deltaTime);
        this.character.update(deltaTime, this.controls.moveState);
        this.world.update(this.character.model.position);

        this.renderer.render(this.scene, this.camera);
    }
}

new App();