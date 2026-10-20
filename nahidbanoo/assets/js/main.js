
const progress=document.getElementById('progress'),header=document.getElementById('header');
const plx=[...document.querySelectorAll('[data-plx]')];
function onScroll(){const h=document.documentElement,p=h.scrollTop/(h.scrollHeight-h.clientHeight||1);progress.style.transform=`scaleX(${p})`;header.classList.toggle('scrolled',h.scrollTop>20);
 plx.forEach(el=>{const s=parseFloat(el.dataset.plx||0);const r=el.getBoundingClientRect();const off=(r.top+r.height/2-innerHeight/2)*s;el.style.translate=`0 ${off.toFixed(1)}px`});}
addEventListener('scroll',()=>requestAnimationFrame(onScroll),{passive:true});onScroll();
const menu=document.getElementById('menu'),burger=document.getElementById('burger');
if(burger){burger.addEventListener('click',()=>{const o=menu.classList.toggle('show');burger.setAttribute('aria-expanded',o)});menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>menu.classList.remove('show')))}
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.1});
document.querySelectorAll('.rv').forEach(el=>io.observe(el));
const cio=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;const el=e.target,end=+el.dataset.count;let n=0;const t=setInterval(()=>{n++;el.textContent=n.toLocaleString('fa-IR');if(n>=end)clearInterval(t)},30);cio.unobserve(el)}),{threshold:.6});
document.querySelectorAll('.count').forEach(el=>cio.observe(el));
/* hero slideshow */
const slides=[...document.querySelectorAll('.show figure')],dotsBox=document.getElementById('dots');
let cur=0,timer;
function go(i){slides[cur]&&slides[cur].classList.remove('on');dotsBox&&dotsBox.children[cur]&&dotsBox.children[cur].classList.remove('on');cur=(i+slides.length)%slides.length;slides[cur]&&slides[cur].classList.add('on');dotsBox&&dotsBox.children[cur]&&dotsBox.children[cur].classList.add('on');restart()}
function restart(){clearInterval(timer);if(slides.length>1)timer=setInterval(()=>go(cur+1),5200)}
if(dotsBox){slides.forEach((_,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label','اسلاید '+(i+1));b.addEventListener('click',()=>go(i));dotsBox.appendChild(b)});slides[0]&&slides[0].classList.add('on');dotsBox.children[0]&&dotsBox.children[0].classList.add('on');restart()}
/* faq */
document.querySelectorAll('.faq-item').forEach(item=>{const q=item.querySelector('.faq-q');q&&q.addEventListener('click',()=>{const open=item.classList.contains('open');document.querySelectorAll('.faq-item').forEach(x=>{x.classList.remove('open');const s=x.querySelector('.faq-q span');s&&(s.textContent='+')});if(!open){item.classList.add('open');q.querySelector('span').textContent='−'}})});
/* lightbox */
const lb=document.getElementById('lightbox');
if(lb){const lbImg=lb.querySelector('img'),lbCap=lb.querySelector('.cap span');
 document.querySelectorAll('.gitem').forEach(f=>f.addEventListener('click',()=>{const im=f.querySelector('img');lbImg.src=im.src;lbImg.alt=im.alt;lbCap.textContent=f.querySelector('figcaption')?f.querySelector('figcaption').textContent:im.alt;lb.showModal()}));
 lb.querySelector('.close').addEventListener('click',()=>lb.close());lb.addEventListener('click',e=>{if(e.target===lb)lb.close()})}
/* video facades: click loads the real Instagram embed */
document.querySelectorAll('.vthumb').forEach(btn=>btn.addEventListener('click',()=>{const code=btn.dataset.embed,kind=btn.dataset.kind||'reel';const ifr=document.createElement('iframe');ifr.src=`https://www.instagram.com/${kind}/${code}/embed/`;ifr.title='ویدیوی اینستاگرام آموزشگاه تقی‌زاده';ifr.loading='lazy';ifr.allow='autoplay; encrypted-media; picture-in-picture';ifr.allowFullscreen=true;btn.replaceWith(ifr)}));
/* consultation form -> WhatsApp */
function waLink(t){return 'https://wa.me/989155061767?text='+encodeURIComponent(t)}
const wq=document.getElementById('waQuick');wq&&(wq.href=waLink('سلام، برای مشاوره رایگان دوره‌های آموزشگاه تقی‌زاده پیام می‌دهم.'));
document.querySelectorAll('.consult-link').forEach(a=>a.addEventListener('click',()=>{const c=a.dataset.course,s=document.getElementById('course');if(s){[...s.options].forEach(o=>{if(o.text===c)s.value=o.text});}}));
const form=document.getElementById('consultForm');
form&&form.addEventListener('submit',e=>{e.preventDefault();const v=id=>document.getElementById(id).value.trim();const name=v('name'),phone=v('phone'),level=v('level'),course=v('course'),msg=v('msg');
 if(!name||phone.replace(/\D/g,'').length<10){alert('لطفاً نام و شماره موبایل معتبر را وارد کن.');return}
 const text=`سلام، من ${name} هستم.\nبرای مشاوره رایگان دوره‌های آموزشگاه تقی‌زاده پیام می‌دهم.\nسطح فعلی: ${level}\nدوره موردنظر: ${course}\nشماره تماس: ${phone}${msg?`\nهدفم: ${msg}`:''}`;open(waLink(text),'_blank')});
