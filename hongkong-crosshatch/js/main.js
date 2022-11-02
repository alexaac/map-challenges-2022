var map = L.map('map');

var tangramLayer = Tangram.leafletLayer({
  scene: './styles/crosshatch.yaml',
  attribution:
    '| &copy; OSM contributors | <a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | <a href="https://twitter.com/patriciogv" target="_blank">@patriciogv</a>',
});

tangramLayer.addTo(map);

// map.setView([40.70531887544228, -74.00976419448853], 15);

// map.setView([46.7698, 23.58995], 15);
map.setView([25.2015627, 55.2244119], 15);
map.setView([43.7400297, 7.4255842], 15);
map.setView([22.2917934, 114.1690138], 14.6);
