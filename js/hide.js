window.addEventListener('keydown', (event) => {
  if (event.key === 'h') {
    if (document.querySelector('.nav--gridContainer'))
      document.querySelector('.nav--gridContainer').classList.add('hide-all');

    if (document.querySelector('.side-pannel'))
      document.querySelector('.side-pannel').classList.add('hide-all');

    if (document.querySelector('.main--contentWrapper'))
      document.querySelector('.main--contentWrapper').classList.add('hide-all');

    if (document.querySelector('.content--contentWrapper'))
      document
        .querySelector('.content--contentWrapper')
        .classList.add('hide-all');

    if (document.querySelector('.content--subCopy'))
      document.querySelector('.content--subCopy').classList.add('hide-all');

    if (document.querySelector('.below'))
      document.querySelector('.below').classList.add('hide-all');
  }
});
