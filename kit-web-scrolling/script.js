document.addEventListener('DOMContentLoaded', () => {
  const anchors = document.querySelectorAll('a[href^="#"]');
  anchors.forEach(anchor => {
    anchor.addEventListener('click', event => {
      const targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        event.preventDefault();
        if (scrollContainer) {
          scrollContainer.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
        } else {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  const heroVideo = document.getElementById('heroVideo');
  const scrollContainer = document.querySelector('main');
  let videoDuration = 0;
  let isVideoLoaded = false;

  if (heroVideo) {
    heroVideo.addEventListener('loadedmetadata', () => {
      videoDuration = heroVideo.duration;
      isVideoLoaded = true;
      heroVideo.pause();
      updateHeroVideo();
    });

    heroVideo.addEventListener('error', () => {
      console.warn('No se pudo cargar el video de hero. Revisa video.mp4.');
    });
  }

  function updateHeroVideo() {
    if (!heroVideo || !scrollContainer || !isVideoLoaded || videoDuration === 0) return;
    const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
    if (maxScroll <= 0) return;
    const progress = Math.min(Math.max(scrollContainer.scrollTop / maxScroll, 0), 1);
    heroVideo.currentTime = progress * videoDuration;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.animate').forEach(el => observer.observe(el));

  if (scrollContainer) {
    scrollContainer.addEventListener('scroll', updateHeroVideo, { passive: true });
    window.addEventListener('resize', updateHeroVideo);
  }
  updateHeroVideo();
});
