(() => {
 const hero=document.querySelector('.hero'),header=document.querySelector('.header');
 function sync(){
  const bounds=hero.getBoundingClientRect();
  document.body.style.setProperty('--hero-end',`${bounds.bottom+scrollY}px`);
  header.classList.toggle('light-header',bounds.bottom<=header.offsetHeight+24);
 }
 new ResizeObserver(sync).observe(hero);
 addEventListener('scroll',sync,{passive:true});addEventListener('resize',sync);
 document.fonts.ready.then(sync);sync();
})();
