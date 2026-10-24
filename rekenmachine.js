/* Rekenmachine bij elke vraag met een getal als antwoord (formulier #nf met invulvak #ni).
   Zet zichzelf erbij zodra zo'n vraag op het scherm komt; de pagina hoeft er niets voor te doen.
   Knop 🧮 opent een klein rekenmachientje; "→ antwoord" zet de uitkomst in het invulvak. */
(function(){
const css=`.rk-knop{flex:0 0 auto;font-size:20px;padding:10px 14px}
.rk{margin-top:10px;background:var(--bg,#f6f3ee);border:2px solid var(--line,#ddd);border-radius:14px;padding:10px;max-width:360px}
.rk-scherm{background:var(--surface,#fff);border:1px solid var(--line,#ddd);border-radius:10px;padding:8px 10px;margin-bottom:8px;text-align:right;font-family:ui-monospace,Menlo,Consolas,monospace;min-height:58px;overflow-wrap:anywhere}
.rk-som{font-size:15px;color:var(--muted,#666);min-height:20px}.rk-uit{font-size:24px;font-weight:700;color:var(--ink,#111)}
.rk-toetsen{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
.rk-toetsen button{font:inherit;font-size:18px;font-weight:700;padding:10px 0;border-radius:10px;border:1px solid var(--line,#ddd);background:var(--surface,#fff);color:var(--ink,#111);cursor:pointer;touch-action:manipulation}
.rk-toetsen button.op{background:var(--chip,#eee)}.rk-toetsen button.is{background:var(--ink,#111);color:var(--surface,#fff)}
.rk-toetsen button.zet{grid-column:span 2;background:var(--accent,#e8742a);border-color:var(--accent,#e8742a);color:#fff;font-size:15px}
.rk-toetsen button.klein{font-size:14px}`;
let open=false,som='';
const TOETS=['7','8','9','÷','C','4','5','6','×','⌫','1','2','3','−','(','0',',','×10ˣ','+',')','x²','=','→ antwoord'];
function rekenen(s){let t=s.replace(/×10\^/g,'E').replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/,/g,'.').replace(/²/g,'**2');
 if(!t||!/^[0-9+\-*/().E ]+$/.test(t.replace(/\*\*2/g,'')))return NaN;
 try{const v=Function('"use strict";return ('+t+')')();return typeof v==='number'&&isFinite(v)?v:NaN}catch(e){return NaN}}
function mooi(v){if(isNaN(v))return '';let s=Math.abs(v)>=1e9||(Math.abs(v)<1e-4&&v!==0)?v.toExponential(6):String(+v.toPrecision(10));
 const m=s.match(/^(-?[\d.]+)e([+-]\d+)$/);if(m){const g=String(+(+m[1]).toPrecision(7)).replace('.',',');return g+'·10^'+(+m[2])}return s.replace('.',',')}
function teken(p){const v=rekenen(som);p.querySelector('.rk-som').textContent=som||' ';p.querySelector('.rk-uit').textContent=som?(isNaN(v)?'…':'= '+mooi(v)):'0'}
function paneel(form){let p=form.parentNode.querySelector('.rk');if(!open){if(p)p.remove();return}
 if(p)return;p=document.createElement('div');p.className='rk';
 p.innerHTML=`<div class="rk-scherm"><div class="rk-som"></div><div class="rk-uit">0</div></div><div class="rk-toetsen">${TOETS.map(k=>`<button type="button" data-k="${k}" class="${/^[÷×−+]$/.test(k)?'op':k==='='?'is':k==='→ antwoord'?'zet':k.length>2?'klein op':/^[C⌫()]$|x²/.test(k)?'op':''}">${k}</button>`).join('')}</div>`;
 form.after(p);teken(p);
 p.addEventListener('click',e=>{const b=e.target.closest('[data-k]');if(!b)return;e.preventDefault();const k=b.dataset.k;
  if(k==='C')som='';else if(k==='⌫')som=som.endsWith('×10^')?som.slice(0,-4):som.slice(0,-1);
  else if(k==='×10ˣ')som+='×10^';else if(k==='x²')som+='²';
  else if(k==='='){const v=rekenen(som);if(!isNaN(v))som=mooi(v).replace('·10^','×10^')}
  else if(k==='→ antwoord'){const v=rekenen(som),inp=document.getElementById('ni');if(!isNaN(v)&&inp&&!inp.readOnly){inp.value=String(+v.toPrecision(8)).includes('e')?mooi(v):String(+v.toPrecision(8)).replace('.',',');inp.classList.remove('shake')}}
  else som+=k;teken(p)})}
function zetErbij(){const form=document.getElementById('nf'),inp=document.getElementById('ni');if(!form||!inp||form.querySelector('.rk-knop'))return;
 som='';const b=document.createElement('button');b.type='button';b.className='btn ghost rk-knop';b.title='Rekenmachine';b.setAttribute('aria-label','Rekenmachine');b.textContent='🧮';
 const nb=form.querySelector('[type=submit]');form.insertBefore(b,nb||null);
 b.onclick=()=>{open=!open;paneel(form)};paneel(form)}
function start(){const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
 new MutationObserver(zetErbij).observe(document.body,{childList:true,subtree:true});zetErbij()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
