/* =========================================================
   admin.js — لوحة تحكم مكتبة مينا
   ========================================================= */

let ADMIN_PRODUCTS = [];
let ADMIN_ORDERS = [];

/* =========================================================
   بيانات الأدمن
   مهم: ضع هنا إيميل حساب الأدمن الموجود في Supabase
   ========================================================= */

const ADMIN_EMAIL = "admin@menalibrary.com";

/* =========================================================
   حالات الطلبات
   ========================================================= */

const ORDER_STATUS_TEXT = {
  pending_review: "قيد المراجعة",
  payment_verified: "تم تأكيد الدفع",
  preparing: "جاري التجهيز",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  rejected: "مرفوض",
};

const PAYMENT_STATUS_TEXT = {
  pending_verification: "قيد المراجعة",
  verified: "تم التأكيد",
  rejected: "مرفوض",
};

function getOrderStatusText(status) {
  return ORDER_STATUS_TEXT[status] || status || "—";
}

function getPaymentStatusText(status) {
  return PAYMENT_STATUS_TEXT[status] || status || "—";
}

/* =========================================================
   إشعارات لوحة التحكم
   ========================================================= */

function showAdminMessage(message, type = "success") {
  const box = document.getElementById("adminMessage");

  if (!box) {
    console.warn("adminMessage غير موجود في الصفحة:", message);
    return;
  }

  box.style.display = "block";
  box.className =
    `status-box ${type === "error" ? "error" : "success"}`;
  box.textContent = message;

  setTimeout(() => {
    box.style.display = "none";
  }, 3500);
}

/* =========================================================
   التحقق من جلسة الأدمن
   ========================================================= */

async function checkAdminSession() {
  try {
    if (!window.supabaseClient) {
      console.error("Supabase client غير متاح");
      window.location.href = "login.html";
      return null;
    }

    const { data, error } =
      await window.supabaseClient.auth.getSession();

    if (error) {
      console.error("Session Error:", error);
      window.location.href = "login.html";
      return null;
    }

    const session = data?.session;

    if (!session || !session.user) {
      window.location.href = "login.html";
      return null;
    }

    const userEmail =
      String(session.user.email || "")
        .trim()
        .toLowerCase();

    const adminEmail =
      String(ADMIN_EMAIL || "")
        .trim()
        .toLowerCase();

    if (!adminEmail || adminEmail === "ضع-ايميل-الادمن-هنا") {
      console.error(
        "لم يتم تحديد ADMIN_EMAIL داخل admin.js"
      );

      alert(
        "لم يتم تحديد إيميل الأدمن داخل ملف admin.js"
      );

      await window.supabaseClient.auth.signOut();

      window.location.href = "login.html";
      return null;
    }

    if (userEmail !== adminEmail) {
      alert("هذا الحساب غير مصرح له بدخول لوحة التحكم.");

      await window.supabaseClient.auth.signOut();

      window.location.href = "login.html";
      return null;
    }

    return session;

  } catch (error) {
    console.error(
      "خطأ في التحقق من جلسة الأدمن:",
      error
    );

    window.location.href = "login.html";
    return null;
  }
}

/* =========================================================
   تسجيل الخروج
   ========================================================= */

async function logoutAdmin() {
  try {
    await window.supabaseClient.auth.signOut();
  } catch (error) {
    console.error("Logout Error:", error);
  }

  window.location.href = "login.html";
}

/* =========================================================
   التبويبات
   ========================================================= */

function setupTabs() {
  const tabs =
    document.querySelectorAll(".admin-tab");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {

      tabs.forEach((t) =>
        t.classList.remove("active")
      );

      tab.classList.add("active");

      const productsTab =
        document.getElementById("tabProducts");

      const ordersTab =
        document.getElementById("tabOrders");

      if (productsTab) {
        productsTab.style.display =
          tab.dataset.tab === "products"
            ? "block"
            : "none";
      }

      if (ordersTab) {
        ordersTab.style.display =
          tab.dataset.tab === "orders"
            ? "block"
            : "none";
      }

      if (
        tab.dataset.tab === "orders" &&
        ADMIN_ORDERS.length === 0
      ) {
        loadOrders();
      }
    });
  });
}

/* =========================================================
   المنتجات — تحميل
   ========================================================= */

async function loadProducts() {
  const grid =
    document.getElementById("adminProducts");

  if (!grid) {
    console.error(
      "adminProducts غير موجود في الصفحة"
    );
    return;
  }

  try {

    if (!window.supabaseClient) {
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
        .order("created_at", {
          ascending: false
        });

    if (error) {
      throw error;
    }

    ADMIN_PRODUCTS = data || [];

    renderProducts();

  } catch (err) {

    console.error(
      "خطأ في تحميل المنتجات:",
      err
    );

    grid.innerHTML =
      `<div class="empty-state">
        تعذر تحميل المنتجات
      </div>`;
  }
}

/* =========================================================
   عرض المنتجات
   ========================================================= */

function renderProducts() {

  const grid =
    document.getElementById("adminProducts");

  if (!grid) return;

  if (ADMIN_PRODUCTS.length === 0) {

    grid.innerHTML =
      `<div class="empty-state">
        لا توجد منتجات، ابدأ بإضافة منتج جديد
      </div>`;

    return;
  }

  grid.innerHTML =
    ADMIN_PRODUCTS.map((p) => {

      const image =
        p.image_url ||
        p.image ||
        p.imageUrl ||
        "https://via.placeholder.com/300";

      const stock =
        p.stock !== undefined &&
        p.stock !== null
          ? p.stock
          : "—";

      const lowStock =
        p.stock !== undefined &&
        p.stock !== null &&
        Number(p.stock) <= 3;

      return `
        <div class="admin-product-card">

          <img
            src="${escapeHTML(image)}"
            alt="${escapeHTML(p.name || "منتج")}"
            onerror="this.src='https://via.placeholder.com/300'"
          >

          <div class="admin-product-body">

            <span class="cat">
              ${escapeHTML(p.category || "عام")}
            </span>

            <h4>
              ${escapeHTML(p.name || "منتج")}
            </h4>

            <div class="price-row">

              <span class="price">
                ${formatPrice(p.price)}
              </span>

              <span class="stock ${lowStock ? "low" : ""}">
                المخزون:
                ${escapeHTML(String(stock))}
              </span>

            </div>

            <div class="admin-product-actions">

              <button
                type="button"
                class="btn-edit"
                onclick="editProduct('${escapeHTML(String(p.id))}')"
              >
                ✏️ تعديل
              </button>

              <button
                type="button"
                class="btn-delete"
                onclick="deleteProduct('${escapeHTML(String(p.id))}')"
              >
                🗑 حذف
              </button>

            </div>

          </div>

        </div>
      `;

    }).join("");
}

/* =========================================================
   نموذج المنتج
   ========================================================= */

function openProductForm(product = null) {

  const box =
    document.getElementById("productFormBox");

  const form =
    document.getElementById("productForm");

  if (!box || !form) {
    console.error(
      "نموذج المنتج غير موجود"
    );
    return;
  }

  form.reset();

  const title =
    document.getElementById("productFormTitle");

  const id =
    document.getElementById("productId");

  const name =
    document.getElementById("productName");

  const price =
    document.getElementById("productPrice");

  const stock =
    document.getElementById("productStock");

  const category =
    document.getElementById("productCategory");

  const description =
    document.getElementById(
      "productDescription"
    );

  const imageUrl =
    document.getElementById(
      "productImageUrl"
    );

  if (title) {
    title.textContent =
      product
        ? "تعديل المنتج"
        : "إضافة منتج جديد";
  }

  if (id) {
    id.value =
      product ? product.id : "";
  }

  if (name) {
    name.value =
      product ? product.name || "" : "";
  }

  if (price) {
    price.value =
      product ? product.price : "";
  }

  if (stock) {
    stock.value =
      product &&
      product.stock !== null &&
      product.stock !== undefined
        ? product.stock
        : "";
  }

  if (category) {
    category.value =
      product
        ? product.category || "إكسسوارات"
        : "إكسسوارات";
  }

  if (description) {
    description.value =
      product
        ? product.description || ""
        : "";
  }

  if (imageUrl) {
    imageUrl.value =
      product
        ? product.image_url ||
          product.image ||
          product.imageUrl ||
          ""
        : "";
  }

  box.style.display = "flex";
}

function closeProductForm() {

  const box =
    document.getElementById("productFormBox");

  if (box) {
    box.style.display = "none";
  }
}

function editProduct(productId) {

  const product =
    ADMIN_PRODUCTS.find(
      (p) =>
        String(p.id) ===
        String(productId)
    );

  if (!product) {

    showAdminMessage(
      "تعذر العثور على المنتج",
      "error"
    );

    return;
  }

  openProductForm(product);
}

/* =========================================================
   رفع صورة المنتج
   ========================================================= */

async function uploadProductImage(file) {

  if (!file) {
    return null;
  }

  const ext =
    file.name.split(".").pop() || "jpg";

  const path =
    `products/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

  try {

    const {
      data,
      error
    } =
      await window.supabaseClient.storage
        .from(
          window.MENA_CONFIG
            ?.PRODUCT_IMAGES_BUCKET ||
          "product-images"
        )
        .upload(
          path,
          file,
          {
            upsert: true
          }
        );

    if (error) {
      throw error;
    }

    const {
      data: publicUrlData
    } =
      window.supabaseClient.storage
        .from(
          window.MENA_CONFIG
            ?.PRODUCT_IMAGES_BUCKET ||
          "product-images"
        )
        .getPublicUrl(
          data.path
        );

    return (
      publicUrlData?.publicUrl ||
      null
    );

  } catch (error) {

    console.error(
      "خطأ في رفع صورة المنتج:",
      error
    );

    showAdminMessage(
      "تعذر رفع صورة المنتج",
      "error"
    );

    return null;
  }
}

/* =========================================================
   حفظ المنتج
   ========================================================= */

async function handleProductSubmit(e) {

  e.preventDefault();

  const saveBtn =
    document.getElementById(
      "saveProductButton"
    );

  if (!saveBtn) {
    console.error(
      "saveProductButton غير موجود"
    );
    return;
  }

  const originalText =
    saveBtn.textContent;

  saveBtn.disabled = true;

  saveBtn.innerHTML =
    `<span class="spinner"></span>
     جاري الحفظ...`;

  try {

    const id =
      document.getElementById(
        "productId"
      )?.value || "";

    const name =
      document.getElementById(
        "productName"
      )?.value.trim() || "";

    const price =
      parseFloat(
        document.getElementById(
          "productPrice"
        )?.value
      );

    const stockRaw =
      document.getElementById(
        "productStock"
      )?.value || "";

    const stock =
      stockRaw === ""
        ? null
        : parseInt(stockRaw, 10);

    const category =
      document.getElementById(
        "productCategory"
      )?.value || "عام";

    const description =
      document.getElementById(
        "productDescription"
      )?.value.trim() || "";

    let imageUrl =
      document.getElementById(
        "productImageUrl"
      )?.value.trim() || "";

    if (!name || Number.isNaN(price)) {

      showAdminMessage(
        "الرجاء إدخال اسم المنتج والسعر بشكل صحيح",
        "error"
      );

      return;
    }

    const fileInput =
      document.getElementById(
        "productImage"
      );

    if (
      fileInput &&
      fileInput.files &&
      fileInput.files[0]
    ) {

      const uploadedUrl =
        await uploadProductImage(
          fileInput.files[0]
        );

      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }

    const payload = {
      name,
      price,
      stock,
      category,
      description,
      image_url: imageUrl,
    };

    const table =
      window.MENA_CONFIG?.PRODUCTS_TABLE ||
      "products";

    let error = null;

    if (id) {

      ({
        error
      } =
        await window.supabaseClient
          .from(table)
          .update(payload)
          .eq("id", id));

    } else {

      ({
        error
      } =
        await window.supabaseClient
          .from(table)
          .insert([payload]));

    }

    if (error) {
      throw error;
    }

    showAdminMessage(
      id
        ? "تم تعديل المنتج بنجاح"
        : "تم إضافة المنتج بنجاح",
      "success"
    );

    closeProductForm();

    await loadProducts();

  } catch (err) {

    console.error(
      "خطأ في حفظ المنتج:",
      err
    );

    showAdminMessage(
      err?.message ||
        "حدث خطأ أثناء حفظ المنتج",
      "error"
    );

  } finally {

    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
  }
}

/* =========================================================
   حذف المنتج
   ========================================================= */

async function deleteProduct(productId) {

  if (
    !confirm(
      "هل أنت متأكد من حذف هذا المنتج؟"
    )
  ) {
    return;
  }

  try {

    const table =
      window.MENA_CONFIG?.PRODUCTS_TABLE ||
      "products";

    const {
      error
    } =
      await window.supabaseClient
        .from(table)
        .delete()
        .eq("id", productId);

    if (error) {
      throw error;
    }

    showAdminMessage(
      "تم حذف المنتج بنجاح",
      "success"
    );

    await loadProducts();

  } catch (err) {

    console.error(
      "خطأ في حذف المنتج:",
      err
    );

    showAdminMessage(
      err?.message ||
        "تعذر حذف المنتج",
      "error"
    );
  }
}

/* =========================================================
   الطلبات — تحميل
   ========================================================= */

async function loadOrders() {

  const container =
    document.getElementById(
      "adminOrders"
    );

  if (!container) {
    console.error(
      "adminOrders غير موجود"
    );
    return;
  }

  try {

    const table =
      window.MENA_CONFIG?.ORDERS_TABLE ||
      "orders";

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
            ascending: false
          }
        );

    if (error) {
      throw error;
    }

    ADMIN_ORDERS = data || [];

    renderOrders();

  } catch (err) {

    console.error(
      "خطأ في تحميل الطلبات:",
      err
    );

    container.innerHTML =
      `<div class="empty-state">
        تعذر تحميل الطلبات
      </div>`;
  }
}

/* =========================================================
   عرض الطلبات
   ========================================================= */

function renderOrders() {

  const container =
    document.getElementById(
      "adminOrders"
    );

  if (!container) {
    return;
  }

  if (
    ADMIN_ORDERS.length === 0
  ) {

    container.innerHTML =
      `<div class="empty-state">
        لا توجد طلبات حتى الآن
      </div>`;

    return;
  }

  container.innerHTML =
    ADMIN_ORDERS
      .map(
        (order) =>
          createOrderHTML(order)
      )
      .join("");
}

/* =========================================================
   منتجات الطلب
   ========================================================= */

function renderOrderProducts(products) {

  let items = products;

  if (typeof items === "string") {

    try {
      items = JSON.parse(items);
    } catch {
      items = [];
    }
  }

  if (!Array.isArray(items)) {
    items = [];
  }

  if (items.length === 0) {
    return `
      <div>
        لا توجد منتجات مرفقة بالطلب
      </div>
    `;
  }

  return items
    .map(
      (item) => `
        <div>
          <span>
            ${escapeHTML(
              item.name || "منتج"
            )}
            ×
            ${escapeHTML(
              String(
                item.quantity || 1
              )
            )}
          </span>

          <span>
            ${formatPrice(
              (Number(item.price) || 0) *
              (Number(item.quantity) || 1)
            )}
          </span>
        </div>
      `
    )
    .join("");
}

/* =========================================================
   خيارات حالة الطلب
   ========================================================= */

function createStatusOptions(
  currentStatus
) {

  return Object.keys(
    ORDER_STATUS_TEXT
  )
    .map(
      (key) => `
        <option
          value="${key}"
          ${
            key === currentStatus
              ? "selected"
              : ""
          }
        >
          ${ORDER_STATUS_TEXT[key]}
        </option>
      `
    )
    .join("");
}

/* =========================================================
   إنشاء كارت الطلب
   ========================================================= */

function createOrderHTML(order) {

  const status =
    order.order_status ||
    order.status ||
    "pending_review";

  const paymentStatus =
    order.payment_status ||
    "pending_verification";

  const createdAt =
    order.created_at
      ? new Date(
          order.created_at
        ).toLocaleString(
          "ar-EG"
        )
      : "—";

  const receiptUrl =
    order.receipt_url ||
    order.receipt_image ||
    "";

  const transactionNumber =
    order.transaction_number ||
    order.transaction_id ||
    "";

  return `
    <div
      class="order-card"
      data-order-id="${escapeHTML(
        String(order.id)
      )}"
    >

      <div class="order-card-header">

        <div>

          <div class="order-num">
            🧾
            ${escapeHTML(
              order.order_number ||
              order.id
            )}
          </div>

          <div class="order-date">
            ${escapeHTML(
              createdAt
            )}
          </div>

        </div>

        <div
          style="
            display:flex;
            gap:8px;
            flex-wrap:wrap;
          "
        >

          <span
            class="status-badge ${escapeHTML(
              status
            )}"
          >
            ${escapeHTML(
              getOrderStatusText(
                status
              )
            )}
          </span>

          <span
            class="status-badge ${escapeHTML(
              paymentStatus
            )}"
          >
            ${escapeHTML(
              getPaymentStatusText(
                paymentStatus
              )
            )}
          </span>

        </div>

      </div>

      <div class="order-customer-info">

        <div>
          <div class="item-label">
            العميل
          </div>

          <div class="item-value">
            ${escapeHTML(
              order.customer_name ||
              "—"
            )}
          </div>
        </div>

        <div>
          <div class="item-label">
            الهاتف
          </div>

          <div class="item-value">
            ${escapeHTML(
              order.customer_phone ||
              "—"
            )}
          </div>
        </div>

        <div>
          <div class="item-label">
            المحافظة
          </div>

          <div class="item-value">
            ${escapeHTML(
              order.governorate ||
              "—"
            )}
          </div>
        </div>

        <div>
          <div class="item-label">
            المنطقة
          </div>

          <div class="item-value">
            ${escapeHTML(
              order.area || ""
            )}
            ${escapeHTML(
              order.locality || ""
            )}
          </div>
        </div>

        <div>
          <div class="item-label">
            العنوان
          </div>

          <div class="item-value">
            ${escapeHTML(
              order.address ||
              "—"
            )}
          </div>
        </div>

        <div>
          <div class="item-label">
            طريقة الدفع
          </div>

          <div class="item-value">
            ${escapeHTML(
              order.payment_method ||
              "—"
            )}
          </div>
        </div>

      </div>

      <div class="order-products-list">
        ${renderOrderProducts(
          order.products
        )}
      </div>

      <div class="order-card-footer">

        <div class="order-totals">

          المنتجات:
          ${formatPrice(
            order.subtotal
          )}

          +

          الشحن:
          ${formatPrice(
            order.shipping ??
            order.shipping_price ??
            order.shipping_cost
          )}

          &nbsp;=&nbsp;

          <strong>
            ${formatPrice(
              order.total
            )}
          </strong>

          ${
            receiptUrl
              ? `
                <br>
                <a
                  class="receipt-link"
                  href="${escapeHTML(
                    receiptUrl
                  )}"
                  target="_blank"
                  rel="noopener"
                >
                  📎 عرض إيصال الدفع
                </a>
              `
              : ""
          }

          ${
            transactionNumber
              ? `
                <br>
                رقم العملية:
                ${escapeHTML(
                  transactionNumber
                )}
              `
              : ""
          }

        </div>

        <div class="order-status-controls">

          <select
            aria-label="حالة الطلب"
            onchange="
              updateOrderStatus(
                '${escapeHTML(
                  String(order.id)
                )}',
                this.value
              )
            "
          >
            ${createStatusOptions(
              status
            )}
          </select>

          <button
            type="button"
            class="btn-delete"
            style="
              padding:8px 14px;
              border-radius:8px;
            "
            onclick="
              deleteOrder(
                '${escapeHTML(
                  String(order.id)
                )}'
              )
            "
          >
            🗑 حذف
          </button>

        </div>

      </div>

    </div>
  `;
}

/* =========================================================
   تحديث حالة الطلب
   ========================================================= */

async function updateOrderStatus(
  orderId,
  newStatus
) {

  try {

    const table =
      window.MENA_CONFIG?.ORDERS_TABLE ||
      "orders";

    const payload = {
      order_status: newStatus,
      status: newStatus,
    };

    if (
      newStatus ===
      "payment_verified"
    ) {
      payload.payment_status =
        "verified";
    }

    else if (
      newStatus ===
      "rejected"
    ) {
      payload.payment_status =
        "rejected";
    }

    const {
      error
    } =
      await window.supabaseClient
        .from(table)
        .update(payload)
        .eq(
          "id",
          orderId
        );

    if (error) {
      throw error;
    }

    showAdminMessage(
      "تم تحديث حالة الطلب بنجاح",
      "success"
    );

    const order =
      ADMIN_ORDERS.find(
        (o) =>
          String(o.id) ===
          String(orderId)
      );

    if (order) {

      order.order_status =
        newStatus;

      order.status =
        newStatus;

      if (
        payload.payment_status
      ) {
        order.payment_status =
          payload.payment_status;
      }
    }

    renderOrders();

  } catch (err) {

    console.error(
      "خطأ في تحديث حالة الطلب:",
      err
    );

    showAdminMessage(
      err?.message ||
        "تعذر تحديث حالة الطلب",
      "error"
    );
  }
}

/* =========================================================
   حذف الطلب
   ========================================================= */

async function deleteOrder(
  orderId
) {

  if (
    !confirm(
      "هل أنت متأكد من حذف هذا الطلب؟"
    )
  ) {
    return;
  }

  try {

    const table =
      window.MENA_CONFIG?.ORDERS_TABLE ||
      "orders";

    const {
      error
    } =
      await window.supabaseClient
        .from(table)
        .delete()
        .eq(
          "id",
          orderId
        );

    if (error) {
      throw error;
    }

    showAdminMessage(
      "تم حذف الطلب بنجاح",
      "success"
    );

    await loadOrders();

  } catch (err) {

    console.error(
      "خطأ في حذف الطلب:",
      err
    );

    showAdminMessage(
      err?.message ||
        "تعذر حذف الطلب",
      "error"
    );
  }
}

/* =========================================================
   التهيئة
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    const session =
      await checkAdminSession();

    if (!session) {
      return;
    }

    setupTabs();

    await loadProducts();

    const logoutButton =
      document.getElementById(
        "logoutButton"
      );

    const addProductButton =
      document.getElementById(
        "addProductButton"
      );

    const productFormClose =
      document.getElementById(
        "productFormClose"
      );

    const cancelProductButton =
      document.getElementById(
        "cancelProductButton"
      );

    const productForm =
      document.getElementById(
        "productForm"
      );

    const productFormBox =
      document.getElementById(
        "productFormBox"
      );

    if (logoutButton) {
      logoutButton.addEventListener(
        "click",
        logoutAdmin
      );
    }

    if (addProductButton) {
      addProductButton.addEventListener(
        "click",
        () => openProductForm(null)
      );
    }

    if (productFormClose) {
      productFormClose.addEventListener(
        "click",
        closeProductForm
      );
    }

    if (cancelProductButton) {
      cancelProductButton.addEventListener(
        "click",
        closeProductForm
      );
    }

    if (productForm) {
      productForm.addEventListener(
        "submit",
        handleProductSubmit
      );
    }

    if (productFormBox) {
      productFormBox.addEventListener(
        "click",
        (e) => {
          if (
            e.target.id ===
            "productFormBox"
          ) {
            closeProductForm();
          }
        }
      );
    }
  }
);
