/* =========================================================
   checkout.js — متجر أم أم كي
   منطق صفحة إتمام الطلب:
   العناوين، الشحن، الدفع، الاستلام من المكتبة، إنشاء الطلب
   ========================================================= */

/* ---------------------------------------------------------
   بيانات الشحن
   --------------------------------------------------------- */

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

/* ---------------------------------------------------------
   أرقام الدفع
   --------------------------------------------------------- */

const PAYMENT_NUMBERS = {
  orange_cash: "01206439150",
  instapay: "01225182025"
};

/* ---------------------------------------------------------
   تطبيع النص العربي
   --------------------------------------------------------- */

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
    (nameItem) =>
      normalizeArabic(nameItem) === normalized
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

  if (SHIPPING_PRICES[govName] !== undefined) {
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

/* ---------------------------------------------------------
   حالة الصفحة
   --------------------------------------------------------- */

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

/* ---------------------------------------------------------
   بيانات المحافظات
   --------------------------------------------------------- */

const DATA_URLS = {
  governorates:
    "https://raw.githubusercontent.com/mo7amed-said-223/egypt-cities/main/governorates.json",

  centers:
    "https://raw.githubusercontent.com/mo7amed-said-223/egypt-cities/main/center_govs.json",

  villages:
    "https://raw.githubusercontent.com/mo7amed-said-223/egypt-cities/main/city_centers.json"
};

/* =========================================================
   تحميل المحافظات والمراكز والقرى
   ========================================================= */

async function loadLocationData() {
  const govSelect =
    document.getElementById("customerGovernorate");

  try {
    const [govRes, centerRes, villageRes] =
      await Promise.all([
        fetch(DATA_URLS.governorates),
        fetch(DATA_URLS.centers),
        fetch(DATA_URLS.villages)
      ]);

    if (!govRes.ok || !centerRes.ok || !villageRes.ok) {
      throw new Error("فشل تحميل بيانات المحافظات");
    }

    GOVERNORATES = await govRes.json();
    CENTERS = await centerRes.json();
    VILLAGES = await villageRes.json();

    populateGovernorates();
  } catch (err) {
    console.error("تعذر تحميل بيانات المحافظات:", err);

    if (govSelect) {
      govSelect.innerHTML =
        `<option value="">تعذر تحميل قائمة المحافظات</option>`;
    }

    setLocationStatus(
      "تعذر تحميل بيانات المحافظات، حاول تحديث الصفحة",
      "error"
    );
  }
}

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

/* ---------------------------------------------------------
   المحافظات
   --------------------------------------------------------- */

function populateGovernorates() {
  const govSelect =
    document.getElementById("customerGovernorate");

  if (!govSelect) return;

  govSelect.innerHTML =
    `<option value="">اختر المحافظة</option>`;

  GOVERNORATES.forEach((g) => {
    const opt = document.createElement("option");

    opt.value = getGovId(g);
    opt.textContent = getGovName(g);
    opt.dataset.name = getGovName(g);

    govSelect.appendChild(opt);
  });
}

/* ---------------------------------------------------------
   المراكز
   --------------------------------------------------------- */

function populateCenters(govId) {
  const citySelect =
    document.getElementById("customerCity");

  const villageSelect =
    document.getElementById("customerVillage");

  if (!citySelect || !villageSelect) return;

  citySelect.innerHTML =
    `<option value="">اختر المركز</option>`;

  villageSelect.innerHTML =
    `<option value="">اختر المركز أولاً</option>`;

  villageSelect.disabled = true;

  const filtered = CENTERS.filter(
    (c) =>
      String(getCenterGovId(c)) ===
      String(govId)
  );

  if (filtered.length === 0) {
    citySelect.innerHTML =
      `<option value="">لا توجد مراكز متاحة</option>`;

    citySelect.disabled = true;
    return;
  }

  filtered.forEach((c) => {
    const opt = document.createElement("option");

    opt.value = getCenterId(c);
    opt.textContent = getCenterName(c);
    opt.dataset.name = getCenterName(c);

    citySelect.appendChild(opt);
  });

  citySelect.disabled = false;
}

/* ---------------------------------------------------------
   القرى
   --------------------------------------------------------- */

function populateVillages(centerId) {
  const villageSelect =
    document.getElementById("customerVillage");

  if (!villageSelect) return;

  villageSelect.innerHTML =
    `<option value="">اختر القرية / الحي</option>`;

  const filtered = VILLAGES.filter(
    (v) =>
      String(getVillageCenterId(v)) ===
      String(centerId)
  );

  if (filtered.length === 0) {
    villageSelect.innerHTML =
      `<option value="">لا توجد قرى متاحة</option>`;

    villageSelect.disabled = true;
    return;
  }

  filtered.forEach((v) => {
    const opt = document.createElement("option");

    opt.value = getVillageName(v);
    opt.textContent = getVillageName(v);

    villageSelect.appendChild(opt);
  });

  villageSelect.disabled = false;
}

/* =========================================================
   حالة الموقع
   ========================================================= */

function setLocationStatus(message, type = "info") {
  const box =
    document.getElementById("locationStatus");

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
   إظهار الاستلام من المكتبة
   ========================================================= */

function updateLibraryPickupVisibility() {
  const pickup =
    document.getElementById("libraryPickupMethod");

  if (!pickup) return;

  const isLuxor =
    isLuxorGovernorate(selectedGovernorate);

  pickup.hidden = !isLuxor;

  if (
    !isLuxor &&
    selectedPaymentMethod === "library_pickup"
  ) {
    selectedPaymentMethod = "cod";

    document
      .querySelectorAll(".payment-method")
      .forEach((method) => {
        method.classList.remove("selected");
      });

    document
      .querySelector('[data-method="cod"]')
      ?.classList.add("selected");
  }
}

/* =========================================================
   أرقام الدفع
   ========================================================= */

function updatePaymentNumbers() {
  const box =
    document.getElementById("paymentNumbers");

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
  const shippingStatus =
    document.getElementById("shippingStatus");

  const shippingText =
    document.getElementById("shippingPriceText");

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

  const govIsLuxor =
    isLuxorGovernorate(selectedGovernorate);

  if (
    selectedPaymentMethod === "library_pickup" &&
    govIsLuxor
  ) {
    currentShippingPrice = 0;

    shippingText.textContent =
      "الاستلام من مكتبة مينا في الأقصر — بدون مصاريف شحن";

    shippingStatus.className =
      "status-box success";

    updateOrderTotals();
    return;
  }

  if (govIsLuxor) {
    if (selectedVillage) {
      const areaPrice =
        findLuxorAreaPrice(selectedVillage);

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
    const price =
      getShippingPriceForGovernorate(
        selectedGovernorate
      );

    currentShippingPrice = price;

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
  const cart = getCart();

  const container =
    document.getElementById("checkoutItems");

  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML =
      `<p class="checkout-empty-message">السلة فارغة</p>`;
  } else {
    container.innerHTML = cart
      .map(
        (item) => `
          <div class="checkout-summary-item">
            <img
              src="${
                escapeHTML(item.image) ||
                "https://via.placeholder.com/60"
              }"
              alt="${escapeHTML(item.name)}"
              onerror="
                this.src='https://via.placeholder.com/60'
              "
            >

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
        `
      )
      .join("");
  }

  const quantity =
    document.getElementById("checkoutQuantity");

  const subtotal =
    document.getElementById("checkoutSubtotal");

  if (quantity) {
    quantity.textContent = cartQuantity();
  }

  if (subtotal) {
    subtotal.textContent =
      formatPrice(cartTotal());
  }

  updateOrderTotals();
}

/* =========================================================
   إجمالي الطلب
   ========================================================= */

function updateOrderTotals() {
  const subtotal = cartTotal();

  let shipping = currentShippingPrice;

  if (selectedPaymentMethod === "library_pickup") {
    shipping = 0;
  }

  const total =
    subtotal + (shipping || 0);

  const subtotalEl =
    document.getElementById("checkoutSubtotal");

  const shippingEl =
    document.getElementById("checkoutShipping");

  const totalEl =
    document.getElementById("checkoutTotal");

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

  if (selectedPaymentMethod === "library_pickup") {
    shipping = 0;
  }

  const total =
    subtotal + shipping;

  let prepaid = 0;
  let remaining = 0;

  const instructions =
    document.getElementById("paymentInstructions");

  if (selectedPaymentMethod === "cod") {
    prepaid = shipping;
    remaining = total - prepaid;

    if (instructions) {
      instructions.textContent =
        "في حالة الدفع عند الاستلام، يتم دفع مصاريف الشحن مقدمًا فقط، ويتم دفع باقي قيمة الطلب عند الاستلام.";
    }
  }

  else if (selectedPaymentMethod === "library_pickup") {
    prepaid = total * 0.5;
    remaining = total - prepaid;

    if (instructions) {
      instructions.textContent =
        "الاستلام من مكتبة مينا في الأقصر: يتم دفع 50% من قيمة الطلب مقدمًا لتأكيد الطلب، ودفع 50% المتبقية عند الاستلام من المكتبة.";
    }
  }

  else {
    prepaid = total;
    remaining = 0;

    const methodName =
      selectedPaymentMethod === "orange_cash"
        ? "Orange Cash"
        : "InstaPay";

    if (instructions) {
      instructions.textContent =
        `يتم دفع إجمالي قيمة الطلب مقدمًا عبر ${methodName}، ثم إرفاق رقم العملية وصورة الإيصال.`;
    }
  }

  const prepaidEl =
    document.getElementById("prepaidAmountText");

  const remainingEl =
    document.getElementById("remainingAmountText");

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
   تسجيل الدخول إجباري قبل الطلب
   ========================================================= */

async function requireCustomerLogin() {
  if (!window.supabaseClient) {
    window.location.href = "login.html";
    return false;
  }

  try {
    const { data, error } =
      await window.supabaseClient.auth.getSession();

    if (error || !data?.session?.user) {
      alert(
        "يجب تسجيل الدخول أولًا لإتمام الطلب."
      );

      window.location.href = "login.html";
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "Session check error:",
      error
    );

    window.location.href = "login.html";
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

function setFieldError(fieldId, hasError) {
  const field =
    document.getElementById(fieldId);

  const row =
    field?.closest(".form-row");

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
    document.getElementById("customerName");

  const phoneField =
    document.getElementById("customerPhone");

  const addressField =
    document.getElementById("customerAddress");

  const govField =
    document.getElementById(
      "customerGovernorate"
    );

  const cityField =
    document.getElementById("customerCity");

  const villageField =
    document.getElementById("customerVillage");

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
    return false;
  }

  const name =
    nameField.value.trim();

  const phone =
    phoneField.value.trim();

  const address =
    addressField.value.trim();

  const gov = govField.value;
  const city = cityField.value;
  const village = villageField.value;

  setFieldError(
    "customerName",
    !name
  );

  if (!name) valid = false;

  const phoneValid =
    validateEgyptianPhone(phone);

  setFieldError(
    "customerPhone",
    !phoneValid
  );

  if (!phoneValid) valid = false;

  setFieldError(
    "customerGovernorate",
    !gov
  );

  if (!gov) valid = false;

  setFieldError(
    "customerCity",
    !city
  );

  if (!city) valid = false;

  setFieldError(
    "customerVillage",
    !village
  );

  if (!village) valid = false;

  setFieldError(
    "customerAddress",
    !address
  );

  if (!address) valid = false;

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

  const receiptRow =
    receiptInput?.closest(".form-row");

  if (!receiptFile) {
    receiptRow?.classList.add("invalid");
    valid = false;
  } else {
    receiptRow?.classList.remove("invalid");
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
   رفع الإيصال
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

  const reader = new FileReader();

  reader.onload = (e) => {
    const preview =
      document.getElementById(
        "receiptPreview"
      );

    if (!preview) return;

    preview.src =
      e.target.result;

    preview.classList.add("show");
  };

  reader.readAsDataURL(file);

  document
    .getElementById("paymentReceipt")
    ?.closest(".form-row")
    ?.classList.remove("invalid");
}

async function uploadReceiptImage(orderNumber) {
  if (!receiptFile) {
    return {
      path: null,
      url: null
    };
  }

  const ext =
    receiptFile.name.split(".").pop() ||
    "jpg";

  const path =
    `orders/${orderNumber}-${Date.now()}.${ext}`;

  const config =
    window.MMK_CONFIG ||
    window.MENA_CONFIG;

  const bucket =
    config
      ? config.RECEIPTS_BUCKET
      : "payment-receipts";

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

    return {
      path: null,
      url: null
    };
  }

  const { data: publicUrlData } =
    window.supabaseClient.storage
      .from(bucket)
      .getPublicUrl(path);

  return {
    path:
      data?.path || path,

    url:
      publicUrlData?.publicUrl || null
  };
}

/* =========================================================
   إرسال الطلب
   ========================================================= */

async function submitOrder(e) {
  e.preventDefault();

  if (isSubmitting) return;

  const messageBox =
    document.getElementById(
      "checkoutMessage"
    );

  if (messageBox) {
    messageBox.style.display = "none";
  }

  const loggedIn =
    await requireCustomerLogin();

  if (!loggedIn) return;

  if (!validateCheckoutForm()) {
    if (messageBox) {
      messageBox.style.display = "block";
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
    const cart = getCart();

    const subtotal = cartTotal();

    const shipping =
      selectedPaymentMethod ===
      "library_pickup"
        ? 0
        : currentShippingPrice || 0;

    const total =
      subtotal + shipping;

    let prepaidAmount = 0;
    let remainingAmount = 0;

    if (selectedPaymentMethod === "cod") {
      prepaidAmount = shipping;
      remainingAmount =
        total - prepaidAmount;
    }

    else if (
      selectedPaymentMethod ===
      "library_pickup"
    ) {
      prepaidAmount =
        total * 0.5;

      remainingAmount =
        total - prepaidAmount;
    }

    else {
      prepaidAmount = total;
      remainingAmount = 0;
    }

    const orderNumber =
      generateOrderNumber();

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

    let customerUserId = null;
    let customerEmail = null;

    try {
      const {
        data: sessionData
      } =
        await window.supabaseClient.auth.getSession();

      if (sessionData?.session?.user) {
        customerUserId =
          sessionData.session.user.id;

        customerEmail =
          sessionData.session.user.email;
      }
    } catch (e) {
      console.warn(
        "تعذر التحقق من جلسة العميل:",
        e
      );
    }

    if (!customerUserId) {
      throw new Error(
        "يجب تسجيل الدخول أولًا لإتمام الطلب"
      );
    }

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
        selectedVillage,

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

      subtotal,
      shipping,
      shipping_price: shipping,
      shipping_cost: shipping,

      total,

      transaction_number:
        document
          .getElementById(
            "transactionNumber"
          )
          .value
          .trim(),

      transaction_id:
        document
          .getElementById(
            "transactionNumber"
          )
          .value
          .trim(),

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
      config
        ? config.ORDERS_TABLE
        : "orders";

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

    if (config) {
      if (config.LAST_ORDER_ID_KEY) {
        localStorage.setItem(
          config.LAST_ORDER_ID_KEY,
          data.id
        );
      }

      if (config.LAST_ORDER_NUMBER_KEY) {
        localStorage.setItem(
          config.LAST_ORDER_NUMBER_KEY,
          orderNumber
        );
      }
    }

    localStorage.removeItem(CART_KEY);

    window.location.href =
      "success.html";

  } catch (err) {
    console.error(
      "خطأ في إرسال الطلب:",
      err
    );

    if (messageBox) {
      messageBox.style.display = "block";
      messageBox.className =
        "status-box error";

      messageBox.textContent =
        err?.message ||
        "حدث خطأ أثناء إرسال الطلب، الرجاء المحاولة مرة أخرى";
    }

    submitBtn.disabled = false;
    submitBtn.textContent = originalText;

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

  methods.forEach((el) => {
    el.addEventListener("click", () => {
      if (
        el.dataset.method ===
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

      methods.forEach((method) => {
        method.classList.remove(
          "selected"
        );
      });

      el.classList.add("selected");

      selectedPaymentMethod =
        el.dataset.method;

      updateLibraryPickupVisibility();
      updateShippingCalculation();
      updatePaymentAmounts();
      updatePaymentNumbers();
    });
  });
}

/* =========================================================
   المحافظات / المراكز / القرى
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
      const selected =
        govSelect.selectedOptions[0];

      selectedGovernorate =
        selected?.dataset.name || "";

      selectedCity = "";
      selectedVillage = "";

      if (!govSelect.value) {
        citySelect.innerHTML =
          `<option value="">اختر المحافظة أولاً</option>`;

        citySelect.disabled = true;

        villageSelect.innerHTML =
          `<option value="">اختر المركز أولاً</option>`;

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
      const selected =
        citySelect.selectedOptions[0];

      selectedCity =
        selected?.dataset.name || "";

      selectedVillage = "";

      if (!citySelect.value) {
        villageSelect.innerHTML =
          `<option value="">اختر المركز أولاً</option>`;

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
        villageSelect.value;

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

  if (!uploadBox || !fileInput) {
    return;
  }

  uploadBox.addEventListener(
    "click",
    () => fileInput.click()
  );

  fileInput.addEventListener(
    "change",
    (e) => {
      handleReceiptFile(
        e.target.files[0]
      );
    }
  );

  uploadBox.addEventListener(
    "dragover",
    (e) => {
      e.preventDefault();
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
    (e) => {
      e.preventDefault();

      uploadBox.classList.remove(
        "drag-active"
      );

      if (e.dataTransfer.files[0]) {
        handleReceiptFile(
          e.dataTransfer.files[0]
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
          .replace(/[^0-9]/g, "")
          .slice(0, 11);
    }
  );
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

    if (cartQuantity() === 0) {
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
    loadLocationData();
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
  }
);

/* =========================================================
   تعبئة بيانات العميل
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

    if (!user) return;

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
  } catch (e) {
    console.warn(
      "تعذر تعبئة بيانات العميل تلقائيًا:",
      e
    );
  }
}