/* =========================================================
   script.js — MMK Store
   المنتجات + السلة + البحث + الأقسام + الحساب
   ========================================================= */

/* =========================================================
   CART CONFIG
   ========================================================= */

const CART_KEY =
  (window.MENA_CONFIG &&
    window.MENA_CONFIG.CART_KEY) ||
  "libraryCart";

const DEFAULT_PRODUCT_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg"
         width="600"
         height="600"
         viewBox="0 0 600 600">
      <rect width="600" height="600" fill="#f6f7fc"/>
      <text x="50%"
            y="50%"
            dominant-baseline="middle"
            text-anchor="middle"
            fill="#64748b"
            font-family="Arial"
            font-size="28">
        MMK
      </text>
    </svg>
  `);

let ALL_PRODUCTS = [];
let CURRENT_CATEGORY = "all";

/* =========================================================
   HELPER FUNCTIONS
   ========================================================= */

function escapeHTML(str) {
  if (
    str === null ||
    str === undefined
  ) {
    return "";
  }

  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatPrice(price) {
  return (
    Number(price || 0).toLocaleString(
      "ar-EG"
    ) + " ج.م"
  );
}

/* =========================================================
   توحيد أسماء الأقسام
   يدعم البيانات القديمة والجديدة
   ========================================================= */

function normalizeProductCategory(category) {
  if (
    category === null ||
    category === undefined
  ) {
    return "";
  }

  const value = String(category)
    .trim()
    .toLowerCase();

  const aliases = {

    /* -------------------------
       كابلات
    ------------------------- */

    "cables": "cables",
    "كابلات": "cables",
    "كابل": "cables",

    /* -------------------------
       شواحن
    ------------------------- */

    "chargers": "chargers",
    "شواحن": "chargers",
    "شاحن": "chargers",

    /* -------------------------
       هيدفون
    ------------------------- */

    "headphones": "headphones",
    "هيدفون": "headphones",
    "headphone": "headphones",

    /* -------------------------
       هاند فري
    ------------------------- */

    "handsfree": "handsfree",
    "hands-free": "handsfree",
    "hands_free": "handsfree",
    "هاند فري": "handsfree",
    "هاندفري": "handsfree",

    /* -------------------------
       أدوات مدرسية
    ------------------------- */

    "school": "school",
    "أدوات مدرسية": "school",
    "ادوات مدرسية": "school",

    /* -------------------------
       إكسسوارات هواتف
    ------------------------- */

    "phone-accessories":
      "phone-accessories",

    "phone_accessories":
      "phone-accessories",

    "phoneaccessories":
      "phone-accessories",

    "إكسسوارات هواتف":
      "phone-accessories",

    "اكسسوارات هواتف":
      "phone-accessories",

    "إكسسوارات الهاتف":
      "phone-accessories",

    "اكسسوارات الهاتف":
      "phone-accessories",

    /* -------------------------
       ملابس
    ------------------------- */

    "clothes": "clothes",
    "ملابس": "clothes",

    /* -------------------------
       أدوات منزلية
    ------------------------- */

    "home": "home",
    "أدوات منزلية": "home",
    "ادوات منزلية": "home",

    /* -------------------------
       إكسسوارات
    ------------------------- */

    "accessories": "accessories",
    "إكسسوارات": "accessories",
    "اكسسوارات": "accessories",

    /* -------------------------
       أيربودز
    ------------------------- */

    "airpods": "airpods",
    "air-pods": "airpods",
    "أيربودز": "airpods",
    "ايربودز": "airpods",

    /* -------------------------
       كل المنتجات
    ------------------------- */

    "all": "all",
    "كل المنتجات": "all"
  };

  return (
    aliases[value] ||
    value
  );
}

/* =========================================================
   اسم القسم المعروض بالعربي
   ========================================================= */

function getCategoryDisplayName(category) {

  const normalized =
    normalizeProductCategory(
      category
    );

  const names = {

    cables: "كابلات",

    chargers: "شواحن",

    headphones: "هيدفون",

    handsfree: "هاند فري",

    school: "أدوات مدرسية",

    "phone-accessories":
      "إكسسوارات هواتف",

    clothes: "ملابس",

    home: "أدوات منزلية",

    accessories: "إكسسوارات",

    airpods: "أيربودز"
  };

  return (
    names[normalized] ||
    (
      category
        ? String(category)
        : "عام"
    )
  );
}

/* =========================================================
   TOAST
   ========================================================= */

function showToast(
  message,
  type = "success"
) {

  let container =
    document.getElementById(
      "toastContainer"
    );

  if (!container) {

    container =
      document.createElement(
        "div"
      );

    container.id =
      "toastContainer";

    document.body.appendChild(
      container
    );
  }

  const toast =
    document.createElement(
      "div"
    );

  toast.className =
    `toast ${type}`;

  const icon =
    type === "success"
      ? "✅"
      : type === "error"
      ? "⚠️"
      : "ℹ️";

  toast.innerHTML = `
    <span>${icon}</span>
    <span>${escapeHTML(
      message
    )}</span>
  `;

  container.appendChild(
    toast
  );

  setTimeout(() => {

    toast.style.opacity =
      "0";

    toast.style.transform =
      "translateY(10px)";

    toast.style.transition =
      "all .25s ease";

    setTimeout(
      () => toast.remove(),
      250
    );

  }, 2600);
}

/* =========================================================
   CART STORAGE
   ========================================================= */

function getCart() {

  let cart = [];

  try {

    const raw =
      localStorage.getItem(
        CART_KEY
      );

    cart = raw
      ? JSON.parse(raw)
      : [];

    if (!Array.isArray(cart)) {
      cart = [];
    }

  } catch (error) {

    console.error(
      "تعذر قراءة السلة:",
      error
    );

    cart = [];
  }

  return cart
    .filter(
      (item) =>
        item &&
        item.id !== undefined &&
        item.id !== null
    )
    .map(
      (item) => ({
        id: String(
          item.id
        ),

        name:
          item.name ||
          "منتج بدون اسم",

        price:
          Number(
            item.price
          ) || 0,

        image:
          item.image ||
          item.image_url ||
          item.imageUrl ||
          "",

        quantity:
          Math.max(
            1,
            parseInt(
              item.quantity,
              10
            ) || 1
          )
      })
    );
}

function saveCart(cart) {

  try {

    localStorage.setItem(
      CART_KEY,
      JSON.stringify(cart)
    );

  } catch (error) {

    console.error(
      "تعذر حفظ السلة:",
      error
    );
  }

  updateCartCount();
}

function cartQuantity() {

  return getCart().reduce(
    (
      sum,
      item
    ) =>
      sum +
      item.quantity,
    0
  );
}

function cartTotal() {

  return getCart().reduce(
    (
      sum,
      item
    ) =>
      sum +
      item.price *
        item.quantity,
    0
  );
}

function updateCartCount() {

  const count =
    cartQuantity();

  document
    .querySelectorAll(
      "#cartCount, .cart-badge"
    )
    .forEach(
      (el) => {

        el.textContent =
          count;

        el.style.display =
          "flex";
      }
    );
}

/* =========================================================
   CART MUTATIONS
   ========================================================= */

function addToCart(
  product,
  quantity = 1
) {

  if (
    !product ||
    product.id ===
      undefined ||
    product.id ===
      null
  ) {
    return;
  }

  const cart =
    getCart();

  const id =
    String(
      product.id
    );

  const existing =
    cart.find(
      (item) =>
        item.id === id
    );

  const image =
    product.image ||
    product.image_url ||
    product.imageUrl ||
    "";

  const name =
    product.name ||
    product.title ||
    "منتج";

  const price =
    Number(
      product.price
    ) || 0;

  const safeQuantity =
    Math.max(
      1,
      Number(
        quantity
      ) || 1
    );

  if (existing) {

    existing.quantity +=
      safeQuantity;

  } else {

    cart.push({
      id,
      name,
      price,
      image,
      quantity:
        safeQuantity
    });
  }

  saveCart(
    cart
  );

  showToast(
    `تمت إضافة "${name}" إلى السلة`,
    "success"
  );

  renderCartIfPresent();
}

function addToCartById(
  productId,
  quantity = 1
) {

  const product =
    ALL_PRODUCTS.find(
      (p) =>
        String(p.id) ===
        String(productId)
    );

  if (!product) {

    showToast(
      "تعذر العثور على المنتج",
      "error"
    );

    return;
  }

  addToCart(
    product,
    quantity
  );
}

function buyNow(
  productId
) {

  addToCartById(
    productId,
    1
  );

  setTimeout(
    goToCheckout,
    100
  );
}

function removeFromCart(
  productId
) {

  let cart =
    getCart();

  cart =
    cart.filter(
      (item) =>
        item.id !==
        String(productId)
    );

  saveCart(
    cart
  );

  renderCartIfPresent();

  showToast(
    "تم حذف المنتج من السلة",
    "info"
  );
}

function changeQuantity(
  productId,
  delta
) {

  const cart =
    getCart();

  const item =
    cart.find(
      (i) =>
        i.id ===
        String(productId)
    );

  if (!item) {
    return;
  }

  item.quantity +=
    Number(delta) || 0;

  if (
    item.quantity <=
    0
  ) {

    removeFromCart(
      productId
    );

    return;
  }

  saveCart(
    cart
  );

  renderCartIfPresent();
}

function setQuantity(
  productId,
  value
) {

  const cart =
    getCart();

  const item =
    cart.find(
      (i) =>
        i.id ===
        String(productId)
    );

  if (!item) {
    return;
  }

  item.quantity =
    Math.max(
      1,
      parseInt(
        value,
        10
      ) || 1
    );

  saveCart(
    cart
  );

  renderCartIfPresent();
}

function clearCart() {

  localStorage.removeItem(
    CART_KEY
  );

  updateCartCount();

  renderCartIfPresent();

  showToast(
    "تم تفريغ السلة",
    "info"
  );
}

function goToCheckout() {

  if (
    cartQuantity() ===
    0
  ) {

    showToast(
      "السلة فارغة، أضف منتجات أولاً",
      "error"
    );

    return;
  }

  window.location.href =
    "checkout.html";
}

function goCheckout() {
  goToCheckout();
}

function continueShopping() {

  window.location.href =
    "index.html#products";
}

/* =========================================================
   CART RENDERING
   ========================================================= */

function renderCartIfPresent() {

  if (
    document.getElementById(
      "cartItems"
    )
  ) {
    renderCart();
  }

  updateCartCount();
}

function renderCart() {

  const cart =
    getCart();

  const cartItemsEl =
    document.getElementById(
      "cartItems"
    );

  const emptyCartEl =
    document.getElementById(
      "emptyCart"
    );

  if (!cartItemsEl) {
    return;
  }

  const cartCard =
    cartItemsEl.closest(
      ".cart-card"
    );

  if (
    cart.length ===
    0
  ) {

    cartItemsEl.innerHTML =
      "";

    if (cartCard) {
      cartCard.style.display =
        "none";
    }

    if (emptyCartEl) {
      emptyCartEl.style.display =
        "block";
    }

    updateCartSummary();

    return;
  }

  if (cartCard) {
    cartCard.style.display =
      "block";
  }

  if (emptyCartEl) {
    emptyCartEl.style.display =
      "none";
  }

  cartItemsEl.innerHTML =
    cart
      .map(
        (item) => {

          const lineTotal =
            item.price *
            item.quantity;

          const itemImage =
            item.image ||
            DEFAULT_PRODUCT_IMAGE;

          return `
            <div
              class="cart-item"
              data-id="${escapeHTML(
                item.id
              )}"
            >

              <img
                class="cart-item-image"
                src="${escapeHTML(
                  itemImage
                )}"
                alt="${escapeHTML(
                  item.name
                )}"
                onerror="
                  this.onerror=null;
                  this.src='${DEFAULT_PRODUCT_IMAGE}';
                "
              >

              <div class="cart-item-info">

                <h3>
                  ${escapeHTML(
                    item.name
                  )}
                </h3>

                <div class="unit-price">
                  سعر الوحدة:
                  ${formatPrice(
                    item.price
                  )}
                </div>

                <div class="qty-control">

                  <button
                    type="button"
                    onclick="
                      changeQuantity(
                        '${escapeHTML(
                          item.id
                        )}',
                        -1
                      )
                    "
                    aria-label="تقليل الكمية"
                  >
                    −
                  </button>

                  <input
                    type="number"
                    min="1"
                    value="${item.quantity}"
                    onchange="
                      setQuantity(
                        '${escapeHTML(
                          item.id
                        )}',
                        this.value
                      )
                    "
                    aria-label="كمية المنتج"
                  >

                  <button
                    type="button"
                    onclick="
                      changeQuantity(
                        '${escapeHTML(
                          item.id
                        )}',
                        1
                      )
                    "
                    aria-label="زيادة الكمية"
                  >
                    +
                  </button>

                </div>

              </div>

              <div class="cart-item-side">

                <div class="item-total">
                  ${formatPrice(
                    lineTotal
                  )}
                </div>

                <button
                  type="button"
                  class="remove-link"
                  onclick="
                    removeFromCart(
                      '${escapeHTML(
                        item.id
                      )}'
                    )
                  "
                >
                  🗑 حذف
                </button>

              </div>

            </div>
          `;
        }
      )
      .join("");

  updateCartSummary();
}

function updateCartSummary() {

  const cart =
    getCart();

  const qty =
    cart.reduce(
      (
        sum,
        item
      ) =>
        sum +
        item.quantity,
      0
    );

  const subtotal =
    cartTotal();

  const summaryQuantityEl =
    document.getElementById(
      "summaryQuantity"
    );

  const subtotalEl =
    document.getElementById(
      "subtotal"
    );

  const totalEl =
    document.getElementById(
      "total"
    );

  if (
    summaryQuantityEl
  ) {
    summaryQuantityEl.textContent =
      qty;
  }

  if (subtotalEl) {
    subtotalEl.textContent =
      formatPrice(
        subtotal
      );
  }

  if (totalEl) {
    totalEl.textContent =
      formatPrice(
        subtotal
      );
  }
}

/* =========================================================
   PRODUCTS — SUPABASE
   ========================================================= */

async function loadProducts() {

  const grid =
    document.getElementById(
      "products"
    );

  if (!grid) {
    return;
  }

  try {

    if (
      !window.supabaseClient
    ) {

      throw new Error(
        "Supabase client غير متاح"
      );
    }

    const table =
      window.MENA_CONFIG?.PRODUCTS_TABLE ||
      "products";

    const {
      data,
      error
    } =
      await window.supabaseClient
        .from(table)
        .select("*")
        .order(
          "created_at",
          {
            ascending:
              false
          }
        );

    if (error) {
      throw error;
    }

    ALL_PRODUCTS =
      (data || []).map(
        normalizeProduct
      );

    console.log(
      "MMK Products loaded:",
      ALL_PRODUCTS
    );

    renderProductsGrid();

  } catch (error) {

    console.error(
      "خطأ في تحميل المنتجات:",
      error
    );

    grid.innerHTML = `
      <div class="empty-state">
        تعذر تحميل المنتجات حاليًا،
        حاول مرة أخرى لاحقًا.
      </div>
    `;
  }
}

/* =========================================================
   NORMALIZE PRODUCT
   ========================================================= */

function normalizeProduct(
  product
) {

  return {

    id:
      product.id,

    name:
      product.name ||
      product.title ||
      "منتج",

    description:
      product.description ||
      "",

    price:
      Number(
        product.price
      ) || 0,

    image_url:
      product.image_url ||
      product.image ||
      product.imageUrl ||
      "",

    category:
      product.category ||
      "",

    stock:
      product.stock !==
        undefined &&
      product.stock !==
        null
        ? Number(
            product.stock
          )
        : null
  };
}

/* =========================================================
   PRODUCT FILTERING
   ========================================================= */

function matchesProductCategory(
  product,
  selectedCategory
) {

  const productCategory =
    normalizeProductCategory(
      product.category
    );

  const category =
    normalizeProductCategory(
      selectedCategory
    );

  if (
    category ===
    "all"
  ) {
    return true;
  }

  return (
    productCategory ===
    category
  );
}

/* =========================================================
   RENDER PRODUCTS GRID
   ========================================================= */

function renderProductsGrid() {

  const grid =
    document.getElementById(
      "products"
    );

  if (!grid) {
    return;
  }

  const searchInput =
    document.getElementById(
      "searchInput"
    );

  const query =
    searchInput
      ? searchInput.value
          .trim()
          .toLowerCase()
      : "";

  const selectedCategory =
    normalizeProductCategory(
      CURRENT_CATEGORY
    );

  const filtered =
    ALL_PRODUCTS.filter(
      (product) => {

        const categoryMatch =
          matchesProductCategory(
            product,
            selectedCategory
          );

        const name =
          String(
            product.name ||
              ""
          ).toLowerCase();

        const description =
          String(
            product.description ||
              ""
          ).toLowerCase();

        const searchMatch =
          query === "" ||
          name.includes(
            query
          ) ||
          description.includes(
            query
          );

        return (
          categoryMatch &&
          searchMatch
        );
      }
    );

  console.log(
    "Current category:",
    selectedCategory
  );

  console.log(
    "Filtered products:",
    filtered
  );

  if (
    filtered.length ===
    0
  ) {

    grid.innerHTML = `
      <div
        class="empty-state products-empty-state"
      >
        لا توجد منتجات مطابقة
        للبحث أو هذا القسم حاليًا.
      </div>
    `;

    return;
  }

  grid.innerHTML =
    filtered
      .map(
        (product) => {

          const outOfStock =
            product.stock !==
              null &&
            product.stock <=
              0;

          const categoryName =
            getCategoryDisplayName(
              product.category
            );

          const image =
            product.image_url ||
            DEFAULT_PRODUCT_IMAGE;

          return `
            <div
              class="product-card"
              data-category="${escapeHTML(
                normalizeProductCategory(
                  product.category
                )
              )}"
            >

              <img
                class="product-image"
                src="${escapeHTML(
                  image
                )}"
                alt="${escapeHTML(
                  product.name
                )}"
                onerror="
                  this.onerror=null;
                  this.src='${DEFAULT_PRODUCT_IMAGE}';
                "
              >

              <div class="product-body">

                <span class="product-category">
                  ${escapeHTML(
                    categoryName
                  )}
                </span>

                <h3 class="product-name">
                  ${escapeHTML(
                    product.name
                  )}
                </h3>

                <p class="product-desc">
                  ${escapeHTML(
                    product.description
                  )}
                </p>

                <div class="product-footer">

                  <span class="product-price">
                    ${formatPrice(
                      product.price
                    )}
                  </span>

                  <div class="product-actions">

                    <button
                      type="button"
                      class="icon-btn"
                      title="أضف للسلة"
                      aria-label="أضف المنتج للسلة"
                      ${
                        outOfStock
                          ? "disabled"
                          : ""
                      }
                      onclick="
                        addToCartById(
                          '${escapeHTML(
                            String(
                              product.id
                            )
                          )}'
                        )
                      "
                    >
                      🛒
                    </button>

                    <button
                      type="button"
                      class="btn btn-primary"
                      ${
                        outOfStock
                          ? "disabled"
                          : ""
                      }
                      onclick="
                        buyNow(
                          '${escapeHTML(
                            String(
                              product.id
                            )
                          )}'
                        )
                      "
                    >
                      ${
                        outOfStock
                          ? "غير متوفر"
                          : "شراء الآن"
                      }
                    </button>

                  </div>

                </div>

              </div>

            </div>
          `;
        }
      )
      .join("");
}

/* =========================================================
   FILTER BY CATEGORY
   ========================================================= */

function filterByCategory(
  category
) {

  CURRENT_CATEGORY =
    normalizeProductCategory(
      category
    );

  updateCategoryButtons();

  renderProductsGrid();

  scrollToProducts();
}

/* =========================================================
   FILTER PRODUCTS
   تدعم:
   filterProducts()
   filterProducts("cables")
   ========================================================= */

function filterProducts(
  category
) {

  if (
    category !==
      undefined &&
    category !==
      null
  ) {

    CURRENT_CATEGORY =
      normalizeProductCategory(
        category
      );

    updateCategoryButtons();

    scrollToProducts();
  }

  renderProductsGrid();
}

/* =========================================================
   CATEGORY BUTTONS
   ========================================================= */

function updateCategoryButtons() {

  const selected =
    normalizeProductCategory(
      CURRENT_CATEGORY
    );

  document
    .querySelectorAll(
      ".category-pill"
    )
    .forEach(
      (button) => {

        const buttonCategory =
          normalizeProductCategory(
            button.getAttribute(
              "data-category"
            )
          );

        button.classList.toggle(
          "active",
          buttonCategory ===
            selected
        );
      }
    );
}

/* =========================================================
   SCROLL TO PRODUCTS
   ========================================================= */

function scrollToProducts() {

  const products =
    document.getElementById(
      "products"
    );

  if (!products) {
    return;
  }

  setTimeout(() => {

    products.scrollIntoView({
      behavior:
        "smooth",
      block:
        "start"
    });

  }, 50);
}

/* =========================================================
   ACCOUNT LINK
   ========================================================= */

async function updateAccountLink() {

  const link =
    document.getElementById(
      "accountLink"
    );

  if (
    !link ||
    !window.supabaseClient
  ) {
    return;
  }

  try {

    const {
      data
    } =
      await window.supabaseClient.auth.getSession();

    if (
      data?.session?.user
    ) {

      const meta =
        data.session.user
          .user_metadata ||
        {};

      const fullName =
        meta.full_name ||
        data.session.user.email ||
        "حسابي";

      const firstName =
        String(
          fullName
        )
          .trim()
          .split(/\s+/)[0];

      link.textContent =
        `👤 ${firstName}`;

      link.href =
        "account.html";

    } else {

      link.textContent =
        "👤 تسجيل الدخول";

      link.href =
        "login.html";
    }

  } catch (error) {

    console.warn(
      "تعذر التحقق من جلسة العميل:",
      error
    );
  }
}

/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    /* -----------------------------
       Cart
    ----------------------------- */

    updateCartCount();


    /* -----------------------------
       Category buttons
    ----------------------------- */

    const categoriesList =
      document.getElementById(
        "categoriesList"
      );

    if (
      categoriesList
    ) {

      categoriesList.addEventListener(
        "click",
        (event) => {

          const button =
            event.target.closest(
              ".category-pill"
            );

          if (!button) {
            return;
          }

          const category =
            button.getAttribute(
              "data-category"
            );

          filterProducts(
            category
          );
        }
      );
    }


    /* -----------------------------
       Products
    ----------------------------- */

    if (
      document.getElementById(
        "products"
      )
    ) {

      loadProducts();
    }


    /* -----------------------------
       Cart page
    ----------------------------- */

    if (
      document.getElementById(
        "cartItems"
      )
    ) {

      renderCart();
    }


    /* -----------------------------
       Account
    ----------------------------- */

    updateAccountLink();

  }
);
