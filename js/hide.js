window.addEventListener('keydown', (event) => {
  if (event.key === 'h') {
    if (document.querySelector('.nav--gridContainer'))
      document.querySelector('.nav--gridContainer').classList.add('hidden');

    if (document.querySelector('.side-pannel'))
      document.querySelector('.side-pannel').classList.add('hidden');

    if (document.querySelector('.main--contentWrapper'))
      document.querySelector('.main--contentWrapper').classList.add('hidden');

    if (document.querySelector('.content--contentWrapper'))
      document
        .querySelector('.content--contentWrapper')
        .classList.add('hidden');

    if (document.querySelector('.content--subCopy'))
      document.querySelector('.content--subCopy').classList.add('hidden');

    if (document.querySelector('.below'))
      document.querySelector('.below').classList.add('hidden');
  }
});
