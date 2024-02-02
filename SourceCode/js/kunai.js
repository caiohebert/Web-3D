import * as THREE 			from 'three';
import { GLTFLoader } 		from 'glTF-loaders';
import { OrbitControls }	from 'orb-cam-ctrl';
import { GUI } from 'gui';

const 	gui 		= new GUI();
const 	rendSize = new THREE.Vector2();
const 	clock 			= new THREE.Clock();

let 	scene,
		renderer, 
		cameraPersp,
		cameraTop,
		cameraHelper,
		cameraBottom,
		controls,
        camControl;


//----------------------------------------------

// configura o ambiente de reprodução
scene 	= new THREE.Scene();
scene.background = new THREE.Color(0x4c4c4c);

renderer = new THREE.WebGLRenderer();
rendSize.x = window.innerWidth * 0.9;
rendSize.y = window.innerHeight * 0.9;

renderer.setSize(rendSize.x, rendSize.y);

// desligar a autoClear para poder desenhar nos 2 Viewports.
renderer.autoClear = false;

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap; 

document.body.appendChild(renderer.domElement);

// cria camera Persp
cameraPersp = new THREE.PerspectiveCamera( 50.0, rendSize.x / rendSize.y, 0.01, 10.0 );
camControl = new OrbitControls(cameraPersp, renderer.domElement);
camControl.enableRotate = false;
camControl.enableZoom = false;
camControl.enablePan = false;

scene.add(cameraPersp);

// Camera top
cameraTop = new THREE.PerspectiveCamera(50.0, rendSize.x/rendSize.y, 0.01, 100.0);

// Camera Bottom
cameraBottom = new THREE.PerspectiveCamera(50.0, rendSize.x/rendSize.y, 0.01, 100.0);

// Load Mesh
const gltfLoader = new GLTFLoader();
gltfLoader.load('../../Assets/Models/minato_kunai/scene.gltf', loadMesh);

// Luz Direcional
const dLight = new THREE.DirectionalLight(0xFFFFFF, 3.5);
dLight.position.set(1.0, 1.0, 1.5);
dLight.castShadow = true;
dLight.shadow.mapSize.width = 8400;
dLight.shadow.mapSize.height = 8400;
dLight.shadow.bias = -0.0001;

scene.add(dLight);

// segunda luz
const pontualLight = new THREE.DirectionalLight(0xFFFFFF, 3.5)
pontualLight.position.set(-1.0, 1.0, 1.5);
pontualLight.castShadow = true;
pontualLight.shadow.bias = -0.0001;
pontualLight.shadow.camera.top = 0.2;
pontualLight.shadow.camera.bottom = -0.2;
pontualLight.shadow.camera.right = -0.2;
pontualLight.shadow.camera.left = 0.2;

scene.add(pontualLight);

initGUI();
anime();


//----------------------------------------------
// Função para fazer o slider
function initGUI() {

	controls = 	{	zoom : 50,
					rotacao : 0
				};

	gui.add( controls, 'zoom', 10, 55, 5).onChange(() => {
		cameraPersp.fov = controls.zoom;
		cameraPersp.updateProjectionMatrix();
	});

	gui.add(controls, 'rotacao', [0, 0.01,] ).onChange(changeRotation)
  
	gui.open();
};

//----------------------------------------------
function changeRotation(){
	let obj = scene.getObjectByName("kunai");

	if (obj){
		obj.rotateY(controls.rotacao);
	}
}
//----------------------------------------------

function loadMesh(loadedMesh) {

	const root 	= loadedMesh.scene;
	root.name 	= "kunai";
	root.traverse((child) => {
		if (child.isMesh){
			child.castShadow = true;
			child.receiveShadow = true;
		}
	})
	scene.add(root);
	
	// Construindo helper
	const helper = new THREE.BoxHelper();
	helper.setFromObject(root);
    helper.visible = true;

	helper.geometry.computeBoundingBox();

	// calculando dimensões e mudando posição do objeto
	let dx = (helper.geometry.boundingBox.max.x - helper.geometry.boundingBox.min.x) / 2.0;
	let dy = (helper.geometry.boundingBox.max.y - helper.geometry.boundingBox.min.y) / 2.0;
	let dz = (helper.geometry.boundingBox.max.z - helper.geometry.boundingBox.min.z) / 2.0;


	root.position.set(	-(helper.geometry.boundingBox.min.x + dx),
						-(helper.geometry.boundingBox.min.y + dy),
						-(helper.geometry.boundingBox.min.z + dz) );

	// setando position da Persp
	cameraPersp.position.set ( 	0.0, 
								0.0, 
								helper.geometry.boundingBox.max.z * 28.0 );

	let maxDim = Math.max(	helper.geometry.boundingBox.max.x, 
							helper.geometry.boundingBox.max.y, 
							helper.geometry.boundingBox.max.z )

    cameraPersp.far = maxDim*20.0;
    cameraPersp.updateProjectionMatrix();

	// setando position da Top
	cameraTop.position.set(0.015, 0.19, 0.07);
	cameraTop.lookAt(new THREE.Vector3(0.0, 0.14, 0.0));
	
	// setando position da Bottom
	cameraBottom.position.set(-0.005, -0.13, 0.06);
	cameraBottom.lookAt(new THREE.Vector3(0.0, -0.09, 0.0));

	// eixos de apoio
	// const axis = new THREE.AxesHelper( maxDim );
	// axis.name = "eixos";
	// scene.add(axis);

	// Plano do chão
    const chao 	= new THREE.Mesh(	new THREE.CircleGeometry(0.9, 64), 
									new THREE.MeshStandardMaterial( { 	color	: 0x363636,
																		side 	: THREE.DoubleSide
																})
							);
	chao.position.set(0.0, - dy, 0.0);
	chao.rotateX(-Math.PI / 2.0);
	chao.receiveShadow = true;

	scene.add(chao);
};

//----------------------------------------------

function anime() {
    camControl.update( clock.getDelta() );

	// ROTAÇÃO
	changeRotation();

	// dividindo tela para diferentes câmeras
	// camera principal
	renderer.setViewport(0.0, 0.0, rendSize.x, rendSize.y );
	renderer.setScissor(0.0, 0.0, rendSize.x, rendSize.y);
	renderer.setScissorTest(true);
	renderer.setClearColor(new THREE.Color(1, 1, 1));
	cameraPersp.updateProjectionMatrix();
	renderer.render( scene, cameraPersp );

	// top
	renderer.setViewport(2.0*rendSize.x / 3.0, 2.0*rendSize.y/3.0, rendSize.x / 3.0, rendSize.y/3.0 )
	renderer.setScissor(2.0*rendSize.x / 3.0, 2.0*rendSize.y/3.0, rendSize.x / 3.0, rendSize.y/3.0);
	renderer.setScissorTest(true);
	renderer.setClearColor(new THREE.Color(1, 1, 1));
	cameraTop.updateProjectionMatrix();
	renderer.render( scene, cameraTop );
	
	// bottom
	renderer.setViewport(2.0*rendSize.x / 3.0, rendSize.y/3.0, rendSize.x / 3.0, rendSize.y/3.0 )
	renderer.setScissor(2.0*rendSize.x / 3.0, rendSize.y/3.0, rendSize.x / 3.0, rendSize.y/3.0);
	renderer.setScissorTest(true);
	renderer.setClearColor(new THREE.Color(1, 1, 1));
	cameraTop.updateProjectionMatrix();
	renderer.render( scene, cameraBottom );
	

	requestAnimationFrame(anime);
};
