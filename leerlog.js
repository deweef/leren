/* Leerlog: houdt per bezoek bij wat Ben of Dana deed (vak, actieve minuten, wat er bijkwam) en stuurt dat
   stil naar het tabblad 'Leerhoek' van de scorebord-spreadsheet (Apps Script uit deweef/spelletjes,
   extra/scorebord.gs). Dat tabblad wordt nooit teruggegeven aan de site. Geen meldingen, niets op het scherm.
   Marcel en Anja worden ook bijgehouden; gasten (vrienden) niet. Werkt voor elke pagina die dit script laadt: het kijkt mee met wat de pagina zelf al in localStorage zet. */
/* Voortgang per persoon: elke sleutel in localStorage (behalve leren-*) krijgt stil '@<wie>' erachter, zodat Ben, Dana
   en Ouder op hetzelfde apparaat elk hun eigen voortgang hebben. De pagina's merken daar niets van (zelfde KEY).
   Oude voortgang van vóór deze splitsing (sleutel zonder '@') krijgt iedereen één keer als beginstand mee.
   Synchroniseren: elke stand gaat met een tijdstempel (leren-tijd@<wie>) naar het tabblad 'Leerhoek opslag' van het
   Apps Script (actie=bewaar); bij openen haalt de pagina de stand van die persoon op (actie=stand) en neemt nieuwere
   standen over (daarna één keer herladen). Tot het antwoord er is (max 3 s) is de pagina even niet aan te raken. */
/* 'Ouder · alles' heet nu Marcel: zet een oude keuze en opslag ('@alle') één keer over. Ook in index.html. */
function lerenWie(){let w=null;try{w=localStorage.getItem('leren-wie');if(w==='alle'){const ls=localStorage,ks=[];for(let i=0;i<ls.length;i++)ks.push(ls.key(i));
 ks.forEach(k=>{if(k&&k.endsWith('@alle')){const n=k.slice(0,-5)+'@marcel';if(ls.getItem(n)===null)ls.setItem(n,ls.getItem(k))}});
 ls.setItem('leren-wie','marcel');w='marcel'}}catch(e){}return w}
(function(){
const URL='https://script.google.com/macros/s/AKfycbzo6b4TQRiL2j1ZhEtBa6xpbNcBxmL7IIIB6e1FdYWnswDIxJ1MphWAlAjm12aK_J9U/exec';
// Wie: ben, dana, marcel, anja (Marcel en Anja zien alles), of gast = een vriend(in) (leren-gast = {naam, klas}).
// Gasten krijgen eigen opslag ('@gast-<naam>'), maar gaan niet in het logboek en niet in de synchronisatie.
let wie=lerenWie();
let opslag=wie,naam=wie;
if(wie==='gast'){let g={};try{g=JSON.parse(localStorage.getItem('leren-gast')||'{}')||{}}catch(e){}
 opslag='gast-'+(String(g.naam||'').toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,20)||'x');naam=null}
else if(!/^(ben|dana|marcel|anja)$/.test(wie||''))return;
try{const P=Storage.prototype,get=P.getItem,set=P.setItem,del=P.removeItem,key=P.key;
 const eigen=k=>typeof k==='string'&&!/^leren-/.test(k);
 const ls=window.localStorage,raw=[];for(let i=0;i<ls.length;i++)raw.push(key.call(ls,i));
 if(/^(ben|dana|marcel)$/.test(opslag))raw.forEach(k=>{if(eigen(k)&&!k.includes('@')&&get.call(ls,k+'@'+opslag)===null)set.call(ls,k+'@'+opslag,get.call(ls,k))});
 const TK='leren-tijd@'+opslag;let tijd={};try{tijd=JSON.parse(get.call(ls,TK)||'{}')||{}}catch(e){}
 const tijd0=Object.assign({},tijd),vuil=new Set();let wacht=null; // tijd0: zoals bij openen (de pagina kan meteen al opslaan)
 const zetTijd=(k,t)=>{tijd[k]=t;try{set.call(ls,TK,JSON.stringify(tijd))}catch(e){}};
 P.getItem=function(k){return get.call(this,this===ls&&eigen(k)?k+'@'+opslag:k)};
 P.setItem=function(k,v){if(this!==ls||!eigen(k))return set.call(this,k,v);const oud=get.call(this,k+'@'+opslag),r=set.call(this,k+'@'+opslag,v);if(oud!==String(v)){zetTijd(k,Date.now());vuil.add(k);plan()}return r};
 P.removeItem=function(k){return del.call(this,this===ls&&eigen(k)?k+'@'+opslag:k)};
 const mijn=()=>{const r=[];for(let i=0;i<ls.length;i++){const k=key.call(ls,i);if(k&&eigen(k)&&k.endsWith('@'+opslag))r.push(k.slice(0,-1-opslag.length))}return r};
 window.lerenSleutels=mijn;

 if(!naam)return; // gast: alleen eigen opslag
 /* ---- versturen: 15 s na de laatste wijziging, en bij weggaan ---- */
 const vak=(location.pathname.split('/').pop()||'').replace(/\.html$/,'');
 if(!vak||vak==='index')return;
 const body=k=>new URLSearchParams({actie:'bewaar',naam,sleutel:k,tijd:String(tijd[k]||Date.now()),data:get.call(ls,k+'@'+opslag)||''});
 function stuur(viaBaken){if(navigator.onLine===false)return;vuil.forEach(k=>{const b=body(k);let ok=false;
   if(viaBaken){try{ok=navigator.sendBeacon(URL,b)}catch(e){}}
   if(!ok){try{fetch(URL,{method:'POST',body:b,mode:'no-cors',keepalive:b.toString().length<60000}).catch(()=>{})}catch(e){}}});
  vuil.clear()}
 function plan(){if(!naam)return;clearTimeout(wacht);wacht=setTimeout(()=>stuur(false),15000)}
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){clearTimeout(wacht);stuur(true)}});
 addEventListener('pagehide',()=>{clearTimeout(wacht);stuur(true)});

 /* ---- ophalen bij openen ---- */
 if(navigator.onLine===false||!window.fetch)return;
 const html=document.documentElement;html.classList.add('leren-laden');
 const st=document.createElement('style');st.textContent='html.leren-laden body{opacity:.35;pointer-events:none;transition:opacity .2s}';
 document.head.appendChild(st);
 let klaar=false;const af=()=>{if(!klaar){klaar=true;html.classList.remove('leren-laden')}};
 setTimeout(af,3000);
 fetch(URL+'?actie=stand&naam='+naam,{cache:'no-store'}).then(r=>r.json()).then(o=>{
  if(klaar||!o||typeof o.stand!=='object')return af();
  let nieuw=false;const lokaal=mijn();
  for(const [k,v] of Object.entries(o.stand)){if(!eigen(k)||!v||typeof v.d!=='string')continue;
   const hier=get.call(ls,k+'@'+opslag),th=tijd0[k];
   // oude stand zonder tijdstempel: de grootste (= meeste voortgang) wint
   const neem=th?Number(v.t)>th:(hier===null||v.d.length>hier.length);
   if(neem&&v.d!==hier){set.call(ls,k+'@'+opslag,v.d);zetTijd(k,Number(v.t));nieuw=true}
   else if(!th&&hier!==null){zetTijd(k,Date.now());vuil.add(k)}}
  // standen die online nog niet bestaan meteen versturen
  lokaal.forEach(k=>{if(!o.stand[k]){if(!tijd[k])zetTijd(k,Date.now());vuil.add(k)}});
  if(vuil.size)plan();
  if(nieuw&&!sessionStorage.getItem('leren-herlaad')){try{sessionStorage.setItem('leren-herlaad','1')}catch(e){}location.reload();return}
  try{sessionStorage.removeItem('leren-herlaad')}catch(e){}
  af()}).catch(af);
}catch(e){}
})();
(function(){
const URL='https://script.google.com/macros/s/AKfycbzo6b4TQRiL2j1ZhEtBa6xpbNcBxmL7IIIB6e1FdYWnswDIxJ1MphWAlAjm12aK_J9U/exec';
const QK='leren-logq';
const wie=lerenWie();
const naam=/^(ben|dana|marcel|anja)$/.test(wie||'')?wie:null;if(!naam)return; // nog niet gekozen of gast: niets bijhouden
const vak=(location.pathname.split('/').pop()||'index').replace(/\.html$/,'')||'index';
if(vak==='index')return;

/* ---- welke opslag hoort bij deze pagina: alles wat de pagina tijdens het bezoek wegschrijft ---- */
const keys=new Set();
try{const orig=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(this===window.localStorage&&!/^leren-/.test(k))keys.add(k);return orig.apply(this,arguments)}}catch(e){}
const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}};
const begin={};try{(window.lerenSleutels?window.lerenSleutels():[]).forEach(k=>{begin[k]=read(k)})}catch(e){}

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

/* ---- welke delen van de leerroute helemaal af zijn (alle stappen met gewicht gehaald) ---- */
function afgerond(){try{if(typeof ROUTE==='undefined'||typeof rDone!=='function')return null;
 const delen=[...new Set(ROUTE.map(r=>r[1]))];return delen.filter(d=>{const l=ROUTE.filter(r=>r[1]===d&&r[4]>0);return l.length&&l.every(rDone)})}catch(e){return null}}
let afBegin=[];addEventListener('load',()=>{afBegin=afgerond()||[]});
function regel(){const min=actief/60000;
 const nu={},wat=[],st=[];
 keys.forEach(k=>{const a=stand(begStand?begStand[k]:begin[k]),b=stand(read(k));
  for(const f of Object.keys(b)){if(f==='toets'||f==='leerpaden'){if(b[f]!==a[f])wat.push(`${NAAM[f]} ${fmt(b[f])}`)}else{const d=b[f]-(a[f]||0);if(d>0)wat.push(`+${fmt(d)} ${NAAM[f]}`)}
   st.push(`${NAAM[f]} ${fmt(b[f])}`)}
  nu[k]=read(k)});
 try{if(typeof window.leerVoortgang==='function')st.push(`leerroute ${window.leerVoortgang()}%`)}catch(e){}
 const af=afgerond();if(af){st.push(`afgerond: ${af.length?af.join(', '):'nog niets'}`);af.filter(d=>!afBegin.includes(d)).forEach(d=>wat.push(`deel ${d} afgerond ✓`));afBegin=af}
 if(min<0.3&&!wat.length)return;
 verstuur({actie:'leer',naam,vak,min:fmt(min).replace(',','.'),wat:wat.join(' · ')||'alleen gekeken',stand:st.join(' · ')});
 begStand=Object.assign({},begStand||begin,nu);actief=0}
// bij weggaan of wegklikken één regel; komt de pagina terug, dan telt een nieuw stuk
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')regel()});
addEventListener('pagehide',regel);
})();
