Q3D.Config.allVisible = true;
Q3D.Config.bgColor = 0x000000;
Q3D.Config.localMode = true;

var container = document.getElementById('view'),
  app = Q3D.application,
  gui = Q3D.gui;

app.init(container); // initialize viewer

// load the scene
app.loadSceneFile(
  './data/index/scene.js',
  function (scene) {
    // scene file has been loaded
    app.start();
    console.log(app.camera.position);
  },
  function (scene) {
    // all relevant files have been loaded
  }
);
