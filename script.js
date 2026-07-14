const toggle = document.querySelector('.menu-toggle');

if (toggle) {
  toggle.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', () => {
    document.body.classList.remove('menu-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  });
});




// v15: persist selected nav item. Works with all .nav-links hash links.
(function () {
  const navLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  if (!navLinks.length) return;

  const storageKey = 'theorem-active-nav';

  function normalize(hash) {
    if (!hash || hash === '#') return '#solutions';
    return hash;
  }

  function setActive(hash, persist = true) {
    hash = normalize(hash);

    navLinks.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === hash);
    });

    if (persist) {
      try { localStorage.setItem(storageKey, hash); } catch (_) {}
    }
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      setActive(link.getAttribute('href'), true);
    });
  });

  window.addEventListener('hashchange', () => {
    setActive(window.location.hash, true);
  });

  let storedHash = '';
  try { storedHash = localStorage.getItem(storageKey) || ''; } catch (_) {}

  const validHashes = navLinks.map((link) => link.getAttribute('href'));

  if (window.location.hash && validHashes.includes(window.location.hash)) {
    setActive(window.location.hash, true);
  } else if (storedHash && validHashes.includes(storedHash)) {
    setActive(storedHash, false);
  } else {
    setActive('#solutions', false);
  }
})();


// v22: hero text switch animation
(function () {
  const switcher = document.querySelector('.hero-switch > span');
  if (!switcher) return;

  const phrases = [
    'your workflows,',
    'your CRM,',
    'your support,',
    'your operations,'
  ];

  let index = 0;
  switcher.textContent = phrases[index];

  setInterval(() => {
    switcher.classList.add('is-changing');
    window.setTimeout(() => {
      index = (index + 1) % phrases.length;
      switcher.textContent = phrases[index];
      switcher.classList.remove('is-changing');
    }, 260);
  }, 2300);
})();


// v40 — pure HTML/CSS industry carousel
(function () {
  const carousel = document.querySelector('[data-industry-carousel]');
  if (!carousel) return;

  const track = carousel.querySelector('.industry-track');
  const slides = Array.from(carousel.querySelectorAll('.industry-card'));
  const prev = carousel.querySelector('.industry-prev');
  const next = carousel.querySelector('.industry-next');

  if (!track || !slides.length || !prev || !next) return;

  let page = 0;

  function perView() {
    if (window.innerWidth <= 720) return 1;
    if (window.innerWidth <= 1120) return 2;
    return 3;
  }

  function totalPages() {
    return Math.ceil(slides.length / perView());
  }

  function update(animate = true) {
    const maxPage = Math.max(totalPages() - 1, 0);
    page = Math.max(0, Math.min(page, maxPage));

    const targetIndex = Math.min(page * perView(), slides.length - 1);
    const offset = slides[targetIndex].offsetLeft;

    track.style.transition = animate ? 'transform .48s cubic-bezier(.22,.61,.36,1)' : 'none';
    track.style.transform = `translate3d(${-offset}px, 0, 0)`;

    prev.disabled = page === 0;
    next.disabled = page === maxPage;
  }

  prev.addEventListener('click', function () {
    page -= 1;
    update(true);
  });

  next.addEventListener('click', function () {
    page += 1;
    update(true);
  });

  window.addEventListener('resize', function () {
    update(false);
  });

  window.addEventListener('load', function () {
    update(false);
  });

  update(false);
})();


// v47 — industry slider autoplay without next/previous buttons
(() => {
  const carousel = document.querySelector('[data-industry-carousel]');
  if (!carousel) return;

  const track = carousel.querySelector('.industry-track');
  const cards = Array.from(carousel.querySelectorAll('.industry-card'));
  if (!track || cards.length < 4) return;

  let index = 0;
  let timer = null;

  const getVisibleCount = () => {
    if (window.innerWidth <= 720) return 1;
    if (window.innerWidth <= 1120) return 2;
    return 3;
  };

  const update = () => {
    const visible = getVisibleCount();
    const maxIndex = Math.max(0, cards.length - visible);
    if (index > maxIndex) index = 0;

    const gap = parseFloat(getComputedStyle(track).gap || "0");
    const cardWidth = cards[0].getBoundingClientRect().width;
    track.style.transition = "transform 650ms cubic-bezier(.22,.8,.24,1)";
    track.style.transform = `translateX(-${index * (cardWidth + gap)}px)`;
  };

  const next = () => {
    const visible = getVisibleCount();
    const maxIndex = Math.max(0, cards.length - visible);
    index = index >= maxIndex ? 0 : index + 1;
    update();
  };

  const start = () => {
    stop();
    timer = window.setInterval(next, 2100);
  };

  const stop = () => {
    if (timer) window.clearInterval(timer);
    timer = null;
  };

  carousel.addEventListener("mouseenter", stop);
  carousel.addEventListener("mouseleave", start);
  window.addEventListener("resize", update);

  update();
  start();
})();


// Document extraction product page
// Guarded above so this code is inert on every existing page.
(function(){
  'use strict';
  if (!document.body.classList.contains('document-extraction-page')) return;
  const qs=(s,r=document)=>r.querySelector(s),qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const obs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}}),{threshold:.1});qsa('.reveal').forEach(e=>obs.observe(e));

  const features={
    collect:{label:'COLLECT & UNDERSTAND',title:'One controlled intake for every document source.',items:['Ingest from email, uploads, portals, scanners, folders and APIs.','Read complex layouts, tables, handwriting and email context.','Keep sender, timestamp, attachment and source lineage together.','Classify every document before the next workflow step begins.']},
    validate:{label:'VALIDATE AGAINST BUSINESS RULES',title:'Accurate extraction is not the same as valid business data.',items:['Cross-check fields against master sheets, databases and prior records.','Apply company-specific pricing, format and completeness rules.','Detect conflicting totals, inactive vendors and missing references.','Stop incorrect data before it enters another system.']},
    review:{label:'ROUTE EDGE CASES TO PEOPLE',title:'Send people the decision—not the entire document.',items:['Route low-confidence and conflicting fields to the right reviewer.','Show the source, reference value and recommendation together.','Record comments, corrections, decisions and timestamps.','Return approved records to the workflow immediately.']},
    deliver:{label:'DELIVER CLEAN DATA',title:'Finish the business workflow, not only the extraction.',items:['Map verified fields to exact destination schemas.','Send output to ERP, CRM, spreadsheets, databases and APIs.','Keep source documents and activity history attached.','Retry failed deliveries without processing the document again.']}
  };
  qsa('.feature-tab').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.feature,d=features[k];qsa('.feature-tab').forEach(x=>x.classList.toggle('active',x===b));qsa('.feature-scene').forEach(x=>x.classList.toggle('active-scene',x.classList.contains(k+'-scene')));qs('#featureCopy').innerHTML=`<span class="section-label">${d.label}</span><h3>${d.title}</h3><ul>${d.items.map(x=>`<li>${x}</li>`).join('')}</ul>`;}));

  /* Nanonets-inspired auto-running storytelling sections */
  const contextKeys=['pdf','erp','invoice','emails','sop'];
  let contextIndex=0, contextTimer=null;
  const contextColors={pdf:'#7488ff',erp:'#c3a65f',invoice:'#66b692',emails:'#d68169',sop:'#8569ff'};
  function selectContext(key, manual){
    contextIndex=contextKeys.indexOf(key);
    qsa('.context-source').forEach(b=>b.classList.toggle('active',b.dataset.context===key));
    qsa('[data-context-ref]').forEach(m=>{
      const active=m.dataset.contextRef===key;
      m.classList.toggle('active',active);
      m.style.setProperty('--ctx-color',contextColors[m.dataset.contextRef]||'#7488ff');
    });
    if(manual) restartContext();
  }
  function restartContext(){clearInterval(contextTimer);contextTimer=setInterval(()=>{contextIndex=(contextIndex+1)%contextKeys.length;selectContext(contextKeys[contextIndex]);},1900);}
  qsa('.context-source').forEach(b=>b.addEventListener('click',()=>selectContext(b.dataset.context,true)));
  qsa('[data-context-ref]').forEach(m=>m.addEventListener('mouseenter',()=>selectContext(m.dataset.contextRef,true)));
  if(qs('.context-source')){selectContext('pdf');restartContext();}

  const usecaseData={
    extract:{metric:'95%*',unit:'sample field-capture goal',title:'Convert messy files into structured records',body:'Read the forms, invoices, orders and transport documents behind your operations, preserve their structure, and prepare the result for immediate use.',items:['Handle mixed layouts and file types','Retain tables, rows and relationships','Escalate uncertain values with evidence','Map results to the destination schema']},
    invoice:{metric:'90%*',unit:'sample straight-through goal',title:'Move supplier bills from inbox to posting',body:'Understand invoices in the format they arrive, compare them with orders and receipts, apply your coding rules, and pause only when something does not agree.',items:['Read every supplier layout','Compare two or three source records','Apply account-coding policies','Post approved entries to finance']},
    order:{metric:'85%*',unit:'sample no-touch goal',title:'Create accurate sales orders from incoming POs',body:'Turn orders from email, portals and shared folders into complete sales records, checked against customer and product data before fulfilment begins.',items:['Capture orders from every channel','Check customers, products and pricing','Route only unresolved differences','Create records in the order system']},
    shipment:{metric:'3–5x*',unit:'sample throughput range',title:'Keep shipment records aligned with the paperwork',body:'Compare bills of lading, delivery evidence and freight documents with operational records, then update shipment status wherever teams track it.',items:['Understand BOLs and delivery proof','Link documents to shipment records','Surface quantity and signature gaps','Synchronise WMS and ERP status']},
    loan:{metric:'95%*',unit:'sample field-capture goal',title:'Turn application packs into review-ready cases',body:'Organise statements, income evidence, tax forms and valuations into a consistent case file, apply policy checks, and preserve a complete decision history.',items:['Organise mixed application documents','Check required policy conditions','Explain missing or conflicting evidence','Keep a review-ready activity history']}
  };
  const caseKeys=['extract','invoice','order','shipment','loan'];
  let caseIndex=0,caseTimer=null;
  function renderUsecase(key,manual){
    caseIndex=caseKeys.indexOf(key);const d=usecaseData[key];
    const tabs=qsa('.usecase-tab');
    const activeTab=tabs.find(b=>b.dataset.case===key);
    tabs.forEach(b=>b.classList.remove('active'));
    if(activeTab){void activeTab.offsetWidth;activeTab.classList.add('active');}
    qsa('.uc-scene').forEach(scene=>scene.classList.toggle('active',scene.classList.contains(key+'-scene')));
    const copy=qs('#usecaseCopy');
    if(copy) {
      copy.innerHTML=`<div class="metric-row"><strong>${d.metric}</strong><small>${d.unit}</small></div><h3>${d.title}</h3><p>${d.body}</p><ul>${d.items.map(x=>`<li>${x}</li>`).join('')}</ul><button class="usecase-demo-link js-open-demo" type="button">Walk through this workflow →</button>`;
      const demoLink=qs('.js-open-demo',copy);
      if(demoLink) demoLink.addEventListener('click',openDemo);
    }
    if(manual) restartUsecases();
  }
  function restartUsecases(){clearInterval(caseTimer);caseTimer=setInterval(()=>{caseIndex=(caseIndex+1)%caseKeys.length;renderUsecase(caseKeys[caseIndex]);},5200);}
  qsa('.usecase-tab').forEach(b=>b.addEventListener('click',()=>renderUsecase(b.dataset.case,true)));
  if(qs('.usecase-tab')){renderUsecase('extract');restartUsecases();}

  const industryData={
    finance:{title:'Move supplier documents from arrival to approval with less handling.',items:['Read invoices, purchase orders, receipts and statements as they arrive.','Match supplier, totals, tax and account details against your records.','Refresh cash-flow reporting and preserve a close-ready audit trail.'],proof:'Example workflow: four payables records are reconciled, reflected in live cash metrics and retained in the quarter-close evidence.',steps:[
      {title:'Pending invoices & receipts queue up',kind:'financeQueue',meta:'Accounts payable · Q2 2026 · awaiting action',badge:'128 pending',rows:[['Invoice · Northwind Traders','INV-3391 · Net 30','$1,247.00'],['Receipt · Office Supply Co','RCPT-2204 · card · East','$214.50'],['Invoice · Globex Ltd','INV-8820 · Net 45','$8,420.00'],['Statement · Harbor Bank','STMT-MAR · operations account','$42,388.00']]},
      {title:'Three-way match · invoice, PO & payment',kind:'financeMatch',meta:'Three-way match · invoice ↔ PO ↔ payment',badge:'4 of 4 matched',rows:[['INV-3391','$1,247.00','PO-4421','ACH · Harbor'],['INV-8820','$8,420.00','PO-7901','Wire · Corporate'],['INV-9114','$3,910.00','PO-6128','ACH · Treasury'],['INV-2204','$214.50','PO-3892','Card · Corporate']]},
      {title:'Cash-flow KPIs refresh in real time',kind:'financeKpis',meta:'Cash-flow cockpit · live KPIs',badge:'Live',rows:[['Pending payables','51','11','92%'],['DPO','30d','24d','18d'],['Cash visibility','T+5','Live','real-time']]},
      {title:'Audit log auto-validated · close ready',kind:'financeAudit',meta:'Audit trail · Q2 2026 close',badge:'Validated',rows:['SOX controls','Bank reconciliations','PO match','Receipt evidence','GL postings','Vendor master']}
    ]},
    banking:{title:'Prepare complete case files for faster, explainable lending decisions.',items:['Assemble applications, statements, income records and credit evidence.','Extract financial details and validate them against lending policy.','Post an approved decision with every source and calculation attached.'],proof:'Example workflow: a four-document loan packet becomes a decision-ready case with verified fields and an updated risk score.',steps:[
      {title:'Loan packet lands in the queue',kind:'loanQueue',meta:'LOAN-3892',person:'Sarah Chen · $385,000 · 30-yr fixed',badge:'4 docs',rows:[['Bank statements (3 mo)','stmt-jan–mar.pdf','42 fields'],['Pay stubs & W-2','income-2024.pdf','18 fields'],['Tax returns (2 years)','1040–23–24.pdf','31 fields'],['Credit report','tu-report.pdf','12 fields']]},
      {title:'Financial fields auto-extracted & validated',kind:'loanFields',meta:'Extracted & validated · LOAN-3892',badge:'103 fields',rows:[['Borrower','Sarah Chen'],['Loan amount','$385,000'],['Annual income','$142,400'],['DTI ratio','0.34'],['FICO score','762'],['Cash buffer','$28.9K']]},
      {title:'Risk score recomputed in real time',kind:'loanMetric',meta:'Bad-debt risk · LOAN-3892',badge:'Recomputing',from:67,to:24,saving:'64% lower vs. manual underwriting'},
      {title:'Decision posted · 64% lower bad-debt risk',kind:'loanSuccess',message:'Decision · Approved',detail:'Posted to loan origination system',saving:'Bad-debt risk down 64%'}
    ]},
    healthcare:{title:'Reduce administrative paperwork while keeping sensitive decisions controlled.',items:['Organise enrollment, eligibility and claim materials from every intake channel.','Check member, plan and coverage details before they enter a case system.','Escalate incomplete evidence with the exact source a reviewer needs.'],proof:'Example workflow: an eligibility packet is structured, checked and delivered with a complete evidence trail.',steps:[
      {title:'Intake forms & claims arrive from every channel',kind:'healthQueue',meta:'Intake queue · today',badge:'4 new',rows:[['Patient intake · Maria Alvarez','Form CMS-1500 · scanned','Email'],['Insurance claim · Aetna PPO','CPT 99213 · ICD J20.9','Patient portal'],['Medicaid application','State submission · 14 pages','Fax'],['Prior-auth request','Specialty prescription · Humira','EHR sync']]},
      {title:'Patient & coverage fields extracted',kind:'healthFields',meta:'Claim CLM-77231 · Maria Alvarez · CMS-1500',badge:'47 / 47 fields',rows:[['Patient','Maria Alvarez'],['Date of birth','03 / 14 / 1986'],['Member ID','W12345678'],['Plan','Aetna PPO'],['Diagnosis (ICD-10)','J20.9'],['Service (CPT)','99213']]},
      {title:'Eligibility verified against payer rules',kind:'healthChecks',meta:'Eligibility check · Aetna PPO · payer rules',badge:'Passed',rows:[['Member eligibility','ID W12345678 · active member'],['Coverage period','Within plan year · effective'],['CPT & ICD pair','99213 · J20.9 · medically appropriate'],['Required attachments','Chart notes · referral · ID']]},
      {title:'Application accepted · Patient onboarded',kind:'healthSuccess',message:'Application accepted · Patient onboarded',detail:'Maria Alvarez · synced to EHR & payer portal',badges:['Rejections down 71%','95%+ data accuracy']}
    ]},
    operations:{title:'Keep forms, sheets and requests moving without adding administrative work.',items:['Capture orders, reports, requests and operating forms from existing channels.','Configure extraction and routing visually around your existing systems.','Synchronise approved data and launch without a long internal build.'],proof:'Example workflow: mixed documents enter one configured pipeline and reach each destination with their operating context attached.',steps:[
      {title:'Financial documents arrive in the queue',kind:'opsQueue',meta:'Document workflow · operations queue',badge:'4 new',rows:[['Risk assessment · Acme Corp Q2','RA-2026-Q2 · 12 pages','Email'],['Expense report · Travel June','EXP-6224 · 38 line items','API webhook'],['Utility bill · Acme Energy','UB-1188 · Net 30','SFTP drop'],['Vendor contract · MSA v3','MSA-V3-2026 · 24 clauses','SharePoint']]},
      {title:'Configure the workflow visually',kind:'opsWorkflow',meta:'Workflow · document pipeline',badge:'Running',rows:[['⚡','Trigger · webhook','POST /v1/intake · attachments'],['▽','Extract · custom schema','28 fields · your taxonomy'],['✓','Validate · plain-English rules','Risk < 60 · auto-route'],['↗','Post · to your stack','REST + webhook fan-out']]},
      {title:'Pipe clean data into your existing stack',kind:'opsSync',meta:'Decision-ready data · your existing stack',badge:'Syncing',rows:[['▤','Data warehouse','analytics.theorrem.extractions'],['○','Customer CRM','Account & opportunity records'],['#','Operations alerts','Exceptions routed to channel']]},
      {title:'Live in 2 weeks · without a long in-house build',kind:'opsImpact',meta:'Impact · configure vs in-house build',badge:'Live'}
    ]},
    logistics:{title:'Keep shipment records moving at the same speed as the freight.',items:['Read bills of lading, dispatch tickets, invoices and delivery evidence.','Extract shipment details and reconcile supplier charges with delivery proof.','Shorten dock-to-pay time while keeping suppliers paid on schedule.'],proof:'Example workflow: four freight documents become a complete shipment record, three reconciled payments and a measurable cash-flow improvement.',steps:[
      {title:'BoLs & dispatch tickets arrive at the dock',kind:'logisticsQueue',meta:'Dock inbox · today',badge:'4 new',rows:[['▣','Bill of lading · BOL-77231','CSX · 24 pallets · LA → Chicago','Carrier portal'],['▣','Dispatch ticket · DT-4128','J.B. Hunt · 14:22 UTC','API webhook'],['▤','Shipping invoice · INV-9921','Maersk · $8,420 · Net 30','Email'],['☑','Proof of delivery · POD-3398','Signed · Midwest DC #4','SFTP drop']]},
      {title:'Shipment details extracted in seconds',kind:'logisticsFields',meta:'BOL-77231 · extracted from PDF',badge:'47 / 47 fields',rows:[['Shipper','Acme Industries'],['Consignee','Midwest DC #4'],['Weight','18,420 lbs'],['Pallets','24'],['Freight class','FC 70'],['Carrier · trailer','CSX · #4421']]},
      {title:'Invoices reconciled · supplier payments queued',kind:'logisticsPayments',meta:'AP queue · auto-pay · reconciled to POD',badge:'3 of 4 paid',rows:[['J.B. Hunt · DT-4128','ACH · Net 14','$3,210.00'],['CSX · BOL-77231','Wire · Net 30','$8,420.00'],['Maersk · INV-9921','ACH · early-pay discount','$5,180.00'],['FedEx Freight · DT-5512','ACH · Net 14','$1,990.00']]},
      {title:'Cash flow up · dock-to-pay 50× faster',kind:'logisticsImpact',meta:'Impact · automated vs manual entry',badge:'Cash flow up'}
    ]}
  };
  let industryKey='banking',industryStep=0,industryTimer=null,industryMetricFrame=null;
  function industryStageBody(step){
    if(step.kind==='financeQueue') return `<div class="industry-record-head"><div><i>▤</i><b>${step.meta}</b></div><em>${step.badge}</em></div><div class="industry-finance-queue">${step.rows.map((r,i)=>`<div style="--row:${i}"><i>□</i><p><b>${r[0]}</b><small>${r[1]}</small></p><strong>${r[2]}</strong><em>Pending</em></div>`).join('')}</div>`;
    if(step.kind==='financeMatch') return `<div class="industry-record-head"><div><i>⌁</i><b>${step.meta}</b></div><em id="industryMatchCount">0 of 4 matched</em></div><div class="industry-finance-match"><header><span>INVOICE</span><span>PO</span><span>PAYMENT</span><span>STATUS</span></header>${step.rows.map((r,i)=>`<div data-match-row="${i}"><p><b>${r[0]}</b><small>${r[1]}</small></p><span>${r[2]}</span><span>${r[3]}</span><em>Checking</em></div>`).join('')}</div>`;
    if(step.kind==='financeKpis') return `<div class="industry-record-head"><div><i>↗</i><b>${step.meta}</b></div><em id="industryKpiState">Refreshing</em></div><div class="industry-kpi-grid">${step.rows.map((r,i)=>`<div><small>${r[0]}</small><strong data-kpi-final="${r[2]}" data-kpi-index="${i}">${r[1]}</strong><em>${i===2?'✓ ': '↘ '}${r[3]}</em><svg viewBox="0 0 120 24" preserveAspectRatio="none"><path d="${i===2?'M0 20 L18 15 L44 12 L68 5 L93 2 L120 1':'M0 2 L18 5 L48 9 L78 13 L100 19 L120 22'}"/></svg></div>`).join('')}</div>`;
    if(step.kind==='financeAudit') return `<div class="industry-record-head"><div><i>☑</i><b>${step.meta}</b></div><em id="industryAuditState">Validating</em></div><div class="industry-audit-grid">${step.rows.map((r,i)=>`<div data-audit="${i}"><i>○</i><b>${r}</b></div>`).join('')}</div>`;
    if(step.kind==='healthQueue') return `<div class="industry-record-head"><div><i>▱</i><b>${step.meta}</b></div><em>${step.badge}</em></div><div class="industry-channel-queue">${step.rows.map((r,i)=>`<div style="--row:${i}"><i>□</i><p><b>${r[0]}</b><small>${r[1]}</small></p><em>${r[2]}</em></div>`).join('')}</div>`;
    if(step.kind==='healthFields') return `<div class="industry-record-head"><div><i>▤</i><b>${step.meta}</b></div><em>${step.badge}</em></div><div class="industry-health-fields">${step.rows.map((r,i)=>`<div style="--field:${i}"><small>${r[0]}</small><b>${r[1]}</b></div>`).join('')}</div>`;
    if(step.kind==='healthChecks') return `<div class="industry-record-head"><div><i>♢</i><b>${step.meta}</b></div><em id="industryHealthState">Running</em></div><div class="industry-health-checks">${step.rows.map((r,i)=>`<div data-health-check="${i}"><i>○</i><p><b>${r[0]}</b><small>${r[1]}</small></p><em>Idle</em></div>`).join('')}</div>`;
    if(step.kind==='healthSuccess') return `<div class="industry-health-success"><i>✓</i><h4>${step.message}</h4><p>${step.detail}</p><div><span>↘ ${step.badges[0]}</span><span>✓ ${step.badges[1]}</span></div></div>`;
    if(step.kind==='opsQueue') return `<div class="industry-record-head"><div><i>▱</i><b>${step.meta}</b></div><em>${step.badge}</em></div><div class="industry-channel-queue">${step.rows.map((r,i)=>`<div style="--row:${i}"><i>${i===0?'♢':'□'}</i><p><b>${r[0]}</b><small>${r[1]}</small></p><em>${r[2]}</em></div>`).join('')}</div>`;
    if(step.kind==='opsWorkflow') return `<div class="industry-record-head"><div><i>⌘</i><b>${step.meta}</b></div><em>● ${step.badge}</em></div><div class="industry-ops-workflow">${step.rows.map((r,i)=>`<div class="${i===0?'done':i===1?'running':''}"><i>${r[0]}</i><p><b>${r[1]}</b><small>${r[2]}</small></p><em>${i===0?'Done':i===1?'Running ···':'Idle'}</em></div>`).join('')}</div>`;
    if(step.kind==='opsSync') return `<div class="industry-record-head"><div><i>↥</i><b>${step.meta}</b></div><em id="industrySyncState">${step.badge}</em></div><div class="industry-sync-list">${step.rows.map((r,i)=>`<div data-sync="${i}"><i>${r[0]}</i><p><b>${r[1]}</b><small>${r[2]}</small></p><em>Syncing</em></div>`).join('')}</div>`;
    if(step.kind==='opsImpact') return `<div class="industry-record-head"><div><i>▥</i><b>${step.meta}</b></div><em class="complete">${step.badge}</em></div><div class="industry-impact"><div><small>TIME TO LAUNCH</small><p><strong>2 wks</strong><span>was <s>9 months</s></span></p><em>↘ 18× faster</em></div><div><small>ENGINEERING EFFORT</small><p><strong>0</strong><span>tickets · was <s>4 FTEs</s></span></p><em>✓ self-serve</em></div><aside><i>✓</i><p><b>Live in production · powered by Theorrem</b><small>Synced to warehouse · CRM · team alerts</small></p><span>↘ roadmap unblocked</span></aside></div>`;
    if(step.kind==='logisticsQueue') return `<div class="industry-record-head"><div><i>▣</i><b>${step.meta}</b></div><em>${step.badge}</em></div><div class="industry-channel-queue industry-logistics-queue">${step.rows.map((r,i)=>`<div style="--row:${i}"><i>${r[0]}</i><p><b>${r[1]}</b><small>${r[2]}</small></p><em>${r[3]}</em></div>`).join('')}</div>`;
    if(step.kind==='logisticsFields') return `<div class="industry-record-head"><div><i>▣</i><b>${step.meta}</b></div><em class="complete">${step.badge}</em></div><div class="industry-health-fields industry-logistics-fields">${step.rows.map((r,i)=>`<div style="--field:${i}"><small>${r[0]}</small><b>${r[1]}</b></div>`).join('')}</div>`;
    if(step.kind==='logisticsPayments') return `<div class="industry-record-head"><div><i>▤</i><b>${step.meta}</b></div><em id="industryPaymentCount">0 of 4 paid</em></div><div class="industry-logistics-payments">${step.rows.map((r,i)=>`<div data-payment="${i}"><i>▣</i><p><b>${r[0]}</b><small>${r[1]}</small></p><strong>${r[2]}</strong><em>${i<3?'Processing':'Queued'}</em></div>`).join('')}</div>`;
    if(step.kind==='logisticsImpact') return `<div class="industry-record-head"><div><i>▥</i><b>${step.meta}</b></div><em class="complete" id="industryLogisticsState">Processed</em></div><div class="industry-logistics-impact"><div><small>DOCK-TO-PAY TIME</small><p><strong id="dockPayMetric">0 hrs</strong><span>was <s>9 days</s></span></p><em>↘ 50× faster</em></div><div><small>ON-TIME PAYMENTS</small><p><strong id="onTimeMetric">12%</strong><span>was <s>67%</s></span></p><em>↗ +31 pts</em></div><aside id="logisticsImpactSummary"><i>✓</i><p><b>Cash flow up · suppliers paid on time</b><small>Detention fees down 82% · DSO down 12 days</small></p><span>↗ +$184K / mo</span></aside></div>`;
    if(step.kind==='loanQueue') return `<div class="industry-loan-head"><div><i>□</i><b>${step.meta}</b><span>·</span><strong>${step.person}</strong></div><em>${step.badge}</em></div><div class="industry-loan-files">${step.rows.map((r,i)=>`<div style="--row:${i}"><i>□</i><p><b>${r[0]}</b><small>${r[1]}</small></p><span>${r[2]}</span><em>✓ Verified</em></div>`).join('')}</div>`;
    if(step.kind==='loanFields') return `<div class="industry-loan-head"><div><i>⊕</i><b>${step.meta}</b></div><em>${step.badge}</em></div><div class="industry-loan-fields">${step.rows.map((r,i)=>`<div style="--field:${i}"><small>${r[0]}</small><b>${r[1]}</b></div>`).join('')}</div>`;
    if(step.kind==='loanMetric') return `<div class="industry-loan-risk"><header><b>${step.meta}</b><span>● ${step.badge}</span></header><strong id="industryRiskValue">${step.from}%</strong><div class="industry-risk-track"><i id="industryRiskBar" style="width:${step.from}%"></i></div><em id="industryRiskSaving">↘ ${step.saving}</em></div>`;
    if(step.kind==='loanSuccess') return `<div class="industry-loan-success"><i>✓</i><h4>${step.message}</h4><p>${step.detail}</p><span>↘ ${step.saving}</span></div>`;
    if(step.kind==='queue') return `<div class="industry-app-title"><div><i>▣</i><b>${step.meta}</b></div><span>${step.badge}</span></div><div class="industry-app-list">${step.rows.map(r=>`<div><i>${r[0]}</i><p><b>${r[1]}</b><small>${r[2]}</small></p><span>${r[3]}</span></div>`).join('')}</div>`;
    if(step.kind==='table') return `<div class="industry-app-title"><div><i>⌁</i><b>${step.meta}</b></div><span>${step.badge}</span></div><div class="industry-app-table"><header><span>RECORD</span><span>VALUE</span><span>RESULT</span><span>STATUS</span></header>${step.rows.map(r=>{const state=/matched|confirmed|active|9[5-9]%/i.test(r[3])?'positive':/checking|review|pending/i.test(r[3])?'pending':'neutral';return `<div><b>${r[0]}</b><span>${r[1]}</span><span>${r[2]}</span><em class="${state}">${r[3]}</em></div>`;}).join('')}</div>`;
    if(step.kind==='fields') return `<div class="industry-app-title"><div><i>▤</i><b>${step.meta}</b></div><span>${step.badge}</span></div><div class="industry-field-grid">${step.rows.map(r=>`<div><small>${r[0]}</small><b>${r[1]}</b><em>✓</em></div>`).join('')}</div>`;
    if(step.kind==='metric') return `<div class="industry-app-title"><div><i>↗</i><b>${step.meta}</b></div><span class="is-live">● ${step.badge}</span></div><div class="industry-metric"><small>${step.detail}</small><strong>${step.value}</strong><div><i style="width:${step.progress}%"></i></div><p>Updated from the latest verified documents</p></div>`;
    if(step.kind==='workflow') return `<div class="industry-app-title"><div><i>⌘</i><b>${step.meta}</b></div><span class="is-live">● ${step.badge}</span></div><div class="industry-workflow">${step.rows.map(r=>`<div class="${r[3]}"><i>${r[0]}</i><p><b>${r[1]}</b><small>${r[2]}</small></p><span>${r[3]}</span></div>`).join('')}</div>`;
    if(step.kind==='payments') return `<div class="industry-app-title"><div><i>▤</i><b>${step.meta}</b></div><span>${step.badge}</span></div><div class="industry-payment-list">${step.rows.map(r=>`<div class="${r[3].toLowerCase()}"><i>▣</i><p><b>${r[0]}</b><small>${r[1]}</small></p><strong>${r[2]}</strong><em>${r[3]==='Paid'?'✓ ':''}${r[3]}</em></div>`).join('')}</div>`;
    if(step.kind==='checks') return `<div class="industry-app-title"><div><i>✓</i><b>${step.meta}</b></div><span>${step.badge}</span></div><div class="industry-check-grid">${step.rows.map(r=>`<div class="${r[1]}"><i>${r[1]==='clear'?'✓':'…'}</i><b>${r[0]}</b></div>`).join('')}</div>`;
    return `<div class="industry-app-title"><div><i>✓</i><b>${step.meta}</b></div><span>Complete</span></div><div class="industry-success"><i>✓</i><h4>${step.message}</h4><p>${step.detail}</p><div><span>Source linked</span><span>Checks saved</span></div></div>`;
  }
  function renderIndustryStage(){
    const d=industryData[industryKey],step=d.steps[industryStep],stage=qs('#industryStage');
    if(!stage)return;
    if(industryMetricFrame)cancelAnimationFrame(industryMetricFrame);
    stage.innerHTML=`<div class="industry-stage-progress"><span>${industryStep+1}</span><b>${step.title}</b><i>${d.steps.map((_,i)=>`<em class="${i<=industryStep?'active':''}"></em>`).join('')}</i></div><div class="industry-stage-body">${industryStageBody(step)}</div>`;
    if(step.kind==='loanMetric'){
      const value=qs('#industryRiskValue',stage),bar=qs('#industryRiskBar',stage),saving=qs('#industryRiskSaving',stage),started=performance.now(),duration=1450;
      const tick=now=>{const p=Math.min(1,(now-started)/duration),eased=1-Math.pow(1-p,3),current=Math.round(step.from+(step.to-step.from)*eased);value.textContent=current+'%';bar.style.width=current+'%';if(p<1)industryMetricFrame=requestAnimationFrame(tick);else saving.classList.add('visible');};
      industryMetricFrame=requestAnimationFrame(tick);
    }
    if(step.kind==='financeMatch') qsa('[data-match-row]',stage).forEach((row,i)=>setTimeout(()=>{if(!row.isConnected)return;row.classList.add('matched');qs('em',row).textContent='✓ Matched';const count=qs('#industryMatchCount',stage);if(count)count.textContent=`${i+1} of 4 matched`;},340+i*280));
    if(step.kind==='financeKpis') setTimeout(()=>{qsa('[data-kpi-final]',stage).forEach(x=>x.textContent=x.dataset.kpiFinal);const state=qs('#industryKpiState',stage);if(state)state.textContent='Live';},650);
    if(step.kind==='financeAudit') qsa('[data-audit]',stage).forEach((row,i)=>setTimeout(()=>{if(!row.isConnected)return;row.classList.add('passed');qs('i',row).textContent='✓';if(i===5){const state=qs('#industryAuditState',stage);if(state)state.textContent='Validated';}},220+i*190));
    if(step.kind==='healthChecks') qsa('[data-health-check]',stage).forEach((row,i)=>setTimeout(()=>{if(!row.isConnected)return;row.classList.add('passed');qs('i',row).textContent='✓';qs('em',row).textContent='✓ Passed';if(i===3){const state=qs('#industryHealthState',stage);if(state)state.textContent='Passed';}},260+i*300));
    if(step.kind==='opsSync') qsa('[data-sync]',stage).forEach((row,i)=>setTimeout(()=>{if(!row.isConnected)return;row.classList.add('synced');qs('em',row).textContent='✓ Synced';if(i===2){const state=qs('#industrySyncState',stage);if(state)state.textContent='Synced';}},260+i*360));
    if(step.kind==='logisticsPayments') qsa('[data-payment]',stage).forEach((row,i)=>{if(i>2)return;setTimeout(()=>{if(!row.isConnected)return;row.classList.add('paid');qs('em',row).textContent='✓ Paid';const count=qs('#industryPaymentCount',stage);if(count)count.textContent=`${i+1} of 4 paid`;},260+i*330);});
    if(step.kind==='logisticsImpact') setTimeout(()=>{const dock=qs('#dockPayMetric',stage),onTime=qs('#onTimeMetric',stage),state=qs('#industryLogisticsState',stage),summary=qs('#logisticsImpactSummary',stage);if(!dock||!dock.isConnected)return;dock.textContent='4 hrs';onTime.textContent='98%';state.textContent='Cash flow up';summary.classList.add('visible');},650);
  }
  function restartIndustry(){clearInterval(industryTimer);industryTimer=setInterval(()=>{industryStep=(industryStep+1)%industryData[industryKey].steps.length;renderIndustryStage();},2600);}
  function renderIndustry(key){
    industryKey=key;industryStep=0;const d=industryData[key],panel=qs('#industryPanel');
    qsa('.industry-tab').forEach(x=>x.classList.toggle('active',x.dataset.industry===key));
    panel.className=`industry-panel ${key}-panel`;
    panel.innerHTML=`<div class="industry-copy"><h3>${d.title}</h3><ul>${d.items.map(x=>`<li>${x}</li>`).join('')}</ul><a href="contact.html">Explore this workflow <span>→</span></a></div><div class="industry-stage" id="industryStage"></div>`;
    renderIndustryStage();restartIndustry();
  }
  qsa('.industry-tab').forEach(b=>b.addEventListener('click',()=>renderIndustry(b.dataset.industry)));
  if(qs('#industryPanel')){
    const previewParams=new URLSearchParams(location.search),previewIndustry=previewParams.get('industry'),previewStep=Number(previewParams.get('step'));
    renderIndustry(industryData[previewIndustry]?previewIndustry:'banking');
    if(Number.isInteger(previewStep)&&previewStep>=1&&previewStep<=4){clearInterval(industryTimer);industryStep=previewStep-1;renderIndustryStage();}
  }

  const shell=qs('#demoShell'),success=qs('#deliverySuccess'),continueBtn=qs('#continueDemo'),poValue=qs('#poValue'),poConfidence=qs('#poConfidence'),suggestion=qs('#poSuggestion'),demoStatus=qs('#demoStatus'),summary=qs('#validationSummary'),progressText=qs('#demoProgressText'),invoice=qs('#invoiceSource');let corrected=false,zoom=100;
  function openDemo(){shell.classList.add('open');shell.setAttribute('aria-hidden','false');document.body.classList.add('demo-open');setTimeout(()=>highlight('po'),200)}function closeDemo(){shell.classList.remove('open');shell.setAttribute('aria-hidden','true');document.body.classList.remove('demo-open')}
  qsa('.js-open-demo').forEach(b=>b.addEventListener('click',openDemo));qsa('.js-close-demo').forEach(b=>b.addEventListener('click',closeDemo));document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDemo()});
  function highlight(r){qsa('[data-region]',qs('#demoSourceContent')).forEach(e=>e.classList.toggle('highlight-region',e.dataset.region===r));qsa('.demo-field').forEach(e=>e.classList.toggle('active',e.dataset.region===r));const t=qs(`[data-region="${r}"]`,qs('#demoSourceContent'));if(t)t.scrollIntoView({block:'center',behavior:'smooth'});}qsa('.demo-field').forEach(b=>b.addEventListener('click',()=>highlight(b.dataset.region)));
  function accept(){corrected=true;poValue.textContent='PO-2026-0881';poConfidence.textContent='Confirmed';poConfidence.className='high';const f=poValue.closest('.demo-field');f.classList.remove('warning');qs('i',f).textContent='✓';suggestion.classList.add('resolved');suggestion.innerHTML='<span>Reviewer choice saved</span><b>PO-2026-0881</b><p>Confirmed in the purchasing master · original reading and source preserved</p><button type="button" disabled>Record selected ✓</button>';demoStatus.textContent='Approved for delivery';demoStatus.className='demo-status success';summary.textContent='All 5 business checks are clear';continueBtn.disabled=false;progressText.textContent='Record approved';qsa('.demo-progress span').forEach((s,i)=>s.classList.toggle('active',i<=2));}
  qs('#acceptSuggestion').addEventListener('click',accept);continueBtn.addEventListener('click',()=>{if(!corrected)return;progressText.textContent='Posted to Operations ERP';qsa('.demo-progress span').forEach(s=>s.classList.add('active'));success.classList.add('show');success.setAttribute('aria-hidden','false')});
  function reset(){corrected=false;poValue.textContent='PO-2026-0BB1';poConfidence.textContent='62%';poConfidence.className='low';const f=poValue.closest('.demo-field');f.classList.add('warning');qs('i',f).textContent='!';suggestion.classList.remove('resolved');suggestion.innerHTML='<span>Closest record in the purchasing master</span><b>PO-2026-0881</b><p>Supplier, amount, timing and item rows align</p><button type="button" id="acceptSuggestion">Use this record</button>';qs('#acceptSuggestion').addEventListener('click',accept);demoStatus.textContent='One value needs a decision';demoStatus.className='demo-status warning';summary.textContent='4 clear · 1 decision pending';continueBtn.disabled=true;success.classList.remove('show');success.setAttribute('aria-hidden','true');progressText.textContent='File added';qsa('.demo-progress span').forEach((s,i)=>s.classList.toggle('active',i===0));zoom=100;invoice.style.transform='scale(1)';qs('#zoomLabel').textContent='100%';highlight('po');}qs('#restartDemo').addEventListener('click',reset);
  function applyZoom(){invoice.style.transform=`scale(${zoom/100})`;qs('#zoomLabel').textContent=zoom+'%'}qs('#zoomIn').addEventListener('click',()=>{zoom=Math.min(130,zoom+10);applyZoom()});qs('#zoomOut').addEventListener('click',()=>{zoom=Math.max(70,zoom-10);applyZoom()});
  qs('#viewActivity').addEventListener('click',e=>{const old=e.currentTarget.textContent;e.currentTarget.textContent=corrected?'Decision saved · Priya · just now':'No reviewer decisions recorded';setTimeout(()=>e.currentTarget.textContent=old,1800)});
  const sampleDocs={invoice:['Northwind_Invoice_3391.pdf','Mailbox attachment · 2 pages · arrived 8:04 AM','Supplier billing','One value needs a decision'],spreadsheet:['July_catalogue_changes.xlsx','Shared drive · 3 sheets · 420 rows','Catalogue revision','14 rows need a decision'],email:['Dispatch instruction','Message · orders@acme.example · arrived 9:18 AM','Dispatch request','Approved for delivery']};qsa('.demo-doc').forEach(b=>b.addEventListener('click',()=>{qsa('.demo-doc').forEach(x=>x.classList.toggle('active',x===b));const d=sampleDocs[b.dataset.demoDoc];qs('#demoFileName').textContent=d[0];qs('#demoFileMeta').textContent=d[1];qs('#demoTemplate').textContent=d[2];demoStatus.textContent=b.dataset.demoDoc==='invoice'?(corrected?'Approved for delivery':d[3]):d[3];demoStatus.className='demo-status '+(b.dataset.demoDoc==='email'?'success':'warning');qs('#sourceHint').textContent=b.dataset.demoDoc==='invoice'?'Choose a record value to reveal its evidence':'The complete decision path is available in the supplier billing example';}));
})();
