(()=>{
 'use strict';
 const slug=document.body.dataset.trip, t=window.TRAVEL_TRIPS?.[slug];
 if(!t)return;
 const nav=document.getElementById('dayNav'), target=document.getElementById('dayDetail'), cal=document.getElementById('calendarGrid');
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const commonsSearch=q=>'https://commons.wikimedia.org/w/index.php?search='+encodeURIComponent(q)+'&title=Special:MediaSearch&type=image';
 const imageCache=new Map();
 let active=0, visit=0;
 function resolveImage(q){
  if(imageCache.has(q))return imageCache.get(q);
  const p=(async()=>{
   const controller=new AbortController();let timer;
   try{
    timer=setTimeout(()=>controller.abort(),9000);
    const query=q+' filetype:bitmap';
    const url='https://commons.wikimedia.org/w/api.php?'+new URLSearchParams({action:'query',generator:'search',gsrsearch:query,gsrnamespace:'6',gsrlimit:'7',prop:'imageinfo',iiprop:'url|mime',iiurlwidth:'850',format:'json',origin:'*'});
    const r=await fetch(url,{signal:controller.signal});if(!r.ok)throw Error('unavailable');
    const json=await r.json(),pages=Object.values(json.query?.pages||{}).filter(p=>p.imageinfo?.[0]?.thumburl&&/^image\/(jpeg|png|webp)/.test(p.imageinfo[0].mime||''));
    pages.sort((a,b)=>(a.index??99)-(b.index??99));
    if(!pages.length)return null;
    const meta=pages[0].imageinfo[0];return {url:meta.thumburl,source:meta.descriptionurl};
   }catch(e){return null}finally{clearTimeout(timer)}
  })();imageCache.set(q,p);return p;
 }
 function gallery(day,token){
  const entries=[...target.querySelectorAll('[data-search-image]')];
  entries.forEach(async(el)=>{
   const q=el.dataset.searchImage;
   const pic=await resolveImage(q);
   if(!pic||token!==visit||!el.isConnected){
     if(!pic&&el.isConnected&&token===visit)el.querySelector('.sight-visual').textContent='View destination photos ↗';
     return;
   }
   const visual=el.querySelector('.sight-visual');if(!visual)return;
   const img=document.createElement('img');img.loading='lazy';img.alt=q;img.src=pic.url;
   img.onerror=()=>{img.remove();visual.textContent='View destination photos ↗'};
   visual.textContent='';visual.append(img);if(pic.source)el.href=pic.source;
  });
 }
 function pick(i,scroll=false){
  if(i<0||i>=t.days.length)return;active=i;
  const token=++visit;
  nav.innerHTML=t.days.map((d,j)=>`<button type="button" class="${i===j?'active':''}" data-day="${j}" aria-current="${i===j?'step':'false'}"><span class="num">${String(j+1).padStart(2,'0')}</span><span><b>${esc(d.title)}</b><small>DAY ${j+1} / ${esc(d.area)}</small></span></button>`).join('');
  const d=t.days[i],sights=d.sights;
  const photoCards=sights.map(q=>`<a class="sight" href="${esc(commonsSearch(q))}" target="_blank" rel="noopener noreferrer" data-search-image="${esc(q)}"><div class="sight-visual">Finding a real photograph…</div><span>${esc(q.replace(/ (Armenia|Georgia|Serbia|Jordan)$/,''))} ↗</span></a>`).join('');
  target.innerHTML=`<div class="daycover" style="background-image:linear-gradient(20deg,${t.colors[0]}66,${t.colors[1]}22),url('https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(t.hero_file)}?width=1200')"><div class="daycover-label"><div class="caps">DAY ${String(i+1).padStart(2,'0')} · ${esc(d.area)}</div><h3>${esc(d.title)}</h3></div></div><div class="daybody"><p class="daylead">${esc(d.lead)}</p><div class="day-info"><ol class="timeline"><li><b>Morning</b><span>${esc(d.morning)}</span></li><li><b>Afternoon</b><span>${esc(d.afternoon)}</span></li><li><b>Evening</b><span>${esc(d.evening)}</span></li></ol><aside class="side-note"><div class="caps eyebrow">GETTING THERE</div><p>${esc(d.transfer)}</p><div class="caps eyebrow">SLEEP HERE</div><p><strong>${esc(d.stay)}</strong></p><div class="caps eyebrow">GOOD TO KNOW</div><p>${esc(d.note)}</p></aside></div><div class="gallery-head"><h4>What you'll actually see</h4><span>${sights.length} photographic viewpoints</span></div><div class="sightgallery">${photoCards}</div><p class="credits">The photos are searched on Wikimedia Commons and link to their original source. They are illustrative, not live April weather conditions.</p><div class="daycontrols"><button type="button" data-prev ${i===0?'disabled':''}>← Previous day</button><button class="primary" type="button" data-next ${i===t.days.length-1?'disabled':''}>Next day →</button></div></div>`;
  target.querySelector('[data-prev]').onclick=()=>pick(i-1);
  target.querySelector('[data-next]').onclick=()=>pick(i+1);
  gallery(d,token);
  if(scroll)document.getElementById('explore').scrollIntoView({behavior:'smooth',block:'start'});
  nav.querySelector('.active')?.scrollIntoView({block:'nearest',inline:'nearest'});
 }
 nav.addEventListener('click',e=>{const b=e.target.closest('[data-day]');if(b)pick(Number(b.dataset.day))});
 cal.innerHTML=t.days.map((d,i)=>`<button type="button" class="calitem" data-cal="${i}"><div class="calnum">${String(i+1).padStart(2,'0')}</div><b>${esc(d.title)}</b><small>${esc(d.area)}</small><small style="color:#bd8b54;margin-top:9px">◦ ${esc(d.stay)}</small></button>`).join('');
 cal.addEventListener('click',e=>{const b=e.target.closest('[data-cal]');if(b)pick(Number(b.dataset.cal),true)});
 pick(0);
})();