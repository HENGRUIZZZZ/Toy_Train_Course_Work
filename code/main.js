// Render the Space(world)
// Enable traceball and orbitcontroll (Automatically)
var mySpace = new Space("myCanvas");

// Rendering Setting
var params = {
  LookingDown: false,
  DriverView: false,
  NewRoute: false,
  ArcLength: true,
  effect_local_time: true,// Always activate to enable controls on local device
  Move_Stop: true,
  Route_Seg: 40,
  Speed: 10, // Slow-10, default
  decouple: function () { train.decouple(); },
};

// Ground/Plane Setting
var plane_geo = new THREE.PlaneGeometry(800, 800, 100, 100);
var material = new THREE.MeshPhongMaterial({ color: 0x009100});
var plane = new THREE.Mesh(plane_geo, material);
plane.receiveShadow = true;
plane.rotation.x = -(Math.PI/(2*90))*90;
mySpace.addObject(plane);

// Initial ConnectPoint Setting
var ConnectPoint1 = new RouteChange(300, 20, 150, mySpace);
var ConnectPoint2 = new RouteChange(-300, 20, -150, mySpace);

//Initial Train and Train Carrige Setting
var train = new Train(mySpace, "myCanvas");
train.addCarrige();
train.addCarrige();
train.addCarrige();
train.addCarrige();
train.addCarrige();

// Routes & Rail Blocks Storage and 
var routes_mesh = [];
var routes = [];
var route_para = 0;
var route_paras = [];
var rail_block = [];
var norm = [];

/*LIGHT*/
// Veritical Light (White Light with Shadow)
var spotlight = new THREE.SpotLight(0xffffff, 1.8, 2000);
spotlight.position.set(0, 600, 0);
spotlight.shadow.camera.near = 0.1;
spotlight.shadow.camera.far = 1200;
spotlight.castShadow = true;
//spotlight.onlyShawdow = true;
mySpace.addObject(spotlight);

// Train Light (Incomplete - Wrong Dynamic Position)
// Originally I would like to put a train light infront of the train head and enable a control pannel
var train_light = new THREE.SpotLight(0x0000ff, 1.8, 10);
train_light.position.set(train.cam.position.x+10,train.cam.position.y+10,train.cam.position.z);
train_light.shadow.camera.near = 0.1;
train_light.shadow.camera.far = 1000;
train_light.castShadow = true;
train_light.shadowCameraVisible = true;
mySpace.addObject(train_light);

/*Control Parameters*/
// Route Changing
var switch_curve = false;
var switched = false;
var next_route = 0;

// Time Setting
var time = 0;
var looptime = 10 * 300;
var general_time;
var time_increments = [];
var control_time = [];
var distances = [];

// UI Setting (Import myspace for changing route)
setupUI(mySpace);

// Intialization Functions
drawRoute(params.Route_Seg);
Com_Norm(params.Route_Seg);
Com_Increment_Time();
drawRail(params.Route_Seg);
mySpace.renderer.setAnimationLoop(render);


// Render Function
function render() {
  var route_paraSegments;
  if (params.effect_local_time) {
    route_paraSegments = Math.round(params.Route_Seg);
    temp_Route_Seg = Math.round(params.Route_Seg);
    drawRoute(route_paraSegments);
    Com_Norm(route_paraSegments);
    Com_Increment_Time();
    drawRail(route_paraSegments);
  } else {
    route_paraSegments = temp_Route_Seg;
  }

  // Control Parameters
  general_time = (time % looptime) / looptime;
  route_paras = [];
  route_paras.push(route_para);
  control_time = [];
  control_time.push(general_time);

  // calculate the routes each train is on, and the time stamp of each train.
  // used for pinpointing the position of each car ,
  // recorded in variables  - control_time and route_paras
  for (var i = 1; i < train.meshes.length; i++) {
    var head_time = control_time[i - 1];
    var distance = head_time * routes[route_paras[i - 1]].getLength();
    var distrance_cache;
    if (i == 1) {distrance_cache = distance - 40;} else {distrance_cache = distance - 35;}
    //Same route
    if (distrance_cache >= 0) {
      route_paras.push(route_paras[i - 1]);
      control_time.push(distrance_cache / routes[route_paras[i - 1]].getLength());
    }
    //Different route
    else {
      var push_route_para = route_paras[i - 1] == 0 ? routes.length - 1 : route_paras[i - 1] - 1;
      distrance_cache = routes[push_route_para].getLength() + distrance_cache;
      route_paras.push(push_route_para);
      control_time.push(distrance_cache / routes[push_route_para].getLength());
    }
  }

  // position of the head car
  var pos = routes[route_para].getPointAt(general_time);

  // update train positions
  if (!switched) {
    train.position(0).copy(pos);
    for (var i = 1; i < train.meshes.length; i++) {
      var current_time = control_time[i];
      train.position(i).copy(routes[route_paras[i]].getPointAt(current_time));}}

  // Orientation takes place when time appraoching 1
  if (general_time < 0.95) {
    train.lookAt(0, routes[route_para].getPointAt(general_time + 0.001));
    train.up(0).x = norm[route_para][Math.round(general_time * route_paraSegments)].x;
    train.up(0).y = norm[route_para][Math.round(general_time * route_paraSegments)].y;
    train.up(0).z = norm[route_para][Math.round(general_time * route_paraSegments)].z;
    for (var i = 1; i < train.meshes.length; i++) {
      var current_time = control_time[i];
      if (current_time < 0) {current_time = 0;}
      train.lookAt(i, routes[route_paras[i]].getPointAt(current_time + 0.001));
      train.up(i).x = norm[route_paras[i]][Math.round(current_time * route_paraSegments)].x;
      train.up(i).y = norm[route_paras[i]][Math.round(current_time * route_paraSegments)].y;
      train.up(i).z = norm[route_paras[i]][Math.round(current_time * route_paraSegments)].z;}
  }

  // Change curve when general_time approaches to 1
  if (general_time >= 0.990 && !switched) {
    switch_curve = true;
    next_route += 1;
    if (next_route == cp_list.length) { next_route = 0; }}
  
  if (switch_curve) {
    route_para = next_route;
    switched = true;
    switch_curve = false;
  }

  if (general_time < 0.15) {switched = false;}

  //Camera for Driver View - Defined in the Train class
  if (params.DriverView == true) {
    mySpace.controls.enabled = false;
    mySpace.renderwithCamera(train.cam);
  } else {mySpace.render();}

  //General Control for Updation
  mySpace.controls.update();
  for (var i = 0; i < cp_list.length; i++) {cp_list[i].animate();}
  if (params.Move_Stop) { time += time_increments[route_para]; }
}
