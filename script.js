/* =========================================================
   script.js — متجر أم أم كي
   منطق المنتجات والسلة والبحث والفلترة المشترك
   ========================================================= */

const CART_KEY = (window.MENA_CONFIG && window.MENA_CONFIG.CART_KEY) || "libraryCart";

let ALL_PRODUCTS = [];
let CURRENT_CATEGORY = "all";

/* ---------------------------------------------------------
   Helper Functions (Format & Escape)
   --------------------------------------------------------- */

function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatPrice(price) {
  return Number(price || 0).toLocaleString("ar-EG") + " ج.م";
}

/* ---------------------------------------------------------
   Toast notifications
   --------------------------------------------------------- */

function showToast(message, type = "success") {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  const icon = type === "success" ? "✅" : type === "error" ? "⚠️" : "ℹ️";
  toast.innerHTML = `<span>${icon}</span><span>${escapeHTML(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all .25s ease";
    setTimeout(() => toast.remove(), 250);
  }, 2600);
}

/* ---------------------------------------------------------
   Cart storage helpers
   --------------------------------------------------------- */

function getCart() {
  let cart = [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    cart = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(cart)) cart = [];
  } catch (e) {
    cart = [];
  }

  return cart
    .filter((item) => item && item.id !== undefined && item.id !== null)
    .map((item) => ({
      id: String(item.id),
      name: item.name || "منتج بدون اسم",
      price: Number(item.price) || 0,
      image: item.image || item.image_url || item.imageUrl || "",
      quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
    }));
}

function saveCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (e) {
    console.error("تعذر حفظ السلة:", e);
  }
  updateCartCount();
}

function cartQuantity() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

function cartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function updateCartCount() {
  const count = cartQuantity();
  document.querySelectorAll("#cartCount, .cart-badge").forEach((el) => {
    el.textContent = count;
    el.style.display = count > 0 ? "flex" : "flex";
  });
}

/* ---------------------------------------------------------
   Cart mutation functions
   --------------------------------------------------------- */

function addToCart(product, quantity = 1) {
  if (!product || product.id === undefined || product.id === null) return;
  const cart = getCart();
  const id = String(product.id);
  const existing = cart.find((item) => item.id === id);

  const image = product.image || product.image_url || product.imageUrl || "";
  const name = product.name || product.title || "منتج";
  const price = Number(product.price) || 0;

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ id, name, price, image, quantity });
  }

  saveCart(cart);
  showToast(`تمت إضافة "${name}" إلى السلة`, "success");
  renderCartIfPresent();
}

function addToCartById(productId, quantity = 1) {
  const product = ALL_PRODUCTS.find((p) => String(p.id) === String(productId));
  if (!product) {
    showToast("تعذر العثور على المنتج", "error");
    return;
  }
  addToCart(product, quantity);
}

function buyNow(productId) {
  addToCartById(productId, 1);
  goToCheckout();
}

function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter((item) => item.id !== String(productId));
  saveCart(cart);
  renderCartIfPresent();
  showToast("تم حذف المنتج من السلة", "info");
}

function changeQuantity(productId, delta) {
  const cart = getCart();
  const item = cart.find((i) => i.id === String(productId));
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }
  saveCart(cart);
  renderCartIfPresent();
}

function setQuantity(productId, value) {
  const cart = getCart();
  const item = cart.find((i) => i.id === String(productId));
  if (!item) return;
  const qty = Math.max(1, parseInt(value, 10) || 1);
  item.quantity = qty;
  saveCart(cart);
  renderCartIfPresent();
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartCount();
  renderCartIfPresent();
  showToast("تم تفريغ السلة", "info");
}

function goToCheckout() {
  if (cartQuantity() === 0) {
    showToast("السلة فارغة، أضف منتجات أولاً", "error");
    return;
  }
  window.location.href = "checkout.html";
}

function goCheckout() {
  goToCheckout();
}

function continueShopping() {
  window.location.href = "index.html#products";
}

/* ---------------------------------------------------------
   Cart rendering (used on cart.html)
   --------------------------------------------------------- */

function renderCartIfPresent() {
  if (document.getElementById("cartItems")) {
    renderCart();
  }
  updateCartCount();
}

function renderCart() {
  const cart = getCart();
  const cartItemsEl = document.getElementById("cartItems");
  const emptyCartEl = document.getElementById("emptyCart");
  if (!cartItemsEl) return;

  if (cart.length === 0) {
    cartItemsEl.innerHTML = "";
    cartItemsEl.closest(".cart-card")?.style.setProperty("display", "none");
    if (emptyCartEl) emptyCartEl.style.display = "block";
    updateCartSummary();
    return;
  }

  cartItemsEl.closest(".cart-card")?.style.setProperty("display", "block");
  if (emptyCartEl) emptyCartEl.style.display = "none";

  cartItemsEl.innerHTML = cart
    .map((item) => {
      const lineTotal = item.price * item.quantity;
      return `
      <div class="cart-item" data-id="${escapeHTML(item.id)}">
        <img class="cart-item-image" src="${escapeHTML(item.image) || "https://via.placeholder.com/150"}" alt="${escapeHTML(item.name)}" onerror="this.src='https://via.placeholder.com/150'">
        <div class="cart-item-info">
          <h3>${escapeHTML(item.name)}</h3>
          <div class="unit-price">سعر الوحدة: ${formatPrice(item.price)}</div>
          <div class="qty-control">
            <button type="button" onclick="changeQuantity('${escapeHTML(item.id)}', -1)" aria-label="تقليل">−</button>
            <input type="number" min="1" value="${item.quantity}" onchange="setQuantity('${escapeHTML(item.id)}', this.value)">
            <button type="button" onclick="changeQuantity('${escapeHTML(item.id)}', 1)" aria-label="زيادة">+</button>
          </div>
        </div>
        <div class="cart-item-side">
          <div class="item-total">${formatPrice(lineTotal)}</div>
          <button type="button" class="remove-link" onclick="removeFromCart('${escapeHTML(item.id)}')">🗑 حذف</button>
        </div>
      </div>`;
    })
    .join("");

  updateCartSummary();
}

function updateCartSummary() {
  const cart = getCart();
  const qty = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cartTotal();

  const summaryQuantityEl = document.getElementById("summaryQuantity");
  const subtotalEl = document.getElementById("subtotal");
  const totalEl = document.getElementById("total");

  if (summaryQuantityEl) summaryQuantityEl.textContent = qty;
  if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
  if (totalEl) totalEl.textContent = formatPrice(subtotal);
}

/* ---------------------------------------------------------
   Products loading from Supabase & Rendering with Filters
   --------------------------------------------------------- */

async function loadProducts() {
  const grid = document.getElementById("products");
  if (!grid) return;

  try {
    if (!window.supabaseClient) throw new Error("Supabase client غير متاح");

    const { data, error } = await window.supabaseClient
      .from(window.MENA_CONFIG.PRODUCTS_TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    ALL_PRODUCTS = (data || []).map(normalizeProduct);
    renderProductsGrid();
  } catch (err) {
    console.error("خطأ في تحميل المنتجات:", err);
    grid.innerHTML = `<div class="empty-state">تعذر تحميل المنتجات حاليًا، حاول مرة أخرى لاحقًا.</div>`;
  }
}

function normalizeProduct(p) {
  return {
    id: p.id,
    name: p.name || p.title || "منتج",
    description: p.description || "",
    price: Number(p.price) || 0,
    image_url: p.image_url || p.image || p.imageUrl || "",
    category: p.category || "عام",
    stock: p.stock !== undefined ? Number(p.stock) : null,
  };
}

function renderProductsGrid() {
  const grid = document.getElementById("products");
  if (!grid) return;

  const searchInput = document.getElementById("searchInput");
  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

  // فلترة حسب القسم والبحث معاً
  const filtered = ALL_PRODUCTS.filter((p) => {
    const matchesCategory = CURRENT_CATEGORY === "all" || p.category === CURRENT_CATEGORY;
    const matchesSearch = query === "" || p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="text-align:center; grid-column: 1/-1; padding: 40px;">لا توجد منتجات مطابقة للبحث أو هذا القسم حالياً.</div>`;
    return;
  }

  grid.innerHTML = filtered
    .map((p) => {
      const outOfStock = p.stock !== null && p.stock <= 0;
      return `
      <div class="product-card">
        <img class="product-image" src="${escapeHTML(p.image_url) || "https://via.placeholder.com/300"}" alt="${escapeHTML(p.name)}" onerror="this.src='https://via.placeholder.com/300'">
        <div class="product-body">
          <span class="product-category">${escapeHTML(p.category)}</span>
          <h3 class="product-name">${escapeHTML(p.name)}</h3>
          <p class="product-desc">${escapeHTML(p.description)}</p>
          <div class="product-footer">
            <span class="product-price">${formatPrice(p.price)}</span>
            <div class="product-actions">
              <button class="icon-btn" title="أضف للسلة" ${outOfStock ? "disabled" : ""} onclick="addToCartById('${escapeHTML(String(p.id))}')">🛒</button>
              <button class="btn btn-primary" ${outOfStock ? "disabled" : ""} onclick="buyNow('${escapeHTML(String(p.id))}')">${outOfStock ? "غير متوفر" : "شراء الآن"}</button>
            </div>
          </div>
        </div>
      </div>`;
    })
    .join("");
}

// دالة تصفية الأقسام
function filterByCategory(category) {
  CURRENT_CATEGORY = category;
  document.querySelectorAll(".category-pill").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-category") === category);
  });
  renderProductsGrid();
}

// دالة تصفية البحث
function filterProducts() {
  renderProductsGrid();
}

/* ---------------------------------------------------------
   حساب العميل (تسجيل الدخول / الحساب)
   --------------------------------------------------------- */

async function updateAccountLink() {
  const link = document.getElementById("accountLink");
  if (!link || !window.supabaseClient) return;

  try {
    const { data } = await window.supabaseClient.auth.getSession();
    if (data?.session?.user) {
      const meta = data.session.user.user_metadata || {};
      const firstName = (meta.full_name || data.session.user.email || "حسابي").split(" ")[0];
      link.textContent = `👤 ${firstName}`;
      link.href = "account.html";
    } else {
      link.textContent = "👤 تسجيل الدخول";
      link.href = "login.html";
    }
  } catch (e) {
    console.warn("تعذر التحقق من جلسة العميل:", e);
  }
}

/* ---------------------------------------------------------
   Init
   --------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();

  const categoriesList = document.getElementById("categoriesList");
  if (categoriesList) {
    categoriesList.addEventListener("click", (e) => {
      const btn = e.target.closest(".category-pill");
      if (!btn) return;
      filterByCategory(btn.getAttribute("data-category"));
    });
  }

  if (document.getElementById("products")) {
    loadProducts();
  }

  if (document.getElementById("cartItems")) {
    renderCart();
  }
});