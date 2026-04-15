document.addEventListener("DOMContentLoaded", () => {
// --- Cursor Glow ---
    document.addEventListener("mousemove",e=>{document.documentElement.style.setProperty("--mx",e.clientX+"px");document.documentElement.style.setProperty("--my",e.clientY+"px")});

    // --- Floating Particles ---
    (function(){const c=document.getElementById("particle-canvas"),x=c.getContext("2d");let w,h;function resize(){w=c.width=innerWidth;h=c.height=innerHeight}resize();window.addEventListener("resize",resize);const pts=Array.from({length:50},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:Math.random()*1.5+.5,dx:(Math.random()-.5)*.3,dy:(Math.random()-.5)*.3,o:Math.random()*.4+.1}));function draw(){x.clearRect(0,0,w,h);pts.forEach(p=>{p.x+=p.dx;p.y+=p.dy;if(p.x<0||p.x>w)p.dx*=-1;if(p.y<0||p.y>h)p.dy*=-1;x.beginPath();x.arc(p.x,p.y,p.r,0,Math.PI*2);x.fillStyle=`rgba(45,212,191,${p.o})`;x.fill()});requestAnimationFrame(draw)}draw()})();

    // --- Header Scroll ---
    const header=document.getElementById("site-header");
    const onScroll=()=>header.classList.toggle("nav-scrolled",scrollY>16);
    onScroll();window.addEventListener("scroll",onScroll,{passive:true});

    // --- Mobile Menu ---
    const mm=document.getElementById("mobile-menu"),mmBtn=document.getElementById("mobile-menu-btn"),mmClose=document.getElementById("mobile-menu-close");
    if(mm&&mmBtn&&mmClose){
      mmBtn.addEventListener("click",()=>{mm.classList.add("open");document.body.style.overflow="hidden"});
      mmClose.addEventListener("click",()=>{mm.classList.remove("open");document.body.style.overflow=""});
      mm.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{mm.classList.remove("open");document.body.style.overflow=""}));
    }

    // --- Hero 3D Tilt ---
    const heroStack=document.getElementById("hero-stack"),heroVisual=document.querySelector(".hero-visual");
    if(heroStack&&heroVisual){
      heroVisual.addEventListener("mousemove",e=>{const r=heroVisual.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;heroStack.style.setProperty("--rx",8-y*8+"deg");heroStack.style.setProperty("--ry",-10+x*10+"deg")});
      heroVisual.addEventListener("mouseleave",()=>{heroStack.style.setProperty("--rx","8deg");heroStack.style.setProperty("--ry","-10deg")});
    }

    // --- Feature Card Stagger ---
    const fcObs=new IntersectionObserver((entries)=>{entries.forEach((e,i)=>{if(e.isIntersecting){setTimeout(()=>e.target.classList.add("visible"),i*80);fcObs.unobserve(e.target)}})},{threshold:.15});
    document.querySelectorAll(".feature-card").forEach(c=>fcObs.observe(c));

    // --- Scroll Reveal for Sections ---
    const srObs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("revealed");srObs.unobserve(e.target)}})},{threshold:.1});
    document.querySelectorAll("section").forEach(s=>{s.classList.add("scroll-reveal");srObs.observe(s)});
    document.querySelectorAll(".scroll-reveal").forEach(el=>srObs.observe(el));

    // --- Animated Counters ---
    const cObs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){const el=e.target,target=+el.dataset.target,dur=1800;let start=null;function step(ts){if(!start)start=ts;const p=Math.min((ts-start)/dur,1);el.textContent=Math.floor(p*target).toLocaleString();if(p<1)requestAnimationFrame(step)}requestAnimationFrame(step);cObs.unobserve(el)}})},{threshold:.5});
    document.querySelectorAll(".stats-counter").forEach(c=>cObs.observe(c));

    // --- Toast Notification ---
    setTimeout(()=>{const t=document.getElementById("notification-toast");if(t){t.classList.add("show");setTimeout(()=>t.classList.remove("show"),5000)}},3000);

    // --- Smooth Active Nav Highlight ---
    const navLinks=document.querySelectorAll(".nav-link");
    const sections=document.querySelectorAll("section[id]");
    window.addEventListener("scroll",()=>{let cur="";sections.forEach(s=>{if(scrollY>=s.offsetTop-200)cur=s.id});navLinks.forEach(l=>{l.style.color=l.getAttribute("href")==="#"+cur?"#2dd4bf":""})},{passive:true});
});

