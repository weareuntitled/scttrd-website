import fs from 'fs';import path from 'path';
const PAYLOAD_URL=(process.env.PAYLOAD_URL||'http://localhost:3000').replace(/\/$/,'');
let token=process.env.PAYLOAD_TOKEN;
if(!token){
  const email=process.env.SEED_EMAIL||'admin@scttrd.de',pw=process.env.SEED_PASSWORD||'admin';
  try{const u=await fetch(`${PAYLOAD_URL}/api/users/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pw})});const j=await u.json();token=j.token||j?.user?.token;if(token)console.log('login ok')}catch{}
  if(!token){console.error('No token: create user via http://localhost:3000/admin first or set PAYLOAD_TOKEN');process.exit(1)}
}
const dir='src/content/home/shows';
for(const f of fs.readdirSync(dir).filter(x=>x.endsWith('.md'))){
  const raw=fs.readFileSync(path.join(dir,f),'utf8');
  const data=Object.fromEntries([...raw.matchAll(/^(\w+):\s*(.*)$/gm)].map(m=>[m[1],m[2].trim().replace(/^['"]|['"]$/g,'')]));
  let mediaId;
  if(data.image){
    try{
      const p='public'+data.image;if(fs.existsSync(p)){
        const blob=await fetch(`${PAYLOAD_URL}/api/media`,{method:'POST',headers:{Authorization:`JWT ${token}`},body:(()=>{const fd=new FormData();fd.append('file',new Blob([fs.readFileSync(p)]),path.basename(p));fd.append('_payload','{}');fd.append('alt',data.imageAlt||data.venue||'show');return fd})()});
        const mj=await blob.json();mediaId=mj.doc?.id;console.log(f,'media',blob.status,mediaId||mj.errors?.[0]?.message||'')
      }
    }catch(e){console.log(f,'media err',e.message)}
  }
  const body={venue:data.venue,city:data.city,date:data.date,status:data.status||'past',order:Number(data.order)||10,link:data.link||undefined,imageAlt:data.imageAlt||undefined,...(mediaId?{image:mediaId}:{})};
  if(!mediaId) { console.log(f,'skip no media, needs manual upload in /admin'); continue }
  const r=await fetch(`${PAYLOAD_URL}/api/shows`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`JWT ${token}`},body:JSON.stringify(body)});
  console.log(f,r.status,(await r.text()).slice(0,300))
}
