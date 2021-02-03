//Supporting Functions

// UI Settings with gui package - A three.js plugin for easy parameter control
function setupUI(mySpace) {
  const gui = new dat.GUI();

  // GUI folder1 - View Folder 
  folder1 = gui.addFolder("Change View");
  folder1.add(params, "LookingDown")
    .onChange(function(value) {
      if (value == true) {
        mySpace.controls.target = new THREE.Vector3(0, 0, 0);
        mySpace.cam.up.set(0, 1, 0);
        mySpace.controls.reset();
        mySpace.controls.noRotate = true; //Do not allowed for rotation, fixed point of view
        mySpace.cam.position.x = 0;
        params.DriverView = false;// Only one view is allowed at the same time
      }}).listen().onFinishChange();
  folder1.add(params, "DriverView").onChange(function (value) { if (value == true) { params.LookingDown = false; } }).listen().onFinishChange();

  //GUI folder2 - Controls Folder
  folder2 = gui.addFolder("Controls");
  folder2.add(params, 'Speed', { BackWard:-5, Stop: 0, Slow: 10, Fast: 40} );
  folder2.add(params, "NewRoute")
  .onChange(function(value) {
    if (value == true) {
      var ConnectPoint3 = new RouteChange(200, 20, -150, mySpace);
      var ConnectPoint4 = new RouteChange(-200, 20, 150, mySpace);
    }}).listen().onFinishChange();
  folder2.add(params, "decouple").name("De-couple");
}

// Draw Routes (Tube)
function drawRoute(route_seg) {
  for (var m = 0; m < routes_mesh.length; m++) {mySpace.scene.remove(routes_mesh[m]);routes_mesh[m].geometry.dispose();routes_mesh[m].material.dispose();}
  var material = new THREE.MeshBasicMaterial({color: 0x642100});
  //Storage for routes
  routes_mesh = [];
  routes = [];
  for (var m = 0; m < cp_list.length; m++) {
    var a = m;
    var b = m + 1 >= cp_list.length ? m + 1 - cp_list.length : m + 1;
    var route;
    route = new LinearCurve(cp_list[a], cp_list[b]);
    var geometry = new THREE.TubeGeometry(route,route_seg,2,4);
    var routeObject = new THREE.Mesh(geometry, material);
    mySpace.addObject(routeObject);
    routes_mesh.push(routeObject);
    routes.push(route);
  }
}

// Clean out routes and draw new routes
function drawRail(route_seg) {
  var material = new THREE.MeshBasicMaterial({color:0x642100,});
  var geometry = new THREE.BoxGeometry(30, 2, 8, 1, 1, 1);
  for (var m = 0; m < rail_block.length; m++) {
    mySpace.scene.remove(rail_block[m]);
    rail_block[m].geometry.dispose();
    rail_block[m].material.dispose();
  }

  // Rail Blok Storage
  rail_block = [];
  for (var m = 0; m < cp_list.length; m++) {
    for (var n = 0; n < route_seg; n++) {
      var route = new THREE.Mesh(geometry, material);
      route.position.x = routes[m].getPoint((1 / route_seg) * n).x;
      route.position.y = routes[m].getPoint((1 / route_seg) * n).y;
      route.position.z = routes[m].getPoint((1 / route_seg) * n).z;
      route.up.x = norm[m][n].x;
      route.up.y = norm[m][n].y;
      route.up.z = norm[m][n].z;
      route.lookAt(routes[m].getPoint((1 / route_seg) * (n + 1)));
      route.receiveShadow = true;
      mySpace.addObject(route);
      rail_block.push(route);
    }
  }
}

//Linear Curve Constructor 
//Reference:https://blog.csdn.net/u014291990/article/details/103327642 (Some ideas comes from)
function LinearCurve(ConnectPoint1, ConnectPoint2) {
  THREE.Curve.call(this);
  this.point1 = ConnectPoint1;
  this.point2 = ConnectPoint2;
}
LinearCurve.prototype = Object.create(THREE.Curve.prototype);
LinearCurve.prototype.constructor = LinearCurve;
LinearCurve.prototype.getPoint = function (t) {
  var p1 = [this.point1.position().x, this.point1.position().y, this.point1.position().z];
  var p2 = [this.point2.position().x, this.point2.position().y, this.point2.position().z];
  var result = [p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t, p1[2] + (p2[2] - p1[2]) * t];
  return new THREE.Vector3(result[0], result[1], result[2]);
};

//Computation of route norms depend on route seg parameter
function Com_Norm(route_seg) {
  norm = [];
  for (var m = 0; m < cp_list.length; m++) {var a = m;var b = m + 1 >= cp_list.length ? 0 : m + 1;var cur_normals = [];
    for (var n = 0; n < route_seg; n++) {
      var normal = new THREE.Vector3();
      normal.lerpVectors(cp_list[a].orient,cp_list[b].orient,n * (1 / route_seg));
      cur_normals.push(normal);
    }
    var normal = new THREE.Vector3();
    normal.lerpVectors(cp_list[a].orient, cp_list[b].orient, 1);
    cur_normals.push(normal);
    norm.push(cur_normals);
  }
}

//Increment of time for different routes 
function Com_Increment_Time() {
  time_increments = [];
  for (var m = 0; m < routes.length; m++) {if (params.ArcLength) {time_increments.push(Math.round((params.Speed / routes[m].getLength()) * 200));} else {time_increments.push(params.Speed);}}}