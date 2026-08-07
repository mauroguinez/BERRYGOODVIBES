import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js';
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const productsRef = collection(db, 'productos');
const productsQuery = query(productsRef, orderBy('createdAt', 'desc'));

const form = document.getElementById('productForm');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const nameInput = document.getElementById('nameInput');
const priceInput = document.getElementById('priceInput');
const descriptionInput = document.getElementById('descriptionInput');
const categoryInput = document.getElementById('categoryInput');
const availableInput = document.getElementById('availableInput');
const productIdInput = document.getElementById('productIdInput');
const productGrid = document.getElementById('productGrid');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFileInput = document.getElementById('importFileInput');
const resetBtn = document.getElementById('resetBtn');

let products = [];
let currentImageData = null;

function formatPrice(value) {
  return value ? `$${Number(value).toLocaleString('es-AR')}` : '$0';
}

function updateImagePreview(src) {
  if (!src) {
    imagePreview.classList.add('empty');
    imagePreview.innerHTML = 'Vista previa de imagen';
    return;
  }
  imagePreview.classList.remove('empty');
  imagePreview.innerHTML = '';
  const img = document.createElement('img');
  img.src = src;
  imagePreview.appendChild(img);
}

function resetForm() {
  form.reset();
  productIdInput.value = '';
  currentImageData = null;
  updateImagePreview(null);
}

function getFilteredProducts() {
  const term = searchInput.value.trim().toLowerCase();
  if (!term) return products;
  return products.filter(product => product.name.toLowerCase().includes(term));
}

function renderProducts() {
  const items = getFilteredProducts();
  productGrid.innerHTML = '';
  if (items.length === 0) {
    productGrid.innerHTML = '<p style="grid-column:1/-1;color:var(--gray);">No se encontraron productos.</p>';
    return;
  }

  items.forEach(product => {
    const card = document.createElement('article');
    card.className = 'product-card';

    const img = document.createElement('img');
    img.src = product.image || '';
    img.alt = product.name || 'Sin imagen';
    if (!product.image) {
      img.style.objectFit = 'contain';
      img.style.background = 'rgba(230, 51, 41, 0.06)';
      img.style.minHeight = '180px';
    }

    const title = document.createElement('h3');
    title.textContent = product.name || 'Sin nombre';

    const meta = document.createElement('div');
    meta.className = 'product-meta';
    meta.innerHTML = `
      <div><strong>Precio:</strong> ${formatPrice(product.price)}</div>
      <div><strong>Categoría:</strong> ${product.category || 'General'}</div>
      <div><strong>Estado:</strong> ${product.available ? 'Disponible' : 'No disponible'}</div>
      <div>${product.description || ''}</div>
    `;

    const footer = document.createElement('div');
    footer.className = 'product-footer';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn btn-secondary';
    editBtn.textContent = 'Editar';
    editBtn.addEventListener('click', () => loadProductForEdit(product));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn-secondary';
    deleteBtn.textContent = 'Eliminar';
    deleteBtn.addEventListener('click', () => deleteProduct(product.id));

    footer.append(editBtn, deleteBtn);
    card.append(img, title, meta, footer);
    productGrid.appendChild(card);
  });
}

function loadProductForEdit(product) {
  productIdInput.value = product.id;
  nameInput.value = product.name || '';
  priceInput.value = product.price || '';
  descriptionInput.value = product.description || '';
  categoryInput.value = product.category || '';
  availableInput.checked = Boolean(product.available);
  currentImageData = product.image || null;
  updateImagePreview(currentImageData);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteProduct(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;
  const confirmed = confirm(`Eliminar producto «${product.name}»?`);
  if (!confirmed) return;

  try {
    await deleteDoc(doc(db, 'productos', id));
  } catch (error) {
    console.error('Error eliminando producto:', error);
    alert('No se pudo eliminar el producto. Revisa la consola.');
  }
}

async function handleFormSubmit(event) {
  event.preventDefault();
  const name = nameInput.value.trim();
  const price = priceInput.value;
  const description = descriptionInput.value.trim();
  const category = categoryInput.value.trim();
  const available = availableInput.checked;

  if (!name || !price) {
    alert('Por favor completá nombre y precio.');
    return;
  }

  const productData = {
    name,
    price,
    description,
    category,
    available,
    image: currentImageData || '',
    updatedAt: serverTimestamp()
  };

  try {
    if (productIdInput.value) {
      const productDoc = doc(db, 'productos', productIdInput.value);
      await setDoc(productDoc, productData, { merge: true });
    } else {
      await addDoc(productsRef, {
        ...productData,
        createdAt: serverTimestamp()
      });
    }
    resetForm();
  } catch (error) {
    console.error('Error guardando producto:', error);
    alert('No se pudo guardar el producto. Revisa la consola.');
  }
}

function handleImageChange(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    currentImageData = reader.result;
    updateImagePreview(currentImageData);
  };
  reader.readAsDataURL(file);
}

function handleExport() {
  const data = JSON.stringify(products, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'berrygood-productos-backup.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed)) {
        alert('El archivo no contiene una lista válida de productos.');
        return;
      }

      for (const item of parsed) {
        await addDoc(productsRef, {
          name: item.name || '',
          price: item.price || '',
          description: item.description || '',
          category: item.category || '',
          available: Boolean(item.available),
          image: item.image || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      alert('Productos importados correctamente.');
    } catch (error) {
      console.error('Error importando JSON:', error);
      alert('No se pudo leer el archivo JSON.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function initSnapshotListener() {
  onSnapshot(productsQuery, (snapshot) => {
    products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderProducts();
  }, (error) => {
    console.error('Error leyendo productos de Firebase:', error);
  });
}

function init() {
  initSnapshotListener();
  form.addEventListener('submit', handleFormSubmit);
  imageInput.addEventListener('change', handleImageChange);
  searchInput.addEventListener('input', renderProducts);
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    renderProducts();
  });
  exportBtn.addEventListener('click', handleExport);
  importBtn.addEventListener('click', () => importFileInput.click());
  importFileInput.addEventListener('change', handleImportFile);
  resetBtn.addEventListener('click', resetForm);
}

init();
