
/* =========================================================
   checkout.js — متجر أم أم كي
   متوافق مع checkout.html
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
let selectedGovernorateId = "";

let selectedCity = "";
let selectedCityId = "";

let selectedVillage = "";

let currentShippingPrice = null;

let selectedPaymentMethod = "cod";

let receiptFile = null;

let isSubmitting = false;

/* =========================================================
   أدوات عامة
   ========================================================= */

function formatPrice(value) {
  const number = Number(value) || 0;

  return `${number.toLocaleString("ar-EG")} ج.م`;
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

/* =========================================================
   تطبيع النص العربي
   ========================================================= */

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

/* =========================================================
   الأقصر
   ========================================================= */

function isLuxorGovernorate(name) {
  if (!name) return false;

  const normalized = normalizeArabic(name);

  return LUXOR_NAMES.some(
    (item) => normalizeArabic(item) === normalized
  );
}

function findLuxorAreaPrice(areaName) {
  if (!areaName) return null;

  const normalized = normalizeArabic(areaName);

  for (const key in LUXOR_AREA_PRICES) {
    if (normalizeArabic(key) === normalized) {
      return LUXOR_AREA_PRICES[key];
    }
  }

  for (const key in LUXOR_AREA_PRICES) {
    const normalizedKey = normalizeArabic(key);

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

  const normalized = normalizeArabic(govName);

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
   بيانات المحافظات
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
   بيانات المراكز
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
    c?.governorateId ??
    c?.governorate
  );
}

/* =========================================================
   بيانات القرى
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
    v?.centerId ??
    v?.center_govId
  );
}

/* =========================================================
   تحميل بيانات الموقع
   ========================================================= */

async function loadLocationData() {
  const govSelect =
    document.getElementById(
      "customerGovernorate"
    );

  if (!govSelect) return;

  try {
    govSelect.innerHTML =
      `<option value="">جاري تحميل المحافظات...</option>`;

    govSelect.disabled = true;

    const responses = await Promise.all([
      fetch(DATA_URLS.governorates),
      fetch(DATA_URLS.centers),
      fetch(DATA_URLS.villages)
    ]);

    const [govRes, centerRes, villageRes] =
      responses;

    if (
      !govRes.ok ||
      !centerRes.ok ||
      !villageRes.ok
    ) {
      throw new Error(
        "فشل تحميل بيانات المحافظات والمراكز والقرى"
      );
    }

    GOVERNORATES =
      await govRes.json();

    CENTERS =
      await centerRes.json();

    VILLAGES =
      await villageRes.json();

    if (!Array.isArray(GOVERNORATES)) {
      throw new Error(
        "بيانات المحافظات غير صحيحة"
      );
    }

    if (!Array.isArray(CENTERS)) {
      throw new Error(
        "بيانات المراكز غير صحيحة"
      );
    }

    if (!Array.isArray(VILLAGES)) {
      throw new Error(
        "بيانات القرى غير صحيحة"
      );
    }

    populateGovernorates();

    setLocationStatus(
      "",
      "info"
    );

  } catch (error) {
    console.error(
      "تعذر تحميل بيانات الموقع:",
      error
    );

    govSelect.disabled = true;

    govSelect.innerHTML =
      `<option value="">تعذر تحميل المحافظات</option>`;

    setLocationStatus(
      "تعذر تحميل بيانات المحافظات والمراكز والقرى. تأكد من اتصال الإنترنت ثم حدّث الصفحة.",
      "error"
    );
  }
}

/* =========================================================
   المحافظات
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

    const id =
      getGovId(gov);

    if (!name) return;

    const option =
      document.createElement("option");

    option.value = String(id);

    option.textContent = name;

    option.dataset.name = name;

    option.dataset.id = String(id);

    govSelect.appendChild(option);
  });

  govSelect.disabled =
    GOVERNORATES.length === 0;
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

  citySelect.innerHTML =
    `<option value="">اختر المركز</option>`;

  citySelect.disabled = true;

  villageSelect.innerHTML =
    `<option value="">اختر المركز أولاً</option>`;

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
    citySelect.innerHTML =
      `<option value="">لا توجد مراكز متاحة</option>`;

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

    option.value = String(id);

    option.textContent = name;

    option.dataset.name = name;

    option.dataset.id = String(id);

    citySelect.appendChild(option);
  });

  citySelect.disabled = false;
}

/* =========================================================
   القرى
   ========================================================= */

function populateVillages(centerId) {
  const villageSelect =
    document.getElementById(
      "customerVillage"
    );

  if (!villageSelect) return;

  villageSelect.innerHTML =
    `<option value="">اختر القرية / الحي</option>`;

  villageSelect.disabled = true;

  const filtered =
    VILLAGES.filter((village) => {
      const villageCenterId =
        getVillageCenterId(village);

      return (
        String(villageCenterId) ===
        String(centerId)
      );
    });

  if (filtered.length === 0) {
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

    option.value = name;

    option.textContent = name;

    option.dataset.name = name;

    villageSelect.appendChild(option);
  });

  villageSelect.disabled = false;
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
    box.textContent = "";
    box.style.display = "none";
    box.className =
      "status-box info u-hidden";
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
   حقول الدفع
   ========================================================= */

function updatePaymentFieldsVisibility() {
  const transactionRow =
    document.querySelector(
      ".transaction-row"
    );

  const receiptInput =
    document.getElementById(
      "paymentReceipt"
    );

  const receiptRow =
    receiptInput?.closest(
      ".form-row"
    );

  const needsReceipt =
    selectedPaymentMethod !== "cod";

  if (transactionRow) {
    transactionRow.style.display =
      needsReceipt
        ? ""
        : "none";
  }

  if (receiptRow) {
    receiptRow.style.display =
      needsReceipt
        ? ""
        : "none";
  }

  if (!needsReceipt) {
    transactionRow
      ?.classList.remove(
        "invalid"
      );

    receiptRow
      ?.classList.remove(
        "invalid"
      );
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
        <div class="payment-number-icon">🟠</div>

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
        <div class="payment-number-icon">🏦</div>

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

  if (
    selectedPaymentMethod ===
    "library_pickup"
  ) {
    box.hidden = false;

    box.innerHTML = `
      <div class="payment-number-content">
        <div class="payment-number-icon">🏪</div>

        <div>
          <strong>الاستلام من مكتبة مينا</strong>

          <div class="payment-number-line">
            يتم دفع 50% مقدمًا لتأكيد الطلب.
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

  if (!shippingStatus || !shippingText) {
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
        `سعر الشحن الافتراضي للأقصر: ${formatPrice(
          LUXOR_DEFAULT_PRICE
        )} — اختر القرية / الحي للسعر الدقيق`;
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
   ملخص الطلب
   ========================================================= */

function renderCheckoutSummary() {
  const cart =
    getCart();

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
            escapeHTML(
              item.image
            ) ||
            "https://via.placeholder.com/60";

          const name =
            escapeHTML(
              item.name
            );

          const quantity =
            Number(item.quantity) || 1;

          const price =
            Number(item.price) || 0;

          return `
            <div class="checkout-summary-item">

              <img
                src="${image}"
                alt="${name}"
                onerror="
                  this.src='https://via.placeholder.com/60'
                "
              >

              <div>
                <div class="name">
                  ${name}
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
      cartQuantity();
  }

  if (subtotal) {
    subtotal.textContent =
      formatPrice(
        cartTotal()
      );
  }

  updateOrderTotals();
}

/* =========================================================
   إجمالي الطلب
   ========================================================= */

function updateOrderTotals() {
  const subtotal =
    Number(cartTotal()) || 0;

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
    Number(cartTotal()) || 0;

  let shipping =
    Number(currentShippingPrice) || 0;

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

  updatePaymentFieldsVisibility();
  updatePaymentNumbers();
}

/* =========================================================
   تسجيل الدخول
   ========================================================= */

async function requireCustomerLogin() {
  if (!window.supabaseClient) {
    alert(
      "تعذر الاتصال بنظام تسجيل الدخول."
    );

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
   الهاتف
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

  if (
    !nameField ||
    !phoneField ||
    !addressField ||
    !govField ||
    !cityField ||
    !villageField
  ) {
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
    validateEgyptianPhone(
      phone
    );

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

  /* -----------------------------------------
     التحقق من الدفع
     COD لا يحتاج رقم عملية أو إيصال
     ----------------------------------------- */

  const needsReceipt =
    selectedPaymentMethod !==
    "cod";

  const transactionField =
    document.getElementById(
      "transactionNumber"
    );

  const receiptInput =
    document.getElementById(
      "paymentReceipt"
    );

  if (needsReceipt) {
    const transactionNumber =
      transactionField
        ?.value
        .trim() || "";

    setFieldError(
      "transactionNumber",
      !transactionNumber
    );

    if (!transactionNumber) {
      valid = false;
    }

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
  } else {
    setFieldError(
      "transactionNumber",
      false
    );
  }

  if (cartQuantity() === 0) {
    showToast(
      "السلة فارغة، لا يمكن إتمام الطلب",
      "error"
    );

    valid = false;
  }

  return valid;
}

/* =========================================================
   رفع صورة الإيصال
   ========================================================= */

function handleReceiptFile(file) {
  if (!file) return;

  if (!file.type.startsWith("image/")) {
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

  const reader =
    new FileReader();

  reader.onload = (event) => {
    const preview =
      document.getElementById(
        "receiptPreview"
      );

    if (!preview) return;

    preview.src =
      event.target.result;

    preview.classList.add(
      "show"
    );
  };

  reader.readAsDataURL(file);

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

  const ext =
    receiptFile.name
      .split(".")
      .pop() ||
    "jpg";

  const safeExt =
    ext
      .toLowerCase()
      .replace(
        /[^a-z0-9]/g,
        ""
      ) || "jpg";

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
      "تعذر رفع صورة إيصال الدفع. حاول مرة أخرى."
    );
  }

  const {
    data: publicUrlData
  } =
    window.supabaseClient.storage
      .from(bucket)
      .getPublicUrl(path);

  return {
    path:
      data?.path ||
      path,

    url:
      publicUrlData?.publicUrl ||
      null
  };
}

/* =========================================================
   إنشاء رقم الطلب
   ========================================================= */

function generateOrderNumber() {
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
    `<span class="spinner"></span>
     جاري إرسال الطلب...`;

  try {
    const cart =
      getCart();

    const subtotal =
      Number(cartTotal()) || 0;

    const shipping =
      selectedPaymentMethod ===
      "library_pickup"
        ? 0
        : Number(
            currentShippingPrice
          ) || 0;

    const total =
      subtotal +
      shipping;

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
      generateOrderNumber();

    /* -----------------------------------------
       بيانات الموقع
       ----------------------------------------- */

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

    const villageName =
      villageSelect
        ?.selectedOptions[0]
        ?.dataset.name ||
      villageSelect?.value ||
      "";

    /* -----------------------------------------
       بيانات المستخدم
       ----------------------------------------- */

    let customerUserId = null;
    let customerEmail = null;

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

    customerUserId =
      user.id;

    customerEmail =
      user.email || null;

    /* -----------------------------------------
       رفع الإيصال
       ----------------------------------------- */

    let receiptData = {
      path: null,
      url: null
    };

    if (
      selectedPaymentMethod !==
      "cod"
    ) {
      receiptData =
        await uploadReceiptImage(
          orderNumber
        );
    }

    /* -----------------------------------------
       رقم العملية
       ----------------------------------------- */

    const transactionField =
      document.getElementById(
        "transactionNumber"
      );

    const transactionNumber =
      selectedPaymentMethod ===
      "cod"
        ? null
        : (
            transactionField
              ?.value
              .trim() || null
          );

    /* -----------------------------------------
       حالة الدفع
       ----------------------------------------- */

    let paymentStatus =
      "pending_verification";

    let customerPaymentState =
      "awaiting_verification";

    if (
      selectedPaymentMethod ===
      "cod"
    ) {
      paymentStatus =
        "shipping_payment_required";

      customerPaymentState =
        "shipping_payment_required";
    }

    /* -----------------------------------------
       بيانات الطلب
       ----------------------------------------- */

    const orderPayload = {
      customer_name:
        document
          .getElementById(
            "customerName"
          )
          .value
          .trim(),

      customer_phone:
        document
          .getElementById(
            "customerPhone"
          )
          .value
          .trim(),

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
        document
          .getElementById(
            "customerAddress"
          )
          .value
          .trim(),

      notes:
        document
          .getElementById(
            "customerNotes"
          )
          ?.value
          .trim() || "",

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
        paymentStatus,

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
        customerPaymentState
    };

    /* -----------------------------------------
       اسم جدول الطلبات
       ----------------------------------------- */

    const config =
      window.MMK_CONFIG ||
      window.MENA_CONFIG;

    const ordersTable =
      config?.ORDERS_TABLE ||
      "orders";

    /* -----------------------------------------
       حفظ الطلب
       ----------------------------------------- */

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

    /* -----------------------------------------
       حفظ بيانات آخر طلب
       ----------------------------------------- */

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

    /* -----------------------------------------
       حفظ احتياطي
       ----------------------------------------- */

    localStorage.setItem(
      "mmk_last_order_id",
      data?.id || ""
    );

    localStorage.setItem(
      "mmk_last_order_number",
      orderNumber
    );

    /* -----------------------------------------
       تفريغ السلة
       ----------------------------------------- */

    localStorage.removeItem(
      typeof CART_KEY !==
        "undefined"
        ? CART_KEY
        : "cart"
    );

    /* -----------------------------------------
       النجاح
       ----------------------------------------- */

    window.location.href =
      "success.html";

  } catch (err) {
    console.error(
      "خطأ في إرسال الطلب:",
      err
    );

    if (messageBox) {
      messageBox.style.display =
        "block";

      messageBox.className =
        "status-box error";

      messageBox.textContent =
        err?.message ||
        "حدث خطأ أثناء إرسال الطلب، الرجاء المحاولة مرة أخرى";

      messageBox.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }

    submitBtn.disabled = false;

    submitBtn.textContent =
      originalText;

    isSubmitting = false;
  }
}

/* =========================================================
   اختيار طريقة الدفع
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

  updatePaymentFieldsVisibility();
}

/* =========================================================
   اختيار المحافظة / المركز / القرية
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

  /* -----------------------------------------
     المحافظة
     ----------------------------------------- */

  govSelect.addEventListener(
    "change",
    () => {
      const selected =
        govSelect.selectedOptions[0];

      selectedGovernorate =
        selected?.dataset.name ||
        "";

      selectedGovernorateId =
        govSelect.value ||
        "";

      selectedCity = "";
      selectedCityId = "";
      selectedVillage = "";

      currentShippingPrice =
        null;

      if (!govSelect.value) {
        citySelect.innerHTML =
          `<option value="">اختر المحافظة أولاً</option>`;

        citySelect.disabled = true;

        villageSelect.innerHTML =
          `<option value="">اختر المركز أولاً</option>`;

        villageSelect.disabled = true;

        setLocationStatus(
          ""
        );

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
        setLocationStatus(
          ""
        );
      }

      updateLibraryPickupVisibility();

      updateShippingCalculation();
    }
  );

  /* -----------------------------------------
     المركز
     ----------------------------------------- */

  citySelect.addEventListener(
    "change",
    () => {
      const selected =
        citySelect.selectedOptions[0];

      selectedCity =
        selected?.dataset.name ||
        "";

      selectedCityId =
        citySelect.value ||
        "";

      selectedVillage = "";

      villageSelect.innerHTML =
        `<option value="">جاري تحميل القرى...</option>`;

      villageSelect.disabled =
        true;

      if (!citySelect.value) {
        villageSelect.innerHTML =
          `<option value="">اختر المركز أولاً</option>`;

        updateShippingCalculation();

        return;
      }

      populateVillages(
        citySelect.value
      );

      updateShippingCalculation();
    }
  );

  /* -----------------------------------------
     القرية
     ----------------------------------------- */

  villageSelect.addEventListener(
    "change",
    () => {
      const selected =
        villageSelect.selectedOptions[0];

      selectedVillage =
        selected?.dataset.name ||
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
      handleReceiptFile(
        event.target.files[0]
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

      if (
        event.dataTransfer
          .files[0]
      ) {
        handleReceiptFile(
          event.dataTransfer.files[0]
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

  if (!phoneInput) return;

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
   تعبئة بيانات العميل
   ========================================================= */

async function prefillFromCustomerSession() {
  if (!window.supabaseClient) {
    return;
  }

  try {
    const {
      data,
      error
    } =
      await window.supabaseClient.auth.getSession();

    if (error) {
      return;
    }

    const user =
      data?.session?.user;

    if (!user) return;

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
   بدء الصفحة
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
      typeof cartQuantity ===
        "function" &&
      cartQuantity() === 0
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

    renderCheckoutSummary();

    setupLocationSelectors();

    setupPaymentMethodSelector();

    setupReceiptUpload();

    setupPhoneMask();

    updateLibraryPickupVisibility();

    updatePaymentNumbers();

    updatePaymentAmounts();

    prefillFromCustomerSession();

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

    loadLocationData();
  }
);

