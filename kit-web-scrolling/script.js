import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js';
import { getFirestore, collection, query, orderBy, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const productsCollection = collection(db, 'productos');
const productsQuery = query(productsCollection, orderBy('createdAt', 'desc'));

function renderProductSection(products) {
  const container = document.getElementById('productList');
  if (!container) return;

  if (!Array.isArray(products) || products.length === 0) {
    container.innerHTML = `
      <article class="card animate">
        <div class="product-photo placeholder">Foto</div>
        <h3>Productos disponibles</h3>
        <p>Los productos se cargarán desde Firebase cuando se creen en el panel.</p>
      </article>
    `;
    return;
  }

  container.innerHTML = products.slice(0, 4).map(product => {
    const price = product.price ? `$${Number(product.price).toLocaleString('es-AR')}` : 'Precio no disponible';
    const available = product.available ? 'Disponible' : 'No disponible';
    const image = product.image || '';
    return `
      <article class="card product-card animate">
        <div class="product-photo">${image ? `<img src="${image}" alt="${product.name || 'Producto'}" />` : 'Foto'}</div>
        <h3>${product.name || 'Sin nombre'}</h3>
        <p>${product.description || 'Sin descripción'}</p>
        <p class="product-price">${price}</p>
        <span class="badge">${available}</span>
      </article>
    `;
  }).join('');
}

function initProducts() {
  onSnapshot(productsQuery, (snapshot) => {
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderProductSection(products);
  }, (error) => {
    console.error('Error cargando productos desde Firebase:', error);
    renderProductSection([]);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const scrollContainer = document.querySelector('main');
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
  initProducts();
});
