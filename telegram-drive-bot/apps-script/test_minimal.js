const fs=require('fs'),vm=require('vm'),assert=require('assert');
const store={props:{},files:[],sent:[],pending:[],triggers:[],calls:[]};
const log=[];
function blob(n,m){let _n=n,_m=m;return{setName(x){_n=x;return this;},setContentType(x){_m=x;return this;},getName(){return _n;},getContentType(){return _m;}};}
function folder(name,id){const kids=[];return{__f:true,getName:()=>name,getId:()=>id,getUrl:()=>'https://drive/f/'+id,
 createFile(a,b,c){let bl;if(typeof a==='string'&&typeof b==='string'){bl=blob(a,c==='GOOGLE_DOCS'?'application/vnd.google-apps.document':'text/plain');}else{bl=a;}
  const f={name:bl.getName(),blob:bl,desc:'',getName(){return this.name;},getId:()=>'id'+(store.files.length+1),getUrl(){return'https://drive/file/'+this.getId();},setName(n){this.name=n;return this;},setDescription(d){this.desc=d;return this;}};
  kids.push(f);store.files.push(f);return f;},
 getFoldersByName(n){const h=kids.filter(k=>k.__f&&k.getName()===n);let i=0;return{hasNext:()=>i<h.length,next:()=>h[i++]};},
 createFolder(n){const s=folder(n,'sub_'+n);s.__f=true;kids.push(s);return s;}};}
const root=folder('root','root');
const cache={c:{},get(k){return this.c[k]||null;},put(k,v){this.c[k]=v;}};
const sandbox={console,JSON,Date,String,Number,Array,Object,RegExp,Error,Math,
 Logger:{log:(m)=>log.push(String(m))},
 PropertiesService:{getScriptProperties:()=>({getProperty:k=>k in store.props?store.props[k]:null,setProperty:(k,v)=>{store.props[k]=v;}})},
 LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},
 CacheService:{getScriptCache:()=>cache},
 DriveApp:{getRootFolder:()=>root,getFolderById:()=>root,getFoldersByName:n=>root.getFoldersByName(n)},
 MimeType:{PLAIN_TEXT:'PLAIN_TEXT',GOOGLE_DOCS:'GOOGLE_DOCS'},
 Utilities:{formatDate:(d,tz,f)=>'2026-10-28_12-00-00'},
 ScriptApp:{getProjectTriggers:()=>store.triggers.slice(),deleteTrigger:t=>{const i=store.triggers.indexOf(t);if(i>=0)store.triggers.splice(i,1);},
  newTrigger:fn=>({timeBased(){return this;},everyMinutes:function(){const t={fn,getHandlerFunction:()=>fn};store.triggers.push(t);return{create(){return t;}};}})},
 UrlFetchApp:{fetch:(url,opts)=>{const rest=url.split('/bot')[1];const m=rest.split('/').pop();
   if(url.indexOf('/documents/')!==-1)return{getResponseCode:()=>200,getBlob:()=>blob('x.jpg','image/jpeg')};
   if(m==='getMe')return{getResponseCode:()=>200,getContentText:()=>JSON.stringify({ok:true,result:{username:'T2GD2Tbot'}})};
   if(m==='getWebhookInfo')return{getResponseCode:()=>200,getContentText:()=>JSON.stringify({ok:true,result:{url:'',pending_update_count:0}})};
   if(m==='getUpdates'){const p=JSON.parse(opts.payload);const off=p.offset||0;
     const out=store.pending.filter(u=>u.update_id>=off);store.pending=store.pending.filter(u=>u.update_id<off);
     return{getResponseCode:()=>200,getContentText:()=>JSON.stringify({ok:true,result:out})};}
   if(m==='getFile')return{getResponseCode:()=>200,getContentText:()=>JSON.stringify({ok:true,result:{file_path:'documents/x.jpg'}})};
   if(m==='sendMessage'){store.sent.push(JSON.parse(opts.payload));return{getResponseCode:()=>200,getContentText:()=>JSON.stringify({ok:true})};}
   if(m==='deleteWebhook')return{getResponseCode:()=>200,getContentText:()=>JSON.stringify({ok:true,result:true})};

   store.calls.push(m);
   return{getResponseCode:()=>200,getContentText:()=>JSON.stringify({ok:true})};}}};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'ready','Code.minimal.gs'),'utf8'),sandbox);
let pass=0,fail=0;const t=(n,f)=>{try{f();console.log('ok   - '+n);pass++;}catch(e){console.log('FAIL - '+n+': '+e.message);fail++;}};
t('START نصب تریگر + لاگ کامل', ()=>{
  log.length=0;
  store.pending=[{update_id:10,message:{chat:{id:5},text:'سلام'}},
                 {update_id:11,message:{chat:{id:5},photo:[{file_id:'p',file_size:100}],caption:'عکس'}}];
  const rep=sandbox.START();
  assert.ok(log.length>5,'باید چند خط لاگ بدهد');
  assert.ok(rep.includes('تمام شد'),rep);
  assert.strictEqual(store.triggers.length,1);
  assert.ok(store.files.length>=2,'متن و عکس باید ذخیره شوند: files='+store.files.length+' sent='+JSON.stringify(store.sent));
  assert.strictEqual(store.sent.length,2);
});
t('POLL پیام جدید را ذخیره می‌کند', ()=>{
  store.pending=[{update_id:20,message:{chat:{id:5},text:'پیام دوم'}}];
  const n=sandbox.POLL();assert.strictEqual(n,1);
});
t('/ping جواب می‌دهد', ()=>{
  store.pending=[{update_id:21,message:{chat:{id:5},text:'/ping'}}];
  sandbox.POLL();assert.ok(store.sent[store.sent.length-1].text.includes('pong'));
});
t('STATUS گزارش می‌دهد', ()=>{log.length=0;const r=sandbox.STATUS();assert.ok(r.includes('تریگر POLL: 1'),r);assert.ok(log.length===1);});
t('STOP تریگر را حذف می‌کند', ()=>{sandbox.STOP();assert.strictEqual(store.triggers.length,0);});
console.log('\n'+pass+' passed, '+fail+' failed');process.exit(fail?1:0);
