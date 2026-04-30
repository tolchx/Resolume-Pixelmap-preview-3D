import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

const canvas = document.getElementById('three-canvas');
const container = document.getElementById('three-container');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1220);

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100000);
// Para alinear con la perspectiva de la imagen (Eje X derecha rojo, Eje Y arriba verde, Eje Z hacia nosotros azul):
// Ponemos la cámara mirando desde una posición Z+ pero ligeramente elevada y a la derecha
camera.position.set(0, 0, 500); 
camera.up.set(0, 1, 0); // Eje Y es hacia arriba

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const ambient = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambient);

const dir = new THREE.DirectionalLight(0xffffff, 0.6);
dir.position.set(300, 500, 200);
scene.add(dir);

const grid = new THREE.GridHelper(2000, 40, 0x22d3ee, 0x1f2937);
grid.rotation.x = Math.PI / 2;
grid.position.z = 0;
scene.add(grid);

const axes = new THREE.AxesHelper(200);
scene.add(axes);
axes.rotation.x = Math.PI / 2;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 100, 0);
controls.update();

const navState = {
    enabled: false,
    locked: false,
    speed: 400,
    accel: 12,
    damping: 10,
    sensitivity: 0.002,
    invertX: false,
    invertY: false,
    pitch: 0,
    yaw: -Math.PI / 2
};
const navVel = new THREE.Vector3();
const navKeys = { w: false, a: false, s: false, d: false, q: false, e: false };
const navUp = new THREE.Vector3(0, 1, 0);
const navTmpForward = new THREE.Vector3();
const navTmpRight = new THREE.Vector3();
const navTmpMove = new THREE.Vector3();

function setNavEnabled(v) {
    navState.enabled = !!v;
    if (navState.enabled) {
        controls.enabled = false;
        transform.enabled = false;
    } else {
        transform.enabled = true;
        controls.enabled = true;
        navVel.set(0, 0, 0);
        if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
    }
}

function setNavSpeed(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return;
    navState.speed = Math.max(10, Math.min(2000, n));
}

function setNavSensitivity(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return;
    navState.sensitivity = Math.max(0.0005, Math.min(0.01, n));
}

function setNavInvert(inv) {
    navState.invertX = !!(inv && inv.x);
    navState.invertY = !!(inv && inv.y);
}

function syncNavAnglesFromCamera() {
    const dir = camera.getWorldDirection(new THREE.Vector3());
    const pitch = Math.asin(THREE.MathUtils.clamp(dir.z, -1, 1));
    const yaw = Math.atan2(dir.y, dir.x);
    navState.pitch = Math.max(-1.48, Math.min(1.48, pitch));
    navState.yaw = yaw;
}

function applyNavOrientation() {
    camera.up.copy(navUp);
    const cp = Math.cos(navState.pitch);
    const dir = new THREE.Vector3(
        Math.cos(navState.yaw) * cp,
        Math.sin(navState.yaw) * cp,
        Math.sin(navState.pitch)
    );
    camera.lookAt(camera.position.clone().add(dir));
}

function navUpdate(dt) {
    if (!navState.enabled) return;
    if (!navState.locked) return;
    const clampedDt = Math.max(0, Math.min(0.05, dt));

    navTmpForward.copy(camera.getWorldDirection(navTmpForward));
    navTmpForward.addScaledVector(navUp, -navTmpForward.dot(navUp));
    if (navTmpForward.lengthSq() < 1e-8) return;
    navTmpForward.normalize();
    navTmpRight.crossVectors(navTmpForward, navUp).normalize();

    navTmpMove.set(0, 0, 0);
    if (navKeys.w) navTmpMove.add(navTmpForward);
    if (navKeys.s) navTmpMove.addScaledVector(navTmpForward, -1);
    if (navKeys.d) navTmpMove.add(navTmpRight);
    if (navKeys.a) navTmpMove.addScaledVector(navTmpRight, -1);
    if (navKeys.e) navTmpMove.add(navUp);
    if (navKeys.q) navTmpMove.addScaledVector(navUp, -1);

    if (navTmpMove.lengthSq() > 1e-8) {
        navTmpMove.normalize().multiplyScalar(navState.speed);
        const k = 1 - Math.exp(-navState.accel * clampedDt);
        navVel.lerp(navTmpMove, k);
    } else {
        const k = Math.exp(-navState.damping * clampedDt);
        navVel.multiplyScalar(k);
    }

    camera.position.addScaledVector(navVel, clampedDt);
}

function requestNavLock() {
    if (!navState.enabled) return;
    if (document.pointerLockElement === renderer.domElement) return;
    renderer.domElement.requestPointerLock();
}

function onPointerLockChange() {
    navState.locked = document.pointerLockElement === renderer.domElement;
    if (navState.locked) {
        syncNavAnglesFromCamera();
        navVel.set(0, 0, 0);
    } else {
        navVel.set(0, 0, 0);
    }
}

function onNavMouseMove(ev) {
    if (!navState.enabled || !navState.locked) return;
    const sx = navState.invertX ? -1 : 1;
    const sy = navState.invertY ? -1 : 1;
    navState.yaw -= (ev.movementX || 0) * navState.sensitivity * sx;
    navState.pitch -= (ev.movementY || 0) * navState.sensitivity * sy;
    navState.pitch = Math.max(-1.48, Math.min(1.48, navState.pitch));
    applyNavOrientation();
}

document.addEventListener('pointerlockchange', onPointerLockChange);
document.addEventListener('mousemove', onNavMouseMove);
window.addEventListener('keydown', (e) => {
    if (!e) return;
    if (!navState.enabled) return;
    if ((e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) || e.isComposing) return;
    const k = String(e.key || '').toLowerCase();
    if (k === 'w') navKeys.w = true;
    if (k === 'a') navKeys.a = true;
    if (k === 's') navKeys.s = true;
    if (k === 'd') navKeys.d = true;
    if (k === 'q') navKeys.q = true;
    if (k === 'e') navKeys.e = true;
});
window.addEventListener('keyup', (e) => {
    if (!e) return;
    const k = String(e.key || '').toLowerCase();
    if (k === 'w') navKeys.w = false;
    if (k === 'a') navKeys.a = false;
    if (k === 's') navKeys.s = false;
    if (k === 'd') navKeys.d = false;
    if (k === 'q') navKeys.q = false;
    if (k === 'e') navKeys.e = false;
});

const homeTarget = new THREE.Vector3().copy(controls.target);
const homePos = new THREE.Vector3().copy(camera.position);
let currentViewRotDeg = { x: 0, y: 0, z: 0 };
let viewRotAnimToken = 0;

const transform = new TransformControls(camera, renderer.domElement);
transform.setMode('translate');
transform.setSpace('world');
transform.showX = true;
transform.showY = true;
transform.showZ = true;
transform.addEventListener('dragging-changed', (e) => {
    controls.enabled = !e.value;
    if (e && e.value) startAutosave();
    else stopAutosave();
});
transform.addEventListener('mouseDown', () => {
    activePreSnapshot = snapshotAll();
});
transform.addEventListener('mouseUp', () => {
    if (!activePreSnapshot) return;
    if (hasOverlap() || outOfBounds()) {
        applySnapshot(activePreSnapshot);
        if (typeof window.onInvalidTransform === 'function') window.onInvalidTransform('Transformación inválida (solapamiento o fuera de límites). Revertida.');
    } else {
        pushUndo(activePreSnapshot);
        saveState();
    }
    activePreSnapshot = null;
});
scene.add(transform);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const group = new THREE.Group();
scene.add(group);

let selected = null;
const selectedSet = new Set();
let primarySelected = '';
let snapEnabled = false;
let gridVisible = true;
let transformMode = 'translate';
let rectMode = 'output';
let sizeScale = 0.05;
const meshesByName = new Map();
const materialsByName = new Map();
const userModifiedByName = new Map();
const outlinesByName = new Map();
const outlineMatSelected = new THREE.LineBasicMaterial({ color: 0xfb2c8d, transparent: true, opacity: 0.95, depthTest: false });
let currentScreens = [];
const selectionProxy = new THREE.Object3D();
scene.add(selectionProxy);
selectionProxy.visible = false;
let proxyLastMatrix = new THREE.Matrix4();
let activePreSnapshot = null;
const undoStack = [];
const redoStack = [];
const maxHistory = 50;

// Spout variables
let spoutTexture = new THREE.Texture();
spoutTexture.colorSpace = THREE.SRGBColorSpace;
spoutTexture.generateMipmaps = false;
spoutTexture.minFilter = THREE.LinearFilter;
spoutTexture.magFilter = THREE.LinearFilter;
spoutTexture.wrapS = THREE.ClampToEdgeWrapping;
spoutTexture.wrapT = THREE.ClampToEdgeWrapping;
spoutTexture.flipY = true; // El servidor ya envía la imagen al derecho, así que usamos el default flipY=true de WebGL
let spoutEnabled = false;
let currentSpoutSender = '';
let wsSpout = null;
let lastSpoutWidth = 0;
let lastSpoutHeight = 0;
let spoutFrames = 0;
let spoutFps = 0;
let lastSpoutTime = 0;

function updateSpoutUI() {
    const statusDiv = document.getElementById('spout-status');
    const indicator = document.getElementById('spout-indicator');
    const text = document.getElementById('spout-text');
    if (!statusDiv) return;
    
    statusDiv.classList.remove('hidden');
    if (spoutEnabled) {
        indicator.className = 'w-2 h-2 rounded-full bg-green-500';
        const senderLabel = currentSpoutSender ? `[${currentSpoutSender}] ` : '';
        text.textContent = `Spout: Conectado ${senderLabel}(${lastSpoutWidth}x${lastSpoutHeight}) - ${spoutFps} FPS`;
    } else {
        indicator.className = 'w-2 h-2 rounded-full bg-red-500';
        text.textContent = 'Spout: Buscando...';
    }
}

setInterval(() => {
    if (spoutEnabled) {
        spoutFps = spoutFrames;
        spoutFrames = 0;
        updateSpoutUI();
    }
}, 1000);

function connectSpoutWebSocket() {
    if (wsSpout) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    wsSpout = new WebSocket(`${protocol}//${window.location.host}`);
    wsSpout.binaryType = 'blob';
    
    wsSpout.onopen = () => {
        console.log('Connected to Spout WebSocket');
    };
    
    wsSpout.onmessage = async (e) => {
        if (typeof e.data === 'string') {
            const msg = JSON.parse(e.data);
            if (msg.type === 'status') {
                spoutEnabled = msg.connected;
                currentSpoutSender = msg.sender || '';
                updateSpoutMaterials();
                updateSpoutUI();
            }
        } else if (e.data instanceof Blob) {
            try {
                const bmp = await createImageBitmap(e.data);
                if (spoutTexture.image) {
                    spoutTexture.image.close && spoutTexture.image.close();
                }
                spoutTexture.image = bmp;
                spoutTexture.needsUpdate = true;
                
                spoutFrames++;
                
                if (bmp.width !== lastSpoutWidth || bmp.height !== lastSpoutHeight) {
                    lastSpoutWidth = bmp.width;
                    lastSpoutHeight = bmp.height;
                    updateSpoutMaterials();
                    updateSpoutUI();
                }
            } catch (err) {
                console.error('Error decoding Spout frame:', err);
            }
        }
    };
    
    wsSpout.onclose = () => {
        console.log('Disconnected from Spout WebSocket. Retrying...');
        wsSpout = null;
        spoutEnabled = false;
        lastSpoutWidth = 0;
        lastSpoutHeight = 0;
        updateSpoutMaterials();
        updateSpoutUI();
        setTimeout(connectSpoutWebSocket, 3000);
    };
}
connectSpoutWebSocket();

function updateSpoutMaterials() {
    let globalMaxX = 0;
    let globalMaxY = 0;
    
    const screenOutBounds = new Map();
    
    for (const s of currentScreens) {
        // Límites globales
        const rectLayout = rectMode === 'output' ? (s.outputRect || s.inputRect) : s.inputRect;
        const lx = Number(rectLayout.x) || 0;
        const ly = Number(rectLayout.y) || 0;
        const lw = Number(rectLayout.w) || 1;
        const lh = Number(rectLayout.h) || 1;
        if (lx + lw > globalMaxX) globalMaxX = lx + lw;
        if (ly + lh > globalMaxY) globalMaxY = ly + lh;
        
        // Límites de salida (OutputRect) por pantalla (Screen)
        const screenName = s.screen || 'default';
        if (!screenOutBounds.has(screenName)) {
            screenOutBounds.set(screenName, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
        }
        const b = screenOutBounds.get(screenName);
        const outX = Number(s.outputRect?.x) || 0;
        const outY = Number(s.outputRect?.y) || 0;
        const outW = Number(s.outputRect?.w) || 1;
        const outH = Number(s.outputRect?.h) || 1;
        
        if (outX < b.minX) b.minX = outX;
        if (outY < b.minY) b.minY = outY;
        if (outX + outW > b.maxX) b.maxX = outX + outW;
        if (outY + outH > b.maxY) b.maxY = outY + outH;
    }
    
    // Detectar si la textura de Spout corresponde a un Screen específico (Advanced Output)
    // o si es la Composition entera.
    let matchedScreen = null;
    const isComposition = currentSpoutSender && currentSpoutSender.toLowerCase().includes('composition');
    
    if (!isComposition) {
        for (const [sName, b] of screenOutBounds.entries()) {
            const w = b.maxX - b.minX;
            const h = b.maxY - b.minY;
            
            const nameMatch = currentSpoutSender && sName && currentSpoutSender.toLowerCase().includes(sName.toLowerCase());
            // Tolerancia mayor por si hay redondeos o bordes negros
            const sizeMatch = Math.abs(lastSpoutWidth - w) < 20 && Math.abs(lastSpoutHeight - h) < 20;
            
            if (nameMatch || sizeMatch) {
                matchedScreen = { name: sName, bounds: b };
                break;
            }
        }
    }

    for (const s of currentScreens) {
        const mat = materialsByName.get(s.name);
        const mesh = meshesByName.get(s.name);
        if (!mat || !mesh) continue;
        
        if (spoutEnabled && lastSpoutWidth > 0 && lastSpoutHeight > 0) {
            mat.map = spoutTexture;
            mat.color.setHex(0xffffff);
            mat.emissive.setHex(0x000000);
            
            let u0 = 0, u1 = 1, v_top = 1, v_bottom = 0;
            
            if (matchedScreen && (s.screen || 'default') === matchedScreen.name) {
                // La textura Spout es el OUTPUT de esta pantalla.
                // Mapeamos usando las coordenadas OutputRect locales de esta pantalla.
                const outX = Number(s.outputRect?.x) || 0;
                const outY = Number(s.outputRect?.y) || 0;
                const outW = Number(s.outputRect?.w) || 1;
                const outH = Number(s.outputRect?.h) || 1;
                
                const localX = outX - matchedScreen.bounds.minX;
                const localY = outY - matchedScreen.bounds.minY;
                
                u0 = localX / lastSpoutWidth;
                u1 = (localX + outW) / lastSpoutWidth;
                v_top = 1.0 - (localY / lastSpoutHeight);
                v_bottom = 1.0 - ((localY + outH) / lastSpoutHeight);
            } else if (matchedScreen) {
                // La textura pertenece a otro Screen. Este slice se vuelve negro/vacío.
                u0 = 0; u1 = 0; v_top = 0; v_bottom = 0;
            } else {
                // La textura es la Composition. Usamos las coordenadas actuales (input/output).
                const rectToUse = rectMode === 'output' ? (s.outputRect || s.inputRect) : s.inputRect;
                const x = Number(rectToUse.x) || 0;
                const y = Number(rectToUse.y) || 0;
                const w = Number(rectToUse.w) || 1;
                const h = Number(rectToUse.h) || 1;
                
                const scaleX = Math.max(lastSpoutWidth, globalMaxX) || 1;
                const scaleY = Math.max(lastSpoutHeight, globalMaxY) || 1;
                
                u0 = x / scaleX;
                u1 = (x + w) / scaleX;
                v_top = 1.0 - (y / scaleY);
                v_bottom = 1.0 - ((y + h) / scaleY);
            }
            
            updateUVsDirectly(mesh, u0, u1, v_top, v_bottom);
        } else {
            if (!mat.userData.fallbackTexture) {
                mat.userData.fallbackTexture = makeScreenTexture(s.name, 1024);
            }
            mat.map = mat.userData.fallbackTexture;
            mat.color.setHex(0xffffff);
            mat.emissive.setHex(0x000000);
            resetUVs(mesh);
        }
        mat.needsUpdate = true;
    }
}

function updateUVsDirectly(mesh, u0, u1, v_top, v_bottom) {
    if (!mesh.geometry) return;
    const uvs = mesh.geometry.attributes.uv;
    if (!uvs) return;
    
    uvs.setXY(0, u0, v_top);
    uvs.setXY(1, u1, v_top);
    uvs.setXY(2, u0, v_bottom);
    uvs.setXY(3, u1, v_bottom);
    uvs.needsUpdate = true;
}

function resetUVs(mesh) {
    if (!mesh.geometry) return;
    const uvs = mesh.geometry.attributes.uv;
    if (!uvs) return;
    
    // Restauramos el mapeo estándar. La textura de fallback (CanvasTexture)
    // tiene flipY=true por defecto en Three.js, por lo que v=1 es el top.
    uvs.setXY(0, 0, 1);
    uvs.setXY(1, 1, 1);
    uvs.setXY(2, 0, 0);
    uvs.setXY(3, 1, 0);
    uvs.needsUpdate = true;
}
let projectKey = '';
let autosaveTimer = null;
let workspaceBox = null;
let gridRotationDeg = 0;

function emitHistoryChange() {
    window.dispatchEvent(new CustomEvent('historychange', {
        detail: {
            canUndo: undoStack.length > 0,
            canRedo: redoStack.length > 0,
            undoCount: undoStack.length,
            redoCount: redoStack.length
        }
    }));
}

/**
 * @returns {boolean}
 */
function canUndo() {
    return undoStack.length > 0;
}

/**
 * @returns {boolean}
 */
function canRedo() {
    return redoStack.length > 0;
}

function updateSceneTheme() {
    const isLight = document.body.classList.contains('theme-light');
    scene.background = new THREE.Color(isLight ? 0xf1f5f9 : 0x0b1220);
}

const themeObserver = new MutationObserver(() => updateSceneTheme());
themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
updateSceneTheme();

let lastW = 0;
let lastH = 0;
function resize() {
    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    if (w === lastW && h === lastH) return;
    lastW = w;
    lastH = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
}

function setGridVisible(v) {
    gridVisible = !!v;
    grid.visible = gridVisible;
}

function setSnapEnabled(v) {
    snapEnabled = !!v;
}

function setGridRotationDeg(deg) {
    const v = Math.max(-90, Math.min(90, Math.round(Number(deg) || 0)));
    gridRotationDeg = v;
    const rz = THREE.MathUtils.degToRad(v);
    grid.rotation.set(Math.PI / 2, 0, rz);
    axes.rotation.set(Math.PI / 2, 0, rz);
    window.dispatchEvent(new CustomEvent('gridrotchange', { detail: { deg: gridRotationDeg } }));
}

/**
 * @returns {number}
 */
function getGridRotationDeg() {
    return gridRotationDeg;
}

let gridRotateMode = false;
function setGridRotateMode(v) {
    gridRotateMode = !!v;
}

let bgDeselectArmed = false;
let bgDeselectArmTs = 0;
let bgDeselectArmTimer = null;

function emitSelection(meta) {
    if (typeof window.onScreenSelect3D !== 'function') return;
    window.onScreenSelect3D(primarySelected || Array.from(selectedSet)[0] || '', {
        ...meta,
        primary: primarySelected || Array.from(selectedSet)[0] || '',
        selectedNames: Array.from(selectedSet)
    });
}

function refreshOutlineGeometry(mesh, outline) {
    if (!mesh || !outline) return;
    if (outline.geometry) outline.geometry.dispose();
    outline.geometry = new THREE.EdgesGeometry(mesh.geometry);
    outline.position.z = 0.01;
    outline.renderOrder = 10;
}

function ensureOutline(mesh) {
    if (!mesh) return;
    const name = mesh.userData && mesh.userData.name ? mesh.userData.name : '';
    if (!name) return;
    const existing = outlinesByName.get(name);
    if (existing) return;
    const outline = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), outlineMatSelected);
    outline.visible = false;
    outline.frustumCulled = false;
    outline.position.z = 0.01;
    outline.renderOrder = 10;
    mesh.add(outline);
    outlinesByName.set(name, outline);
}

function updateSelectionOutlines() {
    for (const [name, outline] of outlinesByName.entries()) {
        const isSelected = selectedSet.has(name);
        outline.visible = isSelected;
        if (isSelected) outline.material = outlineMatSelected;
    }
}

function updateSelectionMaterials() {
    for (const [name, mat] of materialsByName.entries()) {
        if (!mat) continue;
        if (selectedSet.has(name)) {
            mat.emissive.setHex(0x000000);
            mat.color.setHex(0x6b7280);
        } else {
            mat.emissive.setHex(0x000000);
            mat.color.setHex(0xffffff);
        }
    }
    updateSelectionOutlines();
}

function computeCentroid(names) {
    const c = new THREE.Vector3();
    let n = 0;
    for (const name of names) {
        const mesh = meshesByName.get(name);
        if (!mesh) continue;
        c.add(mesh.position);
        n++;
    }
    if (!n) return c;
    return c.multiplyScalar(1 / n);
}

function attachForSelection() {
    if (!selectedSet.size) {
        transform.detach();
        selected = null;
        return;
    }
    if (selectedSet.size === 1) {
        const name = primarySelected || Array.from(selectedSet)[0];
        const mesh = meshesByName.get(name);
        if (!mesh) return;
        selected = name;
        transform.attach(mesh);
        transform.setMode(transformMode);
        return;
    }
    const center = computeCentroid(selectedSet);
    selectionProxy.position.copy(center);
    selectionProxy.rotation.set(0, 0, 0);
    selectionProxy.scale.set(1, 1, 1);
    selectionProxy.updateMatrixWorld(true);
    proxyLastMatrix.copy(selectionProxy.matrixWorld);
    selected = primarySelected || Array.from(selectedSet)[0];
    transform.attach(selectionProxy);
    transform.setMode(transformMode);
}

function getGroupTransform() {
    if (selectedSet.size < 2) return null;
    return {
        pos: { x: selectionProxy.position.x, y: selectionProxy.position.y, z: selectionProxy.position.z },
        rot: {
            x: THREE.MathUtils.radToDeg(selectionProxy.rotation.x),
            y: THREE.MathUtils.radToDeg(selectionProxy.rotation.y),
            z: THREE.MathUtils.radToDeg(selectionProxy.rotation.z)
        }
    };
}

function applyDeltaToSelected(delta, mode) {
    const clampPos = (m) => {
        const limit = 50000;
        m.position.x = Math.max(-limit, Math.min(limit, m.position.x));
        m.position.y = Math.max(-limit, Math.min(limit, m.position.y));
        m.position.z = Math.max(-limit, Math.min(limit, m.position.z));
    };
    for (const name of selectedSet) {
        const m = meshesByName.get(name);
        if (!m) continue;
        m.applyMatrix4(delta);
        clampPos(m);
        // Deshabilitar snap individual en transformaciones de grupo para no romper la relación espacial
        if (selectedSet.size === 1 && snapEnabled && mode === 'translate') {
            const s = 10;
            m.position.x = Math.round(m.position.x / s) * s;
            m.position.y = Math.round(m.position.y / s) * s;
            m.position.z = Math.round(m.position.z / s) * s;
        }
        m.updateMatrixWorld(true);
        userModifiedByName.set(name, true);
        if (typeof window.onScreenMove3D === 'function') window.onScreenMove3D(name, { x: m.position.x, y: m.position.y, z: m.position.z });
        if (typeof window.onScreenRotate3D === 'function') window.onScreenRotate3D(name, {
            x: THREE.MathUtils.radToDeg(m.rotation.x),
            y: THREE.MathUtils.radToDeg(m.rotation.y),
            z: THREE.MathUtils.radToDeg(m.rotation.z)
        });
    }
}

function setGroupTransform(payload) {
    if (selectedSet.size < 2) return;
    const before = snapshotAll();
    const pos = payload && payload.pos ? payload.pos : null;
    const rot = payload && payload.rot ? payload.rot : null;

    if (pos) selectionProxy.position.set(Number(pos.x) || 0, Number(pos.y) || 0, Number(pos.z) || 0);
    if (rot) {
        selectionProxy.rotation.set(
            THREE.MathUtils.degToRad(Number(rot.x) || 0),
            THREE.MathUtils.degToRad(Number(rot.y) || 0),
            THREE.MathUtils.degToRad(Number(rot.z) || 0)
        );
    }

    selectionProxy.updateMatrixWorld(true);
    const newMat = selectionProxy.matrixWorld.clone();
    const invPrev = new THREE.Matrix4().copy(proxyLastMatrix).invert();
    const delta = new THREE.Matrix4().multiplyMatrices(newMat, invPrev);
    proxyLastMatrix.copy(newMat);

    applyDeltaToSelected(delta, transformMode);

    if (hasOverlap() || outOfBounds()) {
        applySnapshot(before);
        if (typeof window.onInvalidTransform === 'function') window.onInvalidTransform('Transformación inválida (solapamiento o fuera de límites). Revertida.');
        return;
    }

    pushUndo(before);
    saveState();
}

function select(name, opts) {
    const mesh = meshesByName.get(name);
    if (!mesh) return;
    const toggle = !!(opts && opts.toggle);
    const replace = !!(opts && opts.replace);
    if (replace || !toggle) {
        selectedSet.clear();
        selectedSet.add(name);
        primarySelected = name;
    } else {
        if (selectedSet.has(name)) {
            selectedSet.delete(name);
            if (primarySelected === name) primarySelected = Array.from(selectedSet)[0] || '';
        } else {
            selectedSet.add(name);
            primarySelected = name;
        }
    }
    updateSelectionMaterials();
    attachForSelection();
    emitSelection({ toggle, replace });
}

function setTransformMode(mode) {
    const m = mode === 'rotate' ? 'rotate' : 'translate';
    transformMode = m;
    transform.setMode(transformMode);
}

let focusAnimToken = 0;
function focus(name) {
    const mesh = meshesByName.get(name);
    if (!mesh) return;
    const box = new THREE.Box3().setFromObject(mesh);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 1);
    const fov = camera.fov * (Math.PI / 180);
    const dist = (maxDim / (2 * Math.tan(fov / 2))) * 2.0;

    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const startUp = camera.up.clone();

    const viewDir = new THREE.Vector3().subVectors(camera.position, controls.target);
    if (viewDir.lengthSq() < 1e-6) viewDir.set(0, 1, 1);
    viewDir.normalize();

    const nextTarget = center.clone();
    const nextPos = nextTarget.clone().add(viewDir.multiplyScalar(dist)).add(new THREE.Vector3(0, dist * 0.25, 0));
    const nextUp = new THREE.Vector3(0, 1, 0);

    const token = ++focusAnimToken;
    const startTs = performance.now();
    const duration = 300;
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const step = () => {
        if (token !== focusAnimToken) return;
        const t = Math.min(1, (performance.now() - startTs) / duration);
        const k = ease(t);
        camera.position.lerpVectors(startPos, nextPos, k);
        controls.target.lerpVectors(startTarget, nextTarget, k);
        camera.up.lerpVectors(startUp, nextUp, k);
        camera.lookAt(controls.target);
        controls.update();
        if (t < 1) requestAnimationFrame(step);
        else setHomeFromCurrent();
    };
    requestAnimationFrame(step);
}

function clearScreens() {
    transform.detach();
    selected = null;
    selectedSet.clear();
    primarySelected = '';
    for (const outline of outlinesByName.values()) {
        if (outline && outline.geometry) outline.geometry.dispose();
    }
    outlinesByName.clear();
    meshesByName.clear();
    materialsByName.clear();
    userModifiedByName.clear();
    currentScreens = [];
    workspaceBox = null;
    undoStack.length = 0;
    redoStack.length = 0;
    emitHistoryChange();
    while (group.children.length) {
        const c = group.children.pop();
        if (c.geometry) c.geometry.dispose();
        if (c.material) c.material.dispose();
    }
}

function makeScreenTexture(label, size) {
    const s = Math.max(1024, Number(size) || 1024);
    const c = document.createElement('canvas');
    c.width = s;
    c.height = s;
    const g = c.getContext('2d');
    g.fillStyle = '#0B1220';
    g.fillRect(0, 0, s, s);

    g.strokeStyle = 'rgba(34, 211, 238, 0.18)';
    g.lineWidth = 2;
    for (let i = 64; i < s; i += 64) {
        g.beginPath();
        g.moveTo(i, 0);
        g.lineTo(i, s);
        g.stroke();
        g.beginPath();
        g.moveTo(0, i);
        g.lineTo(s, i);
        g.stroke();
    }

    g.lineWidth = 10;
    g.strokeStyle = 'rgba(96, 165, 250, 0.9)';
    g.strokeRect(18, 18, s - 36, s - 36);

    g.fillStyle = 'rgba(251, 44, 141, 0.85)';
    g.font = `bold ${Math.floor(s * 0.07)}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(String(label || ''), s / 2, s / 2);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    tex.needsUpdate = true;
    return tex;
}

function getRectForMode(s) {
    const r = rectMode === 'input' ? (s && s.inputRect) : (s && s.outputRect);
    const rw = r ? Number(r.w) : NaN;
    const rh = r ? Number(r.h) : NaN;
    if (Number.isFinite(rw) && Number.isFinite(rh) && rw > 0 && rh > 0) return r;
    const fb = s && s.outputRect ? s.outputRect : (s && s.inputRect ? s.inputRect : null);
    return fb || { x: 0, y: 0, w: 10, h: 10 };
}

function computeLayoutBounds(screens) {
    let minX = Infinity;
    let minY = Infinity;
    for (const s of screens) {
        const r = getRectForMode(s);
        const x = Number(r.x);
        const y = Number(r.y);
        if (Number.isFinite(x) && x < minX) minX = x;
        if (Number.isFinite(y) && y < minY) minY = y;
    }
    if (!Number.isFinite(minX)) minX = 0;
    if (!Number.isFinite(minY)) minY = 0;
    return { minX, minY };
}

function applyLayoutToMesh(mesh, screen, bounds, forcePosition) {
    const r = getRectForMode(screen);
    const rw = Math.max(1, Number(r.w) || 1);
    const rh = Math.max(1, Number(r.h) || 1);
    const w = Math.max(10, rw) * sizeScale;
    const h = Math.max(10, rh) * sizeScale;

    if (mesh.geometry) mesh.geometry.dispose();
    mesh.geometry = new THREE.PlaneGeometry(w, h);
    const outline = outlinesByName.get(mesh.userData && mesh.userData.name ? mesh.userData.name : '');
    if (outline) refreshOutlineGeometry(mesh, outline);

    if (forcePosition) {
        const x = (Number(r.x) - bounds.minX) * sizeScale + w / 2;
        // Invertimos el cálculo de Y: Resolume Y crece hacia abajo, Three.js Y crece hacia arriba.
        // Esto coloca el tope de las pantallas (Y=0 en Resolume) en Y=0 en Three.js y bajan hacia -Y.
        const y = - (Number(r.y) - bounds.minY) * sizeScale - h / 2;
        mesh.position.set(x, y, 0);
    }
}

function setScreens(screens) {
    clearScreens();
    if (!Array.isArray(screens) || !screens.length) return;
    currentScreens = screens.slice();
    const bounds = computeLayoutBounds(currentScreens);

    for (const s of currentScreens) {
        const mat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.1,
            roughness: 0.35,
            emissive: 0x000000,
            side: THREE.DoubleSide
        });
        const tex = makeScreenTexture(s.name, 1024);
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        mat.map = tex;
        mat.userData.fallbackTexture = tex;
        mat.needsUpdate = true;
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), mat);
        mesh.userData.name = s.name;
        mesh.position.set(0, 100, 0);

        const loc = s.loc3D || { x: 0, y: 0, z: 0 };
        const isAllZero = !loc.x && !loc.y && !loc.z;
        if (isAllZero) {
            applyLayoutToMesh(mesh, s, bounds, true);
            s.loc3D = { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z };
        } else {
            mesh.position.set(Number(loc.x) || 0, Number(loc.y) || 0, Number(loc.z) || 0);
            applyLayoutToMesh(mesh, s, bounds, false);
        }

        ensureOutline(mesh);
        group.add(mesh);
        meshesByName.set(s.name, mesh);
        materialsByName.set(s.name, mat);
        if (typeof window.onScreenMove3D === 'function') window.onScreenMove3D(s.name, { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z });
    }
    workspaceBox = new THREE.Box3().setFromObject(group);
    applySavedState();
    updateSpoutMaterials();
}

function setRectMode(mode) {
    rectMode = mode === 'input' ? 'input' : 'output';
    if (!currentScreens.length) return;
    const bounds = computeLayoutBounds(currentScreens);
    for (const s of currentScreens) {
        const mesh = meshesByName.get(s.name);
        if (!mesh) continue;
        const force = !userModifiedByName.get(s.name);
        applyLayoutToMesh(mesh, s, bounds, force);
    }
}

function setProjectKey(key) {
    projectKey = String(key || '');
}

function snapshotAll() {
    const out = [];
    for (const [name, mesh] of meshesByName.entries()) {
        out.push({
            name,
            p: [mesh.position.x, mesh.position.y, mesh.position.z],
            q: [mesh.quaternion.x, mesh.quaternion.y, mesh.quaternion.z, mesh.quaternion.w]
        });
    }
    return out;
}

function applySnapshot(snap) {
    if (!Array.isArray(snap)) return;
    for (const item of snap) {
        const mesh = meshesByName.get(item.name);
        if (!mesh) continue;
        mesh.position.set(item.p[0], item.p[1], item.p[2]);
        mesh.quaternion.set(item.q[0], item.q[1], item.q[2], item.q[3]);
        mesh.updateMatrixWorld(true);
        if (typeof window.onScreenMove3D === 'function') window.onScreenMove3D(item.name, { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z });
        if (typeof window.onScreenRotate3D === 'function') window.onScreenRotate3D(item.name, {
            x: THREE.MathUtils.radToDeg(mesh.rotation.x),
            y: THREE.MathUtils.radToDeg(mesh.rotation.y),
            z: THREE.MathUtils.radToDeg(mesh.rotation.z)
        });
    }
    attachForSelection();
}

function pushUndo(beforeSnap) {
    if (!beforeSnap) return;
    undoStack.push(beforeSnap);
    while (undoStack.length > maxHistory) undoStack.shift();
    redoStack.length = 0;
    emitHistoryChange();
}

function undo() {
    const snap = undoStack.pop();
    if (!snap) return;
    const current = snapshotAll();
    redoStack.push(current);
    applySnapshot(snap);
    emitHistoryChange();
}

function redo() {
    const snap = redoStack.pop();
    if (!snap) return;
    const current = snapshotAll();
    undoStack.push(current);
    applySnapshot(snap);
    emitHistoryChange();
}

function getSavedKey() {
    if (!projectKey) return '';
    return `resolume_state_${projectKey}`;
}

function applySavedState() {
    const key = getSavedKey();
    if (!key) return;
    let raw = '';
    try { raw = localStorage.getItem(key) || ''; } catch {}
    if (!raw) return;
    let obj = null;
    try { obj = JSON.parse(raw); } catch { obj = null; }
    if (!obj || !obj.items || !Array.isArray(obj.items)) return;
    const snap = obj.items;
    applySnapshot(snap);
}

function saveState() {
    const key = getSavedKey();
    if (!key) return;
    const snap = snapshotAll();
    try { localStorage.setItem(key, JSON.stringify({ items: snap })); } catch {}
}

function startAutosave() {
    if (autosaveTimer) return;
    autosaveTimer = setInterval(() => saveState(), 5000);
}

function stopAutosave() {
    if (!autosaveTimer) return;
    clearInterval(autosaveTimer);
    autosaveTimer = null;
}

function hasOverlap() {
    const names = Array.from(selectedSet);
    if (!names.length) return false;
    for (const aName of names) {
        const a = meshesByName.get(aName);
        if (!a) continue;
        const aBox = new THREE.Box3().setFromObject(a);
        for (const [bName, b] of meshesByName.entries()) {
            if (aName === bName) continue;
            const bBox = new THREE.Box3().setFromObject(b);
            if (aBox.intersectsBox(bBox)) return true;
        }
    }
    return false;
}

function outOfBounds() {
    if (!workspaceBox) return false;
    const names = Array.from(selectedSet);
    if (!names.length) return false;
    const margin = 2000;
    const limitBox = workspaceBox.clone().expandByScalar(margin);
    for (const name of names) {
        const mesh = meshesByName.get(name);
        if (!mesh) continue;
        const box = new THREE.Box3().setFromObject(mesh);
        if (!limitBox.containsBox(box)) return true;
    }
    return false;
}

function setObjectTransform(name, payload) {
    const mesh = meshesByName.get(name);
    if (!mesh) return;
    const before = snapshotAll();
    const pos = payload && payload.pos ? payload.pos : null;
    const rot = payload && payload.rot ? payload.rot : null;
    if (pos) mesh.position.set(Number(pos.x) || 0, Number(pos.y) || 0, Number(pos.z) || 0);
    if (rot) {
        mesh.rotation.set(
            THREE.MathUtils.degToRad(Number(rot.x) || 0),
            THREE.MathUtils.degToRad(Number(rot.y) || 0),
            THREE.MathUtils.degToRad(Number(rot.z) || 0)
        );
    }
    mesh.updateMatrixWorld(true);
    userModifiedByName.set(name, true);
    if (typeof window.onScreenMove3D === 'function') window.onScreenMove3D(name, { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z });
    if (typeof window.onScreenRotate3D === 'function') window.onScreenRotate3D(name, {
        x: THREE.MathUtils.radToDeg(mesh.rotation.x),
        y: THREE.MathUtils.radToDeg(mesh.rotation.y),
        z: THREE.MathUtils.radToDeg(mesh.rotation.z)
    });
    pushUndo(before);
}

function setHomeFromCurrent() {
    homeTarget.copy(controls.target);
    homePos.copy(camera.position);
}

function applyViewRotationDeg(deg) {
    const rx = THREE.MathUtils.degToRad(Number(deg.x) || 0);
    const ry = THREE.MathUtils.degToRad(Number(deg.y) || 0);
    const rz = THREE.MathUtils.degToRad(Number(deg.z) || 0);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'XYZ'));
    const offset = new THREE.Vector3().subVectors(homePos, homeTarget);
    const nextOffset = offset.applyQuaternion(q);
    camera.position.copy(homeTarget).add(nextOffset);
    camera.up.set(0, 1, 0).applyQuaternion(q);
    camera.lookAt(homeTarget);
    controls.target.copy(homeTarget);
    controls.update();
}

function setViewRotationDeg(deg, animate) {
    const next = {
        x: Math.max(-180, Math.min(180, Number(deg.x) || 0)),
        y: Math.max(-180, Math.min(180, Number(deg.y) || 0)),
        z: Math.max(-180, Math.min(180, Number(deg.z) || 0))
    };
    if (!animate) {
        currentViewRotDeg = next;
        applyViewRotationDeg(next);
        return;
    }

    const start = { ...currentViewRotDeg };
    const token = ++viewRotAnimToken;
    const startTs = performance.now();
    const duration = 300;
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const step = () => {
        if (token !== viewRotAnimToken) return;
        const t = Math.min(1, (performance.now() - startTs) / duration);
        const k = ease(t);
        const cur = {
            x: start.x + (next.x - start.x) * k,
            y: start.y + (next.y - start.y) * k,
            z: start.z + (next.z - start.z) * k
        };
        currentViewRotDeg = cur;
        applyViewRotationDeg(cur);
        if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

function resetViewRotation() {
    setViewRotationDeg({ x: 0, y: 0, z: 0 }, true);
}

function frameAll() {
    if (!group.children.length) return;
    const box = new THREE.Box3().setFromObject(group);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const dist = (maxDim / (2 * Math.tan(fov / 2))) * 1.4;
    camera.position.set(center.x, center.y + dist * 0.6, center.z + dist);
    controls.target.copy(center);
    controls.update();
    setHomeFromCurrent();
    currentViewRotDeg = { x: 0, y: 0, z: 0 };
}

let gridRotateActive = false;
let gridRotatePointerId = null;
let gridRotateStartX = 0;
let gridRotateStartDeg = 0;
function onGridRotateMove(ev) {
    if (!gridRotateActive || ev.pointerId !== gridRotatePointerId) return;
    const dx = ev.clientX - gridRotateStartX;
    setGridRotationDeg(gridRotateStartDeg + dx * 0.2);
}
function endGridRotate(ev) {
    if (!gridRotateActive) return;
    if (ev && ev.pointerId != null && ev.pointerId !== gridRotatePointerId) return;
    gridRotateActive = false;
    gridRotatePointerId = null;
    controls.enabled = true;
}

function onPointerDown(ev) {
    if (navState.enabled) {
        requestNavLock();
        return;
    }
    if (transform && transform.axis) {
        bgDeselectArmed = false;
        if (bgDeselectArmTimer) {
            clearTimeout(bgDeselectArmTimer);
            bgDeselectArmTimer = null;
        }
        return;
    }
    if (ev && (ev.altKey || gridRotateMode)) {
        gridRotateActive = true;
        gridRotatePointerId = ev.pointerId;
        gridRotateStartX = ev.clientX;
        gridRotateStartDeg = gridRotationDeg;
        controls.enabled = false;
        renderer.domElement.setPointerCapture(ev.pointerId);
        return;
    }
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -(((ev.clientY - rect.top) / rect.height) * 2 - 1);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(group.children, false);
    if (hits.length) {
        const mesh = hits[0].object;
        const name = mesh.userData && mesh.userData.name ? mesh.userData.name : '';
        if (!name) return;
        const toggle = !!(ev && (ev.ctrlKey || ev.metaKey));
        select(name, { toggle });
        bgDeselectArmed = false;
        if (bgDeselectArmTimer) {
            clearTimeout(bgDeselectArmTimer);
            bgDeselectArmTimer = null;
        }
    } else {
        const toggle = !!(ev && (ev.ctrlKey || ev.metaKey));
        if (toggle) return;
        if (!selectedSet.size) return;
        const now = performance.now();
        const withinWindow = bgDeselectArmed && (now - bgDeselectArmTs) < 500;
        if (withinWindow) {
            selectedSet.clear();
            primarySelected = '';
            updateSelectionMaterials();
            attachForSelection();
            emitSelection({ replace: true, cleared: true });
            bgDeselectArmed = false;
            if (bgDeselectArmTimer) {
                clearTimeout(bgDeselectArmTimer);
                bgDeselectArmTimer = null;
            }
        } else {
            bgDeselectArmed = true;
            bgDeselectArmTs = now;
            if (bgDeselectArmTimer) clearTimeout(bgDeselectArmTimer);
            bgDeselectArmTimer = setTimeout(() => {
                bgDeselectArmed = false;
                bgDeselectArmTimer = null;
            }, 500);
        }
    }
}

renderer.domElement.addEventListener('pointerdown', onPointerDown);
renderer.domElement.addEventListener('pointermove', onGridRotateMove);
renderer.domElement.addEventListener('pointerup', endGridRotate);
renderer.domElement.addEventListener('pointercancel', endGridRotate);

transform.addEventListener('objectChange', () => {
    if (!transform.object) return;
    const mesh = transform.object;
    const mode = transform.getMode ? transform.getMode() : transform.mode;
    const clampPos = (m) => {
        const limit = 50000;
        m.position.x = Math.max(-limit, Math.min(limit, m.position.x));
        m.position.y = Math.max(-limit, Math.min(limit, m.position.y));
        m.position.z = Math.max(-limit, Math.min(limit, m.position.z));
    };
    if (mesh === selectionProxy && selectedSet.size > 1) {
        selectionProxy.updateMatrixWorld(true);
        const newMat = selectionProxy.matrixWorld.clone();
        const invPrev = new THREE.Matrix4().copy(proxyLastMatrix).invert();
        const delta = new THREE.Matrix4().multiplyMatrices(newMat, invPrev);
        proxyLastMatrix.copy(newMat);
        applyDeltaToSelected(delta, mode);
        return;
    }

    if (snapEnabled && mode === 'translate') {
        const s = 10;
        mesh.position.x = Math.round(mesh.position.x / s) * s;
        mesh.position.y = Math.round(mesh.position.y / s) * s;
        mesh.position.z = Math.round(mesh.position.z / s) * s;
    }
    if (mode === 'translate') clampPos(mesh);
    const name = mesh.userData && mesh.userData.name ? mesh.userData.name : '';
    if (!name) return;
    userModifiedByName.set(name, true);
    if (mode === 'translate' && typeof window.onScreenMove3D === 'function') {
        window.onScreenMove3D(name, { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z });
    }
    if (mode === 'rotate' && typeof window.onScreenRotate3D === 'function') {
        window.onScreenRotate3D(name, {
            x: THREE.MathUtils.radToDeg(mesh.rotation.x),
            y: THREE.MathUtils.radToDeg(mesh.rotation.y),
            z: THREE.MathUtils.radToDeg(mesh.rotation.z)
        });
    }
});

const navClock = new THREE.Clock();
function animate() {
    resize();
    const dt = navClock.getDelta();
    navUpdate(dt);
    if (controls.enabled) controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

window.__VJ_THREE__ = {
    setScreens,
    select,
    focus,
    frameAll,
    resize,
    setGridVisible,
    setGridRotationDeg,
    getGridRotationDeg,
    setGridRotateMode,
    setNavEnabled,
    setNavSpeed,
    setNavSensitivity,
    setNavInvert,
    setSnapEnabled,
    setTransformMode,
    setRectMode,
    setProjectKey,
    setObjectTransform,
    getGroupTransform,
    setGroupTransform,
    undo,
    redo,
    canUndo,
    canRedo,
    setViewRotationDeg,
    resetViewRotation
};

setGridVisible(true);
emitHistoryChange();
window.dispatchEvent(new CustomEvent('three-ready'));
resize();
animate();
