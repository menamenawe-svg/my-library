
/* =========================================================
   checkout.js — متجر أم أم كي
   نسخة كاملة متوافقة مع checkout.html
   ========================================================= */

/* =========================================================
   بيانات الشحن
   ========================================================= */

const SHIPPING_PRICES = {
  "القاهرة": 97,
  "الإسكندرية": 102,
  "الجيزة": 110,
  "القليوبية": 110,
  "الشرقية": 110,
  "الغربية": 110,
  "الدقهلية": 110,
  "كفر الشيخ": 110,
  "دمياط": 110,
  "البحيرة": 110,
  "المنوفية": 110,
  "بورسعيد": 110,
  "الإسماعيلية": 110,
  "السويس": 110,
  "الفيوم": 110,
  "بني سويف": 140,
  "المنيا": 140,
  "أسيوط": 140,
  "سوهاج": 140,
  "قنا": 140,
  "أسوان": 140,
  "البحر الأحمر": 140,
  "مطروح": 140,
  "شمال سيناء": 140,
  "جنوب سيناء": 140,
  "الوادي الجديد": 140
};

const LUXOR_NAMES = [
  "الأقصر",
  "مدينة الأقصر",
  "مدينة الاقصر",
  "الاقصر"
];

const LUXOR_DEFAULT_PRICE = 25;

const LUXOR_AREA_PRICES = {
  "مدينة الأقصر": 15,
  "الكرنك": 25,
  "الكرنك الجديد": 30,
  "جزيرة العوامية": 25,
  "منشأة العماري": 25,
  "القرنة": 35,
  "مدينة البياضية": 25,
  "الأقالتة": 35,
  "البعيرات": 40,
  "البغدادي": 30,
  "الحبيل": 30,
  "الطود": 35,
  "العديسات": 40,
  "العديسات القبلية": 45,
  "الغربي قمولا": 45,
  "القبلي قمولا": 45,
  "الضبعية": 40,
  "مدينة طيبة الجديدة": 30,
  "الزينية بحري": 35,
  "الزينية قبلي": 40,
  "الصعايدة": 40,
  "العشي": 35,
  "المدامود": 40
};

/* =========================================================
   بيانات الدفع
   ========================================================= */

const PAYMENT_NUMBERS = {
  orange_cash: "01206439150",
  instapay: "01225182025"
};

/* =========================================================
   روابط بيانات المحافظات
   ========================================================= */

const DATA_URLS = {
  governorates:
    "https://raw.githubusercontent.com/mo7amed-said-223/egypt-cities/main/governorates.json",

  centers:
    "https://raw.githubusercontent.com/mo7amed-said-223/egypt-cities/main/center_govs.json",

  villages:
    "https://raw.githubusercontent.com/mo7amed-said-223/egypt-cities/main/city_centers.json"
};

/* =========================================================
   حالة الصفحة
   ========================================================= */

let GOVERNORATES = [];
let CENTERS = [];
let VILLAGES = [];

let selectedGovernorate = "";
let selectedCity = "";
let selectedVillage = "";

let currentShippingPrice = null;
let selectedPaymentMethod = "cod";

let receiptFile = null;
let isSubmitting = false;

/* =========================================================
   أدوات مساعدة
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

  return `${number.toLocaleString("ar-EG")} ج.م`;
}

function normalizeArabic(str) {
  if (!str) return "";

  return String(str)
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ًٌٍَُِّْ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function showToast(message, type = "info") {
  if (typeof window.showMessage === "function") {
    window.showMessage(message);
    return;
  }

  const container =
    document.getElementById("toastContainer");

  if (!container) {
    alert(message);
    return;
  }

  const toast =
    document.createElement("div");

  toast.className =
    `toast-message ${type}`;

  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3500);
}

/* =========================================================
   بيانات السلة
   ========================================================= */

function getCheckoutCart() {
  try {
    if (typeof getCart === "function") {
      const cart = getCart();

      return Array.isArray(cart) ? cart : [];
    }

    const cartKey =
      typeof CART_KEY !== "undefined"
        ? CART_KEY
        : "cart";

    const saved =
      localStorage.getItem(cartKey);

    const cart =
      saved ? JSON.parse(saved) : [];

    return Array.isArray(cart) ? cart : [];
  } catch (error) {
    console.error(
      "خطأ في قراءة السلة:",
      error
    );

    return [];
  }
}

function checkoutCartQuantity() {
  const cart = getCheckoutCart();

  return cart.reduce(
    (total, item) =>
      total +
      Number(item.quantity || 1),
    0
  );
}

function checkoutCartTotal() {
  const cart = getCheckoutCart();

  return cart.reduce(
    (total, item) =>
      total +
      Number(item.price || 0) *
        Number(item.quantity || 1),
    0
  );
}

/* =========================================================
   المحافظات
   ========================================================= */

function getGovName(g) {
  return (
    g?.governorate_name_ar ||
    g?.name_ar ||
    g?.name ||
    g?.governorate ||
    ""
  );
}

function getGovId(g) {
  return (
    g?.id ??
    g?.governorate_id ??
    g?.governorateId ??
    getGovName(g)
  );
}

/* =========================================================
   المراكز
   ========================================================= */

function getCenterName(c) {
  return (
    c?.center_name_ar ||
    c?.name_ar ||
    c?.name ||
    c?.center ||
    ""
  );
}

function getCenterId(c) {
  return (
    c?.id ??
    c?.center_id ??
    c?.centerId ??
    getCenterName(c)
  );
}

function getCenterGovId(c) {
  return (
    c?.governorate_id ??
    c?.gov_id ??
    c?.governorateId
  );
}

/* =========================================================
   القرى
   ========================================================= */

function getVillageName(v) {
  return (
    v?.city_name_ar ||
    v?.name_ar ||
    v?.name ||
    v?.village ||
    v?.city ||
    ""
  );
}

function getVillageCenterId(v) {
  return (
    v?.center_gov_id ??
    v?.center_id ??
    v?.centerId
  );
}

/* =========================================================
   الأقصر
   ========================================================= */

function isLuxorGovernorate(name) {
  if (!name) return false;

  const normalized =
    normalizeArabic(name);

  return LUXOR_NAMES.some(
    (item) =>
      normalizeArabic(item) ===
      normalized
  );
}

function findLuxorAreaPrice(areaName) {
  if (!areaName) {
    return null;
  }

  const normalized =
    normalizeArabic(areaName);

  for (const key in LUXOR_AREA_PRICES) {
    if (
      normalizeArabic(key) ===
      normalized
    ) {
      return LUXOR_AREA_PRICES[key];
    }
  }

  for (const key in LUXOR_AREA_PRICES) {
    const normalizedKey =
      normalizeArabic(key);

    if (
      normalizedKey.includes(normalized) ||
      normalized.includes(normalizedKey)
    ) {
      return LUXOR_AREA_PRICES[key];
    }
  }

  return null;
}

/* =========================================================
   سعر الشحن
   ========================================================= */

function getShippingPriceForGovernorate(
  govName
) {
  if (!govName) {
    return null;
  }

  if (isLuxorGovernorate(govName)) {
    return LUXOR_DEFAULT_PRICE;
  }

  if (
    SHIPPING_PRICES[govName] !==
    undefined
  ) {
    return SHIPPING_PRICES[govName];
  }

  const normalized =
    normalizeArabic(govName);

  for (const key in SHIPPING_PRICES) {
    if (
      normalizeArabic(key) ===
      normalized
    ) {
      return SHIPPING_PRICES[key];
    }
  }

  return 140;
}

/* =========================================================
   حالة الموقع
   ========================================================= */

function setLocationStatus(
  message,
  type = "info"
) {
  const box =
    document.getElementById(
      "locationStatus"
    );

  if (!box) return;

  if (!message) {
    box.style.display = "none";
    box.textContent = "";
    return;
  }

  box.style.display = "block";
  box.className =
    `status-box ${type}`;

  box.textContent = message;
}

/* =========================================================
   تحميل بيانات المحافظات
   ========================================================= */

async function loadLocationData() {
  const govSelect =
    document.getElementById(
      "customerGovernorate"
    );

  const citySelect =
    document.getElementById(
      "customerCity"
    );

  const villageSelect =
    document.getElementById(
      "customerVillage"
    );

  try {
    if (govSelect) {
      govSelect.disabled = true;

      govSelect.innerHTML =
        `<option value="">جاري تحميل المحافظات...</option>`;
    }

    const [
      govRes,
      centerRes,
      villageRes
    ] = await Promise.all([
      fetch(DATA_URLS.governorates),
      fetch(DATA_URLS.centers),
      fetch(DATA_URLS.villages)
    ]);

    if (
      !govRes.ok ||
      !centerRes.ok ||
      !villageRes.ok
    ) {
      throw new Error(
        "تعذر تحميل بيانات المحافظات والمراكز والقرى"
      );
    }

    GOVERNORATES =
      await govRes.json();

    CENTERS =
      await centerRes.json();

    VILLAGES =
      await villageRes.json();

    if (
      !Array.isArray(GOVERNORATES) ||
      !Array.isArray(CENTERS) ||
      !Array.isArray(VILLAGES)
    ) {
      throw new Error(
        "بيانات المناطق غير صحيحة"
      );
    }

    populateGovernorates();

  } catch (error) {
    console.error(
      "تعذر تحميل بيانات المحافظات:",
      error
    );

    if (govSelect) {
      govSelect.disabled = false;

      govSelect.innerHTML =
        `<option value="">تعذر تحميل المحافظات</option>`;
    }

    if (citySelect) {
      citySelect.innerHTML =
        `<option value="">اختر المحافظة أولاً</option>`;

      citySelect.disabled = true;
    }

    if (villageSelect) {
      villageSelect.innerHTML =
        `<option value="">اختر المركز أولاً</option>`;

      villageSelect.disabled = true;
    }

    setLocationStatus(
      "تعذر تحميل بيانات المناطق. تأكد من اتصال الإنترنت ثم حدّث الصفحة.",
      "error"
    );
  }
}

/* =========================================================
   عرض المحافظات
   ========================================================= */

function populateGovernorates() {
  const govSelect =
    document.getElementById(
      "customerGovernorate"
    );

  if (!govSelect) return;

  govSelect.innerHTML =
    `<option value="">اختر المحافظة</option>`;

  GOVERNORATES.forEach((gov) => {
    const name =
      getGovName(gov);

    if (!name) return;

    const option =
      document.createElement("option");

    option.value =
      getGovId(gov);

    option.textContent =
      name;

    option.dataset.name =
      name;

    govSelect.appendChild(option);
  });

  govSelect.disabled = false;
}

/* =========================================================
   عرض المراكز
   ========================================================= */

function populateCenters(govId) {
  const citySelect =
    document.getElementById(
      "customerCity"
    );

  const villageSelect =
    document.getElementById(
      "customerVillage"
    );

  if (
    !citySelect ||
    !villageSelect
  ) {
    return;
  }

  citySelect.innerHTML =
    `<option value="">اختر المركز</option>`;

  villageSelect.innerHTML =
    `<option value="">اختر المركز أولاً</option>`;

  citySelect.disabled = true;
  villageSelect.disabled = true;

  const filtered =
    CENTERS.filter((center) => {
      return (
        String(
          getCenterGovId(center)
        ) ===
        String(govId)
      );
    });

  if (!filtered.length) {
    citySelect.innerHTML =
      `<option value="">لا توجد مراكز متاحة</option>`;

    return;
  }

  filtered.forEach((center) => {
    const name =
      getCenterName(center);

    if (!name) return;

    const option =
      document.createElement("option");

    option.value =
      getCenterId(center);

    option.textContent =
      name;

    option.dataset.name =
      name;

    citySelect.appendChild(option);
  });

  citySelect.disabled = false;
}

/* =========================================================
   عرض القرى
   ========================================================= */

function populateVillages(centerId) {
  const villageSelect =
    document.getElementById(
      "customerVillage"
    );

  if (!villageSelect) {
    return;
  }

  villageSelect.innerHTML =
    `<option value="">اختر القرية / الحي</option>`;

  villageSelect.disabled = true;

  const filtered =
    VILLAGES.filter((village) => {
      return (
        String(
          getVillageCenterId(village)
        ) ===
        String(centerId)
      );
    });

  if (!filtered.length) {
    villageSelect.innerHTML =
      `<option value="">لا توجد قرى متاحة</option>`;

    return;
  }

  filtered.forEach((village) => {
    const name =
      getVillageName(village);

    if (!name) return;

    const option =
      document.createElement("option");

    option.value =
      name;

    option.textContent =
      name;

    villageSelect.appendChild(option);
  });

  villageSelect.disabled = false;
}

/* =========================================================
   إظهار الاستلام من المكتبة
   ========================================================= */

function updateLibraryPickupVisibility() {
  const pickup =
    document.getElementById(
      "libraryPickupMethod"
    );

  if (!pickup) return;

  const isLuxor =
    isLuxorGovernorate(
      selectedGovernorate
    );

  pickup.hidden = !isLuxor;

  if (
    !isLuxor &&
    selectedPaymentMethod ===
      "library_pickup"
  ) {
    selectedPaymentMethod = "cod";

    document
      .querySelectorAll(
        ".payment-method"
      )
      .forEach((method) => {
        method.classList.remove(
          "selected"
        );
      });

    document
      .querySelector(
        '[data-method="cod"]'
      )
      ?.classList.add("selected");
  }
}

/* =========================================================
   أرقام الدفع
   ========================================================= */

function updatePaymentNumbers() {
  const box =
    document.getElementById(
      "paymentNumbers"
    );

  if (!box) return;

  if (
    selectedPaymentMethod ===
    "orange_cash"
  ) {
    box.hidden = false;

    box.innerHTML = `
      <div class="payment-number-content">
        <div class="payment-number-icon">
          🟠
        </div>

        <div>
          <strong>Orange Cash</strong>

          <div class="payment-number-line">
            رقم التحويل:
            <strong dir="ltr">
              ${PAYMENT_NUMBERS.orange_cash}
            </strong>
          </div>
        </div>
      </div>
    `;

    return;
  }

  if (
    selectedPaymentMethod ===
    "instapay"
  ) {
    box.hidden = false;

    box.innerHTML = `
      <div class="payment-number-content">
        <div class="payment-number-icon">
          🏦
        </div>

        <div>
          <strong>InstaPay</strong>

          <div class="payment-number-line">
            رقم التحويل:
            <strong dir="ltr">
              ${PAYMENT_NUMBERS.instapay}
            </strong>
          </div>
        </div>
      </div>
    `;

    return;
  }

  box.hidden = true;
  box.innerHTML = "";
}

/* =========================================================
   حساب الشحن
   ========================================================= */

function updateShippingCalculation() {
  const shippingStatus =
    document.getElementById(
      "shippingStatus"
    );

  const shippingText =
    document.getElementById(
      "shippingPriceText"
    );

  if (
    !shippingStatus ||
    !shippingText
  ) {
    return;
  }

  updateLibraryPickupVisibility();

  if (!selectedGovernorate) {
    currentShippingPrice = null;

    shippingText.textContent =
      "اختر المحافظة والمنطقة لحساب سعر الشحن";

    shippingStatus.className =
      "status-box info";

    updateOrderTotals();

    return;
  }

  const luxor =
    isLuxorGovernorate(
      selectedGovernorate
    );

  if (
    selectedPaymentMethod ===
      "library_pickup" &&
    luxor
  ) {
    currentShippingPrice = 0;

    shippingText.textContent =
      "الاستلام من مكتبة مينا في الأقصر — بدون مصاريف شحن";

    shippingStatus.className =
      "status-box success";

    updateOrderTotals();

    return;
  }

  if (luxor) {
    if (selectedVillage) {
      const areaPrice =
        findLuxorAreaPrice(
          selectedVillage
        );

      if (areaPrice !== null) {
        currentShippingPrice =
          areaPrice;

        shippingText.textContent =
          `سعر الشحن لمنطقتك في الأقصر: ${formatPrice(
            areaPrice
          )}`;
      } else {
        currentShippingPrice =
          LUXOR_DEFAULT_PRICE;

        shippingText.textContent =
          `سعر الشحن المحلي للأقصر: ${formatPrice(
            LUXOR_DEFAULT_PRICE
          )}`;
      }
    } else {
      currentShippingPrice =
        LUXOR_DEFAULT_PRICE;

      shippingText.textContent =
        `سعر الشحن الافتراضي لمحافظة الأقصر: ${formatPrice(
          LUXOR_DEFAULT_PRICE
        )} — اختر المنطقة لتحديد السعر الدقيق`;
    }
  } else {
    const price =
      getShippingPriceForGovernorate(
        selectedGovernorate
      );

    currentShippingPrice =
      price;

    shippingText.textContent =
      `سعر الشحن إلى ${selectedGovernorate}: ${formatPrice(
        price
      )}`;
  }

  shippingStatus.className =
    "status-box success";

  updateOrderTotals();
}

/* =========================================================
   صورة بديلة محلية
   بدون via.placeholder.com
   ========================================================= */

function createLocalPlaceholder() {
  const svg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100"
      height="100"
      viewBox="0 0 100 100"
    >
      <rect
        width="100"
        height="100"
        rx="12"
        fill="#eef2f7"
      />

      <text
        x="50"
        y="55"
        text-anchor="middle"
        font-size="34"
      >
        🛍️
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const CHECKOUT_PLACEHOLDER =
  createLocalPlaceholder();

/* =========================================================
   ملخص الطلب
   ========================================================= */

function renderCheckoutSummary() {
  const cart =
    getCheckoutCart();

  const container =
    document.getElementById(
      "checkoutItems"
    );

  if (!container) return;

  if (!cart.length) {
    container.innerHTML =
      `<p class="checkout-empty-message">
        السلة فارغة
      </p>`;
  } else {
    container.innerHTML =
      cart
        .map((item) => {
          const image =
            item?.image ||
            item?.img ||
            item?.thumbnail ||
            CHECKOUT_PLACEHOLDER;

          const safeImage =
            escapeHTML(image);

          const safeName =
            escapeHTML(
              item?.name ||
              "منتج"
            );

          const quantity =
            Number(
              item?.quantity || 1
            );

          const price =
            Number(
              item?.price || 0
            );

          return `
            <div class="checkout-summary-item">

              <img
                src="${safeImage}"
                alt="${safeName}"
                loading="lazy"
                onerror="
                  this.onerror=null;
                  this.src='${CHECKOUT_PLACEHOLDER}';
                "
              >

              <div>
                <div class="name">
                  ${safeName}
                </div>

                <div class="meta">
                  الكمية: ${quantity}
                </div>
              </div>

              <div class="price">
                ${formatPrice(
                  price * quantity
                )}
              </div>

            </div>
          `;
        })
        .join("");
  }

  const quantity =
    document.getElementById(
      "checkoutQuantity"
    );

  const subtotal =
    document.getElementById(
      "checkoutSubtotal"
    );

  if (quantity) {
    quantity.textContent =
      checkoutCartQuantity();
  }

  if (subtotal) {
    subtotal.textContent =
      formatPrice(
        checkoutCartTotal()
      );
  }

  updateOrderTotals();
}

/* =========================================================
   إجمالي الطلب
   ========================================================= */

function updateOrderTotals() {
  const subtotal =
    checkoutCartTotal();

  let shipping =
    currentShippingPrice;

  if (
    selectedPaymentMethod ===
    "library_pickup"
  ) {
    shipping = 0;
  }

  const total =
    subtotal +
    (shipping || 0);

  const subtotalEl =
    document.getElementById(
      "checkoutSubtotal"
    );

  const shippingEl =
    document.getElementById(
      "checkoutShipping"
    );

  const totalEl =
    document.getElementById(
      "checkoutTotal"
    );

  if (subtotalEl) {
    subtotalEl.textContent =
      formatPrice(subtotal);
  }

  if (shippingEl) {
    shippingEl.textContent =
      shipping === null
        ? "يُحدد حسب العنوان"
        : formatPrice(shipping);
  }

  if (totalEl) {
    totalEl.textContent =
      formatPrice(total);
  }

  updatePaymentAmounts();
}

/* =========================================================
   مبالغ الدفع
   ========================================================= */

function updatePaymentAmounts() {
  const subtotal =
    checkoutCartTotal();

  let shipping =
    currentShippingPrice || 0;

  if (
    selectedPaymentMethod ===
    "library_pickup"
  ) {
    shipping = 0;
  }

  const total =
    subtotal + shipping;

  let prepaid = 0;
  let remaining = 0;

  const instructions =
    document.getElementById(
      "paymentInstructions"
    );

  if (
    selectedPaymentMethod ===
    "cod"
  ) {
    prepaid = shipping;

    remaining =
      total - prepaid;

    if (instructions) {
      instructions.textContent =
        "في حالة الدفع عند الاستلام، يتم دفع مصاريف الشحن مقدمًا فقط، ويتم دفع باقي قيمة الطلب عند الاستلام.";
    }
  }

  else if (
    selectedPaymentMethod ===
    "library_pickup"
  ) {
    prepaid =
      total * 0.5;

    remaining =
      total - prepaid;

    if (instructions) {
      instructions.textContent =
        "الاستلام من مكتبة مينا في الأقصر: يتم دفع 50% من قيمة الطلب مقدمًا لتأكيد الطلب، ودفع 50% المتبقية عند الاستلام من المكتبة.";
    }
  }

  else {
    prepaid = total;
    remaining = 0;

    const methodName =
      selectedPaymentMethod ===
      "orange_cash"
        ? "Orange Cash"
        : "InstaPay";

    if (instructions) {
      instructions.textContent =
        `يتم دفع إجمالي قيمة الطلب مقدمًا عبر ${methodName}، ثم إرفاق رقم العملية وصورة الإيصال.`;
    }
  }

  const prepaidEl =
    document.getElementById(
      "prepaidAmountText"
    );

  const remainingEl =
    document.getElementById(
      "remainingAmountText"
    );

  if (prepaidEl) {
    prepaidEl.textContent =
      formatPrice(prepaid);
  }

  if (remainingEl) {
    remainingEl.textContent =
      formatPrice(remaining);
  }

  updatePaymentNumbers();
}

/* =========================================================
   تسجيل الدخول
   ========================================================= */

async function requireCustomerLogin() {
  if (!window.supabaseClient) {
    window.location.href =
      "login.html";

    return false;
  }

  try {
    const {
      data,
      error
    } =
      await window.supabaseClient.auth.getSession();

    if (
      error ||
      !data?.session?.user
    ) {
      alert(
        "يجب تسجيل الدخول أولًا لإتمام الطلب."
      );

      window.location.href =
        "login.html";

      return false;
    }

    return true;

  } catch (error) {
    console.error(
      "Session check error:",
      error
    );

    window.location.href =
      "login.html";

    return false;
  }
}

/* =========================================================
   التحقق من الهاتف
   ========================================================= */

function validateEgyptianPhone(phone) {
  return /^01[0125][0-9]{8}$/.test(
    String(phone).trim()
  );
}

/* =========================================================
   أخطاء الحقول
   ========================================================= */

function setFieldError(
  fieldId,
  hasError
) {
  const field =
    document.getElementById(fieldId);

  const row =
    field?.closest(
      ".form-row"
    );

  if (row) {
    row.classList.toggle(
      "invalid",
      hasError
    );
  }
}

/* =========================================================
   التحقق من النموذج
   ========================================================= */

function validateCheckoutForm() {
  let valid = true;

  const nameField =
    document.getElementById(
      "customerName"
    );

  const phoneField =
    document.getElementById(
      "customerPhone"
    );

  const addressField =
    document.getElementById(
      "customerAddress"
    );

  const govField =
    document.getElementById(
      "customerGovernorate"
    );

  const cityField =
    document.getElementById(
      "customerCity"
    );

  const villageField =
    document.getElementById(
      "customerVillage"
    );

  const transactionField =
    document.getElementById(
      "transactionNumber"
    );

  if (
    !nameField ||
    !phoneField ||
    !addressField ||
    !govField ||
    !cityField ||
    !villageField ||
    !transactionField
  ) {
    showToast(
      "حدث خطأ في نموذج الطلب",
      "error"
    );

    return false;
  }

  const name =
    nameField.value.trim();

  const phone =
    phoneField.value.trim();

  const address =
    addressField.value.trim();

  const gov =
    govField.value;

  const city =
    cityField.value;

  const village =
    villageField.value;

  setFieldError(
    "customerName",
    !name
  );

  if (!name) {
    valid = false;
  }

  const phoneValid =
    validateEgyptianPhone(phone);

  setFieldError(
    "customerPhone",
    !phoneValid
  );

  if (!phoneValid) {
    valid = false;
  }

  setFieldError(
    "customerGovernorate",
    !gov
  );

  if (!gov) {
    valid = false;
  }

  setFieldError(
    "customerCity",
    !city
  );

  if (!city) {
    valid = false;
  }

  setFieldError(
    "customerVillage",
    !village
  );

  if (!village) {
    valid = false;
  }

  setFieldError(
    "customerAddress",
    !address
  );

  if (!address) {
    valid = false;
  }

  if (
    selectedPaymentMethod ===
      "library_pickup" &&
    !isLuxorGovernorate(
      selectedGovernorate
    )
  ) {
    showToast(
      "الاستلام من المكتبة متاح فقط داخل الأقصر",
      "error"
    );

    valid = false;
  }

  /*
   * الدفع عند الاستلام:
   * مطلوب رقم العملية وصورة الإيصال
   * لأن مصاريف الشحن يتم دفعها مقدمًا.
   */

  const transactionNumber =
    transactionField.value.trim();

  setFieldError(
    "transactionNumber",
    !transactionNumber
  );

  if (!transactionNumber) {
    valid = false;
  }

  const receiptInput =
    document.getElementById(
      "paymentReceipt"
    );

  const receiptRow =
    receiptInput?.closest(
      ".form-row"
    );

  if (!receiptFile) {
    receiptRow?.classList.add(
      "invalid"
    );

    valid = false;
  } else {
    receiptRow?.classList.remove(
      "invalid"
    );
  }

  if (
    checkoutCartQuantity() === 0
  ) {
    showToast(
      "السلة فارغة، لا يمكن إتمام الطلب",
      "error"
    );

    valid = false;
  }

  return valid;
}

/* =========================================================
   اختيار صورة الإيصال
   ========================================================= */

function handleReceiptFile(file) {
  if (!file) {
    return;
  }

  if (
    !file.type ||
    !file.type.startsWith(
      "image/"
    )
  ) {
    showToast(
      "الملف يجب أن يكون صورة فقط",
      "error"
    );

    return;
  }

  const maxSize =
    5 * 1024 * 1024;

  if (file.size > maxSize) {
    showToast(
      "حجم الصورة يجب ألا يتجاوز 5 ميجابايت",
      "error"
    );

    return;
  }

  receiptFile = file;

  const preview =
    document.getElementById(
      "receiptPreview"
    );

  if (preview) {
    const objectURL =
      URL.createObjectURL(file);

    preview.src =
      objectURL;

    preview.classList.add(
      "show"
    );

    preview.onload = () => {
      URL.revokeObjectURL(
        objectURL
      );
    };
  }

  document
    .getElementById(
      "paymentReceipt"
    )
    ?.closest(".form-row")
    ?.classList.remove(
      "invalid"
    );
}

/* =========================================================
   رفع الإيصال إلى Supabase
   ========================================================= */

async function uploadReceiptImage(
  orderNumber
) {
  if (!receiptFile) {
    return {
      path: null,
      url: null
    };
  }

  if (
    !window.supabaseClient
  ) {
    throw new Error(
      "اتصال قاعدة البيانات غير متاح"
    );
  }

  const ext =
    receiptFile.name
      .split(".")
      .pop()
      ?.toLowerCase() ||
    "jpg";

  const safeExt =
    /^[a-z0-9]+$/i.test(ext)
      ? ext
      : "jpg";

  const path =
    `orders/${orderNumber}-${Date.now()}.${safeExt}`;

  const config =
    window.MMK_CONFIG ||
    window.MENA_CONFIG;

  const bucket =
    config?.RECEIPTS_BUCKET ||
    "payment-receipts";

  const {
    data,
    error
  } =
    await window.supabaseClient.storage
      .from(bucket)
      .upload(
        path,
        receiptFile,
        {
          upsert: true,
          contentType:
            receiptFile.type
        }
      );

  if (error) {
    console.error(
      "خطأ في رفع الإيصال:",
      error
    );

    throw new Error(
      "تعذر رفع صورة الإيصال. تأكد من إعداد Storage في Supabase."
    );
  }

  const {
    data: publicData
  } =
    window.supabaseClient.storage
      .from(bucket)
      .getPublicUrl(path);

  return {
    path:
      data?.path || path,

    url:
      publicData?.publicUrl || null
  };
}

/* =========================================================
   إنشاء رقم الطلب
   ========================================================= */

function createOrderNumber() {
  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      now.getDate()
    ).padStart(2, "0");

  const random =
    Math.floor(
      1000 +
      Math.random() * 9000
    );

  return `MMK-${year}${month}${day}-${random}`;
}

function generateOrderNumber() {
  if (
    typeof window.generateOrderNumber ===
    "function" &&
    window.generateOrderNumber !==
      generateOrderNumber
  ) {
    return window.generateOrderNumber();
  }

  return createOrderNumber();
}

/* =========================================================
   إرسال الطلب
   ========================================================= */

async function submitOrder(e) {
  e.preventDefault();

  if (isSubmitting) {
    return;
  }

  const messageBox =
    document.getElementById(
      "checkoutMessage"
    );

  if (messageBox) {
    messageBox.style.display =
      "none";
  }

  const loggedIn =
    await requireCustomerLogin();

  if (!loggedIn) {
    return;
  }

  if (
    !validateCheckoutForm()
  ) {
    if (messageBox) {
      messageBox.style.display =
        "block";

      messageBox.className =
        "status-box error";

      messageBox.textContent =
        "الرجاء مراجعة الحقول المطلوبة وتصحيحها قبل المتابعة";

      messageBox.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }

    return;
  }

  isSubmitting = true;

  const submitBtn =
    document.getElementById(
      "confirmOrderBtn"
    );

  if (!submitBtn) {
    isSubmitting = false;
    return;
  }

  const originalText =
    submitBtn.textContent;

  submitBtn.disabled = true;

  submitBtn.innerHTML =
    `<span class="spinner"></span> جاري إرسال الطلب...`;

  try {
    const cart =
      getCheckoutCart();

    const subtotal =
      checkoutCartTotal();

    const shipping =
      selectedPaymentMethod ===
        "library_pickup"
        ? 0
        : Number(
            currentShippingPrice || 0
          );

    const total =
      subtotal + shipping;

    let prepaidAmount = 0;
    let remainingAmount = 0;

    if (
      selectedPaymentMethod ===
      "cod"
    ) {
      prepaidAmount =
        shipping;

      remainingAmount =
        total -
        prepaidAmount;
    }

    else if (
      selectedPaymentMethod ===
      "library_pickup"
    ) {
      prepaidAmount =
        total * 0.5;

      remainingAmount =
        total -
        prepaidAmount;
    }

    else {
      prepaidAmount =
        total;

      remainingAmount = 0;
    }

    const orderNumber =
      createOrderNumber();

    /*
     * نرفع الإيصال قبل إنشاء الطلب
     */
    const receiptData =
      await uploadReceiptImage(
        orderNumber
      );

    const govSelect =
      document.getElementById(
        "customerGovernorate"
      );

    const citySelect =
      document.getElementById(
        "customerCity"
      );

    const govName =
      govSelect
        ?.selectedOptions[0]
        ?.dataset.name ||
      govSelect?.value ||
      "";

    const cityName =
      citySelect
        ?.selectedOptions[0]
        ?.dataset.name ||
      citySelect?.value ||
      "";

    let customerUserId =
      null;

    let customerEmail =
      null;

    const {
      data: sessionData,
      error: sessionError
    } =
      await window.supabaseClient.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    const user =
      sessionData?.session?.user;

    if (!user) {
      throw new Error(
        "انتهت جلسة تسجيل الدخول. سجل الدخول مرة أخرى."
      );
    }

    customerUserId =
      user.id;

    customerEmail =
      user.email || null;

    const name =
      document.getElementById(
        "customerName"
      )?.value
      ?.trim() || "";

    const phone =
      document.getElementById(
        "customerPhone"
      )?.value
      ?.trim() || "";

    const address =
      document.getElementById(
        "customerAddress"
      )?.value
      ?.trim() || "";

    const notes =
      document.getElementById(
        "customerNotes"
      )?.value
      ?.trim() || "";

    const transactionNumber =
      document.getElementById(
        "transactionNumber"
      )?.value
      ?.trim() || "";

    /*
     * البيانات المرسلة لجدول orders
     */
    const orderPayload = {
      customer_name:
        name,

      customer_phone:
        phone,

      customer_user_id:
        customerUserId,

      customer_email:
        customerEmail,

      governorate:
        govName,

      area:
        cityName,

      locality:
        selectedVillage,

      address:
        address,

      notes:
        notes,

      payment_method:
        selectedPaymentMethod,

      products:
        cart,

      subtotal:
        subtotal,

      shipping:
        shipping,

      shipping_price:
        shipping,

      shipping_cost:
        shipping,

      total:
        total,

      transaction_number:
        transactionNumber,

      transaction_id:
        transactionNumber,

      receipt_image:
        receiptData.url,

      receipt_url:
        receiptData.url,

      receipt_path:
        receiptData.path,

      payment_status:
        "pending_verification",

      order_status:
        "pending_review",

      status:
        "pending_review",

      order_number:
        orderNumber,

      prepaid_amount:
        prepaidAmount,

      remaining_amount:
        remainingAmount,

      customer_payment_state:
        "awaiting_verification"
    };

    const config =
      window.MMK_CONFIG ||
      window.MENA_CONFIG;

    const ordersTable =
      config?.ORDERS_TABLE ||
      "orders";

    const {
      data,
      error
    } =
      await window.supabaseClient
        .from(ordersTable)
        .insert([
          orderPayload
        ])
        .select()
        .single();

    if (error) {
      console.error(
        "Supabase order error:",
        error
      );

      throw error;
    }

    /*
     * حفظ آخر طلب
     */
    if (config) {
      if (
        config.LAST_ORDER_ID_KEY &&
        data?.id
      ) {
        localStorage.setItem(
          config.LAST_ORDER_ID_KEY,
          data.id
        );
      }

      if (
        config.LAST_ORDER_NUMBER_KEY
      ) {
        localStorage.setItem(
          config.LAST_ORDER_NUMBER_KEY,
          orderNumber
        );
      }
    }

    /*
     * حذف السلة بعد نجاح الطلب
     */
    const cartKey =
      typeof CART_KEY !==
      "undefined"
        ? CART_KEY
        : "cart";

    localStorage.removeItem(
      cartKey
    );

    /*
     * الانتقال لصفحة النجاح
     */
    window.location.href =
      "success.html";

  } catch (error) {
    console.error(
      "خطأ في إرسال الطلب:",
      error
    );

    if (messageBox) {
      messageBox.style.display =
        "block";

      messageBox.className =
        "status-box error";

      /*
       * إظهار رسالة مفهومة بدل تفاصيل
       * Supabase التقنية للمستخدم
       */
      let message =
        "حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى.";

      if (
        error?.message
      ) {
        message =
          error.message;
      }

      messageBox.textContent =
        message;

      messageBox.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }

    submitBtn.disabled =
      false;

    submitBtn.textContent =
      originalText;

    isSubmitting = false;
  }
}

/* =========================================================
   طرق الدفع
   ========================================================= */

function setupPaymentMethodSelector() {
  const methods =
    document.querySelectorAll(
      ".payment-method"
    );

  methods.forEach((method) => {
    method.addEventListener(
      "click",
      () => {
        const methodName =
          method.dataset.method;

        if (
          methodName ===
            "library_pickup" &&
          !isLuxorGovernorate(
            selectedGovernorate
          )
        ) {
          showToast(
            "الاستلام من المكتبة متاح فقط داخل الأقصر",
            "error"
          );

          return;
        }

        methods.forEach(
          (item) => {
            item.classList.remove(
              "selected"
            );
          }
        );

        method.classList.add(
          "selected"
        );

        selectedPaymentMethod =
          methodName;

        updateLibraryPickupVisibility();

        updateShippingCalculation();

        updatePaymentAmounts();

        updatePaymentNumbers();
      }
    );
  });
}

/* =========================================================
   اختيار المحافظات والمراكز والقرى
   ========================================================= */

function setupLocationSelectors() {
  const govSelect =
    document.getElementById(
      "customerGovernorate"
    );

  const citySelect =
    document.getElementById(
      "customerCity"
    );

  const villageSelect =
    document.getElementById(
      "customerVillage"
    );

  if (
    !govSelect ||
    !citySelect ||
    !villageSelect
  ) {
    return;
  }

  govSelect.addEventListener(
    "change",
    () => {
      const option =
        govSelect
          .selectedOptions[0];

      selectedGovernorate =
        option?.dataset.name ||
        "";

      selectedCity = "";
      selectedVillage = "";
      currentShippingPrice =
        null;

      if (!govSelect.value) {
        citySelect.innerHTML =
          `<option value="">اختر المحافظة أولاً</option>`;

        citySelect.disabled =
          true;

        villageSelect.innerHTML =
          `<option value="">اختر المركز أولاً</option>`;

        villageSelect.disabled =
          true;

        setLocationStatus("");

        updateLibraryPickupVisibility();

        updateShippingCalculation();

        return;
      }

      populateCenters(
        govSelect.value
      );

      if (
        isLuxorGovernorate(
          selectedGovernorate
        )
      ) {
        setLocationStatus(
          "محافظة الأقصر لديها نظام شحن محلي خاص، كما يتاح الاستلام من مكتبة مينا.",
          "info"
        );
      } else {
        setLocationStatus("");
      }

      updateLibraryPickupVisibility();

      updateShippingCalculation();
    }
  );

  citySelect.addEventListener(
    "change",
    () => {
      const option =
        citySelect
          .selectedOptions[0];

      selectedCity =
        option?.dataset.name ||
        "";

      selectedVillage = "";

      if (!citySelect.value) {
        villageSelect.innerHTML =
          `<option value="">اختر المركز أولاً</option>`;

        villageSelect.disabled =
          true;

        updateShippingCalculation();

        return;
      }

      populateVillages(
        citySelect.value
      );

      updateShippingCalculation();
    }
  );

  villageSelect.addEventListener(
    "change",
    () => {
      selectedVillage =
        villageSelect.value ||
        "";

      updateShippingCalculation();
    }
  );
}

/* =========================================================
   رفع صورة الإيصال
   ========================================================= */

function setupReceiptUpload() {
  const uploadBox =
    document.getElementById(
      "receiptUploadBox"
    );

  const fileInput =
    document.getElementById(
      "paymentReceipt"
    );

  if (
    !uploadBox ||
    !fileInput
  ) {
    return;
  }

  uploadBox.addEventListener(
    "click",
    () => {
      fileInput.click();
    }
  );

  fileInput.addEventListener(
    "change",
    (event) => {
      const file =
        event.target.files?.[0];

      handleReceiptFile(file);
    }
  );

  uploadBox.addEventListener(
    "dragover",
    (event) => {
      event.preventDefault();

      uploadBox.classList.add(
        "drag-active"
      );
    }
  );

  uploadBox.addEventListener(
    "dragleave",
    () => {
      uploadBox.classList.remove(
        "drag-active"
      );
    }
  );

  uploadBox.addEventListener(
    "drop",
    (event) => {
      event.preventDefault();

      uploadBox.classList.remove(
        "drag-active"
      );

      const file =
        event.dataTransfer
          ?.files?.[0];

      if (file) {
        handleReceiptFile(
          file
        );
      }
    }
  );
}

/* =========================================================
   الهاتف
   ========================================================= */

function setupPhoneMask() {
  const phoneInput =
    document.getElementById(
      "customerPhone"
    );

  if (!phoneInput) {
    return;
  }

  phoneInput.addEventListener(
    "input",
    () => {
      phoneInput.value =
        phoneInput.value
          .replace(
            /[^0-9]/g,
            ""
          )
          .slice(0, 11);
    }
  );
}

/* =========================================================
   تعبئة بيانات العميل من الحساب
   ========================================================= */

async function prefillFromCustomerSession() {
  if (
    !window.supabaseClient
  ) {
    return;
  }

  try {
    const {
      data
    } =
      await window.supabaseClient.auth.getSession();

    const user =
      data?.session?.user;

    if (!user) {
      return;
    }

    const meta =
      user.user_metadata ||
      {};

    const nameField =
      document.getElementById(
        "customerName"
      );

    const phoneField =
      document.getElementById(
        "customerPhone"
      );

    if (
      nameField &&
      !nameField.value &&
      meta.full_name
    ) {
      nameField.value =
        meta.full_name;
    }

    if (
      phoneField &&
      !phoneField.value &&
      meta.phone
    ) {
      phoneField.value =
        meta.phone;
    }

  } catch (error) {
    console.warn(
      "تعذر تعبئة بيانات العميل تلقائيًا:",
      error
    );
  }
}

/* =========================================================
   بداية الصفحة
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    const isLoggedIn =
      await requireCustomerLogin();

    if (!isLoggedIn) {
      return;
    }

    if (
      checkoutCartQuantity() ===
      0
    ) {
      showToast(
        "سلتك فارغة، الرجاء إضافة منتجات أولاً",
        "error"
      );

      setTimeout(() => {
        window.location.href =
          "cart.html";
      }, 1200);

      return;
    }

    /*
     * تشغيل الصفحة
     */
    renderCheckoutSummary();

    setupLocationSelectors();

    setupPaymentMethodSelector();

    setupReceiptUpload();

    setupPhoneMask();

    updateLibraryPickupVisibility();

    updatePaymentNumbers();

    updatePaymentAmounts();

    /*
     * تحميل بيانات المحافظات
     */
    await loadLocationData();

    /*
     * تعبئة بيانات الحساب
     */
    await prefillFromCustomerSession();

    /*
     * نموذج الطلب
     */
    const checkoutForm =
      document.getElementById(
        "checkoutForm"
      );

    if (checkoutForm) {
      checkoutForm.addEventListener(
        "submit",
        submitOrder
      );
    }

  }
);

