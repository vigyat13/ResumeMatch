from __future__ import annotations


def build_job_preview_html() -> str:
    return """<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: #f4f2ef;
      color: #111827;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      overflow: hidden;
    }
    .top {
      height: 82px;
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 0 48px;
      border-bottom: 1px solid #e5e7eb;
      background: #fff;
    }
    .brand { color: #0a66c2; font-size: 28px; font-weight: 850; }
    .search {
      flex: 1;
      height: 48px;
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: 780px;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      background: #fff;
      padding: 0 16px;
      box-shadow: 0 8px 22px rgba(15,23,42,.06);
    }
    .search input {
      width: 100%;
      border: 0;
      outline: 0;
      font-size: 17px;
      color: #111827;
      background: transparent;
    }
    .button {
      border: 0;
      border-radius: 12px;
      background: #2563eb;
      color: #fff;
      padding: 14px 28px;
      font-size: 16px;
      font-weight: 800;
    }
    main { padding: 28px 48px 42px; }
    .headline {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 18px;
    }
    .headline h1 { margin: 0 0 5px; font-size: 25px; letter-spacing: 0; }
    .headline p { margin: 0; color: #64748b; font-size: 15px; }
    .status {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      border: 1px solid #dbeafe;
      border-radius: 999px;
      background: #eff6ff;
      color: #1d4ed8;
      padding: 9px 14px;
      font-weight: 850;
    }
    .status i {
      width: 9px;
      height: 9px;
      border-radius: 999px;
      background: #3b82f6;
      animation: pulse 1.1s ease-in-out infinite;
    }
    .layout { display: grid; grid-template-columns: 410px 1fr; gap: 24px; }
    .panel {
      border: 1px solid #e5e7eb;
      border-radius: 20px;
      background: #fff;
      box-shadow: 0 18px 55px rgba(15,23,42,.08);
      overflow: hidden;
    }
    .panel h2 {
      margin: 0;
      padding: 19px 22px;
      border-bottom: 1px solid #eef2f7;
      font-size: 18px;
    }
    .source {
      display: grid;
      grid-template-columns: 48px 1fr;
      gap: 14px;
      align-items: center;
      padding: 17px 22px;
      border-bottom: 1px solid #f1f5f9;
    }
    .source:last-child { border-bottom: 0; }
    .logo {
      width: 48px;
      height: 48px;
      display: grid;
      place-items: center;
      border-radius: 14px;
      background: #eef6ff;
      color: #2563eb;
      font-weight: 850;
    }
    .source strong { display: block; margin-bottom: 4px; font-size: 15px; }
    .source small { color: #64748b; }
    .bar { height: 8px; margin-top: 9px; overflow: hidden; border-radius: 999px; background: #e5e7eb; }
    .bar span {
      display: block;
      width: 14%;
      height: 100%;
      border-radius: inherit;
      background: #22c55e;
      transition: width .55s ease;
    }
    .source.active .bar span { width: 88%; }
    .work { padding: 22px; min-height: 498px; }
    .empty {
      display: grid;
      min-height: 455px;
      place-items: center;
      border: 1px dashed #cbd5e1;
      border-radius: 18px;
      color: #94a3b8;
      font-weight: 750;
    }
    .live-feed { display: none; }
    body[data-phase="searching"] .empty { display: none; }
    body[data-phase="searching"] .live-feed { display: block; }
    .feed-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 14px;
      padding: 18px;
      border: 1px solid #e5e7eb;
      border-radius: 18px;
      background: #fff;
      animation: rowIn .55s ease both;
    }
    .feed-row:nth-child(2) { animation-delay: 120ms; }
    .feed-row:nth-child(3) { animation-delay: 240ms; }
    .feed-row:nth-child(4) { animation-delay: 360ms; }
    .feed-row strong { display: block; margin-bottom: 5px; font-size: 16px; }
    .feed-row span { color: #64748b; font-size: 14px; }
    .spinner {
      width: 28px;
      height: 28px;
      border: 3px solid #dbeafe;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin .8s linear infinite;
    }
    .results { display: none; grid-template-columns: 410px 1fr; gap: 24px; }
    body[data-phase="results"] .layout { display: none; }
    body[data-phase="results"] .results { display: grid; }
    .job-list, .detail {
      border: 1px solid #e5e7eb;
      border-radius: 20px;
      background: #fff;
      box-shadow: 0 18px 55px rgba(15,23,42,.08);
      overflow: hidden;
    }
    .job {
      display: grid;
      grid-template-columns: 52px 1fr;
      gap: 14px;
      padding: 16px 18px;
      border-bottom: 1px solid #f1f5f9;
      animation: rowIn .55s ease both;
    }
    .job.active {
      border: 2px solid #3b82f6;
      border-radius: 17px;
      margin: 13px;
      box-shadow: 0 12px 32px rgba(59,130,246,.18);
    }
    .job-title { margin: 1px 0 5px; font-size: 16px; font-weight: 850; }
    .meta { color: #64748b; font-size: 14px; line-height: 1.35; }
    .chips { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
    .chip { border-radius: 999px; background: #f1f5f9; color: #475569; padding: 5px 9px; font-size: 12px; font-weight: 750; }
    .detail { padding: 28px; min-height: 500px; }
    .detail h2 { margin: 0 0 8px; font-size: 25px; }
    .detail .company { margin: 0 0 20px; color: #64748b; font-size: 16px; }
    .section { margin-top: 20px; }
    .section h3 { margin: 0 0 10px; font-size: 13px; color: #334155; text-transform: uppercase; letter-spacing: .08em; }
    .section p { margin: 0; color: #475569; font-size: 16px; line-height: 1.55; }
    .actions { display: flex; gap: 12px; margin-top: 28px; }
    .primary, .secondary { border-radius: 999px; padding: 14px 22px; font-weight: 850; }
    .primary { background: #2563eb; color: #fff; }
    .secondary { border: 1px solid #e5e7eb; color: #334155; }
    .cursor {
      position: fixed;
      left: 0;
      top: 0;
      z-index: 20;
      width: 30px;
      height: 30px;
      pointer-events: none;
      transform: translate(130px, 130px) rotate(-16deg);
      filter: drop-shadow(0 8px 10px rgba(0,0,0,.25));
      transition: transform 120ms linear;
    }
    .cursor::before {
      content: "";
      position: absolute;
      border-left: 22px solid #111827;
      border-top: 13px solid transparent;
      border-bottom: 13px solid transparent;
    }
    .cursor.click::after {
      content: "";
      position: absolute;
      left: -13px;
      top: -13px;
      width: 44px;
      height: 44px;
      border: 2px solid rgba(37,99,235,.75);
      border-radius: 999px;
      animation: click .34s ease-out;
    }
    .caption {
      position: fixed;
      left: 48px;
      right: 48px;
      bottom: 0;
      padding: 38px 24px 20px;
      color: #fff;
      font-size: 18px;
      font-weight: 750;
      background: linear-gradient(0deg, rgba(15,23,42,.74), rgba(15,23,42,0));
    }
    @keyframes pulse { 50% { transform: scale(.72); opacity: .55; } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes rowIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes click { from { opacity: 1; transform: scale(.45); } to { opacity: 0; transform: scale(1.5); } }
  </style>
</head>
<body data-phase="idle">
  <div class="top">
    <div class="brand">Job Search</div>
    <label class="search">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="m21 21-4.2-4.2M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" stroke="#64748b" stroke-width="2" stroke-linecap="round"/></svg>
      <input id="searchInput" autocomplete="off" />
    </label>
    <button id="searchButton" class="button">Search</button>
  </div>
  <main>
    <div class="headline">
      <div><h1 id="title">Waiting for prompt</h1><p id="subtitle">The browser stream will type, search, and open matching listings.</p></div>
      <div class="status"><i></i><span id="status">Ready</span></div>
    </div>
    <div class="layout">
      <section class="panel">
        <h2>Sources</h2>
        <div class="source" data-source data-source-name="linkedin"><div class="logo">Li</div><div><strong>LinkedIn</strong><small>Waiting</small><div class="bar"><span></span></div></div></div>
        <div class="source" data-source data-source-name="indeed"><div class="logo">In</div><div><strong>Indeed</strong><small>Waiting</small><div class="bar"><span></span></div></div></div>
        <div class="source" data-source data-source-name="glassdoor"><div class="logo">Gl</div><div><strong>Glassdoor</strong><small>Waiting</small><div class="bar"><span></span></div></div></div>
        <div class="source" data-source data-source-name="career"><div class="logo">Co</div><div><strong>Company career pages</strong><small>Waiting</small><div class="bar"><span></span></div></div></div>
      </section>
      <section class="panel work">
        <div class="empty">Waiting for live job API response</div>
        <div class="live-feed">
          <div class="feed-row"><div><strong>Query submitted</strong><span>The prompt and location filter were sent to the job search API.</span></div><div class="spinner"></div></div>
          <div class="feed-row"><div><strong>Checking publishers</strong><span>Watching LinkedIn, Indeed, Glassdoor, and direct career-page results.</span></div><div class="spinner"></div></div>
          <div class="feed-row"><div><strong>Waiting for real listings</strong><span>No placeholder jobs are rendered before the API returns.</span></div><div class="spinner"></div></div>
        </div>
      </section>
    </div>
    <div class="results">
      <section id="jobList" class="job-list"></section>
      <section id="detail" class="detail"></section>
    </div>
  </main>
  <div id="cursor" class="cursor"></div>
  <div id="caption" class="caption">Opening browser session.</div>
  <script>
    const cursor = document.getElementById('cursor');
    const input = document.getElementById('searchInput');
    const title = document.getElementById('title');
    const subtitle = document.getElementById('subtitle');
    const statusText = document.getElementById('status');
    const caption = document.getElementById('caption');
    const sources = [...document.querySelectorAll('[data-source]')];
    const jobList = document.getElementById('jobList');
    const detail = document.getElementById('detail');
    const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    const initials = (name) => String(name || 'JB').split(/\\s+/).filter(Boolean).slice(0,2).map((part) => part[0]).join('').toUpperCase() || 'JB';
    const ago = (iso) => {
      if (!iso) return 'Recently';
      const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
      if (hours < 1) return 'Just now';
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return days === 1 ? '1d ago' : `${days}d ago`;
    };

    window.agentPreview = {
      moveCursor(x, y, down = false) {
        cursor.style.transform = `translate(${x}px, ${y}px) rotate(-16deg)`;
        cursor.classList.toggle('click', Boolean(down));
        if (down) window.setTimeout(() => cursor.classList.remove('click'), 340);
      },
      setRun(query, location) {
        title.textContent = `Search ${query || 'jobs'}${location ? ` in ${location}` : ''}`;
        subtitle.textContent = 'Typing prompt and preparing the job-board search.';
        statusText.textContent = 'Typing';
        caption.textContent = 'Typing the search prompt into the live browser.';
      },
      setSearching(query, location) {
        document.body.dataset.phase = 'searching';
        title.textContent = `Searching ${query || 'jobs'}${location ? ` in ${location}` : ''}`;
        subtitle.textContent = 'Scanning LinkedIn, Indeed, Glassdoor, and company career pages.';
        statusText.textContent = 'Searching';
        caption.textContent = 'Search submitted. Checking job boards and opening matching listings.';
        sources.forEach((source, index) => {
          window.setTimeout(() => {
            source.classList.add('active');
            source.querySelector('small').textContent = 'Scanning listings';
          }, index * 260);
        });
      },
      showResults(query, location, jobs) {
        const rows = Array.isArray(jobs) ? jobs.slice(0, 8) : [];
        const sourceCounts = rows.reduce((counts, job) => {
          const source = String(job.source || '').toLowerCase();
          if (source.includes('linkedin')) counts.linkedin += 1;
          else if (source.includes('indeed')) counts.indeed += 1;
          else if (source.includes('glassdoor')) counts.glassdoor += 1;
          else counts.career += 1;
          return counts;
        }, { linkedin: 0, indeed: 0, glassdoor: 0, career: 0 });
        document.body.dataset.phase = 'results';
        title.textContent = `${rows.length} jobs found`;
        subtitle.textContent = `Live API results for ${query || 'jobs'}${location ? ` in ${location}` : ''}.`;
        statusText.textContent = 'Complete';
        caption.textContent = 'Jobs found. Opening the strongest matching listing now.';
        sources.forEach((source) => {
          const key = source.dataset.sourceName;
          const count = sourceCounts[key] || 0;
          source.classList.add('active');
          source.querySelector('small').textContent = count ? `${count} live listing${count === 1 ? '' : 's'}` : 'Checked';
        });
        jobList.innerHTML = rows.map((job, index) => `
          <article class="job ${index === 0 ? 'active' : ''}" data-job="${index}">
            <div class="logo">${esc(initials(job.company))}</div>
            <div>
              <div class="job-title">${esc(job.title)}</div>
              <div class="meta">${esc(job.company)}<br>${esc(job.is_remote ? 'Remote' : job.location || 'Location not listed')}</div>
              <div class="chips"><span class="chip">${esc(job.source || 'Job board')}</span><span class="chip">${esc(ago(job.posted_at))}</span></div>
            </div>
          </article>
        `).join('');
        const first = rows[0];
        detail.innerHTML = first ? `
          <h2>${esc(first.title)}</h2>
          <p class="company">${esc(first.company)} - ${esc(first.is_remote ? 'Remote' : first.location || 'Location not listed')} - ${esc(first.source || 'Job board')}</p>
          <div class="section"><h3>Match summary</h3><p>${esc(first.description_snippet || 'This listing matches the role and location filters from your prompt.')}</p></div>
          <div class="section"><h3>Search filter</h3><p>Prompt: ${esc(query || 'jobs')}<br>Location: ${esc(location || 'anywhere')}</p></div>
          <div class="actions"><div class="primary">Open job</div><div class="secondary">Save</div></div>
        ` : '<h2>No jobs found</h2><p class="company">Try a broader role or location.</p>';
      }
    };
  </script>
</body>
</html>"""
