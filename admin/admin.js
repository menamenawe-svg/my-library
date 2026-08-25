/* =========================================================
   admin.js — لوحة تحكم مكتبة مينا
   ========================================================= */

let ADMIN_PRODUCTS = [];
let ADMIN_ORDERS = [];

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

/* ---------------------------------------------------------
   إشعارات لوحة التحكم
   --------------------------------------------------------- */

function showAdminMessage(message, type = "success") {
  const box = document.getElementById("adminMessage");
  box.style.display = "block";
  box.className = `status-box ${type === "error" ? "error" : "success"}`;
  box.textContent = message;
  setTimeout(() => (box.style.display = "none"), 3500);
}

/* ---------------------------------------------------------
   الجلسة وتسجيل الدخول/الخروج
   --------------------------------------------------------- */

async function checkAdminSession() {
  const { data } = await window.supabaseClient.auth.getSession();
  if (!data?.session) {
    window.location.href = "login.html";
    return null;
  }
  return data.session;
}

async function logoutAdmin() {
  await window.supabaseClient.auth.signOut();
  window.location.href = "login.html";
}

/* ---------------------------------------------------------
   التبويبات
   --------------------------------------------------------- */

function setupTabs() {
  const tabs = document.querySelectorAll(".admin-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      document.getElementById("tabProducts").style.display = tab.dataset.tab === "products" ? "block" : "none";
      document.getElementById("tabOrders").style.display = tab.dataset.tab === "orders" ? "block" : "none";

      if (tab.dataset.tab === "orders" && ADMIN_ORDERS.length === 0) {
        loadOrders();
      }
    });
  });
}

/* ---------------------------------------------------------
   المنتجات — تحميل وعرض
   --------------------------------------------------------- */

async function loadProducts() {
  const grid = document.getElementById("adminProducts");
  try {
    const { data, error } = await window.supabaseClient
      .from(window.MENA_CONFIG.PRODUCTS_TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    ADMIN_PRODUCTS = data || [];
    renderProducts();
  } catch (err) {
    console.error("خطأ في تحميل المنتجات:", err);
    grid.innerHTML = `<div class="empty-state">تعذر تحميل المنتجات</div>`;
  }
}

function renderProducts() {
  const grid = document.getElementById("adminProducts");

  if (ADMIN_PRODUCTS.length === 0) {
    grid.innerHTML = `<div class="empty-state">لا توجد منتجات، ابدأ بإضافة منتج جديد</div>`;
    return;
  }

  grid.innerHTML = ADMIN_PRODUCTS.map((p) => {
    const image = p.image_url || p.image || p.imageUrl || "https://via.placeholder.com/300";
    const stock = p.stock !== undefined && p.stock !== null ? p.stock : "—";
    const lowStock = p.stock !== undefined && p.stock !== null && Number(p.stock) <= 3;

    return `
    <div class="admin-product-card">
      <img src="${escapeHTML(image)}" alt="${escapeHTML(p.name)}" onerror="this.src='https://via.placeholder.com/300'">
      <div class="admin-product-body">
        <span class="cat">${escapeHTML(p.category || "عام")}</span>
        <h4>${escapeHTML(p.name)}</h4>
        <div class="price-row">
          <span class="price">${formatPrice(p.price)}</span>
          <span class="stock ${lowStock ? "low" : ""}">المخزون: ${escapeHTML(String(stock))}</span>
        </div>
        <div class="admin-product-actions">
          <button class="btn-edit" onclick="editProduct('${escapeHTML(String(p.id))}')">✏️ تعديل</button>
          <button class="btn-delete" onclick="deleteProduct('${escapeHTML(String(p.id))}')">🗑 حذف</button>
        </div>
      </div>
    </div>`;
  }).join("");
}

/* ---------------------------------------------------------
   نموذج المنتج (إضافة / تعديل)
   --------------------------------------------------------- */

function openProductForm(product = null) {
  const box = document.getElementById("productFormBox");
  const form = document.getElementById("productForm");
  form.reset();

  document.getElementById("productFormTitle").textContent = product ? "تعديل المنتج" : "إضافة منتج جديد";
  document.getElementById("productId").value = product ? product.id : "";
  document.getElementById("productName").value = product ? product.name : "";
  document.getElementById("productPrice").value = product ? product.price : "";
  document.getElementById("productStock").value = product && product.stock !== null && product.stock !== undefined ? product.stock : "";
  document.getElementById("productCategory").value = product ? product.category || "إكسسوارات" : "إكسسوارات";
  document.getElementById("productDescription").value = product ? product.description || "" : "";
  document.getElementById("productImageUrl").value = product ? product.image_url || product.image || product.imageUrl || "" : "";

  box.style.display = "flex";
}

function closeProductForm() {
  document.getElementById("productFormBox").style.display = "none";
}

function editProduct(productId) {
  const product = ADMIN_PRODUCTS.find((p) => String(p.id) === String(productId));
  if (!product) {
    showAdminMessage("تعذر العثور على المنتج", "error");
    return;
  }
  openProductForm(product);
}

async function uploadProductImage(file) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await window.supabaseClient.storage
    .from("product-images")
    .upload(path, file, { upsert: true });

  if (error) {
    console.error("خطأ في رفع صورة المنتج:", error);
    return null;
  }

  const { data: publicUrlData } = window.supabaseClient.storage
    .from("product-images")
    .getPublicUrl(data.path);

  return publicUrlData?.publicUrl || null;
}

async function handleProductSubmit(e) {
  e.preventDefault();

  const saveBtn = document.getElementById("saveProductButton");
  const originalText = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.innerHTML = `<span class="spinner"></span> جاري الحفظ...`;

  try {
    const id = document.getElementById("productId").value;
    const name = document.getElementById("productName").value.trim();
    const price = parseFloat(document.getElementById("productPrice").value);
    const stockRaw = document.getElementById("productStock").value;
    const stock = stockRaw === "" ? null : parseInt(stockRaw, 10);
    const category = document.getElementById("productCategory").value;
    const description = document.getElementById("productDescription").value.trim();
    let imageUrl = document.getElementById("productImageUrl").value.trim();

    if (!name || isNaN(price)) {
      showAdminMessage("الرجاء إدخال اسم المنتج والسعر بشكل صحيح", "error");
      saveBtn.disabled = false;
      saveBtn.textContent = originalText;
      return;
    }

    const fileInput = document.getElementById("productImage");
    if (fileInput.files && fileInput.files[0]) {
      const uploadedUrl = await uploadProductImage(fileInput.files[0]);
      if (uploadedUrl) imageUrl = uploadedUrl;
    }

    const payload = {
      name,
      price,
      stock,
      category,
      description,
      image_url: imageUrl,
    };

    let error;
    if (id) {
      ({ error } = await window.supabaseClient
        .from(window.MENA_CONFIG.PRODUCTS_TABLE)
        .update(payload)
        .eq("id", id));
    } else {
      ({ error } = await window.supabaseClient
        .from(window.MENA_CONFIG.PRODUCTS_TABLE)
        .insert([payload]));
    }

    if (error) throw error;

    showAdminMessage(id ? "تم تعديل المنتج بنجاح" : "تم إضافة المنتج بنجاح", "success");
    closeProductForm();
    loadProducts();
  } catch (err) {
    console.error("خطأ في حفظ المنتج:", err);
    showAdminMessage("حدث خطأ أثناء حفظ المنتج", "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
  }
}

async function deleteProduct(productId) {
  if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;

  try {
    const { error } = await window.supabaseClient
      .from(window.MENA_CONFIG.PRODUCTS_TABLE)
      .delete()
      .eq("id", productId);

    if (error) throw error;

    showAdminMessage("تم حذف المنتج بنجاح", "success");
    loadProducts();
  } catch (err) {
    console.error("خطأ في حذف المنتج:", err);
    showAdminMessage("تعذر حذف المنتج", "error");
  }
}

/* ---------------------------------------------------------
   الطلبات — تحميل وعرض
   --------------------------------------------------------- */

async function loadOrders() {
  const container = document.getElementById("adminOrders");
  try {
    const { data, error } = await window.supabaseClient
      .from(window.MENA_CONFIG.ORDERS_TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    ADMIN_ORDERS = data || [];
    renderOrders();
  } catch (err) {
    console.error("خطأ في تحميل الطلبات:", err);
    container.innerHTML = `<div class="empty-state">تعذر تحميل الطلبات</div>`;
  }
}

function renderOrders() {
  const container = document.getElementById("adminOrders");

  if (ADMIN_ORDERS.length === 0) {
    container.innerHTML = `<div class="empty-state">لا توجد طلبات حتى الآن</div>`;
    return;
  }

  container.innerHTML = ADMIN_ORDERS.map((order) => createOrderHTML(order)).join("");
}

function renderOrderProducts(products) {
  let items = products;
  if (typeof items === "string") {
    try {
      items = JSON.parse(items);
    } catch (e) {
      items = [];
    }
  }
  if (!Array.isArray(items)) items = [];

  if (items.length === 0) return `<div>لا توجد منتجات مرفقة بالطلب</div>`;

  return items
    .map(
      (item) =>
        `<div><span>${escapeHTML(item.name)} × ${escapeHTML(String(item.quantity))}</span><span>${formatPrice((item.price || 0) * (item.quantity || 1))}</span></div>`
    )
    .join("");
}

function createStatusOptions(currentStatus) {
  return Object.keys(ORDER_STATUS_TEXT)
    .map(
      (key) =>
        `<option value="${key}" ${key === currentStatus ? "selected" : ""}>${ORDER_STATUS_TEXT[key]}</option>`
    )
    .join("");
}

function createOrderHTML(order) {
  const status = order.order_status || order.status || "pending_review";
  const paymentStatus = order.payment_status || "pending_verification";
  const createdAt = order.created_at ? new Date(order.created_at).toLocaleString("ar-EG") : "—";

  return `
  <div class="order-card" data-order-id="${escapeHTML(String(order.id))}">
    <div class="order-card-header">
      <div>
        <div class="order-num">🧾 ${escapeHTML(order.order_number || order.id)}</div>
        <div class="order-date">${escapeHTML(createdAt)}</div>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <span class="status-badge ${status}">${getOrderStatusText(status)}</span>
        <span class="status-badge ${paymentStatus}">${getPaymentStatusText(paymentStatus)}</span>
      </div>
    </div>

    <div class="order-customer-info">
      <div><div class="item-label">العميل</div><div class="item-value">${escapeHTML(order.customer_name)}</div></div>
      <div><div class="item-label">الهاتف</div><div class="item-value">${escapeHTML(order.customer_phone)}</div></div>
      <div><div class="item-label">المحافظة</div><div class="item-value">${escapeHTML(order.governorate)}</div></div>
      <div><div class="item-label">المنطقة</div><div class="item-value">${escapeHTML(order.area || "")} ${escapeHTML(order.locality || "")}</div></div>
      <div><div class="item-label">العنوان</div><div class="item-value">${escapeHTML(order.address)}</div></div>
      <div><div class="item-label">طريقة الدفع</div><div class="item-value">${escapeHTML(order.payment_method)}</div></div>
    </div>

    <div class="order-products-list">
      ${renderOrderProducts(order.products)}
    </div>

    <div class="order-card-footer">
      <div class="order-totals">
        المنتجات: ${formatPrice(order.subtotal)} + الشحن: ${formatPrice(order.shipping ?? order.shipping_price ?? order.shipping_cost)}
        &nbsp;=&nbsp; <strong>${formatPrice(order.total)}</strong>
        ${order.receipt_url || order.receipt_image ? `<br><a class="receipt-link" href="${escapeHTML(order.receipt_url || order.receipt_image)}" target="_blank" rel="noopener">📎 عرض إيصال الدفع</a>` : ""}
        ${order.transaction_number || order.transaction_id ? `<br>رقم العملية: ${escapeHTML(order.transaction_number || order.transaction_id)}` : ""}
      </div>
      <div class="order-status-controls">
        <select onchange="updateOrderStatus('${escapeHTML(String(order.id))}', this.value)">
          ${createStatusOptions(status)}
        </select>
        <button class="btn-delete" style="padding:8px 14px; border-radius:8px;" onclick="deleteOrder('${escapeHTML(String(order.id))}')">🗑 حذف</button>
      </div>
    </div>
  </div>`;
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const payload = {
      order_status: newStatus,
      status: newStatus,
    };

    if (newStatus === "payment_verified") {
      payload.payment_status = "verified";
    } else if (newStatus === "rejected") {
      payload.payment_status = "rejected";
    }

    const { error } = await window.supabaseClient
      .from(window.MENA_CONFIG.ORDERS_TABLE)
      .update(payload)
      .eq("id", orderId);

    if (error) throw error;

    showAdminMessage("تم تحديث حالة الطلب بنجاح", "success");

    const order = ADMIN_ORDERS.find((o) => String(o.id) === String(orderId));
    if (order) {
      order.order_status = newStatus;
      order.status = newStatus;
      if (payload.payment_status) order.payment_status = payload.payment_status;
    }
    renderOrders();
  } catch (err) {
    console.error("خطأ في تحديث حالة الطلب:", err);
    showAdminMessage("تعذر تحديث حالة الطلب", "error");
  }
}

async function deleteOrder(orderId) {
  if (!confirm("هل أنت متأكد من حذف هذا الطلب؟")) return;

  try {
    const { error } = await window.supabaseClient
      .from(window.MENA_CONFIG.ORDERS_TABLE)
      .delete()
      .eq("id", orderId);

    if (error) throw error;

    showAdminMessage("تم حذف الطلب بنجاح", "success");
    loadOrders();
  } catch (err) {
    console.error("خطأ في حذف الطلب:", err);
    showAdminMessage("تعذر حذف الطلب", "error");
  }
}

/* ---------------------------------------------------------
   التهيئة
   --------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", async () => {
  const session = await checkAdminSession();
  if (!session) return;

  setupTabs();
  loadProducts();

  document.getElementById("logoutButton").addEventListener("click", logoutAdmin);
  document.getElementById("addProductButton").addEventListener("click", () => openProductForm(null));
  document.getElementById("productFormClose").addEventListener("click", closeProductForm);
  document.getElementById("cancelProductButton").addEventListener("click", closeProductForm);
  document.getElementById("productForm").addEventListener("submit", handleProductSubmit);

  document.getElementById("productFormBox").addEventListener("click", (e) => {
    if (e.target.id === "productFormBox") closeProductForm();
  });
});
