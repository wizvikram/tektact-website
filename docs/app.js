/* Tektact Quote Studio: editable, offline-only, no dependencies and no outbound requests. */
(() => {
  'use strict';
  const Core = window.TektactCore;
  const STORAGE_KEY = 'tektact-quotation-v1';
  const DEFAULT_LOGO = 'tektact-logo.webp';
  const MAX_LOGO_BYTES = 800_000;
  const $ = id => document.getElementById(id);
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const serviceTemplates = {
    interior: { title: 'Interior Painting', desc: 'Providing and applying crack fillers and patch putty, 1 coat of primer and 2 coats of Premium Emulsion All Protek. Product performance up to 5 years (subject to manufacturer terms).', unit:'SFT', rate:'19' },
    exterior: { title: 'Exterior Painting', desc: 'Providing and applying crack fillers and patch putty, 1 coat of primer and 2 coats of Apex Ultima. Product performance up to 8 years (subject to manufacturer terms).', unit:'SFT', rate:'22' },
    enamel: { title: 'Enamel for Doors and Grills', desc:'Providing and applying crack fillers and 2 coats of Satin Enamel. Product performance up to 5 years (subject to manufacturer terms).', unit:'SFT', rate:'25' },
    wood: { title:'Wood Polish (Repolish)', desc:'Providing and applying wood repolish.', unit:'SFT', rate:'70' },
    texture: { title:'Wall Textures', desc:'Providing and applying Royale Play wall textures.', unit:'SFT', rate:'110' },
    tile: { title:'Tile Guard', desc:'Providing and applying tile guard.', unit:'SFT', rate:'30' },
    waterproof: { title:'Waterproofing', desc:'Terrace waterproofing and terrace cool coating.', unit:'SFT', rate:'33' },
    custom: { title:'Custom painting service', desc:'', unit:'SFT', rate:'0' }
  };
  const defaultState = () => ({
    version:1, quoteNo:`TKT-${new Date().getFullYear()}-001`, date:today(), client:'', attention:'', site:'',
    company:'Tektact Consultants & Contractors', phone:'+91 9894 88 33 55', email:'vikram@tektact.in', website:'www.tektact.in',
    address:'3/194, Indira Nagar, Chinna Thadagam, Coimbatore - 641108.', validity:'10',
    payment:'50% with P.O.; 35% during work; 15% within 7 days of completion.',
    terms:'Final bill will be based on joint measurements and any agreed amendments.\nElectricity: Client’s scope.\nWater: Client’s scope.\nStorage space: Client’s scope.',
    logo:'', measurements:[],
    items:[{...serviceTemplates.interior, qty:'0'}, {...serviceTemplates.exterior,qty:'0'}],
    discountMode:'amount', discountValue:'0', taxRate:'0'
  });
  const sampleState = () => ({...defaultState(), quoteNo:'REFERENCE-2026-02-14', date:'2026-02-14', client:'Sample Client',attention:'', site:'Coimbatore', items:[
    {...serviceTemplates.exterior,qty:'3370'}, {...serviceTemplates.interior,qty:'6921'},
    {...serviceTemplates.enamel,qty:'975'}, {...serviceTemplates.wood,qty:'793'},
    {...serviceTemplates.texture,qty:'401'}, {...serviceTemplates.tile,qty:'65'},
    {...serviceTemplates.waterproof,qty:'1400'}]
  });
  const str = (v, max=1600) => typeof v === 'string' ? v.slice(0,max) : (typeof v === 'number' && Number.isFinite(v) ? String(v).slice(0,max) : '');
  function normalize(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw Error('Invalid backup format.');
    const base = defaultState();
    for (const key of ['quoteNo','date','client','attention','site','company','phone','email','website','address','validity','payment','terms','discountValue','taxRate']) {
      if (Object.prototype.hasOwnProperty.call(data,key)) base[key] = str(data[key], key === 'terms' ? 1600:350);
    }
    if (data.discountMode === 'percent' || data.discountMode === 'amount') base.discountMode = data.discountMode;
    if (typeof data.logo === 'string' && /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(data.logo) && data.logo.length <= 1_100_000) base.logo = data.logo;
    if (Array.isArray(data.items)) {
      if (data.items.length > 150) throw Error('A quotation can have at most 150 service lines.');
      base.items = data.items.map(item => ({title:str(item?.title,160), desc:str(item?.desc,1400), unit:str(item?.unit,20)||'SFT',qty:str(item?.qty,30),rate:str(item?.rate,30)}));
    }
    if (Array.isArray(data.measurements)) {
      if (data.measurements.length > 150) throw Error('At most 150 measurement rows are supported.');
      base.measurements = data.measurements.map(row => ({name:str(row?.name,100),length:str(row?.length,30),width:str(row?.width,30),count:str(row?.count,30),deduction:str(row?.deduction,30)}));
    }
    return base;
  }
  let state;
  let persistError = '';
  try { state = normalize(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')); }
  catch (_) {state = defaultState(); }
  const setText = (id, val) => { $(id).textContent = val; };
  const make = (tag, className, text) => { const el = document.createElement(tag); if(className) el.className = className; if(text !== undefined) el.textContent = text; return el; };
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); persistError=''; setText('saveStatus','Saved on this device'); }
    catch (_) { persistError='Browser storage full or disabled. Export backup now.'; setText('saveStatus','Not saved — export backup'); }
  }
  function fieldInput(label, prop, value, options={}) {
    const wrap=make('label',options.className||''); wrap.append(document.createTextNode(label));
    const input=document.createElement(options.multiline?'textarea':'input');
    if(options.multiline) input.rows=options.rows||2;
    else input.type=options.type||'text';
    if(options.type==='number') {input.min='0';input.step='any';input.inputMode='decimal';}
    if(options.maxlength) input.maxLength=options.maxlength;
    input.value=value ?? ''; input.dataset.prop=prop; wrap.append(input);return wrap;
  }
  function renderMeasurements() {
    const body=$('measureRows'); body.replaceChildren();
    state.measurements.forEach((row,index)=>{
      const tr=make('tr');
      for(const [prop, label, type] of [['name','Name','text'],['length','Length','number'],['width','Height','number'],['count','Count','number'],['deduction','Deduct','number']]) {
        const td=make('td'); const input=document.createElement('input');input.type=type;input.value=row[prop]??'';input.dataset.row=index;input.dataset.prop=prop;input.setAttribute('aria-label',`${label} ${index+1}`);
        if(type==='number'){ input.min='0'; input.step='any'; input.inputMode='decimal'; }else input.maxLength=100;
        td.append(input);tr.append(td);
      }
      const td=make('td','area-value'); td.dataset.areaFor=index;tr.append(td);
      const remove=make('td');const btn=make('button','icon-btn','×');btn.type='button';btn.dataset.removeMeasurement=index;btn.title='Remove area';btn.setAttribute('aria-label',`Remove measurement ${index+1}`);remove.append(btn);tr.append(remove);body.append(tr);
    });
  }
  function renderLines() {
    const box=$('quoteLines');box.replaceChildren();
    state.items.forEach((item,index)=>{
      const panel=make('div','quote-line');const head=make('div','quote-line-head');head.append(make('b','',`SERVICE ${String(index+1).padStart(2,'0')}`));
      const button=make('button','icon-btn','×');button.type='button';button.title='Remove service';button.dataset.removeLine=index;button.setAttribute('aria-label',`Remove service ${index+1}`);head.append(button);panel.append(head);
      const grid=make('div','quote-line-grid');
      grid.append(fieldInput('Service name','title',item.title,{className:'title-field',maxlength:160}));
      grid.append(fieldInput('Scope of work / specification','desc',item.desc,{className:'desc-field',multiline:true}));
      grid.append(fieldInput('Unit','unit',item.unit,{maxlength:20}));
      grid.append(fieldInput('Quantity','qty',item.qty,{type:'number'}));
      grid.append(fieldInput('Rate (₹)','rate',item.rate,{type:'number'}));
      const money=make('div','line-amount');money.append(make('span','','Amount'));const bold=make('b');bold.dataset.lineAmount=index;money.append(bold);grid.append(money);
      for(const input of grid.querySelectorAll('[data-prop]')) input.dataset.line=index;
      panel.append(grid);box.append(panel);
    });
  }
  function formatNumber(n) {return new Intl.NumberFormat('en-IN',{maximumFractionDigits:2,minimumFractionDigits:2}).format(n);}
  function quoteTotals() {return Core.calculateQuote(state.items,{mode:state.discountMode,value:state.discountValue},state.taxRate);}
  function paintMeasurements() {
    const errors=[];let total=0;
    state.measurements.forEach((row,i)=>{
      const cell=document.querySelector(`[data-area-for="${i}"]`);
      try {const area=Core.rectangleArea(row); total+=area;if(cell){cell.textContent=formatNumber(area);cell.title='Net square feet';}}
      catch(e){errors.push(`Measurement ${i+1}: ${e.message}`);if(cell){cell.textContent='Invalid';cell.title=e.message;}}
    });
    setText('totalArea',`${formatNumber(total)} SFT`);
    return {total,errors};
  }
  const isISOdate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value+'T12:00:00').getTime()) && new Date(value+'T12:00:00').toISOString().slice(0,10)===value;
  function validationErrors(calc,measure) {
    const errors=[...calc.errors,...measure.errors];
    if(!state.items.length) errors.push('Add at least one service.');
    if(!state.items.some((it,i)=>calc.lineAmounts[i] > 0n)) errors.push('At least one service must have a positive amount.');
    if(!state.client.trim()) errors.push('Enter the client name.');
    if(!state.quoteNo.trim()) errors.push('Enter a quotation number.');
    if(!isISOdate(state.date)) errors.push('Enter a valid quotation date.');
    const days=Number(state.validity);
    if(!/^[1-9]\d*$/.test(state.validity)||days>365) errors.push('Validity must be 1–365 days.');
    if(persistError) errors.push(persistError);
    return errors;
  }
  function updatePreview() {
    let calc;
    try{calc=quoteTotals();}
    catch(e){calc={lineAmounts:state.items.map(()=>0n),subtotal:0n,discount:0n,taxable:0n,tax:0n,grandTotal:0n,errors:[e.message]};}
    const measured=paintMeasurements(); const errors=validationErrors(calc,measured);
    $('validation').hidden=!errors.length;
    $('validation').textContent=errors.join('\n');
    $('printQuote').disabled=!!errors.length;$('printQuoteBottom').disabled=!!errors.length;
    setText('subTotal',Core.formatRupees(calc.subtotal));setText('discountDisplay','− '+Core.formatRupees(calc.discount));
    setText('taxDisplay',Core.formatRupees(calc.tax));setText('grandTotal',Core.formatRupees(calc.grandTotal));
    setText('quickTotal',Core.formatRupees(calc.grandTotal));
    state.items.forEach((_,i)=>{const el=document.querySelector(`[data-line-amount="${i}"]`);if(el)el.textContent=Core.formatRupees(calc.lineAmounts[i]||0n);});
    const image=state.logo||DEFAULT_LOGO;$('previewLogo').src=image;$('headerLogo').src=image;
    setText('printQuoteNo',state.quoteNo);setText('printClient',state.client||'Client name');
    setText('printAttention',state.attention?`Kind Attn: ${state.attention}`:'');
    setText('printSite',state.site);setText('printDate',isISOdate(state.date)?new Date(state.date+'T12:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—');
    setText('printValidity',`${state.validity||'—'} days`);
    const company=state.company||'Tektact Consultants & Contractors';
    setText('printCompany',company);setText('printAddress',state.address);
    setText('printContacts',[state.phone,state.website,state.email].filter(Boolean).join('  •  '));
    // DOM nodes/textContent only: client and imported JSON cannot insert markup into the document.
    const printLines=$('printLines');printLines.replaceChildren();
    state.items.forEach((item,i)=>{
      const tr=make('tr'); const spec=make('td');spec.append(make('strong','',item.title));spec.append(make('div','desc',item.desc));
      for(const value of [String(i+1)]) tr.append(make('td','',value));
      tr.append(spec);
      for(const value of [item.unit,item.qty,item.rate,Core.formatRupees(calc.lineAmounts[i]||0n)])tr.append(make('td','',value));
      printLines.append(tr);
    });
    setText('printSubtotal',Core.formatRupees(calc.subtotal));
    setText('printDiscount','− '+Core.formatRupees(calc.discount));
    setText('printTax',Core.formatRupees(calc.tax));
    setText('printGrand',Core.formatRupees(calc.grandTotal));
    $('printDiscLine').hidden=calc.discount===0n;$('printTaxLine').hidden=calc.tax===0n;
    setText('printWords',Core.amountInWords(calc.grandTotal));
    const terms=$('printTerms');terms.replaceChildren();
    const fixed=[`Final bill will be based on joint measurements and any agreed amendments.`,`Payment: ${state.payment}`,`Quotation valid for ${state.validity} days from document date.`];
    const additional=state.terms.split(/\r?\n/).map(s=>s.trim()).filter(Boolean).filter(s=>!fixed.some(f=>f===s));
    const all=[...fixed.slice(0,1),fixed[1],fixed[2],...additional.filter(t=>!t.startsWith('Final bill will be based on joint measurements'))];
    all.forEach(term=>terms.append(make('li','',term)));
    return errors;
  }
  function renderForm() {
    document.querySelectorAll('[data-field]').forEach(el=>{el.value=state[el.dataset.field]??'';});
    $('discountMode').value=state.discountMode;
    $('discountValue').value=state.discountValue;
    $('taxRate').value=state.taxRate;
    renderMeasurements();renderLines();updatePreview();
  }
  function changed(){save();updatePreview();}
  document.querySelectorAll('[data-field]').forEach(input=>input.addEventListener('input',()=>{state[input.dataset.field]=input.value;changed();}));
  $('measureRows').addEventListener('input',event=>{const input=event.target;if(input.dataset.row===undefined)return;state.measurements[Number(input.dataset.row)][input.dataset.prop]=input.value;changed();});
  $('measureRows').addEventListener('click',event=>{const btn=event.target.closest('[data-remove-measurement]');if(!btn)return;state.measurements.splice(Number(btn.dataset.removeMeasurement),1);renderMeasurements();changed();});
  $('quoteLines').addEventListener('input',event=>{const input=event.target;if(input.dataset.line===undefined)return;state.items[Number(input.dataset.line)][input.dataset.prop]=input.value;changed();});
  $('quoteLines').addEventListener('click',event=>{const btn=event.target.closest('[data-remove-line]');if(!btn)return;state.items.splice(Number(btn.dataset.removeLine),1);renderLines();changed();});
  for(const [id,key] of [['discountMode','discountMode'],['discountValue','discountValue'],['taxRate','taxRate']]){
    $(id).addEventListener('input',()=>{state[key]=$(id).value;changed();});
  }
  $('addMeasure').addEventListener('click',()=>{if(state.measurements.length>=150)return alert('Maximum 150 measurement rows.');state.measurements.push({name:'',length:'',width:'',count:'1',deduction:'0'});renderMeasurements();changed();});
  $('addLine').addEventListener('click',()=>{if(state.items.length>=150)return alert('Maximum 150 services.');state.items.push({...serviceTemplates.custom,qty:'0'});renderLines();changed();});
  $('transferArea').addEventListener('click',()=>{
    const result=paintMeasurements();if(result.errors.length){alert(result.errors.join('\n'));return;}
    if(!state.measurements.length||result.total<=0){alert('Add at least one valid measurement with a positive net area.');return;}
    const type=$('transferService').value;const template=serviceTemplates[type]||serviceTemplates.custom;
    if(state.items.length>=150){alert('Maximum 150 services.');return;}
    state.items.push({...template,qty:result.total.toFixed(2)});renderLines();changed();
    $('quoteLines').lastElementChild?.scrollIntoView({behavior:'smooth',block:'center'});
  });
  function printQuote() {const errors=updatePreview();if(errors.length){alert('Correct these issues before printing:\n'+errors.join('\n'));return;}window.print();}
  $('printQuote').addEventListener('click',printQuote);$('printQuoteBottom').addEventListener('click',printQuote);
  function exportTektactExcel() {
  if (!window.XLSX) {
    alert('Excel export library did not load. Check your internet connection and retry. PDF export is still available.');
    return;
  }
  const core = window.TektactCore;
  const totals = core.calculateQuote(state.items, {mode:state.discountMode,value:state.discountValue},state.taxRate);
  if(totals.errors.length) {
    alert('Correct quotation calculations first:\n'+totals.errors.join('\n'));
    return;
  }
  try {
    const XLSX=window.XLSX;
    const wb=XLSX.utils.book_new();
    const data=[];
    const set=(r,c,v)=>{if(!data[r-1])data[r-1]=[];data[r-1][c-1]=v;};
    const sum=big=>Number(big)/100;
    const formula=(f,v)=>({t:'n',f,v});
    set(1,1,'TEKTACT | PAINTING QUOTATION');
    set(2,1,state.company||'Tektact Consultants & Contractors');
    set(4,1,'Quotation no.');set(4,2,state.quoteNo);
    set(4,4,'Date');set(4,5,state.date);
    set(5,1,'Client');set(5,2,state.client);
    set(6,1,'Kind attention');set(6,2,state.attention);
    set(7,1,'Project / site');set(7,2,state.site);
    ['#','Service','Specifications / scope','Unit','Quantity','Rate (₹)','Amount (₹)'].forEach((h,i)=>set(9,i+1,h));
    const slots=Math.max(16,state.items.length),end=9+slots;
    for(let i=0;i<slots;i++){
      const row=i+10,it=state.items[i];
      if(it){
        set(row,1,i+1);set(row,2,it.title);set(row,3,it.desc);set(row,4,it.unit);
        set(row,5,Number(it.qty));set(row,6,Number(it.rate));
      }
      set(row,7,formula(`IF(OR(E${row}="",F${row}=""),"",ROUND(E${row}*F${row},2))`,it?sum(totals.lineAmounts[i]):0));
    }
    const sub=end+2,dis=end+3,taxRate=end+4,taxAmount=end+5,grand=end+6;
    set(sub,6,'Subtotal');set(sub,7,formula(`SUM(G10:G${end})`,sum(totals.subtotal)));
    set(dis,6,'Discount (₹)');set(dis,7,sum(totals.discount));
    set(taxRate,6,'Tax rate (%)');set(taxRate,7,Number(state.taxRate));
    set(taxAmount,6,'Tax');set(taxAmount,7,formula(`ROUND(MAX(0,G${sub}-G${dis})*G${taxRate}/100,2)`,sum(totals.tax)));
    set(grand,6,'GRAND TOTAL');set(grand,7,formula(`G${sub}-G${dis}+G${taxAmount}`,sum(totals.grandTotal)));
    set(grand+2,1,'Amount in words (MANUALLY update after editing numbers): '+core.amountInWords(totals.grandTotal));
    set(grand+4,1,'TERMS AND CONDITIONS');
    const terms=[
      'Final bill based on joint measurements and agreed amendments.',
      'Payment: '+state.payment,
      'Quotation validity: '+state.validity+' days from quotation date.',
      ...state.terms.split(/\r?\n/).map(s=>s.trim()).filter(Boolean)
    ];
    terms.forEach((t,i)=>set(grand+5+i,1,(i+1)+'. '+t));
    const foot=grand+7+terms.length;
    set(foot,1,(state.company||'Tektact Consultants & Contractors')+' | REGISTERED OFFICE');
    set(foot+1,1,state.address);
    set(foot+2,1,[state.phone,state.website,state.email].filter(Boolean).join('  |  '));
    const sheet=XLSX.utils.aoa_to_sheet(data);
    sheet['!cols']=[{wch:7},{wch:29},{wch:71},{wch:9},{wch:13},{wch:15},{wch:19}];
    sheet['!merges']=[XLSX.utils.decode_range('A1:G1'),XLSX.utils.decode_range(`A${foot}:G${foot}`),XLSX.utils.decode_range(`A${foot+1}:G${foot+1}`),XLSX.utils.decode_range(`A${foot+2}:G${foot+2}`)];
    for(let i=10;i<=grand;i++)if(sheet[`G${i}`]&&i!==taxRate)sheet[`G${i}`].z='#,##0.00';
    XLSX.utils.book_append_sheet(wb,sheet,'Quotation');
    const measure=[['TEKTACT | PAINTING AREA CALCULATOR'],[],['#','Room / surface','Length (ft)','Height (ft)','Count','Deduction (SFT)','Net SFT']];
    const count=Math.max(20,state.measurements.length);
    let totalMeasured=0;
    for(let i=0;i<count;i++){
      const r=i+4,entry=state.measurements[i];
      let v=0;
      try {if(entry)v=core.rectangleArea(entry);}catch(e){}
      totalMeasured+=v;
      measure.push([i+1,entry?.name||'',entry?Number(entry.length):'',entry?Number(entry.width):'',entry?Number(entry.count):'',entry?Number(entry.deduction||0):'',formula(`IF(OR(C${r}="",D${r}="",E${r}=""),"",MAX(0,ROUND(C${r}*D${r}*E${r}-IF(F${r}="",0,F${r}),2)))`,v)]);
    }
    measure.push([],['','TOTAL MEASURED AREA','','','', '',formula(`SUM(G4:G${count+3})`,totalMeasured)]);
    const ms=XLSX.utils.aoa_to_sheet(measure);
    ms['!cols']=[{wch:7},{wch:34},{wch:17},{wch:17},{wch:12},{wch:19},{wch:19}];
    XLSX.utils.book_append_sheet(wb,ms,'Measurements');
    const notes=XLSX.utils.aoa_to_sheet([
      ['TEKTACT | COMPANY AND EDITING NOTES'],
      ['Company',state.company],['Registered address',state.address],['Phone',state.phone],
      ['Email',state.email],['Website',state.website],['Payment schedule',state.payment],
      ['Quotation validity (days)',Number(state.validity)],
      ['Editing guide','Change quantity (E) or rate (F) on Quotation. Amounts and grand total recalculate.'],
      ['Important','Update the amount in words manually whenever the grand total changes.'],
      ['Discount','Percentage discounts in the calculator are converted into editable rupee discounts in Excel.'],
      ['Reference rates','Historical sample prices, not verified current market quotations. Confirm before sending.']
    ]);
    notes['!cols']=[{wch:29},{wch:90}];
    XLSX.utils.book_append_sheet(wb,notes,'Company & Notes');
    const fname=(state.quoteNo||'draft').replace(/[^a-z0-9_-]/gi,'_');
    XLSX.writeFile(wb,`Tektact_Quotation_${fname}.xlsx`,{compression:true});
  }catch(err){alert('Unable to export Excel: '+err.message);}
}
  $('downloadExcel').addEventListener('click',exportTektactExcel);
  $('downloadExcelBottom').addEventListener('click',exportTektactExcel);
  function replaceState(next) {state=normalize(next);save();renderForm();}
  $('loadSample').addEventListener('click',()=>{if(confirm('Load the 14 February 2026 sample quotation? This replaces the current draft (export a backup first if needed).'))replaceState(sampleState());});
  $('newQuote').addEventListener('click',()=>{if(confirm('Start a fresh quotation? Export a backup first if you want to keep the current one.'))replaceState(defaultState());});
  $('logoUpload').addEventListener('change',event=>{
    const file=event.target.files?.[0];if(!file)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>MAX_LOGO_BYTES){alert('Choose a PNG/JPG/WebP logo smaller than 800 KB.');event.target.value='';return;}
    const reader=new FileReader();reader.onload=()=>{if(typeof reader.result==='string'&&reader.result.length<1_100_000){state.logo=reader.result;changed();}else alert('Logo is too large.');};reader.onerror=()=>alert('Unable to read logo.');reader.readAsDataURL(file);
  });
  $('exportJson').addEventListener('click',()=>{
    const file=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const link=document.createElement('a');
    const url=URL.createObjectURL(file);link.href=url;link.download=`tektact-quotation-${state.quoteNo.replace(/[^a-z0-9-_]/gi,'_')||'draft'}.json`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  $('importJson').addEventListener('click',()=>$('jsonUpload').click());
  $('jsonUpload').addEventListener('change',async event=>{
    const file=event.target.files?.[0];if(!file)return;
    if(file.size>2_000_000){alert('Backup is too large (2 MB maximum).');event.target.value='';return;}
    try{const incoming=normalize(JSON.parse(await file.text()));if(confirm('Replace current draft with imported backup?'))replaceState(incoming);}
    catch(e){alert(`Could not import backup: ${e.message}`);}event.target.value='';
  });
  renderForm();
})();
