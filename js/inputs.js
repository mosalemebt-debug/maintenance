/* الأرقام العربية وحقول التاريخ */
/* ---------- الأرقام العربية ---------- */
(function(){
  const AR=['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  const cv=t=>String(t).split(/([A-Za-z][A-Za-z0-9_.\-]*)/).map((p,i)=>i%2?p:p.replace(/(\d),(?=\d)/g,'$1٬').replace(/(\d)\.(?=\d)/g,'$1٫').replace(/\d/g,d=>AR[d])).join('');
  window.arDigits=cv;
  const on=localStorage.getItem('arDigits')!=='0';
  const tg=document.getElementById('digtog');
  if(tg){tg.textContent=on?'١٢٣':'123';tg.title=on?'الأرقام عربية – اضغط للأرقام الإنجليزية':'الأرقام إنجليزية – اضغط للأرقام العربية';tg.onclick=()=>{localStorage.setItem('arDigits',on?'0':'1');location.reload()}}
  if(!on)return;
  function walk(n){
    if(n.nodeType===3){const p=n.parentNode;if(p&&/^(SCRIPT|STYLE|TEXTAREA)$/.test(p.tagName))return;const v=n.nodeValue;if(/\d/.test(v)){const c=cv(v);if(c!==v)n.nodeValue=c}}
    else if(n.nodeType===1&&!/^(SCRIPT|STYLE|TEXTAREA)$/.test(n.tagName)){n.childNodes.forEach(walk)}
  }
  const mo=new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')walk(m.target);else m.addedNodes.forEach(walk)}});
  walk(document.body);mo.observe(document.body,{childList:true,subtree:true,characterData:true});
  const _al=window.alert.bind(window),_cf=window.confirm.bind(window);
  window.alert=m=>_al(cv(m));window.confirm=m=>_cf(cv(m));
})();
/* ---------- حقول التاريخ: يوم/شهر/سنة ---------- */
(function(){
  const pad=n=>String(n).padStart(2,'0');
  const toDisp=v=>{const m=/^(\d{4})-(\d\d)-(\d\d)$/.exec(v||'');return m?m[3]+'/'+m[2]+'/'+m[1]:''};
  const parse=t=>{t=String(t).replace(/[٠-٩]/g,c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c)).trim();
    const m=/^(\d{1,2})\D+(\d{1,2})\D+(\d{4})$/.exec(t)||/^(\d{2})(\d{2})(\d{4})$/.exec(t);if(!m)return null;
    const d=+m[1],mo=+m[2],y=+m[3],dt=new Date(Date.UTC(y,mo-1,d));
    if(dt.getUTCMonth()!==mo-1||dt.getUTCDate()!==d)return null;return y+'-'+pad(mo)+'-'+pad(d)};
  const vd=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
  function enhance(inp){
    if(inp._ard)return;inp._ard=1;
    const w=document.createElement('span');w.style.cssText='position:relative;display:inline-flex;gap:4px;align-items:center';
    const t=document.createElement('input');t.type='text';t.inputMode='numeric';t.placeholder='يوم/شهر/سنة';t.maxLength=10;t.dir='ltr';t.style.cssText='width:112px;min-width:0;text-align:center';
    const b=document.createElement('button');b.type='button';b.textContent='📅';b.tabIndex=-1;b.className='btn sm alt';b.style.cssText='padding:4px 8px';
    inp.parentNode.insertBefore(w,inp);w.append(t,b,inp);
    inp.style.cssText='position:absolute;left:0;bottom:0;width:1px;height:1px;min-width:0;opacity:0;pointer-events:none;border:0;padding:0';
    Object.defineProperty(inp,'value',{get(){return vd.get.call(inp)},set(v){vd.set.call(inp,v);t.value=toDisp(v)},configurable:true});
    t.value=toDisp(vd.get.call(inp));
    b.onclick=()=>{try{inp.showPicker()}catch(e){inp.focus();inp.click()}};
    inp.addEventListener('change',()=>{t.value=toDisp(vd.get.call(inp))});
    t.addEventListener('input',e=>{if(e.inputType==='insertText'&&(/^\d{2}$/.test(t.value)||/^\d{2}\/\d{2}$/.test(t.value)))t.value+='/'});
    t.addEventListener('change',()=>{
      const raw=t.value.trim();
      if(!raw){vd.set.call(inp,'');inp.dispatchEvent(new Event('change',{bubbles:true}));return}
      const v=parse(raw);
      if(v){vd.set.call(inp,v);t.value=toDisp(v);inp.dispatchEvent(new Event('change',{bubbles:true}))}
      else{alert('اكتب التاريخ بالشكل يوم/شهر/سنة، مثال: 25/10/2026');t.value=toDisp(vd.get.call(inp))}
    });
  }
  const scan=n=>{if(n.nodeType!==1)return;if(n.matches&&n.matches('input[type=date]'))enhance(n);n.querySelectorAll&&n.querySelectorAll('input[type=date]').forEach(enhance)};
  scan(document.body);
  new MutationObserver(ms=>{for(const m of ms)m.addedNodes.forEach(scan)}).observe(document.body,{childList:true,subtree:true});
})();
