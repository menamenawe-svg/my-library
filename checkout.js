
/* =========================================================
   checkout.js — متجر أم أم كي
   نسخة متوافقة بالكامل مع checkout.html
   ========================================================= */

/* =========================================================
   إعدادات الشحن
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

/* الأقصر لها نظام شحن خاص */
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
   أرقام الدفع
   ========================================================= */

const PAYMENT_NUMBERS = {
  orange_cash: "01206439150",
  instapay: "01225182025"
};

/* =========================================================
   بيانات الموقع
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
   روابط البيانات
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
   أدوات مساعدة
   ========================================================= */

function normalizeArabic(str) {
  if (!str) return "";

  return String(str)
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

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
    new Intl.NumberFormat("ar-EG", {
      maximumFractionDigits: 2
    }).format(number) + " ج.م"
  );
}

function showToast(message, type = "info") {
  if (typeof window.showToast === "function") {
    window.showToast(message, type);
    return;
  }

  const container =
    document.getElementById("toastContainer");

  if (!container) {
    alert(message);
    return;
  }

  const toast = document.createElement("div");

  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3500);
}

/* =========================================================
   الأقصر
   ========================================================= */

function isLuxorGovernorate(name) {
  if (!name) return false;

  const normalized = normalizeArabic(name);

  return LUXOR_NAMES.some(
    (item) =>
      normalizeArabic(item) === normalized
  );
}

function findLuxorAreaPrice(areaName) {
  if (!areaName) return null;

  const normalized = normalizeArabic(areaName);

  for (const key in LUXOR_AREA_PRICES) {
    if (
      normalizeArabic(key) === normalized
    ) {
      return LUXOR_AREA_PRICES[key];
    }
  }

  return null;
}

/* =========================================================
   سعر الشحن
   ========================================================= */

function getShippingPriceForGovernorate(govName) {
  if (!govName) return null;

  if (isLuxorGovernorate(govName)) {
    return LUXOR_DEFAULT_PRICE;
  }

  if (
    SHIPPING_PRICES[govName] !== undefined
  ) {
    return SHIPPING_PRICES[govName];
  }

  const normalized =
    normalizeArabic(govName);

  for (const key in SHIPPING_PRICES) {
    if (
      normalizeArabic(key) === normalized
    ) {
      return SHIPPING_PRICES[key];
    }
  }

  return 140;
}

/* =========================================================
   استخراج أسماء البيانات
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
    c?.governorateId ??
    c?.governorate
  );
}

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
    v?.centerId ??
    v?.center
  );
}

/* =========================================================
   تحميل البيانات
   ========================================================= */

async function fetchJSON(url) {
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}`
    );
  }

  return await response.json();
}

async function loadLocationData() {
  const govSelect =
    document.getElementById(
      "customerGovernorate"
    );

  try {
    const results =
      await Promise.allSettled([
        fetchJSON(DATA_URLS.governorates),
        fetchJSON(DATA_URLS.centers),
        fetchJSON(DATA_URLS.villages)
      ]);

    if (
      results[0].status === "fulfilled"
    ) {
      GOVERNORATES =
        Array.isArray(results[0].value)
          ? results[0].value
          : [];
    }

    if (
      results[1].status === "fulfilled"
    ) {
      CENTERS =
        Array.isArray(results[1].value)
          ? results[1].value
          : [];
    }

    if (
      results[2].status === "fulfilled"
    ) {
      VILLAGES =
        Array.isArray(results[2].value)
          ? results[2].value
          : [];
    }

    if (GOVERNORATES.length === 0) {
      throw new Error(
        "لم يتم تحميل المحافظات"
      );
    }

    populateGovernorates();

    if (
      CENTERS.length === 0 ||
      VILLAGES.length === 0
    ) {
      setLocationStatus(
        "تم تحميل المحافظات، لكن بعض بيانات المراكز أو القرى غير متاحة حاليًا.",
        "info"
      );
    }

  } catch (error) {
    console.error(
      "Location data error:",
      error
    );

    if (govSelect) {
      govSelect.innerHTML = `
        <option value="">
          تعذر تحميل المحافظات
        </option>
      `;
    }

    setLocationStatus(
      "تعذر تحميل بيانات المحافظات. تأكد من اتصال الإنترنت ثم حدّث الصفحة.",
      "error"
    );
  }
}

/* =========================================================
   المحافظات
   ========================================================= */

function populateGovernorates() {
  const select =
    document.getElementById(
      "customerGovernorate"
    );

  if (!select) return;

  select.innerHTML = `
    <option value="">
      اختر المحافظة
    </option>
  `;

  GOVERNORATES.forEach((gov) => {
    const name = getGovName(gov);
    const id = getGovId(gov);

    if (!name) return;

    const option =
      document.createElement("option");

    option.value = id;
    option.textContent = name;
    option.dataset.name = name;

    select.appendChild(option);
  });
}

/* =========================================================
   المراكز
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

  if (!citySelect || !villageSelect) {
    return;
  }

  citySelect.innerHTML = `
    <option value="">
      اختر المركز
    </option>
  `;

  villageSelect.innerHTML = `
    <option value="">
      اختر المركز أولاً
    </option>
  `;

  citySelect.disabled = true;
  villageSelect.disabled = true;

  const filtered =
    CENTERS.filter((center) => {
      const centerGovId =
        getCenterGovId(center);

      return (
        String(centerGovId) ===
        String(govId)
      );
    });

  if (filtered.length === 0) {
    citySelect.innerHTML = `
      <option value="">
        لا توجد مراكز متاحة
      </option>
    `;

    return;
  }

  filtered.forEach((center) => {
    const name =
      getCenterName(center);

    const id =
      getCenterId(center);

    if (!name) return;

    const option =
      document.createElement("option");

    option.value = id;
    option.textContent = name;
    option.dataset.name = name;

    citySelect.appendChild(option);
  });

  citySelect.disabled = false;
}

/* =========================================================
   القرى
   ========================================================= */

function populateVillages(centerId) {
  const select =
    document.getElementById(
      "customerVillage"
    );

  if (!select) return;

  select.innerHTML = `
    <option value="">
      اختر القرية / الحي
    </option>
  `;

  select.disabled = true;

  const filtered =
    VILLAGES.filter((village) => {
      return (
        String(
          getVillageCenterId(village)
        ) === String(centerId)
      );
    });

  if (filtered.length === 0) {
    select.innerHTML = `
      <option value="">
        لا توجد قرى متاحة
      </option>
    `;

    return;
  }

  filtered.forEach((village) => {
    const name =
      getVillageName(village);

    if (!name) return;

    const option =
      document.createElement("option");

    option.value = name;
    option.textContent = name;

    select.appendChild(option);
  });

  select.disabled = false;
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
   الاستلام من المكتبة
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
  const status =
    document.getElementById(
      "shippingStatus"
    );

  const text =
    document.getElementById(
      "shippingPriceText"
    );

  if (!status || !text) return;

  updateLibraryPickupVisibility();

  if (!selectedGovernorate) {
    currentShippingPrice = null;

    text.textContent =
      "اختر المحافظة والمنطقة لحساب سعر الشحن";

    status.className =
      "status-box info";

    updateOrderTotals();
    return;
  }

  const luxor =
    isLuxorGovernorate(
      selectedGovernorate
    );

  if (
    luxor &&
    selectedPaymentMethod ===
      "library_pickup"
  ) {
    currentShippingPrice = 0;

    text.textContent =
      "الاستلام من مكتبة مينا في الأقصر — بدون مصاريف شحن";

    status.className =
      "status-box success";

    updateOrderTotals();
    return;
  }

  if (luxor) {
    const areaPrice =
      findLuxorAreaPrice(
        selectedVillage
      );

    if (areaPrice !== null) {
      currentShippingPrice =
        areaPrice;

      text.textContent =
        `سعر الشحن لمنطقتك في الأقصر: ${formatPrice(
          areaPrice
        )}`;
    } else {
      currentShippingPrice =
        LUXOR_DEFAULT_PRICE;

      text.textContent =
        `سعر الشحن الافتراضي للأقصر: ${formatPrice(
          LUXOR_DEFAULT_PRICE
        )}`;
    }
  } else {
    currentShippingPrice =
      getShippingPriceForGovernorate(
        selectedGovernorate
      );

    text.textContent =
      `سعر الشحن إلى ${selectedGovernorate}: ${formatPrice(
        currentShippingPrice
      )}`;
  }

  status.className =
    "status-box success";

  updateOrderTotals();
}

/* =========================================================
   السلة
   ========================================================= */

function getCheckoutCart() {
  try {
    if (
      typeof getCart === "function"
    ) {
      const cart = getCart();

      return Array.isArray(cart)
        ? cart
        : [];
    }
  } catch (error) {
    console.warn(
      "getCart error:",
      error
    );
  }

  const key =
    typeof CART_KEY !== "undefined"
      ? CART_KEY
      : "cart";

  try {
    const cart =
      JSON.parse(
        localStorage.getItem(key)
      );

    return Array.isArray(cart)
      ? cart
      : [];
  } catch {
    return [];
  }
}

function getCartQuantitySafe() {
  const cart =
    getCheckoutCart();

  return cart.reduce(
    (sum, item) =>
      sum +
      Number(
        item.quantity || 1
      ),
    0
  );
}

function getCartTotalSafe() {
  const cart =
    getCheckoutCart();

  return cart.reduce(
    (sum, item) =>
      sum +
      Number(item.price || 0) *
        Number(
          item.quantity || 1
        ),
    0
  );
}

/* =========================================================
   ملخص الطلب
   ========================================================= */

function renderCheckoutSummary() {
  const container =
    document.getElementById(
      "checkoutItems"
    );

  if (!container) return;

  const cart =
    getCheckoutCart();

  if (cart.length === 0) {
    container.innerHTML = `
      <p class="checkout-empty-message">
        السلة فارغة
      </p>
    `;

    updateOrderTotals();
    return;
  }

  container.innerHTML =
    cart
      .map((item) => {
        const image =
          typeof item.image ===
          "string"
            ? item.image
            : "";

        /*
          لا نستخدم via.placeholder.com
          حتى لا تظهر ERR_CONNECTION_CLOSED
        */

        const imageHTML = image
          ? `
            <img
              src="${escapeHTML(image)}"
              alt="${escapeHTML(
                item.name || "منتج"
              )}"
              onerror="
                this.style.display='none';
              "
            >
          `
          : `
            <div
              class="checkout-no-image"
              aria-hidden="true"
            >
              🛍️
            </div>
          `;

        return `
          <div class="checkout-summary-item">

            ${imageHTML}

            <div>
              <div class="name">
                ${escapeHTML(
                  item.name ||
                    "منتج"
                )}
              </div>

              <div class="meta">
                الكمية:
                ${Number(
                  item.quantity || 1
                )}
              </div>
            </div>

            <div class="price">
              ${formatPrice(
                Number(
                  item.price || 0
                ) *
                  Number(
                    item.quantity || 1
                  )
              )}
            </div>

          </div>
        `;
      })
      .join("");

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
      getCartQuantitySafe();
  }

  if (subtotal) {
    subtotal.textContent =
      formatPrice(
        getCartTotalSafe()
      );
  }

  updateOrderTotals();
}

/* =========================================================
   إجمالي الطلب
   ========================================================= */

function updateOrderTotals() {
  const subtotal =
    getCartTotalSafe();

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
    getCartTotalSafe();

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
  } else if (
    selectedPaymentMethod ===
    "library_pickup"
  ) {
    prepaid =
      total * 0.5;

    remaining =
      total - prepaid;

    if (instructions) {
      instructions.textContent =
        "الاستلام من مكتبة مينا في الأقصر: يتم دفع 50% من قيمة الطلب مقدمًا لتأكيد الطلب، ودفع 50% المتبقية عند الاستلام.";
    }
  } else {
    prepaid = total;
    remaining = 0;

    const method =
      selectedPaymentMethod ===
      "orange_cash"
        ? "Orange Cash"
        : "InstaPay";

    if (instructions) {
      instructions.textContent =
        `يتم دفع إجمالي قيمة الطلب مقدمًا عبر ${method}، ثم إرفاق رقم العملية وصورة الإيصال.`;
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
  if (
    !window.supabaseClient
  ) {
    alert(
      "تعذر الاتصال بنظام تسجيل الدخول."
    );

    window.location.href =
      "login.html";

    return false;
  }

  try {
    const { data, error } =
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
      "Session error:",
      error
    );

    window.location.href =
      "login.html";

    return false;
  }
}

/* =========================================================
   الهاتف
   ========================================================= */

function validateEgyptianPhone(phone) {
  return /^01[0125][0-9]{8}$/.test(
    String(phone).trim()
  );
}

function setupPhoneMask() {
  const input =
    document.getElementById(
      "customerPhone"
    );

  if (!input) return;

  input.addEventListener(
    "input",
    () => {
      input.value =
        input.value
          .replace(/[^0-9]/g, "")
          .slice(0, 11);
    }
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
    document.getElementById(
      fieldId
    );

  const row =
    field?.closest(
      ".form-row"
    );

  if (row) {
    row.classList.toggle(
      "invalid",
      Boolean(hasError)
    );
  }
}

/* =========================================================
   التحقق من النموذج
   ========================================================= */

function validateCheckoutForm() {
  let valid = true;

  const name =
    document
      .getElementById(
        "customerName"
      )
      ?.value.trim() || "";

  const phone =
    document
      .getElementById(
        "customerPhone"
      )
      ?.value.trim() || "";

  const address =
    document
      .getElementById(
        "customerAddress"
      )
      ?.value.trim() || "";

  const gov =
    document.getElementById(
      "customerGovernorate"
    )?.value || "";

  const city =
    document.getElementById(
      "customerCity"
    )?.value || "";

  const village =
    document.getElementById(
      "customerVillage"
    )?.value || "";

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

  setFieldError(
    "customerCity",
    !city
  );

  setFieldError(
    "customerVillage",
    !village
  );

  setFieldError(
    "customerAddress",
    !address
  );

  if (!gov) valid = false;
  if (!city) valid = false;
  if (!village) valid = false;
  if (!address) valid = false;

  selectedGovernorate =
    document
      .getElementById(
        "customerGovernorate"
      )
      ?.selectedOptions[0]
      ?.dataset.name ||
    selectedGovernorate ||
    "";

  selectedCity =
    document
      .getElementById(
        "customerCity"
      )
      ?.selectedOptions[0]
      ?.dataset.name ||
    selectedCity ||
    "";

  selectedVillage =
    village;

  /* الاستلام من المكتبة */
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

  /* لازم يكون سعر الشحن معروف */
  if (
    currentShippingPrice === null
  ) {
    updateShippingCalculation();
  }

  /* رقم العملية */
  const transactionField =
    document.getElementById(
      "transactionNumber"
    );

  /*
    في كل الحالات التي يوجد فيها مبلغ
    مقدم يتم طلب رقم العملية والإيصال.
  */
  const transactionNumber =
    transactionField
      ?.value.trim() || "";

  setFieldError(
    "transactionNumber",
    !transactionNumber
  );

  if (!transactionNumber) {
    valid = false;
  }

  /* الإيصال */
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
    getCartQuantitySafe() <= 0
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
   رفع الإيصال
   ========================================================= */

function handleReceiptFile(file) {
  if (!file) return;

  if (
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
    preview.src =
      URL.createObjectURL(
        file
      );

    preview.classList.add(
      "show"
    );
  }

  document
    .getElementById(
      "paymentReceipt"
    )
    ?.closest(".form-row")
    ?.classList.remove(
      "invalid"
    );

  showToast(
    "تم اختيار صورة الإيصال بنجاح ✅",
    "success"
  );
}

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
      "Supabase غير متصل"
    );
  }

  const ext =
    (
      receiptFile.name
        .split(".")
        .pop() ||
      "jpg"
    )
      .toLowerCase()
      .replace(
        /[^a-z0-9]/g,
        ""
      ) || "jpg";

  const path =
    `orders/${orderNumber}-${Date.now()}.${ext}`;

  const config =
    window.MMK_CONFIG ||
    window.MENA_CONFIG ||
    {};

  const bucket =
    config.RECEIPTS_BUCKET ||
    "payment-receipts";

  const { data, error } =
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
      "Receipt upload error:",
      error
    );

    throw new Error(
      "تعذر رفع صورة الإيصال: " +
        error.message
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
      publicData?.publicUrl ||
      null
  };
}

/* =========================================================
   توليد رقم الطلب
   ========================================================= */

function generateCheckoutOrderNumber() {
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
        Math.random() *
          9000
    );

  return `MMK-${year}${month}${day}-${random}`;
}

function getOrderNumber() {
  if (
    typeof generateOrderNumber ===
    "function"
  ) {
    return generateOrderNumber();
  }

  return generateCheckoutOrderNumber();
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

  if (!validateCheckoutForm()) {
    if (messageBox) {
      messageBox.style.display =
        "block";

      messageBox.className =
        "status-box error";

      messageBox.textContent =
        "الرجاء مراجعة البيانات المطلوبة وتصحيح الحقول الناقصة.";

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

  submitBtn.innerHTML = `
    <span class="spinner"></span>
    جاري إرسال الطلب...
  `;

  try {
    const cart =
      getCheckoutCart();

    const subtotal =
      getCartTotalSafe();

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
    } else if (
      selectedPaymentMethod ===
      "library_pickup"
    ) {
      prepaidAmount =
        total * 0.5;

      remainingAmount =
        total -
        prepaidAmount;
    } else {
      prepaidAmount =
        total;

      remainingAmount = 0;
    }

    const orderNumber =
      getOrderNumber();

    /*
      نرفع الإيصال أولاً
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
      selectedGovernorate ||
      govSelect?.value ||
      "";

    const cityName =
      citySelect
        ?.selectedOptions[0]
        ?.dataset.name ||
      selectedCity ||
      citySelect?.value ||
      "";

    const villageName =
      document.getElementById(
        "customerVillage"
      )?.value ||
      selectedVillage ||
      "";

    /* بيانات المستخدم */
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
        "يجب تسجيل الدخول أولًا لإتمام الطلب."
      );
    }

    const customerUserId =
      user.id;

    const customerEmail =
      user.email || null;

    /* بيانات العميل */
    const customerName =
      document
        .getElementById(
          "customerName"
        )
        ?.value.trim() || "";

    const customerPhone =
      document
        .getElementById(
          "customerPhone"
        )
        ?.value.trim() || "";

    const customerAddress =
      document
        .getElementById(
          "customerAddress"
        )
        ?.value.trim() || "";

    const customerNotes =
      document
        .getElementById(
          "customerNotes"
        )
        ?.value.trim() || "";

    const transactionNumber =
      document
        .getElementById(
          "transactionNumber"
        )
        ?.value.trim() || "";

    /*
      بيانات الطلب
    */
    const orderPayload = {
      customer_name:
        customerName,

      customer_phone:
        customerPhone,

      customer_user_id:
        customerUserId,

      customer_email:
        customerEmail,

      governorate:
        govName,

      area:
        cityName,

      locality:
        villageName,

      address:
        customerAddress,

      notes:
        customerNotes,

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
      window.MENA_CONFIG ||
      {};

    const ordersTable =
      config.ORDERS_TABLE ||
      "orders";

    /*
      إدخال الطلب في Supabase
    */
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
      حفظ آخر طلب
    */
    if (config.LAST_ORDER_ID_KEY) {
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

    /*
      احتياطي إضافي
    */
    localStorage.setItem(
      "mmk_last_order_id",
      data.id
    );

    localStorage.setItem(
      "mmk_last_order_number",
      orderNumber
    );

    /*
      تفريغ السلة
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
      الانتقال لصفحة النجاح
    */
    window.location.href =
      "success.html";

  } catch (error) {
    console.error(
      "Submit order error:",
      error
    );

    if (messageBox) {
      messageBox.style.display =
        "block";

      messageBox.className =
        "status-box error";

      messageBox.textContent =
        error?.message ||
        "حدث خطأ أثناء إرسال الطلب، الرجاء المحاولة مرة أخرى.";

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
            "الاستلام من المكتبة متاح فقط داخل الأقصر.",
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
   اختيار المحافظة والمركز والقرية
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

  /*
    المحافظة
  */
  govSelect.addEventListener(
    "change",
    () => {
      const option =
        govSelect.selectedOptions[0];

      selectedGovernorate =
        option?.dataset.name ||
        "";

      selectedCity = "";
      selectedVillage = "";
      currentShippingPrice =
        null;

      citySelect.innerHTML = `
        <option value="">
          اختر المركز
        </option>
      `;

      citySelect.disabled =
        true;

      villageSelect.innerHTML = `
        <option value="">
          اختر المركز أولاً
        </option>
      `;

      villageSelect.disabled =
        true;

      if (!govSelect.value) {
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

  /*
    المركز
  */
  citySelect.addEventListener(
    "change",
    () => {
      const option =
        citySelect.selectedOptions[0];

      selectedCity =
        option?.dataset.name ||
        "";

      selectedVillage = "";

      villageSelect.innerHTML = `
        <option value="">
          اختر القرية / الحي
        </option>
      `;

      villageSelect.disabled =
        true;

      if (!citySelect.value) {
        updateShippingCalculation();
        return;
      }

      populateVillages(
        citySelect.value
      );

      updateShippingCalculation();
    }
  );

  /*
    القرية
  */
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
   رفع الإيصال
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

  if (!uploadBox || !fileInput) {
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
      handleReceiptFile(
        event.target.files?.[0]
      );
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
        handleReceiptFile(file);
      }
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
    const { data } =
      await window.supabaseClient.auth.getSession();

    const user =
      data?.session?.user;

    if (!user) return;

    const metadata =
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
      !nameField.value
    ) {
      const name =
        metadata.full_name ||
        metadata.name ||
        "";

      if (name) {
        nameField.value =
          name;
      }
    }

    if (
      phoneField &&
      !phoneField.value
    ) {
      const phone =
        metadata.phone ||
        "";

      if (phone) {
        phoneField.value =
          phone
            .replace(
              /[^0-9]/g,
              ""
            )
            .slice(0, 11);
      }
    }
  } catch (error) {
    console.warn(
      "Prefill error:",
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
    /*
      التأكد من تسجيل الدخول
    */
    const loggedIn =
      await requireCustomerLogin();

    if (!loggedIn) {
      return;
    }

    /*
      التأكد أن السلة ليست فارغة
    */
    if (
      getCartQuantitySafe() <= 0
    ) {
      showToast(
        "سلتك فارغة، الرجاء إضافة منتجات أولاً.",
        "error"
      );

      setTimeout(() => {
        window.location.href =
          "cart.html";
      }, 1200);

      return;
    }

    /*
      تشغيل الصفحة
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
      تحميل المحافظات والمراكز والقرى
    */
    await loadLocationData();

    /*
      تعبئة بيانات العميل
    */
    await prefillFromCustomerSession();

    /*
      ربط الفورم
    */
    const form =
      document.getElementById(
        "checkoutForm"
      );

    if (form) {
      form.addEventListener(
        "submit",
        submitOrder
      );
    }
  }
);

/* =========================================================
   تصدير بعض الدوال عند الحاجة
   ========================================================= */

window.MMCheckout = {
  updateShippingCalculation,
  updatePaymentAmounts,
  updatePaymentNumbers,
  renderCheckoutSummary,
  getShippingPriceForGovernorate,
  isLuxorGovernorate
};

