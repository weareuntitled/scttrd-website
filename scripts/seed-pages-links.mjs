import fs from 'fs';import path from 'path';import { fileURLToPath } from 'url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const BASE=(process.env.PAYLOAD_URL||'http://localhost:3000').replace(/\/$/,'');
const lex=t=>JSON.stringify({root:{type:'root',format:'',indent:0,version:1,children:[{tag:'p',type:'paragraph',format:'',indent:0,version:1,children:[{text:t,mode:'normal',type:'text',style:'',detail:0,format:0,version:1}],direction:'ltr'}],direction:'ltr'}});
const A=(token)=>token?{Authorization:`JWT ${token}`}:{};
async function api(token,method,path,body,headers={}){const r=await fetch(BASE+path,{method,headers:{'Content-Type':'application/json',...(A(token)),...headers},body:body?JSON.stringify(body):undefined});const t=await r.text();return {status:r.status,json:t?JSON.parse(t):null,text:t};}
async function login(){const email=process.env.SEED_EMAIL||'admin@scttrd.de';const pwd=process.env.SEED_PASSWORD||'scttrd_music';const r=await api(null,'POST','/api/users/login',{email,password:pwd});if(!r.json?.token){console.error('login failed',r.text);process.exit(1);}console.log('login ok');return r.json.token;}
async function uploadMedia(token,p,alt){if(!fs.existsSync(p)){console.log('  image missing',p);return null;}const fd=new FormData();fd.append('file',new Blob([fs.readFileSync(p)]),path.basename(p));fd.append('_payload',JSON.stringify({alt}));const r=await fetch(`${BASE}/api/media`,{method:'POST',headers:A(token),body:fd});const j=await r.json();if(r.status===201&&j.doc){console.log('  media',path.basename(p),r.status,j.doc.id);return j.doc.id;}console.log('  media err',path.basename(p),r.status,j.errors?.[0]?.message?.message||j.errors?.[0]?.message||'');return null;}
async function upsertPage(token,slug,data){const q=await api(token,'GET',`/api/pages?where[slug][equals]=${slug}&limit=1`);const found=q.json?.docs?.[0];const body={...data,slug};if(found){const r=await api(token,'PATCH',`/api/pages/${found.id}`,body);console.log(`page ${slug} updated`,r.status);return found.id;}const r=await api(token,'POST','/api/pages',body);console.log(`page ${slug} created`,r.status);return r.json?.doc?.id;}
async function upsertLink(token,platform,label,url,order){const q=await api(token,'GET',`/api/links?where[platform][equals]=${platform}&limit=1`);const found=q.json?.docs?.[0];const payload={title:label,label,platform,url,order};if(found){await api(token,'PATCH',`/api/links/${found.id}`,payload);console.log(`link ${platform} updated`);}else{await api(token,'POST','/api/links',payload);console.log(`link ${platform} created`);}}

const token=await login();

// ---------- Home ----------
const hero1=await uploadMedia(token,ROOT+'/public/images/00_scttrd_graded_-29.jpg','SCTTRD Pressebild dunkel');
const hero2=await uploadMedia(token,ROOT+'/public/images/00_scttrd_graded_-51.jpg','SCTTRD Pressebild');
const homeId=await upsertPage(token,'home',{
  title:'Home',section:'home',
  headline:'SCTTRD',subtitle:'LIVE Techno mit Vocals',title:'SCTTRD',
  bio_de:lex('Wir sind SCTTRD. Producer Dani, Vocalistin Babsi und Drummer Nate. Unser Sound pendelt zwischen düsterem Post-Punk, hartem Techno und melodischem Trance. Wir liefern einen Mix aus deutschen und englischen Texten, irgendwo zwischen NDW 2.0 und Underground. Punk, aber schön!'),
  bio_en:lex('We are SCTTRD – producer Dani, vocalist Babsi and drummer Nate. Our sound swings between dark post-punk, hard techno and melodic trance. We bring a mix of German and English lyrics, somewhere between NDW 2.0 and the underground. Punk, but beautiful!'),
  text:'Punk, aber schön',email:'info@scttrd.de',
  ctaHeadline:'Want to book us?',ctaButton:'Book us here',ctaButtonEmailSubject:'Booking%20SCTTRD',
  ...(hero1?{image:hero1,imageAlt:'SCTTRD Pressebild dunkel'}:{}),
});

// ---------- About ----------
const aboutHero=await uploadMedia(token,ROOT+'/public/images/about_01.jpg','SCTTRD live');
const gallery=[];
for(const [p,a] of [['about_02.jpg','SCTTRD live 2'],['about_03.jpg','SCTTRD live 3'],['about_04.jpg','SCTTRD live 4']]){
  const id=await uploadMedia(token,ROOT+'/public/images/'+p,a);if(id)gallery.push({image:id,alt:a});
}
await upsertPage(token,'about',{
  title:'About',section:'about',
  headline:'SCTTRD',subheading:'live Techno in schön',
  bio_en:lex('Our sound is a mixture of live-vocals, running synth-lines, energized beats and drums. The atmosphere we bring on stage is rough but also beautiful. Bringing the soul back into TECHNO LIVE music with a raw blend of post-punk and trance.'),
  email:'info@scttrd.de',
  ...(aboutHero?{image:aboutHero,imageAlt:'SCTTRD live'}:{}),
  ...(gallery.length?{gallery}:{}),
});

// Links (aus src/content/home/links)
await upsertLink(token,'instagram','Instagram','https://www.instagram.com/scttrd_ofc/',30);
await upsertLink(token,'soundcloud','SoundCloud','https://soundcloud.com/scttrd-live',20);
await upsertLink(token,'spotify','Spotify','https://open.spotify.com/intl-de/artist/3MCQLvQUU8ayzroe9gBaui?si=7Ba4s_Z8QsWpuj429tL2wg',10);

// Shows -> Home zuordnen
const shows=await api(token,'GET','/api/shows?limit=100');
for(const s of shows.json?.docs||[]){
  if(s.page===homeId)continue;
  await api(token,'PATCH',`/api/shows/${s.id}`,{page:homeId});
  console.log('show linked:',s.venue);
}
console.log('done. homeId=',homeId);