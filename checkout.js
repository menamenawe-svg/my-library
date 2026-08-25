/* =========================================================
   checkout.js — MMK Store
   إتمام الطلب + المحافظات + الشحن + الدفع + الاستلام من المكتبة
   ========================================================= */

/* =========================================================
   أسعار الشحن
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

/* =========================================================
   الأقصر
   ========================================================= */

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
   الحالة العامة
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
   أدوات النص العربي
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

function getShippingPriceForGovernorate(govName) {
  if (!govName) return null;

  if (isLuxorGovernorate(govName)) {
    return LUXOR_DEFAULT_PRICE;
  }

  if (
    Object.prototype.hasOwnProperty.call(
      SHIPPING_PRICES,
      govName
    )
  ) {
    return SHIPPING_PRICES[govName];
  }

  const normalized = normalizeArabic(govName);

  for (const key in SHIPPING_PRICES) {
    if (normalizeArabic(key) === normalized) {
      return SHIPPING_PRICES[key];
    }
  }

  return 140;
}

/* =========================================================
   حماية تسجيل الدخول
   ========================================================= */

async function requireCustomerLogin() {
  if (!window.supabaseClient) {
    window.location.href = "login.html";
    return false;
  }

  try {
    const { data, error } =
      await window.supabaseClient.auth.getSession();

    if (error || !data || !data.session || !data.session.user) {
      alert("يجب تسجيل الدخول أولًا لإتمام الطلب.");
      window.location.href = "login.html";
      return false;
    }

    return true;
  } catch (error) {
    console.error("Session check error:", error);
    window.location.href = "login.html";
    return false;
  }
}

/* =========================================================
   بيانات المحافظات
   ========================================================= */

function getGovName(g) {
  return (
    g.governorate_name_ar ||
    g.name_ar ||
    g.name ||
    g.governorate ||
    ""
  );
}

function getGovId(g) {
  return (
    g.id ??
    g.governorate_id ??
    g.governorateId ??
    getGovName(g)
  );
}

function getCenterName(c) {
  return (
    c.center_name_ar ||
    c.name_ar ||
    c.name ||
    c.center ||
    ""
  );
}

function getCenterId(c) {
  return (
    c.id ??
    c.center_id ??
    c.centerId ??
    getCenterName(c)
  );
}

function getCenterGovId(c) {
  return (
    c.governorate_id ??
    c.gov_id ??
    c.governorateId
  );
}

function getVillageName(v) {
  return (
    v.city_name_ar ||
    v.name_ar ||
    v.name ||
    v.village ||
    v.city ||
    ""
  );
}

function getVillageCenterId(v) {
  return (
    v.center_gov_id ??
    v.center_id ??
    v.centerId
  );
}

/* =========================================================
   تحميل المحافظات والمراكز والقرى
   ========================================================= */

async function loadLocationData() {
  const govSelect = document.getElementById(
    "customerGovernorate"
  );

  if (!govSelect) {
    return;
  }

  try {
    const responses = await Promise.all([
      fetch(DATA_URLS.governorates, {
        cache: "no-store"
      }),
      fetch(DATA_URLS.centers, {
        cache: "no-store"
      }),
      fetch(DATA_URLS.villages, {
        cache: "no-store"
      })
    ]);

    const govRes = responses[0];
    const centerRes = responses[1];
    const villageRes = responses[2];

    if (!govRes.ok || !centerRes.ok || !villageRes.ok) {
      throw new Error(
        "فشل تحميل بيانات المحافظات والمراكز والقرى"
      );
    }

    GOVERNORATES = await govRes.json();
    CENTERS = await centerRes.json();
    VILLAGES = await villageRes.json();

    if (!Array.isArray(GOVERNORATES)) {
      GOVERNORATES = [];
    }

    if (!Array.isArray(CENTERS)) {
      CENTERS = [];
    }

    if (!Array.isArray(VILLAGES)) {
      VILLAGES = [];
    }

    populateGovernorates();
  } catch (error) {
    console.error(
      "تعذر تحميل بيانات المحافظات:",
      error
    );

    govSelect.innerHTML =
      '<option value="">تعذر تحميل قائمة المحافظات</option>';

    setLocationStatus(
      "تعذر تحميل بيانات المحافظات، حاول تحديث الصفحة.",
      "error"
    );
  }
}

/* =========================================================
   عرض المحافظات
   ========================================================= */

function populateGovernorates() {
  const govSelect = document.getElementById(
    "customerGovernorate"
  );

  if (!govSelect) return;

  govSelect.innerHTML =
    '<option value="">اختر المحافظة</option>';

  GOVERNORATES.forEach((governorate) => {
    const name = getGovName(governorate);
    const id = getGovId(governorate);

    if (!name) return;

    const option = document.createElement("option");

    option.value = id;
    option.textContent = name;
    option.dataset.name = name;

    govSelect.appendChild(option);
  });

  govSelect.disabled = false;
}

/* =========================================================
   عرض المراكز
   ========================================================= */

function populateCenters(governorateId) {
  const citySelect = document.getElementById(
    "customerCity"
  );

  const villageSelect = document.getElementById(
    "customerVillage"
  );

  if (!citySelect || !villageSelect) {
    return;
  }

  citySelect.innerHTML =
    '<option value="">اختر المركز</option>';

  villageSelect.innerHTML =
    '<option value="">اختر المركز أولاً</option>';

  citySelect.disabled = true;
  villageSelect.disabled = true;

  const filtered = CENTERS.filter((center) => {
    return (
      String(getCenterGovId(center)) ===
      String(governorateId)
    );
  });

  if (filtered.length === 0) {
    citySelect.innerHTML =
      '<option value="">لا توجد مراكز متاحة</option>';

    return;
  }

  filtered.forEach((center) => {
    const name = getCenterName(center);
    const id = getCenterId(center);

    if (!name) return;

    const option = document.createElement("option");

    option.value = id;
    option.textContent = name;
    option.dataset.name = name;

    citySelect.appendChild(option);
  });

  citySelect.disabled = false;
}

/* =========================================================
   عرض القرى
   ========================================================= */

function populateVillages(centerId) {
  const villageSelect = document.getElementById(
    "customerVillage"
  );

  if (!villageSelect) {
    return;
  }

  villageSelect.innerHTML =
    '<option value="">اختر القرية / الحي</option>';

  villageSelect.disabled = true;

  const filtered = VILLAGES.filter((village) => {
    return (
      String(getVillageCenterId(village)) ===
      String(centerId)
    );
  });

  if (filtered.length === 0) {
    villageSelect.innerHTML =
      '<option value="">لا توجد قرى متاحة</option>';

    return;
  }

  filtered.forEach((village) => {
    const name = getVillageName(village);

    if (!name) return;

    const option = document.createElement("option");

    option.value = name;
    option.textContent = name;

    villageSelect.appendChild(option);
  });

  villageSelect.disabled = false;
}

/* =========================================================
   رسالة العنوان
   ========================================================= */

function setLocationStatus(
  message,
  type = "info"
) {
  const box = document.getElementById(
    "locationStatus"
  );

  if (!box) return;

  if (!message) {
    box.style.display = "none";
    return;
  }

  box.style.display = "block";
  box.className = `status-box ${type}`;
  box.textContent = message;
}

/* =========================================================
   الاستلام من المكتبة
   ========================================================= */

function updateLibraryPickupVisibility() {
  const pickup = document.getElementById(
    "libraryPickupMethod"
  );

  if (!pickup) return;

  const available = isLuxorGovernorate(
    selectedGovernorate
  );

  pickup.hidden = !available;

  if (
    !available &&
    selectedPaymentMethod === "library_pickup"
  ) {
    selectedPaymentMethod = "cod";

    document
      .querySelectorAll(".payment-method")
      .forEach((method) => {
        method.classList.remove("selected");
      });

    const codMethod = document.querySelector(
      '[data-method="cod"]'
    );

    if (codMethod) {
      codMethod.classList.add("selected");
    }
  }
}

/* =========================================================
   أرقام الدفع
   ========================================================= */

function updatePaymentNumbers() {
  const box = document.getElementById(
    "paymentNumbers"
  );

  if (!box) return;

  if (selectedPaymentMethod === "orange_cash") {
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

  if (selectedPaymentMethod === "instapay") {
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

  box.hidden = true;
  box.innerHTML = "";
}

/* =========================================================
   حساب الشحن
   ========================================================= */

function updateShippingCalculation() {
  const shippingStatus = document.getElementById(
    "shippingStatus"
  );

  const shippingText = document.getElementById(
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

  const luxor = isLuxorGovernorate(
    selectedGovernorate
  );

  if (
    luxor &&
    selectedPaymentMethod === "library_pickup"
  ) {
    currentShippingPrice = 0;

    shippingText.textContent =
      "الاستلام من MMK في الأقصر — بدون مصاريف شحن";

    shippingStatus.className =
      "status-box success";

    updateOrderTotals();
    return;
  }

  if (luxor) {
    if (selectedVillage) {
      const areaPrice = findLuxorAreaPrice(
        selectedVillage
      );

      if (areaPrice !== null) {
        currentShippingPrice = areaPrice;

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
    currentShippingPrice =
      getShippingPriceForGovernorate(
        selectedGovernorate
      );

    shippingText.textContent =
      `سعر الشحن إلى ${selectedGovernorate}: ${formatPrice(
        currentShippingPrice
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
  const cart = getCart();

  const container = document.getElementById(
    "checkoutItems"
  );

  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <p class="checkout-empty-message">
        السلة فارغة
      </p>
    `;
  } else {
    container.innerHTML = cart
      .map((item) => {
        const image = item.image || "";

        return `
          <div class="checkout-summary-item">

            ${
              image
                ? `
                  <img
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(item.name)}"
                    onerror="this.style.display='none'"
                  >
                `
                : ""
            }

            <div>
              <div class="name">
                ${escapeHTML(item.name)}
              </div>

              <div class="meta">
                الكمية: ${item.quantity}
              </div>
            </div>

            <div class="price">
              ${formatPrice(
                item.price * item.quantity
              )}
            </div>

          </div>
        `;
      })
      .join("");
  }

  const quantity = document.getElementById(
    "checkoutQuantity"
  );

  if (quantity) {
    quantity.textContent = cartQuantity();
  }

  updateOrderTotals();
}

/* =========================================================
   إجمالي الطلب
   ========================================================= */

function updateOrderTotals() {
  const subtotal = cartTotal();

  let shipping = currentShippingPrice;

  if (
    selectedPaymentMethod ===
    "library_pickup"
  ) {
    shipping = 0;
  }

  const total =
    subtotal + (shipping || 0);

  const subtotalEl = document.getElementById(
    "checkoutSubtotal"
  );

  const shippingEl = document.getElementById(
    "checkoutShipping"
  );

  const totalEl = document.getElementById(
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
  const subtotal = cartTotal();

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
        "الاستلام من MMK في الأقصر: يتم دفع 50% من قيمة الطلب مقدمًا لتأكيد الطلب، ودفع 50% المتبقية عند الاستلام.";
    }
  } else {
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
   الهاتف المصري
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
  const field = document.getElementById(
    fieldId
  );

  if (!field) return;

  const row = field.closest(".form-row");

  if (!row) return;

  row.classList.toggle(
    "invalid",
    hasError
  );
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

  const governorateField =
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
    !governorateField ||
    !cityField ||
    !villageField ||
    !transactionField
  ) {
    return false;
  }

  const name =
    nameField.value.trim();

  const phone =
    phoneField.value.trim();

  const address =
    addressField.value.trim();

  const governorate =
    governorateField.value;

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
    !governorate
  );

  if (!governorate) {
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

  if (!receiptFile) {
    if (receiptInput) {
      const row =
        receiptInput.closest(
          ".form-row"
        );

      if (row) {
        row.classList.add(
          "invalid"
        );
      }
    }

    valid = false;
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
   رفع ملف الإيصال
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

  const preview =
    document.getElementById(
      "receiptPreview"
    );

  if (preview) {
    const reader =
      new FileReader();

    reader.onload =
      (event) => {
        preview.src =
          event.target.result;

        preview.classList.add(
          "show"
        );
      };

    reader.readAsDataURL(file);
  }

  const receiptInput =
    document.getElementById(
      "paymentReceipt"
    );

  const row =
    receiptInput?.closest(
      ".form-row"
    );

  if (row) {
    row.classList.remove(
      "invalid"
    );
  }
}

/* =========================================================
   رفع الإيصال إلى Supabase Storage
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

  const extension =
    receiptFile.name
      .split(".")
      .pop() ||
    "jpg";

  const path =
    `orders/${orderNumber}-${Date.now()}.${extension}`;

  const config =
    window.MMK_CONFIG ||
    window.MENA_CONFIG;

  const bucket =
    config?.RECEIPTS_BUCKET ||
    "payment-receipts";

  const { data, error } =
    await window.supabaseClient.storage
      .from(bucket)
      .upload(
        path,
        receiptFile,
        {
          upsert: true
        }
      );

  if (error) {
    console.error(
      "خطأ في رفع الإيصال:",
      error
    );

    throw error;
  }

  const { data: urlData } =
    window.supabaseClient.storage
      .from(bucket)
      .getPublicUrl(path);

  return {
    path:
      data?.path || path,

    url:
      urlData?.publicUrl || null
  };
}

/* =========================================================
   اختيار طريقة الدفع
   ========================================================= */

function setupPaymentMethodSelector() {
  const methods =
    document.querySelectorAll(
      ".payment-method"
    );

  methods.forEach(
    (method) => {
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
        }
      );
    }
  );
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

  govSelect.addEventListener(
    "change",
    () => {
      const option =
        govSelect.selectedOptions[0];

      selectedGovernorate =
        option?.dataset.name ||
        option?.textContent ||
        "";

      selectedCity = "";
      selectedVillage = "";

      if (!govSelect.value) {
        citySelect.innerHTML =
          '<option value="">اختر المحافظة أولاً</option>';

        citySelect.disabled = true;

        villageSelect.innerHTML =
          '<option value="">اختر المركز أولاً</option>';

        villageSelect.disabled = true;

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
          "محافظة الأقصر لديها نظام شحن محلي خاص، والاستلام من MMK متاح داخل الأقصر.",
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
        citySelect.selectedOptions[0];

      selectedCity =
        option?.dataset.name ||
        option?.textContent ||
        "";

      selectedVillage = "";

      if (!citySelect.value) {
        villageSelect.innerHTML =
          '<option value="">اختر المركز أولاً</option>';

        villageSelect.disabled = true;

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
        villageSelect.value || "";

      updateShippingCalculation();
    }
  );
}

/* =========================================================
   رفع الإيصال Drag & Drop
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
        event.dataTransfer.files?.[0];

      handleReceiptFile(file);
    }
  );
}

/* =========================================================
   ماسك الهاتف
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
          .replace(/[^0-9]/g, "")
          .slice(0, 11);
    }
  );
}

/* =========================================================
   إرسال الطلب
   ========================================================= */

async function submitOrder(event) {
  event.preventDefault();

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

  const submitButton =
    document.getElementById(
      "confirmOrderBtn"
    );

  if (!submitButton) {
    return;
  }

  isSubmitting = true;

  const originalText =
    submitButton.textContent;

  submitButton.disabled = true;

  submitButton.innerHTML =
    '<span class="spinner"></span> جاري إرسال الطلب...';

  try {
    const cart = getCart();

    const subtotal =
      cartTotal();

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

      remainingAmount =
        0;
    }

    const orderNumber =
      typeof generateOrderNumber ===
      "function"
        ? generateOrderNumber()
        : `MMK-${Date.now()}`;

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
      govSelect?.selectedOptions?.[0]
        ?.dataset?.name ||
      govSelect?.value ||
      "";

    const cityName =
      citySelect?.selectedOptions?.[0]
        ?.dataset?.name ||
      citySelect?.value ||
      "";

    const {
      data: sessionData,
      error: sessionError
    } =
      await window.supabaseClient.auth.getSession();

    if (
      sessionError ||
      !sessionData?.session?.user
    ) {
      throw new Error(
        "انتهت جلسة تسجيل الدخول، يرجى تسجيل الدخول مرة أخرى."
      );
    }

    const user =
      sessionData.session.user;

    const customerUserId =
      user.id;

    const customerEmail =
      user.email || null;

    const name =
      document.getElementById(
        "customerName"
      ).value.trim();

    const phone =
      document.getElementById(
        "customerPhone"
      ).value.trim();

    const address =
      document.getElementById(
        "customerAddress"
      ).value.trim();

    const notes =
      document.getElementById(
        "customerNotes"
      )?.value.trim() || "";

    const transactionNumber =
      document.getElementById(
        "transactionNumber"
      ).value.trim();

    const orderPayload = {
      customer_name: name,
      customer_phone: phone,

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
      window.MENA_CONFIG ||
      {};

    const ordersTable =
      config.ORDERS_TABLE ||
      "orders";

    const {
      data,
      error
    } =
      await window.supabaseClient
        .from(ordersTable)
        .insert([orderPayload])
        .select()
        .single();

    if (error) {
      throw error;
    }

    if (data?.id) {
      localStorage.setItem(
        config.LAST_ORDER_ID_KEY ||
          "lastOrderId",
        data.id
      );
    }

    localStorage.setItem(
      config.LAST_ORDER_NUMBER_KEY ||
        "lastOrderNumber",
      orderNumber
    );

    localStorage.removeItem(
      CART_KEY
    );

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

      messageBox.textContent =
        error?.message ||
        "حدث خطأ أثناء إرسال الطلب، الرجاء المحاولة مرة أخرى";

      messageBox.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }

    submitButton.disabled =
      false;

    submitButton.textContent =
      originalText;

    isSubmitting = false;
  }
}

/* =========================================================
   تعبئة بيانات العميل تلقائيًا
   ========================================================= */

async function prefillFromCustomerSession() {
  if (!window.supabaseClient) {
    return;
  }

  try {
    const { data } =
      await window.supabaseClient.auth.getSession();

    const user =
      data?.session?.user;

    if (!user) {
      return;
    }

    const meta =
      user.user_metadata || {};

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
      "تعذر تعبئة بيانات العميل:",
      error
    );
  }
}

/* =========================================================
   تهيئة الصفحة
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    const loggedIn =
      await requireCustomerLogin();

    if (!loggedIn) {
      return;
    }

    if (cartQuantity() === 0) {
      if (
        typeof showToast ===
        "function"
      ) {
        showToast(
          "سلتك فارغة، الرجاء إضافة منتجات أولًا",
          "error"
        );
      }

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

    loadLocationData();

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
