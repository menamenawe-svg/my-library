/* =========================================================
   admin.js — MMK Admin Dashboard
   إدارة المنتجات والطلبات باستخدام Supabase
   ========================================================= */


/* =========================================================
   بيانات لوحة التحكم
   ========================================================= */

let ADMIN_PRODUCTS = [];
let ADMIN_ORDERS = [];


/* =========================================================
   دوال مساعدة
   ========================================================= */

function escapeHTML(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function formatPrice(value) {
  const number = Number(value) || 0;

  return (
    number.toLocaleString("ar-EG", {
      maximumFractionDigits: 2
    }) + " ج.م"
  );
}


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
  rejected: "مرفوض"
};


const PAYMENT_STATUS_TEXT = {
  pending_verification: "قيد المراجعة",
  verified: "تم التأكيد",
  rejected: "مرفوض"
};


function getOrderStatusText(status) {
  return (
    ORDER_STATUS_TEXT[status] ||
    status ||
    "—"
  );
}


function getPaymentStatusText(status) {
  return (
    PAYMENT_STATUS_TEXT[status] ||
    status ||
    "—"
  );
}


/* =========================================================
   حالات الدفع المعروضة
   ========================================================= */

const PAYMENT_METHOD_TEXT = {
  cod: "الدفع عند الاستلام",
  orange_cash: "Orange Cash",
  instapay: "InstaPay",
  library_pickup: "الاستلام من MMK"
};


function getPaymentMethodText(method) {
  return (
    PAYMENT_METHOD_TEXT[method] ||
    method ||
    "—"
  );
}


/* =========================================================
   إشعارات لوحة التحكم
   ========================================================= */

function showAdminMessage(
  message,
  type = "success"
) {
  const box =
    document.getElementById(
      "adminMessage"
    );

  if (!box) return;

  box.style.display = "block";

  box.className =
    `status-box ${
      type === "error"
        ? "error"
        : "success"
    }`;

  box.textContent = message;

  clearTimeout(
    showAdminMessage.timer
  );

  showAdminMessage.timer =
    setTimeout(() => {
      box.style.display = "none";
    }, 3500);
}


/* =========================================================
   الجلسة
   ========================================================= */

async function checkAdminSession() {
  try {
    if (!window.supabaseClient) {
      console.error(
        "Supabase client غير موجود"
      );

      window.location.href =
        "login.html";

      return null;
    }

    const { data, error } =
      await window.supabaseClient.auth.getSession();

    if (error) {
      console.error(
        "خطأ في الجلسة:",
        error
      );

      window.location.href =
        "login.html";

      return null;
    }

    if (!data?.session) {
      window.location.href =
        "login.html";

      return null;
    }

    return data.session;

  } catch (error) {
    console.error(
      "تعذر التحقق من جلسة الأدمن:",
      error
    );

    window.location.href =
      "login.html";

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
    console.error(
      "خطأ أثناء تسجيل الخروج:",
      error
    );
  }

  window.location.href =
    "login.html";
}


/* =========================================================
   التبويبات
   ========================================================= */

function setupTabs() {
  const tabs =
    document.querySelectorAll(
      ".admin-tab"
    );

  const productsTab =
    document.getElementById(
      "tabProducts"
    );

  const ordersTab =
    document.getElementById(
      "tabOrders"
    );

  tabs.forEach((tab) => {
    tab.addEventListener(
      "click",
      async () => {
        const selectedTab =
          tab.dataset.tab;

        tabs.forEach((item) => {
          item.classList.remove(
            "active"
          );
        });

        tab.classList.add(
          "active"
        );

        if (productsTab) {
          productsTab.style.display =
            selectedTab === "products"
              ? "block"
              : "none";
        }

        if (ordersTab) {
          ordersTab.style.display =
            selectedTab === "orders"
              ? "block"
              : "none";
        }

        if (
          selectedTab === "orders"
        ) {
          await loadOrders();
        }
      }
    );
  });
}


/* =========================================================
   المنتجات — تحميل
   ========================================================= */

async function loadProducts() {
  const grid =
    document.getElementById(
      "adminProducts"
    );

  if (!grid) return;

  try {
    grid.innerHTML = `
      <div class="page-loading">
        جاري تحميل المنتجات...
      </div>
    `;

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
            ascending: false
          }
        );

    if (error) {
      throw error;
    }

    ADMIN_PRODUCTS =
      Array.isArray(data)
        ? data
        : [];

    renderProducts();

  } catch (error) {

    console.error(
      "خطأ في تحميل المنتجات:",
      error
    );

    grid.innerHTML = `
      <div class="empty-state">
        تعذر تحميل المنتجات
        <br>
        <small>
          ${escapeHTML(
            error?.message || ""
          )}
        </small>
      </div>
    `;
  }
}


/* =========================================================
   عرض المنتجات
   ========================================================= */

function renderProducts() {
  const grid =
    document.getElementById(
      "adminProducts"
    );

  if (!grid) return;

  if (
    ADMIN_PRODUCTS.length === 0
  ) {
    grid.innerHTML = `
      <div class="empty-state">
        لا توجد منتجات، ابدأ بإضافة منتج جديد
      </div>
    `;

    return;
  }

  grid.innerHTML =
    ADMIN_PRODUCTS
      .map((product) => {

        const image =
          product.image_url ||
          product.image ||
          product.imageUrl ||
          "";

        const stock =
          product.stock !==
            undefined &&
          product.stock !== null
            ? product.stock
            : "—";

        const lowStock =
          product.stock !==
            undefined &&
          product.stock !== null &&
          Number(product.stock) <= 3;

        const category =
          product.category ||
          "—";

        return `
          <div
            class="admin-product-card"
          >

            ${
              image
                ? `
                  <img
                    src="${escapeHTML(
                      image
                    )}"
                    alt="${escapeHTML(
                      product.name ||
                      "منتج"
                    )}"
                    onerror="
                      this.style.display='none';
                    "
                  >
                `
                : `
                  <div
                    class="admin-product-image-placeholder"
                  >
                    MMK
                  </div>
                `
            }

            <div
              class="admin-product-body"
            >

              <span class="cat">
                ${escapeHTML(
                  category
                )}
              </span>

              <h4>
                ${escapeHTML(
                  product.name ||
                  "منتج بدون اسم"
                )}
              </h4>

              <div
                class="price-row"
              >

                <span class="price">
                  ${formatPrice(
                    product.price
                  )}
                </span>

                <span
                  class="stock ${
                    lowStock
                      ? "low"
                      : ""
                  }"
                >
                  المخزون:
                  ${escapeHTML(
                    String(stock)
                  )}
                </span>

              </div>

              <div
                class="admin-product-actions"
              >

                <button
                  type="button"
                  class="btn-edit"
                  onclick="
                    editProduct(
                      '${escapeHTML(
                        String(
                          product.id
                        )
                      )}'
                    )
                  "
                >
                  ✏️ تعديل
                </button>

                <button
                  type="button"
                  class="btn-delete"
                  onclick="
                    deleteProduct(
                      '${escapeHTML(
                        String(
                          product.id
                        )
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
      })
      .join("");
}


/* =========================================================
   نموذج المنتج
   ========================================================= */

function openProductForm(
  product = null
) {
  const box =
    document.getElementById(
      "productFormBox"
    );

  const form =
    document.getElementById(
      "productForm"
    );

  if (!box || !form) {
    return;
  }

  form.reset();

  const title =
    document.getElementById(
      "productFormTitle"
    );

  const idField =
    document.getElementById(
      "productId"
    );

  const nameField =
    document.getElementById(
      "productName"
    );

  const priceField =
    document.getElementById(
      "productPrice"
    );

  const stockField =
    document.getElementById(
      "productStock"
    );

  const categoryField =
    document.getElementById(
      "productCategory"
    );

  const descriptionField =
    document.getElementById(
      "productDescription"
    );

  const imageUrlField =
    document.getElementById(
      "productImageUrl"
    );

  if (title) {
    title.textContent =
      product
        ? "تعديل المنتج"
        : "إضافة منتج جديد";
  }

  if (idField) {
    idField.value =
      product
        ? product.id
        : "";
  }

  if (nameField) {
    nameField.value =
      product?.name ||
      "";
  }

  if (priceField) {
    priceField.value =
      product?.price ??
      "";
  }

  if (stockField) {
    stockField.value =
      product?.stock !==
        null &&
      product?.stock !==
        undefined
        ? product.stock
        : "";
  }

  if (categoryField) {
    categoryField.value =
      product?.category ||
      "accessories";
  }

  if (descriptionField) {
    descriptionField.value =
      product?.description ||
      "";
  }

  if (imageUrlField) {
    imageUrlField.value =
      product?.image_url ||
      product?.image ||
      product?.imageUrl ||
      "";
  }

  box.style.display =
    "flex";
}


/* =========================================================
   إغلاق نموذج المنتج
   ========================================================= */

function closeProductForm() {
  const box =
    document.getElementById(
      "productFormBox"
    );

  if (box) {
    box.style.display =
      "none";
  }
}


/* =========================================================
   تعديل منتج
   ========================================================= */

function editProduct(
  productId
) {
  const product =
    ADMIN_PRODUCTS.find(
      (item) =>
        String(item.id) ===
        String(productId)
    );

  if (!product) {
    showAdminMessage(
      "تعذر العثور على المنتج",
      "error"
    );

    return;
  }

  openProductForm(
    product
  );
}


/* =========================================================
   رفع صورة المنتج
   ========================================================= */

async function uploadProductImage(
  file
) {
  if (!file) {
    return null;
  }

  const extension =
    file.name
      .split(".")
      .pop() ||
    "jpg";

  const path =
    `products/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`;

  const bucket =
    window.MENA_CONFIG
      ?.PRODUCT_IMAGES_BUCKET ||
    "product-images";

  const {
    data,
    error
  } =
    await window.supabaseClient.storage
      .from(bucket)
      .upload(
        path,
        file,
        {
          upsert: true
        }
      );

  if (error) {
    console.error(
      "خطأ في رفع صورة المنتج:",
      error
    );

    return null;
  }

  const {
    data: publicUrlData
  } =
    window.supabaseClient.storage
      .from(bucket)
      .getPublicUrl(path);

  return (
    publicUrlData?.publicUrl ||
    null
  );
}


/* =========================================================
   حفظ المنتج
   ========================================================= */

async function handleProductSubmit(
  event
) {
  event.preventDefault();

  const saveButton =
    document.getElementById(
      "saveProductButton"
    );

  if (!saveButton) {
    return;
  }

  const originalText =
    saveButton.textContent;

  saveButton.disabled =
    true;

  saveButton.innerHTML =
    '<span class="spinner"></span> جاري الحفظ...';

  try {
    const id =
      document.getElementById(
        "productId"
      )?.value || "";

    const name =
      document.getElementById(
        "productName"
      )?.value
        .trim() || "";

    const price =
      parseFloat(
        document.getElementById(
          "productPrice"
        )?.value
      );

    const stockRaw =
      document.getElementById(
        "productStock"
      )?.value ?? "";

    const stock =
      stockRaw === ""
        ? null
        : parseInt(
            stockRaw,
            10
          );

    const category =
      document.getElementById(
        "productCategory"
      )?.value || "accessories";

    const description =
      document.getElementById(
        "productDescription"
      )?.value
        .trim() || "";

    let imageUrl =
      document.getElementById(
        "productImageUrl"
      )?.value
        .trim() || "";

    if (
      !name ||
      Number.isNaN(price)
    ) {
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
      fileInput?.files?.length
    ) {
      const uploadedUrl =
        await uploadProductImage(
          fileInput.files[0]
        );

      if (uploadedUrl) {
        imageUrl =
          uploadedUrl;
      }
    }

    const payload = {
      name,
      price,
      stock,
      category,
      description,
      image_url:
        imageUrl
    };

    const table =
      window.MENA_CONFIG
        ?.PRODUCTS_TABLE ||
      "products";

    let error = null;

    if (id) {
      const result =
        await window.supabaseClient
          .from(table)
          .update(payload)
          .eq(
            "id",
            id
          );

      error =
        result.error;

    } else {
      const result =
        await window.supabaseClient
          .from(table)
          .insert([
            payload
          ]);

      error =
        result.error;
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

  } catch (error) {

    console.error(
      "خطأ في حفظ المنتج:",
      error
    );

    showAdminMessage(
      `حدث خطأ أثناء حفظ المنتج: ${
        error?.message || ""
      }`,
      "error"
    );

  } finally {

    saveButton.disabled =
      false;

    saveButton.textContent =
      originalText;
  }
}


/* =========================================================
   حذف المنتج
   ========================================================= */

async function deleteProduct(
  productId
) {
  const confirmed =
    confirm(
      "هل أنت متأكد من حذف هذا المنتج؟"
    );

  if (!confirmed) {
    return;
  }

  try {

    const table =
      window.MENA_CONFIG
        ?.PRODUCTS_TABLE ||
      "products";

    const {
      error
    } =
      await window.supabaseClient
        .from(table)
        .delete()
        .eq(
          "id",
          productId
        );

    if (error) {
      throw error;
    }

    showAdminMessage(
      "تم حذف المنتج بنجاح",
      "success"
    );

    await loadProducts();

  } catch (error) {

    console.error(
      "خطأ في حذف المنتج:",
      error
    );

    showAdminMessage(
      `تعذر حذف المنتج: ${
        error?.message || ""
      }`,
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
    return;
  }

  try {

    container.innerHTML = `
      <div class="page-loading">
        جاري تحميل الطلبات...
      </div>
    `;

    const table =
      window.MENA_CONFIG
        ?.ORDERS_TABLE ||
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

    ADMIN_ORDERS =
      Array.isArray(data)
        ? data
        : [];

    renderOrders();

  } catch (error) {

    console.error(
      "خطأ في تحميل الطلبات:",
      error
    );

    container.innerHTML = `
      <div class="empty-state">
        تعذر تحميل الطلبات
        <br>
        <small>
          ${escapeHTML(
            error?.message || ""
          )}
        </small>
      </div>
    `;
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
    ADMIN_ORDERS.length ===
    0
  ) {
    container.innerHTML = `
      <div class="empty-state">
        لا توجد طلبات حتى الآن
      </div>
    `;

    return;
  }

  container.innerHTML =
    ADMIN_ORDERS
      .map(
        createOrderHTML
      )
      .join("");
}


/* =========================================================
   منتجات الطلب
   ========================================================= */

function renderOrderProducts(
  products
) {
  let items =
    products;

  if (
    typeof items ===
    "string"
  ) {
    try {
      items =
        JSON.parse(
          items
        );
    } catch {
      items = [];
    }
  }

  if (!Array.isArray(items)) {
    items = [];
  }

  if (
    items.length ===
    0
  ) {
    return `
      <div>
        لا توجد منتجات مرفقة بالطلب
      </div>
    `;
  }

  return items
    .map((item) => {

      const quantity =
        Number(
          item.quantity
        ) || 1;

      const price =
        Number(
          item.price
        ) || 0;

      return `
        <div>
          <span>
            ${escapeHTML(
              item.name ||
              "منتج"
            )}
            ×
            ${escapeHTML(
              String(quantity)
            )}
          </span>

          <span>
            ${formatPrice(
              price *
                quantity
            )}
          </span>
        </div>
      `;
    })
    .join("");
}


/* =========================================================
   خيارات الحالات
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
          value="${escapeHTML(
            key
          )}"
          ${
            key ===
            currentStatus
              ? "selected"
              : ""
          }
        >
          ${escapeHTML(
            ORDER_STATUS_TEXT[
              key
            ]
          )}
        </option>
      `
    )
    .join("");
}


/* =========================================================
   إنشاء كارت الطلب
   ========================================================= */

function createOrderHTML(
  order
) {
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

  const customerName =
    order.customer_name ||
    order.name ||
    "—";

  const customerPhone =
    order.customer_phone ||
    order.phone ||
    "—";

  const governorate =
    order.governorate ||
    order.province ||
    "—";

  const area =
    order.area ||
    order.city ||
    "";

  const locality =
    order.locality ||
    order.village ||
    "";

  const address =
    order.address ||
    "—";

  const paymentMethod =
    getPaymentMethodText(
      order.payment_method
    );

  const shipping =
    order.shipping ??
    order.shipping_price ??
    order.shipping_cost ??
    0;

  const subtotal =
    order.subtotal ??
    order.products_total ??
    0;

  const total =
    order.total ??
    order.final_total ??
    (
      Number(subtotal) +
      Number(shipping)
    );

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
        String(
          order.id
        )
      )}"
    >

      <div class="order-card-header">

        <div>

          <div class="order-num">
            🧾
            ${escapeHTML(
              order.order_number ||
              order.id ||
              "—"
            )}
          </div>

          <div class="order-date">
            ${escapeHTML(
              createdAt
            )}
          </div>

        </div>


        <div
          class="order-status-badges"
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
              customerName
            )}
          </div>

        </div>


        <div>

          <div class="item-label">
            الهاتف
          </div>

          <div class="item-value">
            ${escapeHTML(
              customerPhone
            )}
          </div>

        </div>


        <div>

          <div class="item-label">
            المحافظة
          </div>

          <div class="item-value">
            ${escapeHTML(
              governorate
            )}
          </div>

        </div>


        <div>

          <div class="item-label">
            المركز
          </div>

          <div class="item-value">
            ${escapeHTML(
              area
            )}
          </div>

        </div>


        <div>

          <div class="item-label">
            القرية / الحي
          </div>

          <div class="item-value">
            ${escapeHTML(
              locality
            )}
          </div>

        </div>


        <div>

          <div class="item-label">
            العنوان
          </div>

          <div class="item-value">
            ${escapeHTML(
              address
            )}
          </div>

        </div>


        <div>

          <div class="item-label">
            طريقة الدفع
          </div>

          <div class="item-value">
            ${escapeHTML(
              paymentMethod
            )}
          </div>

        </div>

      </div>


      <div class="order-products-list">

        ${renderOrderProducts(
          order.products ||
          order.items ||
          []
        )}

      </div>


      <div class="order-card-footer">

        <div class="order-totals">

          المنتجات:
          ${formatPrice(
            subtotal
          )}

          +
          الشحن:
          ${formatPrice(
            shipping
          )}

          &nbsp;=&nbsp;

          <strong>
            ${formatPrice(
              total
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
                  rel="noopener noreferrer"
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
            title="تغيير حالة الطلب"
            aria-label="تغيير حالة الطلب"
            onchange="
              updateOrderStatus(
                '${escapeHTML(
                  String(
                    order.id
                  )
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
            onclick="
              deleteOrder(
                '${escapeHTML(
                  String(
                    order.id
                  )
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

    const payload = {
      order_status:
        newStatus,

      status:
        newStatus
    };


    if (
      newStatus ===
      "payment_verified"
    ) {
      payload.payment_status =
        "verified";
    }

    if (
      newStatus ===
      "rejected"
    ) {
      payload.payment_status =
        "rejected";
    }


    const table =
      window.MENA_CONFIG
        ?.ORDERS_TABLE ||
      "orders";


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


    const order =
      ADMIN_ORDERS.find(
        (item) =>
          String(
            item.id
          ) ===
          String(
            orderId
          )
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


    showAdminMessage(
      "تم تحديث حالة الطلب بنجاح",
      "success"
    );


    renderOrders();

  } catch (error) {

    console.error(
      "خطأ في تحديث حالة الطلب:",
      error
    );

    showAdminMessage(
      `تعذر تحديث حالة الطلب: ${
        error?.message || ""
      }`,
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
      window.MENA_CONFIG
        ?.ORDERS_TABLE ||
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

  } catch (error) {

    console.error(
      "خطأ في حذف الطلب:",
      error
    );

    showAdminMessage(
      `تعذر حذف الطلب: ${
        error?.message || ""
      }`,
      "error"
    );
  }
}


/* =========================================================
   تهيئة الصفحة
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    if (
      !window.supabaseClient ||
      !window.MENA_CONFIG
    ) {
      console.error(
        "Supabase غير جاهز"
      );

      return;
    }


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

    if (logoutButton) {
      logoutButton.addEventListener(
        "click",
        logoutAdmin
      );
    }


    const addProductButton =
      document.getElementById(
        "addProductButton"
      );

    if (addProductButton) {
      addProductButton.addEventListener(
        "click",
        () => {
          openProductForm(
            null
          );
        }
      );
    }


    const closeButton =
      document.getElementById(
        "productFormClose"
      );

    if (closeButton) {
      closeButton.addEventListener(
        "click",
        closeProductForm
      );
    }


    const cancelButton =
      document.getElementById(
        "cancelProductButton"
      );

    if (cancelButton) {
      cancelButton.addEventListener(
        "click",
        closeProductForm
      );
    }


    const productForm =
      document.getElementById(
        "productForm"
      );

    if (productForm) {
      productForm.addEventListener(
        "submit",
        handleProductSubmit
      );
    }


    const productFormBox =
      document.getElementById(
        "productFormBox"
      );

    if (productFormBox) {
      productFormBox.addEventListener(
        "click",
        (event) => {

          if (
            event.target.id ===
            "productFormBox"
          ) {
            closeProductForm();
          }

        }
      );
    }

  }
);
