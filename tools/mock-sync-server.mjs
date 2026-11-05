// 가짜 Apps Script: GET ?code= → {ok,data}, POST {code,name,data,summary} → 저장
import http from 'http';
const db={};const sums={};
http.createServer((req,res)=>{res.setHeader('Access-Control-Allow-Origin','*');const u=new URL(req.url,'http://x');
  if(u.pathname==='/_dump'){res.end(JSON.stringify({db,sums}));return;}
  if(req.method==='GET'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({ok:true,data:db[u.searchParams.get('code')]||null}));return;}
  let b='';req.on('data',c=>b+=c);req.on('end',()=>{const j=JSON.parse(b);db[j.code]=j.data;sums[j.code]={name:j.name,...j.summary};res.setHeader('Content-Type','application/json');res.end('{"ok":true}');});
}).listen(8770,'127.0.0.1');
