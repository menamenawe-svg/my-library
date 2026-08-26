/* =========================================================
   product.js
   صفحة تفاصيل المنتج - MMK Store
   متوافق مع Supabase + السلة الحالية
   ========================================================= */


/* =========================================================
   Placeholder محلي
   ========================================================= */

function createProductPlaceholder() {

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="500"
         height="500"
         viewBox="0 0 500 500">

      <rect
        width="500"
        height="500"
        rx="30"
        fill="#eef2f7"
      />

      <text
        x="250"
        y="285"
        text-anchor="middle"
        font-size="130">
        🛍️
      </text>

    </svg>
  `;

  return (
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(svg)
  );
}


const PRODUCT_PLACEHOLDER =
  createProductPlaceholder();


/* =========================================================
   تنظيف الصورة
   ========================================================= */

function normalizeProductImage(image) {

  if (!image) {
    return PRODUCT_PLACEHOLDER;
  }

  const value =
    String(image).trim();

  if (!value) {
    return PRODUCT_PLACEHOLDER;
  }

  if (
    value.includes("via.placeholder.com") ||
    value.includes("placeholder.com") ||
    value.includes("placehold.co") ||
    value.includes("placehold.it")
  ) {
    return PRODUCT_PLACEHOLDER;
  }

  return value;
}


/* =========================================================
   حماية HTML
   ========================================================= */

function escapeProductHTML(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   السعر
   ========================================================= */

function formatProductPrice(value) {

  return (
    (Number(value) || 0)
      .toLocaleString("ar-EG") +
    " ج.م"
  );
}


/* =========================================================
   الحصول على ID المنتج من الرابط
   ========================================================= */

function getProductIdFromURL() {

  const params =
    new URLSearchParams(
      window.location.search
    );

  return params.get("id");
}


/* =========================================================
   الحصول على اسم جدول المنتجات
   ========================================================= */

function getProductsTableName() {

  const config =
    window.MMK_CONFIG ||
    window.MENA_CONFIG ||
    {};

  return (
    config.PRODUCTS_TABLE ||
    "products"
  );
}


/* =========================================================
   البحث عن المنتج في Supabase
   ========================================================= */

async function loadProduct() {

  const productId =
    getProductIdFromURL();

  const loading =
    document.getElementById(
      "productLoading"
    );

  const errorBox =
    document.getElementById(
      "productError"
    );

  const details =
    document.getElementById(
      "productDetails"
    );


  if (!productId) {

    loading.hidden = true;
    errorBox.hidden = false;

    errorBox.textContent =
      "لم يتم تحديد المنتج.";

    return;
  }


  if (!window.supabaseClient) {

    loading.hidden = true;
    errorBox.hidden = false;

    errorBox.textContent =
      "تعذر الاتصال بقاعدة البيانات.";

    return;
  }


  try {

    const table =
      getProductsTableName();


    const {
      data,
      error
    } =
      await window.supabaseClient
        .from(table)
        .select("*")
        .eq("id", productId)
        .single();


    if (error) {

      console.error(
        "Product load error:",
        error
      );

      throw error;
    }


    if (!data) {
      throw new Error(
        "المنتج غير موجود"
      );
    }


    renderProduct(data);


  } catch (err) {

    console.error(
      "تعذر تحميل المنتج:",
      err
    );

    loading.hidden = true;
    errorBox.hidden = false;

    errorBox.textContent =
      "تعذر العثور على المنتج أو تحميل بياناته.";
  }
}


/* =========================================================
   عرض المنتج
   ========================================================= */

function renderProduct(product) {

  const loading =
    document.getElementById(
      "productLoading"
    );

  const details =
    document.getElementById(
      "productDetails"
    );


  const image =
    product.image ||
    product.img ||
    product.thumbnail ||
    product.image_url ||
    "";


  const name =
    product.name ||
    product.title ||
    product.product_name ||
    "منتج";


  const description =
    product.description ||
    product.details ||
    product.product_description ||
    "لا يوجد وصف متاح لهذا المنتج.";


  const price =
    product.price ||
    product.sale_price ||
    0;


  const category =
    product.category ||
    product.category_name ||
    product.type ||
    "منتج";


  const productImage =
    document.getElementById(
      "productImage"
    );


  const productTitle =
    document.getElementById(
      "productTitle"
    );


  const productPrice =
    document.getElementById(
      "productPrice"
    );


  const productCategory =
    document.getElementById(
      "productCategory"
    );


  const productDescription =
    document.getElementById(
      "productDescription"
    );


  const productStock =
    document.getElementById(
      "productStock"
    );


  if (productImage) {

    productImage.src =
      normalizeProductImage(
        image
      );

    productImage.alt =
      name;

    productImage.onerror =
      () => {

        productImage.src =
          PRODUCT_PLACEHOLDER;

      };
  }


  if (productTitle) {

    productTitle.textContent =
      name;

  }


  if (productPrice) {

    productPrice.textContent =
      formatProductPrice(
        price
      );

  }


  if (productCategory) {

    productCategory.textContent =
      category;

  }


  if (productDescription) {

    /*
     * textContent مهم هنا حتى يظهر
     * الوصف كامل بدون HTML ضار.
     *
     * white-space: pre-wrap
     * في CSS يحافظ على السطور.
     */

    productDescription.textContent =
      description;

  }


  if (productStock) {

    const stock =
      product.stock ??
      product.quantity ??
      product.inventory;


    if (
      stock !== undefined &&
      stock !== null &&
      stock !== ""
    ) {

      if (
        Number(stock) <= 0
      ) {

        productStock.textContent =
          "غير متوفر حاليًا";

        productStock.style.background =
          "#fef2f2";

        productStock.style.color =
          "#dc2626";

      } else {

        productStock.textContent =
          `متوفر — الكمية المتاحة: ${stock}`;

      }

    } else {

      productStock.textContent =
        "متوفر";

    }
  }


  document.title =
    `${name} - MMK Store`;


  window.CURRENT_PRODUCT =
    product;


  loading.hidden = true;
  details.hidden = false;


  setupProductActions();
}


/* =========================================================
   كمية المنتج
   ========================================================= */

function setupQuantityControls() {

  const input =
    document.getElementById(
      "productQuantity"
    );

  const decrease =
    document.getElementById(
      "decreaseQuantity"
    );

  const increase =
    document.getElementById(
      "increaseQuantity"
    );


  if (
    !input ||
    !decrease ||
    !increase
  ) {
    return;
  }


  decrease.addEventListener(
    "click",
    () => {

      let value =
        Number(input.value) || 1;

      value =
        Math.max(
          1,
          value - 1
        );

      input.value =
        value;
    }
  );


  increase.addEventListener(
    "click",
    () => {

      let value =
        Number(input.value) || 1;

      value =
        Math.min(
          99,
          value + 1
        );

      input.value =
        value;
    }
  );


  input.addEventListener(
    "input",
    () => {

      let value =
        Number(input.value) || 1;

      value =
        Math.max(
          1,
          Math.min(
            99,
            value
          )
        );

      input.value =
        value;
    }
  );
}


/* =========================================================
   السلة
   ========================================================= */

function getProductCart() {

  try {

    /*
     * نستخدم نفس getCart الموجودة
     * في script.js حتى تكون السلة
     * مشتركة بين كل صفحات الموقع.
     */

    if (
      typeof window.getCart ===
      "function"
    ) {

      const cart =
        window.getCart();

      if (
        Array.isArray(cart)
      ) {
        return cart;
      }
    }


    /*
     * نفس مفتاح السلة الموجود
     * في script.js:
     *
     * const CART_KEY =
     *   ... || "libraryCart";
     */

    const cartKey =
      (
        window.MENA_CONFIG &&
        window.MENA_CONFIG.CART_KEY
      ) ||
      "libraryCart";


    const saved =
      localStorage.getItem(
        cartKey
      );


    if (!saved) {
      return [];
    }


    const cart =
      JSON.parse(saved);


    return Array.isArray(cart)
      ? cart
      : [];


  } catch (error) {

    console.error(
      "Cart read error:",
      error
    );

    return [];
  }
}


/* =========================================================
   حفظ السلة
   ========================================================= */

function saveProductCart(cart) {

  /*
   * نفس CART_KEY المستخدم في
   * script.js لضمان عدم إنشاء
   * سلة مختلفة.
   */

  const cartKey =
    (
      window.MENA_CONFIG &&
      window.MENA_CONFIG.CART_KEY
    ) ||
    "libraryCart";


  localStorage.setItem(
    cartKey,
    JSON.stringify(cart)
  );
}


/* =========================================================
   إضافة المنتج للسلة
   ========================================================= */

function addProductToCart() {

  const product =
    window.CURRENT_PRODUCT;


  if (!product) {

    showProductToast(
      "تعذر إضافة المنتج.",
      "error"
    );

    return;
  }


  const quantityInput =
    document.getElementById(
      "productQuantity"
    );


  const quantity =
    Math.max(
      1,
      Number(
        quantityInput?.value ||
        1
      )
    );


  /*
   * نستخدم نفس بيانات المنتج
   * بدون تغيير البيانات الأصلية.
   */

  const productId =
    product.id;


  const name =
    product.name ||
    product.title ||
    product.product_name ||
    "منتج";


  const price =
    Number(
      product.price ||
      product.sale_price ||
      0
    );


  const image =
    product.image ||
    product.img ||
    product.thumbnail ||
    product.image_url ||
    "";


  const cart =
    getProductCart();


  const existingIndex =
    cart.findIndex(
      item =>
        String(
          item?.id
        ) ===
        String(
          productId
        )
    );


  if (
    existingIndex !==
    -1
  ) {

    const oldQuantity =
      Number(
        cart[existingIndex]
          ?.quantity ||
        1
      );


    cart[existingIndex]
      .quantity =
        oldQuantity +
        quantity;


  } else {

    cart.push({

      ...product,

      id:
        productId,

      name:
        name,

      price:
        price,

      image:
        image,

      quantity:
        quantity

    });
  }


  saveProductCart(cart);


  /*
   * تحديث عداد السلة
   */

  if (
    typeof window.updateCartCount ===
    "function"
  ) {

    window.updateCartCount();

  }


  /*
   * بعض نسخ script.js قد تستخدم
   * updateCartBadge بدلًا منه.
   */

  if (
    typeof window.updateCartBadge ===
    "function"
  ) {

    window.updateCartBadge();

  }


  showProductToast(
    "تمت إضافة المنتج إلى السلة 🛒",
    "success"
  );
}


/* =========================================================
   رسالة بسيطة
   ========================================================= */

function showProductToast(
  message,
  type = "info"
) {

  if (
    typeof window.showMessage ===
    "function"
  ) {

    window.showMessage(
      message
    );

    return;
  }


  const container =
    document.getElementById(
      "toastContainer"
    );


  if (!container) {

    alert(message);

    return;
  }


  const toast =
    document.createElement(
      "div"
    );


  toast.className =
    `toast-message ${type}`;


  toast.textContent =
    message;


  container.appendChild(
    toast
  );


  setTimeout(
    () => {

      toast.remove();

    },
    3000
  );
}


/* =========================================================
   أزرار المنتج
   ========================================================= */

function setupProductActions() {

  setupQuantityControls();


  const addButton =
    document.getElementById(
      "addProductBtn"
    );


  if (addButton) {

    /*
     * نمنع تسجيل الحدث أكثر من مرة.
     */

    if (
      addButton.dataset.ready ===
      "true"
    ) {
      return;
    }


    addButton.dataset.ready =
      "true";


    addButton.addEventListener(
      "click",
      addProductToCart
    );
  }
}


/* =========================================================
   تشغيل الصفحة
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadProduct();

  }
);