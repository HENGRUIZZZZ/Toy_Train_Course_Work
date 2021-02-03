//Space Class  Add/remove obejct with addObject() and removeObject(), it enables trackball and orbit controll for better performance, reference is in the document
class Space {
  constructor(caID) {
    this.renderer = new THREE.WebGLRenderer({
      canvas: document.getElementById(caID),
      antialias: true
    });
    this.renderer.setClearColor(0xffffff);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    //this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;
    this.cam = new THREE.PerspectiveCamera(50,window.innerWidth / window.innerHeight,0.01,3000);
    this.cam.position.x = 450;
    this.cam.position.z = 450;
    this.cam.position.y = 450;
    this.cam.lookAt(new THREE.Vector3(0, 1, 0));
    this.scene = new THREE.Scene();

    // Provided trackball Controls in Three.js examples
    this.controls = new THREE.OrbitControls(this.cam,this.renderer.domElement);
    this.controls.maxPolarAngle = Math.PI * 0.45;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 800;

    //Traceball Control enabled with mouse
    document.getElementById(caID).onmouseover = () => {this.controls.enabled = true;};
    document.getElementById(caID).onmouseout = () => {this.controls.enabled = false;};
  }
//Add an object to the space
  addObject(object) {this.scene.add(object);}
//Remove an object from the space
  removeObject(object) {this.scene.remove(object);}
//Render the space
  renderwithCamera(cam) {this.renderer.render(this.scene, cam);}
//Render the canvas
  render() {this.renderer.render(this.scene, this.cam);}
}

//Route Change Class is for defining Connect points that control the direction and movement of trains
// Connect Points List
var cp_list = [];

// Connect Points Position List
var cp_list_positions = [];

class RouteChange {
    constructor(x, y, z, world) {
        var cp_gro = new THREE.BoxGeometry(0.1, 0.1, 0.1, 1, 1, 1);
        var cp_material = new THREE.MeshPhongMaterial({color: 0x000000});
        this.cp = new THREE.Mesh(cp_gro, cp_material);
        this.cp.position.x = x;
        this.cp.position.y = y;
        this.cp.position.z = z;
        this.orient = new THREE.Vector3(0, 2, 0);
        world.addObject(this.cp);
        cp_list.push(this);
        cp_list_positions.push(this.position());}
    position() {return this.cp.position;}
    setOrient(x, y, z) {this.orient = new THREE.Vector3(x, y, z);}
    animate() {this.cp.rotation.y += 0.08;}
}


//Train Creation Class with input (Space and CavasID)
//Reference - Some Ideas come from https://codesandbox.io/s/5m37wxr8jp?file=/src/index.js (Online webgl model design website)
class Train {
  constructor(space, caID) {
    this.space = space;
    // Driver Camera
    this.cam = new THREE.PerspectiveCamera(50,document.getElementById(caID).width /document.getElementById(caID).height,0.01,2500);
    this.cam.position.y = 40;
    this.cam.rotation.y = Math.PI;

    // Create the locomotive
    var head_body_geo = new THREE.CylinderGeometry(10, 10, 40, 10);
    this.material = new THREE.MeshPhongMaterial({ color: 0x0000ff });
    var head_body_mesh = new THREE.Mesh(head_body_geo, material);
    head_body_mesh.position.y = 10;
    head_body_mesh.rotation.z = Math.PI / 2;//Rotate the Cylinder
    head_body_mesh.rotation.y = Math.PI / 2;//Rotate the Cylinder
    var chimney_geo = new THREE.BoxGeometry(15, 10, 10, 1, 1, 1);
    // Create the chimney for locomotive
    var chimney_Mesh = new THREE.Mesh(chimney_geo, material);
    chimney_Mesh.position.y = 18;
    chimney_Mesh.position.z = 10;
    this.material = new THREE.MeshPhongMaterial({ color: 0xffff00 });
    // Create the wheels for locomotive
    var wheel_geo = new THREE.CylinderGeometry(5, 5, 5, 12);
    var wheel_1 = new THREE.Mesh(wheel_geo, material);
    wheel_1.position.x = 7;//Thick
    wheel_1.position.y = 5;//Height
    wheel_1.position.z = 8;//Horizontal Position
    wheel_1.rotation.z = Math.PI / 2;//Rotation Rate
    var wheel_2 = new THREE.Mesh(wheel_geo, material);
    wheel_2.position.x = -7;
    wheel_2.position.y = 5;
    wheel_2.position.z = 8;
    wheel_2.rotation.z = Math.PI / 2;

    // Combine all componets for the locomotive
    var body_merge_geo = new THREE.Geometry();
    //Update and merge head body
    head_body_mesh.updateMatrix();
    body_merge_geo.merge(head_body_mesh.geometry, head_body_mesh.matrix);
    //Update and merge head lomonotive
    chimney_Mesh.updateMatrix();
    body_merge_geo.merge(chimney_Mesh.geometry, chimney_Mesh.matrix);
    //Update and merge head wheel1
    wheel_1.updateMatrix();
    body_merge_geo.merge(wheel_1.geometry, wheel_1.matrix);
    //Update and merge head wheel2
    wheel_2.updateMatrix();
    body_merge_geo.merge(wheel_2.geometry, wheel_2.matrix);
    this.meshes = [];
    var new_Mesh = new THREE.Mesh(body_merge_geo, this.material);
    new_Mesh.add(this.cam);
    this.meshes.push(new_Mesh);
    space.addObject(new_Mesh);
  }


  //De_Couple a carrige from the current train unless there is no more carriges
  decouple() {
    if (this.meshes.length > 1) {
      this.space.removeObject(this.meshes[this.meshes.length - 1]);
      this.meshes.pop();
    }
  }

  //Add Carrige to the lomonotive
  addCarrige() {
    // Carrige Body
    var carrige_body_geo = new THREE.BoxGeometry(15, 15, 30, 1, 1, 1);
    var carrige_body_Mesh = new THREE.Mesh(carrige_body_geo, this.material);
    carrige_body_Mesh.position.y = 10;

    // Carrige Wheels (2 for each)
    var wheel_geo = new THREE.CylinderGeometry(5, 5, 5, 12);
    var wheel_1 = new THREE.Mesh(wheel_geo, this.material);
    wheel_1.position.x = 7;
    wheel_1.position.y = 5;
    wheel_1.position.z = 2;
    wheel_1.rotation.z = Math.PI / 2;
    var wheel_2 = new THREE.Mesh(wheel_geo, this.material);
    wheel_2.position.x = -7;
    wheel_2.position.y = 5;
    wheel_2.position.z = 2;
    wheel_2.rotation.z = Math.PI / 2;

    //Combine all components for a single carrige
    var body_merge_geo = new THREE.Geometry();
    var new_Mesh = new THREE.Mesh(body_merge_geo, this.material);
    carrige_body_Mesh.updateMatrix();
    body_merge_geo.merge(carrige_body_Mesh.geometry, carrige_body_Mesh.matrix);
    wheel_1.updateMatrix();
    body_merge_geo.merge(wheel_1.geometry, wheel_1.matrix);
    wheel_2.updateMatrix();
    body_merge_geo.merge(wheel_2.geometry, wheel_2.matrix);
    this.meshes.push(new_Mesh);
    this.space.addObject(new_Mesh);
  }

    //Lookaat function at particular mesh
    lookAt(id, position) {this.meshes[id].lookAt(position);}

    //Get train position
    position(id) {return this.meshes[id].position;}
  
    //Get up vactor
    up(id) {return this.meshes[id].up;}
}
