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
