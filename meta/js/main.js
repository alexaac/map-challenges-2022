let imgNames = [];
const imgDiv = document.getElementById('mps-inline-block');

/**
 * @description Fetch data
 * @param {string} url - file
 */
const getData = async (url) => {
  const response = fetch(url);

  const data = await (await response).json();

  return data;
};

// Get the data

// Get the data
const data = await getData('data/categories.json');

data.forEach((elem, i) => {
  if (elem.type === 'child') {
    const a = document.createElement('a');
    a.href = `https://maptheclouds.com/playground/30-day-map-challenge-2022/${elem.name}/`;

    const img = document.createElement('img');
    img.src = `../${elem.name}/img/demo.gif`;
    img.className = 'post-img';

    a.appendChild(img);
    imgDiv.appendChild(a);
  }
});

const a = document.createElement('a');
a.href = `https://maptheclouds.com/playground/30-day-map-challenge-2022/meta/assets/textures/unnamed.gif`;

const img = document.createElement('img');
img.src = `assets/textures/unnamed.gif`;
img.className = 'post-img';
img.style = 'width:100px';

a.appendChild(img);
imgDiv.appendChild(a);
