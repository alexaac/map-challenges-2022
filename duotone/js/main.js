let imgNames = [];
const imgDiv = document.getElementById('mps-inline-block');

const numFiles = 5;
const effects = ['Pink Sunset', 'Seafoam', 'Purple Light', 'Custom'];

// Get the data
for (let i = 1; i < numFiles; i++) {
  const a = document.createElement('a');

  const img = document.createElement('img');
  img.src = `./assets/textures/duotone${i}.jpg`;
  img.className = 'post-img';
  img.title = effects[i - 1];
  img.alt = effects[i - 1];

  a.appendChild(img);
  imgDiv.appendChild(a);
}
