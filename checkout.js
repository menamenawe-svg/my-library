
/* =========================================================
   checkout.js — متجر أم أم كي
   نسخة كاملة ومتوافقة مع checkout.html

   ملاحظات:
   - لا تستخدم via.placeholder.com نهائيًا.
   - صور المنتجات التي تحتوي على placeholder يتم استبدالها
     بصورة SVG محلية داخل المتصفح.
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
   صورة Placeholder محلية
   مهم:
   لا يوجد أي رابط لـ via.placeholder.com
   ========================================================= */

function createLocalPlaceholder() {

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="100"
         height="100"
         viewBox="0 0 100 100">

      <rect
        width="100"
        height="100"
        rx="14"
        fill="#eef2f7"
      />

      <text
        x="50"
        y="55"
        text-anchor="middle"
        font-size="34">
        🛍️
      </text>

    </svg>
  `;

  return (
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(svg)
  );
}

const CHECKOUT_PLACEHOLDER =
  createLocalPlaceholder();


/* =========================================================
   تنظيف روابط الصور
   ========================================================= */

function normalizeProductImage(image) {

  if (!image) {
    return CHECKOUT_PLACEHOLDER;
  }

  const value = String(image).trim();

  if (!value) {
    return CHECKOUT_PLACEHOLDER;
  }

  /*
   * أهم جزء في إصلاح ERR_CONNECTION_CLOSED
   *
   * لو المنتج محفوظ له:
   * https://via.placeholder.com/60
   *
   * لا نضعه في src أصلًا.
   */

  if (
    value.includes("via.placeholder.com") ||
    value.includes("placeholder.com")
  ) {
    return CHECKOUT_PLACEHOLDER;
  }

  /*
   * روابط Placeholder الشائعة الأخرى
   */

  if (
    value.includes("placehold.co") ||
    value.includes("placehold.it")
  ) {
    return CHECKOUT_PLACEHOLDER;
  }

  return value;
}


/* =========================================================
   أدوات مساعدة
   ========================================================= */

function escapeHTML(value) {

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


function formatPrice(value) {

  const number =
    Number(value) || 0;

  return (
    number.toLocaleString("ar-EG") +
    " ج.م"
  );
}


function normalizeArabic(str) {

  if (!str) {
    return "";
  }

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
   الرسائل
   ========================================================= */

function showToast(
  message,
  type = "info"
) {

  if (
    typeof window.showMessage ===
    "function"
  ) {
    window.showMessage(message);
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
    document.createElement("div");

  toast.className =
    "toast-message " + type;

  toast.textContent =
    message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3500);
}


/* =========================================================
   قراءة السلة
   ========================================================= */

function getCheckoutCart() {

  try {

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

    const cartKey =
      typeof window.CART_KEY !==
      "undefined"
        ? window.CART_KEY
        : "cart";

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
      "خطأ في قراءة السلة:",
      error
    );

    return [];
  }
}


/* =========================================================
   كمية السلة
   ========================================================= */

function checkoutCartQuantity() {

  const cart =
    getCheckoutCart();

  return cart.reduce(
    (total, item) => {

      const quantity =
        Number(
          item?.quantity || 1
        );

      return (
        total +
        (quantity > 0
          ? quantity
          : 1)
      );
    },
    0
  );
}


/* =========================================================
   إجمالي المنتجات
   ========================================================= */

function checkoutCartTotal() {

  const cart =
    getCheckoutCart();

  return cart.reduce(
    (total, item) => {

      const price =
        Number(
          item?.price || 0
        );

      const quantity =
        Number(
          item?.quantity || 1
        );

      return (
        total +
        price *
          (quantity > 0
            ? quantity
            : 1)
      );
    },
    0
  );
}


/* =========================================================
   بيانات المحافظة
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
   بيانات المركز
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
   بيانات القرية
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

  if (!name) {
    return false;
  }

  const normalized =
    normalizeArabic(name);

  return LUXOR_NAMES.some(
    item =>
      normalizeArabic(item) ===
      normalized
  );
}


function findLuxorAreaPrice(
  areaName
) {

  if (!areaName) {
    return null;
  }

  const normalized =
    normalizeArabic(
      areaName
    );

  for (
    const key in LUXOR_AREA_PRICES
  ) {

    if (
      normalizeArabic(key) ===
      normalized
    ) {
      return LUXOR_AREA_PRICES[key];
    }
  }

  for (
    const key in LUXOR_AREA_PRICES
  ) {

    const normalizedKey =
      normalizeArabic(key);

    if (
      normalizedKey.includes(
        normalized
      ) ||
      normalized.includes(
        normalizedKey
      )
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

  if (
    isLuxorGovernorate(
      govName
    )
  ) {
    return LUXOR_DEFAULT_PRICE;
  }

  if (
    SHIPPING_PRICES[govName] !==
    undefined
  ) {
    return SHIPPING_PRICES[govName];
  }

  const normalized =
    normalizeArabic(
      govName
    );

  for (
    const key in SHIPPING_PRICES
  ) {

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

  if (!box) {
    return;
  }

  if (!message) {

    box.style.display =
      "none";

    box.textContent = "";

    return;
  }

  box.style.display =
    "block";

  box.className =
    "status-box " + type;

  box.textContent =
    message;
}


/* =========================================================
   تحميل المحافظات والمراكز والقرى
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

      govSelect.disabled =
        true;

      govSelect.innerHTML =
        `<option value="">
          جاري تحميل المحافظات...
        </option>`;
    }

    const responses =
      await Promise.all([
        fetch(
          DATA_URLS.governorates,
          {
            cache: "no-store"
          }
        ),

        fetch(
          DATA_URLS.centers,
          {
            cache: "no-store"
          }
        ),

        fetch(
          DATA_URLS.villages,
          {
            cache: "no-store"
          }
        )
      ]);

    const [
      govRes,
      centerRes,
      villageRes
    ] = responses;

    if (
      !govRes.ok ||
      !centerRes.ok ||
      !villageRes.ok
    ) {

      throw new Error(
        "تعذر تحميل بيانات المناطق"
      );
    }

    GOVERNORATES =
      await govRes.json();

    CENTERS =
      await centerRes.json();

    VILLAGES =
      await villageRes.json();

    if (
      !Array.isArray(
        GOVERNORATES
      ) ||
      !Array.isArray(
        CENTERS
      ) ||
      !Array.isArray(
        VILLAGES
      )
    ) {

      throw new Error(
        "بيانات المناطق غير صحيحة"
      );
    }

    populateGovernorates();

    setLocationStatus(
      "تم تحميل بيانات المحافظات والمراكز والقرى بنجاح.",
      "success"
    );

  } catch (error) {

    console.error(
      "تعذر تحميل بيانات المحافظات:",
      error
    );

    if (govSelect) {

      govSelect.disabled =
        false;

      govSelect.innerHTML =
        `<option value="">
          تعذر تحميل المحافظات
        </option>`;
    }

    if (citySelect) {

      citySelect.innerHTML =
        `<option value="">
          اختر المحافظة أولاً
        </option>`;

      citySelect.disabled =
        true;
    }

    if (villageSelect) {

      villageSelect.innerHTML =
        `<option value="">
          اختر المركز أولاً
        </option>`;

      villageSelect.disabled =
        true;
    }

    setLocationStatus(
      "تعذر تحميل بيانات المناطق. تأكد من اتصال الإنترنت ثم حدّث الصفحة.",
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

  if (!select) {
    return;
  }

  select.innerHTML =
    `<option value="">
      اختر المحافظة
    </option>`;

  GOVERNORATES.forEach(
    gov => {

      const name =
        getGovName(gov);

      if (!name) {
        return;
      }

      const option =
        document.createElement(
          "option"
        );

      option.value =
        getGovId(gov);

      option.textContent =
        name;

      option.dataset.name =
        name;

      select.appendChild(
        option
      );
    }
  );

  select.disabled =
    false;
}


/* =========================================================
   المراكز
   ========================================================= */

function populateCenters(
  govId
) {

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
    `<option value="">
      اختر المركز
    </option>`;

  villageSelect.innerHTML =
    `<option value="">
      اختر المركز أولاً
    </option>`;

  citySelect.disabled =
    true;

  villageSelect.disabled =
    true;

  let filtered =
    CENTERS.filter(
      center =>
        String(
          getCenterGovId(
            center
          )
        ) ===
        String(govId)
    );

  /*
   * بعض قواعد البيانات تختلف في شكل الـ ID.
   * لو لم نجد مراكز بالـ ID نحاول البحث بالاسم.
   */

  if (!filtered.length) {

    const gov =
      GOVERNORATES.find(
        item =>
          String(
            getGovId(item)
          ) ===
          String(govId)
      );

    const govName =
      getGovName(gov);

    if (govName) {

      const normalizedGov =
        normalizeArabic(
          govName
        );

      filtered =
        CENTERS.filter(
          center => {

            const centerGov =
              center?.governorate_name_ar ||
              center?.governorate ||
              center?.gov_name_ar ||
              "";

            return (
              normalizeArabic(
                centerGov
              ) ===
              normalizedGov
            );
          }
        );
    }
  }

  if (!filtered.length) {

    citySelect.innerHTML =
      `<option value="">
        لا توجد مراكز متاحة
      </option>`;

    return;
  }

  filtered.forEach(
    center => {

      const name =
        getCenterName(
          center
        );

      if (!name) {
        return;
      }

      const option =
        document.createElement(
          "option"
        );

      option.value =
        getCenterId(
          center
        );

      option.textContent =
        name;

      option.dataset.name =
        name;

      citySelect.appendChild(
        option
      );
    }
  );

  citySelect.disabled =
    false;
}


/* =========================================================
   القرى
   ========================================================= */

function populateVillages(
  centerId
) {

  const select =
    document.getElementById(
      "customerVillage"
    );

  if (!select) {
    return;
  }

  select.innerHTML =
    `<option value="">
      اختر القرية / الحي
    </option>`;

  select.disabled =
    true;

  let filtered =
    VILLAGES.filter(
      village =>
        String(
          getVillageCenterId(
            village
          )
        ) ===
        String(centerId)
    );

  if (!filtered.length) {

    /*
     * بعض البيانات قد تستخدم center_id
     * أو center_gov_id بشكل مختلف.
     *
     * لو لم توجد قرى، نعرض المركز نفسه
     * كمنطقة حتى لا يتوقف نموذج الطلب.
     */

    const cityName =
      selectedCity;

    if (cityName) {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        cityName;

      option.textContent =
        cityName;

      select.appendChild(
        option
      );

      select.disabled =
        false;

      return;
    }

    select.innerHTML =
      `<option value="">
        لا توجد قرى متاحة
      </option>`;

    return;
  }

  filtered.forEach(
    village => {

      const name =
        getVillageName(
          village
        );

      if (!name) {
        return;
      }

      const option =
        document.createElement(
          "option"
        );

      option.value =
        name;

      option.textContent =
        name;

      select.appendChild(
        option
      );
    }
  );

  select.disabled =
    false;
}


/* =========================================================
   الاستلام من المكتبة
   ========================================================= */

function updateLibraryPickupVisibility() {

  const pickup =
    document.getElementById(
      "libraryPickupMethod"
    );

  if (!pickup) {
    return;
  }

  const isLuxor =
    isLuxorGovernorate(
      selectedGovernorate
    );

  pickup.hidden =
    !isLuxor;

  if (
    !isLuxor &&
    selectedPaymentMethod ===
      "library_pickup"
  ) {

    selectedPaymentMethod =
      "cod";

    document
      .querySelectorAll(
        ".payment-method"
      )
      .forEach(
        method =>
          method.classList.remove(
            "selected"
          )
      );

    document
      .querySelector(
        '[data-method="cod"]'
      )
      ?.classList.add(
        "selected"
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

  if (!box) {
    return;
  }

  if (
    selectedPaymentMethod ===
    "orange_cash"
  ) {

    box.hidden =
      false;

    box.innerHTML = `
      <div class="payment-number-content">

        <div class="payment-number-icon">
          🟠
        </div>

        <div>
          <strong>
            Orange Cash
          </strong>

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

    box.hidden =
      false;

    box.innerHTML = `
      <div class="payment-number-content">

        <div class="payment-number-icon">
          🏦
        </div>

        <div>
          <strong>
            InstaPay
          </strong>

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


  box.hidden =
    true;

  box.innerHTML =
    "";
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

    currentShippingPrice =
      null;

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

    currentShippingPrice =
      0;

    shippingText.textContent =
  "الاستلام من MMK Store في الأقصر — بدون مصاريف شحن";

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

      if (
        areaPrice !==
        null
      ) {

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
   عرض ملخص السلة
   ========================================================= */

function renderCheckoutSummary() {

  const cart =
    getCheckoutCart();

  const container =
    document.getElementById(
      "checkoutItems"
    );

  if (!container) {
    return;
  }


  if (!cart.length) {

    container.innerHTML =
      `
      <p class="checkout-empty-message">
        السلة فارغة
      </p>
      `;

  } else {

    container.innerHTML =
      cart
        .map(item => {

          /*
           * تنظيف الصورة قبل إدخالها
           * في src.
           */

          const rawImage =
            item?.image ||
            item?.img ||
            item?.thumbnail ||
            "";

          const image =
            normalizeProductImage(
              rawImage
            );

          const safeImage =
            escapeHTML(
              image
            );

          const safeName =
            escapeHTML(
              item?.name ||
              "منتج"
            );

          const quantity =
            Math.max(
              1,
              Number(
                item?.quantity ||
                1
              )
            );

          const price =
            Number(
              item?.price ||
              0
            );


          return `
            <div class="checkout-summary-item">

              <img
                src="${safeImage}"
                alt="${safeName}"
                loading="lazy"
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
                  price *
                  quantity
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
      formatPrice(
        subtotal
      );
  }


  if (shippingEl) {

    shippingEl.textContent =
      shipping === null
        ? "يُحدد حسب العنوان"
        : formatPrice(
            shipping
          );
  }


  if (totalEl) {

    totalEl.textContent =
      formatPrice(
        total
      );
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
    Number(
      currentShippingPrice || 0
    );


  if (
    selectedPaymentMethod ===
    "library_pickup"
  ) {
    shipping = 0;
  }


  const total =
    subtotal +
    shipping;


  let prepaid =
    0;

  let remaining =
    0;


  const instructions =
    document.getElementById(
      "paymentInstructions"
    );


  if (
    selectedPaymentMethod ===
    "cod"
  ) {

    prepaid =
      shipping;

    remaining =
      total -
      prepaid;


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
      total -
      prepaid;


    if (instructions) {

      instructions.textContent =
       "الاستلام من MMK Store في الأقصر: يتم دفع 50% من قيمة الطلب مقدمًا لتأكيد الطلب، ودفع 50% المتبقية عند الاستلام من المتجر.";
    }

  } else {

    prepaid =
      total;

    remaining =
      0;


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
      formatPrice(
        prepaid
      );
  }


  if (remainingEl) {

    remainingEl.textContent =
      formatPrice(
        remaining
      );
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
      await window.supabaseClient
        .auth
        .getSession();


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

function validateEgyptianPhone(
  phone
) {

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
   التحقق من الطلب
   ========================================================= */

function validateCheckoutForm() {

  let valid =
    true;


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


  /*
   * رقم العملية وصورة الإيصال
   * مطلوبة في طرق الدفع التي تحتاج
   * إثبات تحويل.
   *
   * الدفع عند الاستلام:
   * مطلوب أيضًا إثبات دفع الشحن مقدمًا.
   */

  const transactionNumber =
    transactionField.value.trim();


  const transactionRequired =
    selectedPaymentMethod ===
      "cod" ||
    selectedPaymentMethod ===
      "orange_cash" ||
    selectedPaymentMethod ===
      "instapay" ||
    selectedPaymentMethod ===
      "library_pickup";


  if (transactionRequired) {

    setFieldError(
      "transactionNumber",
      !transactionNumber
    );

    if (!transactionNumber) {
      valid = false;
    }
  }


  const receiptInput =
    document.getElementById(
      "paymentReceipt"
    );

  const receiptRow =
    receiptInput?.closest(
      ".form-row"
    );


  if (
    transactionRequired &&
    !receiptFile
  ) {

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
    checkoutCartQuantity() ===
    0
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
   اختيار الإيصال
   ========================================================= */

function handleReceiptFile(
  file
) {

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


  if (
    file.size >
    maxSize
  ) {

    showToast(
      "حجم الصورة يجب ألا يتجاوز 5 ميجابايت",
      "error"
    );

    return;
  }


  receiptFile =
    file;


  const preview =
    document.getElementById(
      "receiptPreview"
    );


  if (preview) {

    const objectURL =
      URL.createObjectURL(
        file
      );

    preview.src =
      objectURL;

    preview.classList.add(
      "show"
    );

    preview.onload =
      () => {

        URL.revokeObjectURL(
          objectURL
        );
      };
  }


  document
    .getElementById(
      "paymentReceipt"
    )
    ?.closest(
      ".form-row"
    )
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
    /^[a-z0-9]+$/i.test(
      ext
    )
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
    await window.supabaseClient
      .storage
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
    window.supabaseClient
      .storage
      .from(bucket)
      .getPublicUrl(
        path
      );


  return {

    path:
      data?.path ||
      path,

    url:
      publicData?.publicUrl ||
      null
  };
}


/* =========================================================
   رقم الطلب
   ========================================================= */

function createOrderNumber() {

  const now =
    new Date();


  const year =
    now.getFullYear();


  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    );


  const random =
    Math.floor(
      1000 +
      Math.random() *
      9000
    );


  return (
    `MMK-${year}${month}${day}-${random}`
  );
}


/* =========================================================
   إرسال الطلب
   ========================================================= */

async function submitOrder(
  event
) {

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


  isSubmitting =
    true;


  const submitBtn =
    document.getElementById(
      "confirmOrderBtn"
    );


  if (!submitBtn) {

    isSubmitting =
      false;

    return;
  }


  const originalText =
    submitBtn.textContent;


  submitBtn.disabled =
    true;


  submitBtn.innerHTML =
    `<span class="spinner"></span>
     جاري إرسال الطلب...`;


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
            currentShippingPrice ||
            0
          );


    const total =
      subtotal +
      shipping;


    let prepaidAmount =
      0;

    let remainingAmount =
      0;


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
      createOrderNumber();


    /*
     * رفع صورة الإيصال
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


    /*
     * بيانات المستخدم
     */

    const {
      data: sessionData,
      error: sessionError
    } =
      await window.supabaseClient
        .auth
        .getSession();


    if (sessionError) {
      throw sessionError;
    }


    const user =
      sessionData
        ?.session
        ?.user;


    if (!user) {

      throw new Error(
        "انتهت جلسة تسجيل الدخول. سجل الدخول مرة أخرى."
      );
    }


    const customerUserId =
      user.id;


    const customerEmail =
      user.email ||
      null;


    const name =
      document.getElementById(
        "customerName"
      )?.value
      ?.trim() ||
      "";


    const phone =
      document.getElementById(
        "customerPhone"
      )?.value
      ?.trim() ||
      "";


    const address =
      document.getElementById(
        "customerAddress"
      )?.value
      ?.trim() ||
      "";


    const notes =
      document.getElementById(
        "customerNotes"
      )?.value
      ?.trim() ||
      "";


    const transactionNumber =
      document.getElementById(
        "transactionNumber"
      )?.value
      ?.trim() ||
      "";


    /*
     * بيانات الطلب
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


    /*
     * إدخال الطلب
     */

    const {
      data,
      error
    } =
      await window.supabaseClient
        .from(
          ordersTable
        )
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
     * حذف السلة
     */

    const cartKey =
      typeof window.CART_KEY !==
      "undefined"
        ? window.CART_KEY
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


    isSubmitting =
      false;
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


  methods.forEach(
    method => {

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
            item =>
              item.classList.remove(
                "selected"
              )
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
    }
  );
}


/* =========================================================
   المحافظات والمراكز والقرى
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
   * المحافظة
   */

  govSelect.addEventListener(
    "change",
    () => {

      const option =
        govSelect
          .selectedOptions[0];


      selectedGovernorate =
        option?.dataset.name ||
        "";


      selectedCity =
        "";

      selectedVillage =
        "";

      currentShippingPrice =
        null;


      if (!govSelect.value) {

        citySelect.innerHTML =
          `<option value="">
            اختر المحافظة أولاً
          </option>`;

        citySelect.disabled =
          true;


        villageSelect.innerHTML =
          `<option value="">
            اختر المركز أولاً
          </option>`;

        villageSelect.disabled =
          true;


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
      "محافظة الأقصر لديها نظام شحن محلي خاص، كما يتاح الاستلام من MMK Store.",
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


  /*
   * المركز
   */

  citySelect.addEventListener(
    "change",
    () => {

      const option =
        citySelect
          .selectedOptions[0];


      selectedCity =
        option?.dataset.name ||
        "";


      selectedVillage =
        "";


      if (!citySelect.value) {

        villageSelect.innerHTML =
          `<option value="">
            اختر المركز أولاً
          </option>`;

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


  /*
   * القرية
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
    event => {

      const file =
        event.target
          .files?.[0];

      handleReceiptFile(
        file
      );
    }
  );


  uploadBox.addEventListener(
    "dragover",
    event => {

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
    event => {

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
          .slice(
            0,
            11
          );
    }
  );
}


/* =========================================================
   تعبئة بيانات العميل
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
      await window.supabaseClient
        .auth
        .getSession();


    const user =
      data
        ?.session
        ?.user;


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
   تنظيف صور السلة القديمة
   =========================================================

   هذا الجزء مهم جدًا.

   لو عندك منتجات قديمة في localStorage
   محفوظة بـ via.placeholder.com،
   الكود يحولها للصورة المحلية قبل العرض.

   ========================================================= */

function cleanupOldCartImages() {

  try {

    const cartKey =
      typeof window.CART_KEY !==
      "undefined"
        ? window.CART_KEY
        : "cart";


    const saved =
      localStorage.getItem(
        cartKey
      );


    if (!saved) {
      return;
    }


    const cart =
      JSON.parse(saved);


    if (!Array.isArray(cart)) {
      return;
    }


    let changed =
      false;


    const cleaned =
      cart.map(
        item => {

          if (!item) {
            return item;
          }


          const image =
            item.image ||
            item.img ||
            item.thumbnail;


          if (
            image &&
            (
              String(image).includes(
                "via.placeholder.com"
              ) ||
              String(image).includes(
                "placeholder.com"
              ) ||
              String(image).includes(
                "placehold.co"
              ) ||
              String(image).includes(
                "placehold.it"
              )
            )
          ) {

            changed =
              true;


            const newItem =
              {
                ...item
              };


            /*
             * نحذف الصورة القديمة
             * بدل تخزين Data URI في localStorage.
             */

            if (
              "image" in newItem
            ) {
              newItem.image =
                "";
            }


            if (
              "img" in newItem
            ) {
              newItem.img =
                "";
            }


            if (
              "thumbnail" in newItem
            ) {
              newItem.thumbnail =
                "";
            }


            return newItem;
          }


          return item;
        }
      );


    if (changed) {

      localStorage.setItem(
        cartKey,
        JSON.stringify(
          cleaned
        )
      );
    }


  } catch (error) {

    console.warn(
      "تعذر تنظيف صور السلة القديمة:",
      error
    );
  }
}


/* =========================================================
   تشغيل الصفحة
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    /*
     * تنظيف روابط الصور القديمة
     * قبل رسم المنتجات.
     */

    cleanupOldCartImages();


    /*
     * التأكد من تسجيل الدخول
     */

    const isLoggedIn =
      await requireCustomerLogin();


    if (!isLoggedIn) {
      return;
    }


    /*
     * التأكد أن السلة ليست فارغة
     */

    if (
      checkoutCartQuantity() ===
      0
    ) {

      showToast(
        "سلتك فارغة، الرجاء إضافة منتجات أولاً",
        "error"
      );


      setTimeout(
        () => {

          window.location.href =
            "cart.html";

        },
        1200
      );


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
     * تحميل المحافظات
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

