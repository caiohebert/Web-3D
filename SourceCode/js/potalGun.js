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
scene.background = new THREE.Color(0xa834ec);

renderer = new THREE.WebGLRenderer();
rendSize.x = window.innerWidth * 0.9;
rendSize.y = window.innerHeight * 0.9;

renderer.setSize(rendSize.x, rendSize.y);

// desligar a autoClear para poder desenhar nos 2 Viewports.
renderer.autoClear = false;

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap; 


document.body.appendChild(renderer.domElement);

// cria câmera Persp
cameraPersp = new THREE.PerspectiveCamera( 50.0, rendSize.x / rendSize.y, 0.01, 500.0 );
camControl = new OrbitControls(cameraPersp, renderer.domElement);
camControl.enableRotate = false;
camControl.enableZoom = false;
camControl.enablePan = false;

scene.add(cameraPersp);

// Camera top
cameraTop = new THREE.PerspectiveCamera(50.0, rendSize.x/rendSize.y, 0.01, 500.0);

// Camera Bottom
cameraBottom = new THREE.PerspectiveCamera(50.0, rendSize.x/rendSize.y, 0.01, 500.0);

// Load Mesh
const gltfLoader = new GLTFLoader();
gltfLoader.load('../../Assets/Models/portal_gun/scene.gltf', loadMesh);

// Luz Direcional
const dLight = new THREE.DirectionalLight(0xFFFFFF, 3.0);
dLight.position.set(100.0, 100.0, 150.0);
dLight.castShadow = true;
dLight.shadow.bias = -0.1;
dLight.shadow.camera.top = 80;
dLight.shadow.camera.bottom = -80;
dLight.shadow.camera.left = -100;
dLight.shadow.camera.right = 100;

scene.add(dLight);

// luz de cima
const pontualLight = new THREE.DirectionalLight(0xFFFFFF, 0.8)
pontualLight.position.set(0, 200.0, 0);
pontualLight.castShadow = true;
pontualLight.shadow.bias = -0.001;
pontualLight.shadow.camera.top = 30;
pontualLight.shadow.camera.bottom = -30;
pontualLight.shadow.camera.right = -100;
pontualLight.shadow.camera.left = 100;

scene.add(pontualLight);

// luz de trás
const backLight = new THREE.DirectionalLight(0xFFFFFF, 3.0)
backLight.position.set(-100.0, 100.0, -150.0);
backLight.castShadow = true;
backLight.shadow.bias = -0.1;
backLight.shadow.camera.top = 80;
backLight.shadow.camera.bottom = -80;
backLight.shadow.camera.left = -100;
backLight.shadow.camera.right = 100;

scene.add(backLight);

// animação
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

	gui.add(controls, 'rotacao', [0, 0.01, 0.003] ).onChange(changeRotation)
  
	gui.open();
};

//----------------------------------------------
function changeRotation(){
	let obj = scene.getObjectByName("arma");

	if (obj){
		obj.rotateY(controls.rotacao);
	}
}

//----------------------------------------------

function loadMesh(loadedMesh) {

	const root 	= loadedMesh.scene;
	root.name 	= "arma";
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
								70.0, 
								helper.geometry.boundingBox.max.z * 3.3 );

	let maxDim = Math.max(	helper.geometry.boundingBox.max.x, 
							helper.geometry.boundingBox.max.y, 
							helper.geometry.boundingBox.max.z )

    cameraPersp.far = maxDim*20.0;
    cameraPersp.updateProjectionMatrix();

	// setando position da Top
	cameraTop.position.set(-120.0, -10.0, -60.0);
	cameraTop.lookAt(new THREE.Vector3(0.0, -20.0, 25.0));

	// setando position da Bottom
	cameraBottom.position.set(50.0, 30.0, -70.0);
	cameraBottom.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));

	// // eixos de apoio
	// const axis = new THREE.AxesHelper( maxDim );
	// axis.name = "eixos";
	// scene.add(axis);

	// Plano do chão
    const chao 	= new THREE.Mesh(	new THREE.CircleGeometry(600.0, 64), 
									new THREE.MeshStandardMaterial( { 	color	: 0x9404d4,
																		side 	: THREE.DoubleSide
																})
							);
	chao.position.set(0.0, -dy, 0.0);
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
	renderer.setViewport(0, 2.0*rendSize.y/3.0, rendSize.x / 3.0, rendSize.y/3.0 )
	renderer.setScissor(0, 2.0*rendSize.y/3.0, rendSize.x / 3.0, rendSize.y/3.0 );
	renderer.setScissorTest(true);
	renderer.setClearColor(new THREE.Color(1, 1, 1));
	cameraTop.updateProjectionMatrix();
	renderer.render( scene, cameraBottom );


	requestAnimationFrame(anime);
};