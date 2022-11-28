let notes = ['A4', 'B4', 'C4', 'D4'];

let delaySlider;
let durationSlider;

function setup() {
  noCanvas();
  noLoop();
  monoSynth = new p5.MonoSynth();
  let container = createDiv();
  container.style('display', 'flex');
  container.style('align-items', 'flex-start');
  container.style('height', 'fit-content');

  createSpan('Delay: ').parent(container);
  delaySlider = createSlider(1, 20, 2);
  delaySlider.parent(container);
  createSpan('Duration: ').parent(container);
  durationSlider = createSlider(1, 20, 1);
  durationSlider.parent(container);
}

let playing = false;

function countryPressed(e, notes) {
  if (notes) {
    if (
      !playing &&
      e.target !== delaySlider.elt &&
      e.target !== durationSlider.elt
    ) {
      playStuff(notes);
    }
  }
}

function asyncDelay(t) {
  return new Promise((res) => setTimeout(res, t));
}

async function playStuff(notes) {
  playing = true;
  for (let note of notes) {
    monoSynth.play(note, 5, 0, durationSlider.value() / 6);

    await asyncDelay((delaySlider.value() / 6) * 1000);
  }

  playing = false;
} //playStuff

function draw() {} //draw
