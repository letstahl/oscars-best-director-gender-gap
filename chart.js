(function () {
  'use strict';

  const CSV_PATH = 'data/processed/oscars_best_director.csv';
  const MARGIN   = { top: 60, right: 60, bottom: 130, left: 44 };

  const tooltip = d3.select('body')
    .append('div')
    .attr('class', 'chart-tooltip');

  function showTooltip(event, d) {
    const hasImg = d.wiki_image_url && d.wiki_image_url.trim() !== '';
    tooltip.html(`
      ${hasImg
        ? `<img class="tooltip__photo" src="${d.wiki_image_url}" alt="${d.name}" onerror="this.style.display='none'">`
        : `<div class="tooltip__photo--placeholder"></div>`}
      <div class="tooltip__body">
        <div class="tooltip__year">
          ${d.year}
          ${+d.win === 1 ? '<span class="tooltip__winner-badge">★ Winner</span>' : ''}
        </div>
        <div class="tooltip__name">${d.name}</div>
        <div class="tooltip__film">${d.film}</div>
      </div>
    `);
    positionTooltip(event);
    tooltip.classed('is-visible', true);
  }

  function moveTooltip(event) { positionTooltip(event); }
  function hideTooltip()      { tooltip.classed('is-visible', false); }

  function positionTooltip(event) {
    const TW = 260, TH = 420, PAD = 18;
    let x = event.clientX + PAD;
    let y = event.clientY - TH / 2;
    if (x + TW > window.innerWidth - PAD) x = event.clientX - TW - PAD;
    y = Math.max(PAD, Math.min(y, window.innerHeight - TH - PAD));
    tooltip.style('left', x + 'px').style('top', y + 'px');
  }

  let allData = [];

  function drawChart(rawData) {
    rawData.forEach(d => {
      d.year           = +d.year;
      d.win            = +d.win;
      d.is_woman       = +d.is_woman;
      d.nominees_count = +d.nominees_count;
    });
    allData = rawData;
    render(rawData);
  }

  function render(data) {
    d3.select('#chart-svg-wrap').selectAll('*').remove();

    const yearData = Array.from(
      d3.rollup(data, v => v[0].nominees_count, d => d.year),
      ([year, count]) => ({ year, count })
    ).sort((a, b) => a.year - b.year);

    const womenData = data.filter(d => d.is_woman === 1);

    const wrap   = document.getElementById('chart-svg-wrap');
    const totalW = Math.max(wrap.clientWidth || 960, 700);
    const totalH = Math.max(500, Math.round(totalW * 0.5));
    const W      = totalW - MARGIN.left - MARGIN.right;
    const H      = totalH - MARGIN.top  - MARGIN.bottom;

    const minYear = d3.min(yearData, d => d.year);
    const maxYear = d3.max(yearData, d => d.year);

    const xScale = d3.scaleLinear()
      .domain([minYear - 1, maxYear + 2])
      .range([0, W]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(yearData, d => d.count) + 1])
      .range([H, 0]);

    const svg = d3.select('#chart-svg-wrap')
      .append('svg')
      .attr('viewBox', `0 0 ${totalW} ${totalH}`)
      .attr('width', '100%');

    const g = svg.append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale).tickSize(-W).tickFormat('').ticks(5));

    const xTicks = d3.range(Math.ceil(minYear / 10) * 10, maxYear + 1, 10);

    g.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(xScale).tickValues(xTicks).tickFormat(d3.format('d')).tickSize(6));

    g.append('g')
      .attr('class', 'axis axis--y')
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format('d')).tickSize(4));

    const line = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.count))
      .curve(d3.curveMonotoneX);

    const path = g.append('path')
      .datum(yearData)
      .attr('class', 'chart-line')
      .attr('d', line);

    const totalLen = path.node().getTotalLength();
    path
      .attr('stroke-dasharray', `${totalLen} ${totalLen}`)
      .attr('stroke-dashoffset', totalLen)
      .transition().duration(1000).ease(d3.easeCubicInOut)
      .attr('stroke-dashoffset', 0);

    g.selectAll('.dot--male')
      .data(yearData)
      .join('circle')
      .attr('class', 'dot--male')
      .attr('cx', d => xScale(d.year))
      .attr('cy', d => yScale(d.count))
      .attr('r', 3)
      .style('opacity', 0)
      .transition().delay(1000).duration(400)
      .style('opacity', 0.65);

    const cX1  = xScale(2017.5);
    const cX2  = xScale(maxYear + 1.5);
    const cMid = (cX1 + cX2) / 2;

    g.append('rect')
      .attr('class', 'cluster-band')
      .attr('x', cX1).attr('y', 0)
      .attr('width', Math.max(0, cX2 - cX1))
      .attr('height', H)
      .style('opacity', 0)
      .transition().delay(1400).duration(600)
      .style('opacity', 1);

    const clG = g.append('g').attr('class', 'annotation annotation--cluster').style('opacity', 0);
    const bY  = 10;

    clG.append('line').attr('x1', cX1 + 2).attr('y1', bY).attr('x2', cX2 - 2).attr('y2', bY).attr('class', 'annotation-bracket');
    clG.append('line').attr('x1', cX1 + 2).attr('y1', bY - 4).attr('x2', cX1 + 2).attr('y2', bY + 4).attr('class', 'annotation-bracket');
    clG.append('line').attr('x1', cX2 - 2).attr('y1', bY - 4).attr('x2', cX2 - 2).attr('y2', bY + 4).attr('class', 'annotation-bracket');

    [['2018 – 2025', true], ['6 of the 10 women ever nominated', false]].forEach(([txt, bold], i) => {
      clG.append('text')
        .attr('x', cMid).attr('y', bY + 18 + i * 14)
        .attr('text-anchor', 'middle')
        .attr('class', bold ? 'annotation-text--cluster-bold' : 'annotation-text--cluster')
        .text(txt);
    });

    clG.transition().delay(1600).duration(500).style('opacity', 1);

    const womenByYear = d3.group(womenData, d => d.year);
    const annotLayer  = g.append('g').attr('class', 'annot-layer');

    const ANNOT_BELOW = {
      1977: { row: 0, lines: ['49 years after the Oscars began —', '1st woman nominated'] },
      2010: { row: 1, lines: ['82 years after 1928 —', '1st woman to win Best Director'], isWin: true }
    };

    womenByYear.forEach((women, year) => {
      women.forEach((d, i) => {
        const isWinner = d.win === 1;
        const cx       = xScale(year);
        const baseY    = yScale(d.nominees_count);
        const offsetY  = women.length > 1 ? (i - (women.length - 1) / 2) * 18 : 0;
        const cy       = baseY + offsetY;

        if (isWinner) {
          g.append('circle')
            .attr('cx', cx).attr('cy', cy).attr('r', 13)
            .attr('class', 'dot--winner-ring')
            .style('opacity', 0)
            .transition().delay(1500).duration(700).style('opacity', 1);
        }

        g.append('circle')
          .attr('class', isWinner ? 'dot--female dot--winner' : 'dot--female')
          .attr('data-name', d.name)
          .attr('cx', cx).attr('cy', cy)
          .attr('r', isWinner ? 9 : 7)
          .style('opacity', 0)
          .on('mouseover', ev => showTooltip(ev, d))
          .on('mousemove', moveTooltip)
          .on('mouseleave', hideTooltip)
          .on('click', (ev) => { ev.stopPropagation(); toggleHighlight(d.name); })
          .transition().delay(1400 + i * 90).duration(500)
          .ease(d3.easeBackOut).style('opacity', 1);

        if (!ANNOT_BELOW[year] || i !== 0) return;

        const ann    = ANNOT_BELOW[year];
        const rowY   = ann.row === 0 ? H + 38 : H + 84;
        const lineH  = 14;
        const isWin  = !!ann.isWin;
        const lClass = isWin ? 'annot-line annot-line--winner' : 'annot-line';
        const dClass = isWin ? 'annot-dot annot-dot--winner'   : 'annot-dot';
        const b      = isWin ? 'annot-text--winner-bold'       : 'annot-text--bold';
        const n      = isWin ? 'annot-text--winner'            : 'annot-text';

        annotLayer.append('line')
          .attr('x1', cx).attr('y1', cy + (isWinner ? 10 : 8))
          .attr('x2', cx).attr('y2', rowY - 6)
          .attr('class', lClass)
          .style('opacity', 0)
          .transition().delay(1700).duration(400).style('opacity', 1);

        annotLayer.append('circle')
          .attr('cx', cx).attr('cy', rowY - 2).attr('r', 2.5)
          .attr('class', dClass)
          .style('opacity', 0)
          .transition().delay(1700).duration(300).style('opacity', 1);

        ann.lines.forEach((txt, li) => {
          annotLayer.append('text')
            .attr('x', cx).attr('y', rowY + 12 + li * lineH)
            .attr('text-anchor', 'middle')
            .attr('class', li === 0 ? b : n)
            .text(txt)
            .style('opacity', 0)
            .transition().delay(1900 + li * 60).duration(400).style('opacity', 1);
        });
      });
    });

    const traceLayer = g.append('g').attr('class', 'trace-layer');
    let highlightedName = null;

    function toggleHighlight(name) {
      highlightedName = (highlightedName === name) ? null : name;
      traceLayer.selectAll('*').remove();

      const femaleDots = g.selectAll('.dot--female');

      if (!highlightedName) {
        femaleDots.classed('is-dimmed', false).classed('is-highlighted', false);
        return;
      }

      femaleDots
        .classed('is-dimmed', function () { return d3.select(this).attr('data-name') !== highlightedName; })
        .classed('is-highlighted', function () { return d3.select(this).attr('data-name') === highlightedName; });

      const points = womenData
        .filter(d => d.name === highlightedName)
        .sort((a, b) => a.year - b.year)
        .map(d => ({ x: xScale(d.year), y: yScale(d.nominees_count) }));

      if (points.length > 1) {
        const traceLine = d3.line().x(d => d.x).y(d => d.y).curve(d3.curveMonotoneX);
        traceLayer.append('path')
          .datum(points)
          .attr('class', 'trace-path')
          .attr('d', traceLine);
      }
    }

    svg.on('click', () => toggleHighlight(null));
  }

  let chartDrawn = false;

  function initChart() {
    if (chartDrawn) return;
    chartDrawn = true;
    d3.csv(CSV_PATH).then(drawChart).catch(() => {
      document.getElementById('chart-svg-wrap').innerHTML =
        '<p style="color:#555;font-style:italic;padding:40px;text-align:center">Could not load oscars_chart.csv</p>';
    });
  }

  window.initOscarsChart = initChart;

})();