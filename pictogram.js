(function () {
  'use strict';

  const CSV_PATH = 'data/processed/oscars_best_director.csv';

  const OSCAR_PATH = 'M14.66 0.440141C14.2678 0.67654 13.7687 1.21948 13.5514 1.64617C13.0119 2.70444 13.0319 6.09748 13.5842 7.24896C14.1582 8.44621 14.1833 10.7027 13.6224 10.7027C12.8397 10.7027 8.96827 13.0177 8.37184 13.8428C7.47271 15.0862 7.1745 16.6202 7.51749 18.236C7.68078 19.004 8.06377 21.1439 8.36855 22.9909C8.97991 26.6957 9.48499 27.8193 10.7782 28.3502C11.557 28.67 11.6418 28.8499 11.6376 30.1761C11.6352 30.9853 11.4283 32.2878 11.1779 33.0704C10.7698 34.3452 10.7695 34.9603 11.1755 38.9716C11.4247 41.4346 11.8468 44.0435 12.1134 44.7686C12.4454 45.6703 12.543 46.576 12.4233 47.6349C11.8698 52.523 11.8892 54.3567 12.5155 56.2963C13.1355 58.2167 13.3164 61.2571 12.9531 63.6458L12.7782 64.7953L10.5262 65.1849C8.18168 65.5908 6.71388 66.3023 6.15118 67.3064C5.00578 69.3486 12.9627 71.2566 19.4781 70.502C24.5555 69.9139 27.4323 68.6384 26.6854 67.3064C26.1227 66.3023 24.6549 65.5908 22.3104 65.1849L20.0584 64.7953L19.8834 63.6458C19.5201 61.2571 19.701 58.2167 20.3211 56.2963C20.9473 54.3567 20.9667 52.523 20.4133 47.6349C20.2936 46.5776 20.3912 45.6706 20.7211 44.7734C21.768 41.9279 22.3038 32.8421 21.4587 32.2738C21.3133 32.1761 21.1945 31.3331 21.1945 30.4005C21.1945 28.8285 21.2575 28.6791 22.0584 28.3502C23.3516 27.8193 23.8567 26.6957 24.468 22.9909C24.7728 21.1439 25.1558 19.004 25.3191 18.236C25.6621 16.6202 25.3639 15.0862 24.4647 13.8428C23.8683 13.0177 19.9969 10.7027 19.2142 10.7027C18.6533 10.7027 18.6783 8.44621 19.2524 7.24896C19.7879 6.13223 19.8416 2.94896 19.3452 1.76372C18.6759 0.165423 16.2514 -0.519419 14.66 0.440141ZM25.9531 69.7054C21.7032 72.0652 10.4164 72.1042 6.21716 69.7739L5.09116 69.1489L4.59831 69.9668C4.2395 70.5624 4.14219 71.2622 4.2401 72.5438L4.37413 74.3035L3.07081 74.8448C2.35408 75.1426 1.36988 75.7505 0.8839 76.1954C0.00925349 76.9958 0 77.0393 0 80.3645V83.7251L1.88064 84.732C5.29176 86.5589 8.77632 87.1402 16.269 87.1327C21.1056 87.1279 23.4265 86.9905 25.0752 86.6109C28.1538 85.9027 30.3905 84.9389 31.7171 83.7485L32.8366 82.7441V79.8742C32.8366 77.0926 32.8094 76.9793 31.9527 76.1954C31.4667 75.7505 30.4849 75.1436 29.7708 74.8471L28.4726 74.3077L28.5971 72.4383C28.7048 70.8153 28.6287 70.4624 28.0177 69.7597L27.3141 68.9498L25.9531 69.7054Z';

  function makeSVG() {
    return `<svg viewBox="0 0 33 88" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="${OSCAR_PATH}"/></svg>`;
  }

  let allData     = [];
  let initialized = false;

  const pictoTooltip = document.createElement('div');
  pictoTooltip.className = 'picto-tooltip';
  document.body.appendChild(pictoTooltip);

  function buildPictogram(data) {
    allData = data.map(d => ({
      ...d,
      year:     +d.year,
      win:      +d.win,
      is_woman: +d.is_woman
    }));
    renderPictogram('all');
  }

  function renderPictogram(filter) {
    const wrap = document.getElementById('pictogram-wrap');
    wrap.innerHTML = '';

    let filtered = [...allData];
    if (filter === 'winner') filtered = allData.filter(d => d.win === 1);
    if (filter === 'women')  filtered = allData.filter(d => d.is_woman === 1);

    const nomCount = {};
    allData.forEach(d => {
      if (!nomCount[d.name]) nomCount[d.name] = { total: 0, wins: 0, years: [] };
      nomCount[d.name].total++;
      nomCount[d.name].years.push(d.year);
      if (d.win === 1) nomCount[d.name].wins++;
    });

    filtered.sort((a, b) => a.year - b.year);

    filtered.forEach((d, i) => {
      const item = document.createElement('div');
      item.className = 'picto-item';
      item.classList.add(d.is_woman === 1 ? 'picto-item--female' : 'picto-item--male');
      if (d.win === 1) item.classList.add('picto-item--winner');
      item.innerHTML = makeSVG();

      item.addEventListener('mouseenter', (e) => showTooltip(e, d, nomCount[d.name]));
      item.addEventListener('mousemove',  movePictoTooltip);
      item.addEventListener('mouseleave', hidePictoTooltip);

      wrap.appendChild(item);
      setTimeout(() => item.classList.add('is-visible'), 10 + i * 6);
    });
  }

  function showTooltip(event, d, counts) {
    const sortedYears = [...counts.years].sort((a, b) => a - b);
    const nomIndex    = sortedYears.indexOf(d.year) + 1;
    const nomLabel    = counts.total > 1
      ? `Nomination ${nomIndex} of ${counts.total}`
      : `1 nomination`;

    const winLabel = d.win === 1
      ? '★ Winner'
      : counts.wins > 0
        ? 'Won in another year'
        : 'Never won';

    const winClass = d.win === 1
      ? 'picto-tooltip__badge--win'
      : counts.wins > 0
        ? 'picto-tooltip__badge--nom'
        : 'picto-tooltip__badge--nowin';

    const hasImg = d.wiki_image_url && d.wiki_image_url.trim() !== '';

    pictoTooltip.innerHTML = `
      ${hasImg
        ? `<img class="picto-tooltip__photo" src="${d.wiki_image_url}" alt="${d.name}" onerror="this.style.display='none'">`
        : `<div class="picto-tooltip__photo--placeholder"></div>`}
      <div class="picto-tooltip__body">
        <div class="picto-tooltip__year">
          ${d.year}
          ${d.win === 1 ? '<span class="picto-tooltip__badge picto-tooltip__badge--win" style="font-size:0.5rem;padding:1px 5px;">★ Winner</span>' : ''}
        </div>
        <div class="picto-tooltip__name">${d.name}</div>
        <div class="picto-tooltip__film">${d.film}</div>
        <div class="picto-tooltip__badges">
          <span class="picto-tooltip__badge picto-tooltip__badge--nom">${nomLabel}</span>
          <span class="picto-tooltip__badge ${winClass}">${winLabel}</span>
        </div>
      </div>
    `;

    movePictoTooltip(event);
    pictoTooltip.classList.add('is-visible');
  }

  function movePictoTooltip(event) {
    const TW = 260, TH = 420, PAD = 16;
    let x = event.clientX + PAD;
    let y = event.clientY - TH / 2;
    if (x + TW > window.innerWidth - PAD) x = event.clientX - TW - PAD;
    y = Math.max(PAD, Math.min(y, window.innerHeight - TH - PAD));
    pictoTooltip.style.left = x + 'px';
    pictoTooltip.style.top  = y + 'px';
  }

  function hidePictoTooltip() {
    pictoTooltip.classList.remove('is-visible');
  }

  function initPictogram() {
    if (initialized) return;
    initialized = true;
    d3.csv(CSV_PATH).then(buildPictogram).catch(() => {
      document.getElementById('pictogram-wrap').innerHTML =
        '<p style="color:#555;font-style:italic;padding:40px;text-align:center;width:100%">Could not load oscars_chart.csv</p>';
    });
  }

  function filterPictogram(filter) {
    if (!initialized) return;
    renderPictogram(filter);
  }

  window.initPictogram   = initPictogram;
  window.filterPictogram = filterPictogram;

})();