import * as dat from '../../js/libs/lil-gui.module.min.js';
import { WindGL } from './wind-gl.js';

/** Constants */

let animate = true;

const sections = document.querySelectorAll('.content--fixedPageContent');
gsap.to(sections[0], {
  duration: 3,
  opacity: 1,
  visibility: 'visible',
  ease: 'power2.inOut',
});

/**
 * Debug
 */
const gui = new dat.GUI({ closed: true });
const parameters = {
  displacementScale: 0,
};
gui.hide();

// using var to work around a WebKit bug
var canvas = document.getElementById('webgl'); // eslint-disable-line
console.log(canvas);
const pxRatio = Math.max(Math.floor(window.devicePixelRatio) || 1, 2);
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

const gl = canvas.getContext('webgl', { antialiasing: false });
console.log(gl);

let rampColors = {};

// rampColors = {
//   0.09: '#31455e',
//   0.09: '#32272d',
//   0.14: '#98b3c6',
//   0.19: '#3b66aa',
//   0.23: '#c1d1c4',
//   0.28: '#3f78b1',
//   0.33: '#364f87',
//   0.38: '#556191',
//   0.42: '#6f7488',
//   0.47: '#f0d759',
//   0.52: '#657c60',
//   0.57: '#5b5b4f',
//   0.61: '#867652',
//   0.66: '#969580',
//   0.71: '#3b3221',
//   0.76: '#edd980',
//   0.8: '#56559b',
//   0.85: '#c2bf96',
//   0.9: '#b99735',
//   0.95: '#8f57d8',
//   1.0: '#fdedd3',
// };

rampColors = {
  0.0: '#17116b',
  0.1: '#173679',
  0.2: '#4888c8',
  0.3: '#7fc5dc',
  0.4: '#d5d283',
  0.5: '#c3ad33',
  0.6: '#dfa953',
  1.0: '#17116b',
};

const wind = new WindGL(gl, rampColors);
wind.numParticles = 270000;
// wind.speedFactor = 0.5;
wind.speedFactor = 1.0;

function frame() {
  if (wind.windData) {
    wind.draw();
  }
  requestAnimationFrame(frame);
}
frame();

gui.add(wind, 'numParticles', 1024, 589824);
gui.add(wind, 'fadeOpacity', 0.96, 0.999).step(0.001).updateDisplay();
gui.add(wind, 'speedFactor', 0.05, 1.0);
gui.add(wind, 'dropRate', 0, 0.1);
gui.add(wind, 'dropRateBump', 0, 0.2);

const windFiles = {
  0: '2022103100000',
  3: '2022103100003',
  6: '2022103100006',
  9: '2022103100009',
  12: '2022103100012',
  15: '2022103100015',
  18: '2022103100018',
  21: '2022103100021',
  24: '2022103100024',
  27: '2022103100027',
  30: '2022103100030',
  31: '2022103100031',
  33: '2022103100033',
  36: '2022103100036',
  39: '2022103100039',
  42: '2022103100042',
  45: '2022103100045',
  48: '2022103100048',
  51: '2022103100051',
  54: '2022103100054',
};

const meta = {
  '2022-10-31+h': 0,
  'retina resolution': true,
  'github.com/mapbox/webgl-wind': function () {
    window.location = 'https://github.com/mapbox/webgl-wind';
  },
};
gui
  .add(meta, '2022-10-31+h', 0, 18, 1)
  .onFinishChange((value) => updateWind(value * 3))
  .listen();
if (pxRatio !== 1) {
  gui.add(meta, 'retina resolution').onFinishChange(updateRetina);
}
gui.add(meta, 'github.com/mapbox/webgl-wind');
// updateWind(0);
updateRetina();

let running = false;

const startSequence = () => {
  meta['2022-10-31+h'] = 0;

  if (running) return;

  gsap.to(meta, {
    delay: 0,
    duration: 10,
    '2022-10-31+h': 54 / 3,
    ease: 'linear',
    roundProps: '2022-10-31+h',
    onUpdate: () => {
      if (meta['2022-10-31+h'] * 3 < 54) {
        setTimeout(() => {
          updateWind(meta['2022-10-31+h'] * 3);
        }, 500);
      }
    },
    onStart: () => {
      running = true;
    },
    onComplete: () => {
      running = false;

      rotateBtn.classList.remove('hidden');
      stopBtn.classList.add('hidden');

      // startSequence();
    },
  });
};

if (animate) {
  startSequence();
}

function updateRetina() {
  const ratio = meta['retina resolution'] ? pxRatio : 1;
  canvas.width = canvas.clientWidth * ratio;
  canvas.height = canvas.clientHeight * ratio;
  wind.resize();
}

getJSON(
  'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_coastline.geojson',
  function (data) {
    const canvas = document.getElementById('coastline');
    canvas.width = canvas.clientWidth * pxRatio;
    canvas.height = canvas.clientHeight * pxRatio;

    const ctx = canvas.getContext('2d');
    ctx.lineWidth = pxRatio;
    ctx.lineJoin = ctx.lineCap = 'round';
    ctx.strokeStyle = 'white';
    ctx.beginPath();

    for (let i = 0; i < data.features.length; i++) {
      const line = data.features[i].geometry.coordinates;
      for (let j = 0; j < line.length; j++) {
        ctx[j ? 'lineTo' : 'moveTo'](
          ((line[j][0] + 180) * canvas.width) / 360,
          ((-line[j][1] + 90) * canvas.height) / 180
        );
      }
    }
    ctx.stroke();
  }
);

function updateWind(name) {
  document.querySelector('#file-name').innerHTML = windFiles[name];

  getJSON('./data/' + windFiles[name] + '.json', function (windData) {
    const windImage = new Image();
    windData.image = windImage;
    windImage.src = './data/' + windFiles[name] + '.png';
    windImage.onload = function () {
      wind.setWind(windData);
    };
  });
}

function getJSON(url, callback) {
  const xhr = new XMLHttpRequest();
  xhr.responseType = 'json';
  xhr.open('get', url, true);
  xhr.onload = function () {
    if (xhr.status >= 200 && xhr.status < 300) {
      callback(xhr.response);
    } else {
      throw new Error(xhr.statusText);
    }
  };
  xhr.send();
}

const rotateBtn = document.querySelector('#animate');
const stopBtn = document.querySelector('#stop-animation');

rotateBtn.addEventListener('click', (event) => {
  rotateBtn.classList.add('hidden');
  stopBtn.classList.remove('hidden');
  animate = true;
  startSequence();
});

stopBtn.addEventListener('click', (event) => {
  rotateBtn.classList.remove('hidden');
  stopBtn.classList.add('hidden');
  animate = false;
});
