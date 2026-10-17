/* Leerlog: houdt per bezoek bij wat Ben of Dana deed (vak, actieve minuten, wat er bijkwam) en stuurt dat
   stil naar het tabblad 'Leerhoek' van de scorebord-spreadsheet (Apps Script uit deweef/spelletjes,
   extra/scorebord.gs). Dat tabblad wordt nooit teruggegeven aan de site. Geen meldingen, niets op het scherm.
   Werkt voor elke pagina die dit script laadt: het kijkt mee met wat de pagina zelf al in localStorage zet. */
(function(){
const URL='https://script.google.com/macros/s/AKfycbzo6b4TQRiL2j1ZhEtBa6xpbNcBxmL7IIIB6e1FdYWnswDIxJ1MphWAlAjm12aK_J9U/exec';
const QK='leren-logq';
let wie=null;try{wie=localStorage.getItem('leren-wie')}catch(e){}
if(wie!=='ben'&&wie!=='dana')return; // ouder of nog niet gekozen: niets bijhouden
const vak=(location.pathname.split('/').pop()||'index').replace(/\.html$/,'')||'index';
if(vak==='index')return;

/* ---- welke opslag hoort bij deze pagina: alles wat de pagina tijdens het bezoek wegschrijft ---- */
const keys=new Set();
try{const orig=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(this===window.localStorage&&!/^leren-/.test(k))keys.add(k);return orig.apply(this,arguments)}}catch(e){}
const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}};
const begin={};try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!/^leren-/.test(k))begin[k]=read(k)}}catch(e){}

/* ---- samenvatting van een opgeslagen stand: XP, opgaven, gekende woorden/begrippen, toetsen, leerpaden ---- */
function stand(o){const r={};if(!o||typeof o!=='object')return r;
 if(typeof o.xp==='number')r.xp=o.xp;
 if(typeof o.done==='number')r.opgaven=o.done;
 if(typeof o.score==='number')r.score=o.score;
 let gekend=0,geoefend=0;
 for(const v of Object.values(o))if(v&&typeof v==='object'&&!Array.isArray(v)){const items=Object.values(v).filter(x=>x&&typeof x==='object'&&typeof x.l==='number');
  if(items.length>2){geoefend+=items.filter(x=>x.l>0).length;gekend+=items.filter(x=>x.l>=3).length}}
 if(geoefend){r.gekend=gekend;r.geoefend=geoefend}
 const toets=o.bestToets||o.best;if(typeof toets==='number'&&toets>0)r.toets=toets;
 if(o.lpd&&typeof o.lpd==='object')r.leerpaden=Object.keys(o.lpd).length;
 return r}
const NAAM={xp:'XP',opgaven:'opgaven',score:'punten',gekend:'gekend',geoefend:'geoefend',toets:'beste toets',leerpaden:'leerpaden klaar'};
const fmt=n=>String(Math.round(n*10)/10).replace('.',',');

/* ---- actieve tijd: alleen tellen als het scherm zichtbaar is en er de laatste 2 minuten iets aangeraakt is ---- */
let actief=0,laatst=Date.now(),tik=Date.now(),begStand=null;
['pointerdown','keydown','touchstart','wheel'].forEach(t=>addEventListener(t,()=>{laatst=Date.now()},{passive:true,capture:true}));
setInterval(()=>{const nu=Date.now();if(document.visibilityState==='visible'&&nu-laatst<120000)actief+=Math.min(nu-tik,5000);tik=nu},1000);

function verstuur(params){const q=Object.entries(params).map(([k,v])=>k+'='+encodeURIComponent(v)).join('&');
 let ok=false;try{ok=navigator.onLine!==false&&navigator.sendBeacon(URL+'?'+q)}catch(e){}
 if(!ok){try{const a=JSON.parse(localStorage.getItem(QK)||'[]');a.push(q);localStorage.setItem(QK,JSON.stringify(a.slice(-50)))}catch(e){}}}
// wat de vorige keer (zonder internet) bleef liggen, alsnog versturen
try{const a=JSON.parse(localStorage.getItem(QK)||'[]');if(a.length&&navigator.onLine!==false){localStorage.removeItem(QK);a.forEach(q=>{try{navigator.sendBeacon(URL+'?'+q)}catch(e){}})}}catch(e){}

function regel(){const min=actief/60000;
 const nu={},wat=[],st=[];
 keys.forEach(k=>{const a=stand(begStand?begStand[k]:begin[k]),b=stand(read(k));
  for(const f of Object.keys(b)){if(f==='toets'||f==='leerpaden'){if(b[f]!==a[f])wat.push(`${NAAM[f]} ${fmt(b[f])}`)}else{const d=b[f]-(a[f]||0);if(d>0)wat.push(`+${fmt(d)} ${NAAM[f]}`)}
   st.push(`${NAAM[f]} ${fmt(b[f])}`)}
  nu[k]=read(k)});
 try{if(typeof window.leerVoortgang==='function')st.push(`leerroute ${window.leerVoortgang()}%`)}catch(e){}
 if(min<0.3&&!wat.length)return;
 verstuur({actie:'leer',naam:wie,vak,min:fmt(min).replace(',','.'),wat:wat.join(' · ')||'alleen gekeken',stand:st.join(' · ')});
 begStand=Object.assign({},begStand||begin,nu);actief=0}
// bij weggaan of wegklikken één regel; komt de pagina terug, dan telt een nieuw stuk
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')regel()});
addEventListener('pagehide',regel);
})();
