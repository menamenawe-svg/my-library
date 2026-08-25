<!DOCTYPE html>
<html lang="ar" dir="rtl">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>إتمام الطلب | MMK Store</title>

  <meta
    name="description"
    content="إتمام طلبك من MMK Store"
  >

  <link
    href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap"
    rel="stylesheet"
  >

  <link rel="stylesheet" href="style.css">
</head>

<body>

  <!-- =====================================================
       PROMO BAR
  ====================================================== -->

  <div class="promo-bar">
    <div class="promo-track">

      <span>🚚 توصيل لكل محافظات مصر</span>
      <span>🎁 عروض وخصومات أسبوعية</span>
      <span>🔒 دفع آمن</span>
      <span>⭐ خدمة عملاء متميزة</span>

      <span>🚚 توصيل لكل محافظات مصر</span>
      <span>🎁 عروض وخصومات أسبوعية</span>
      <span>🔒 دفع آمن</span>
      <span>⭐ خدمة عملاء متميزة</span>

    </div>
  </div>


  <!-- =====================================================
       NAVBAR
  ====================================================== -->

  <header class="navbar">

    <div class="container">

      <a href="index.html" class="logo">
        🛍️ <span>MMK Store</span>
      </a>

      <nav class="nav-links">

        <a href="index.html">
          الرئيسية
        </a>

        <a href="index.html#categories">
          الأقسام
        </a>

        <a href="index.html#products">
          المنتجات
        </a>

        <a href="cart.html">
          السلة
        </a>

      </nav>

      <div class="nav-actions">

        <a
          href="login.html"
          class="account-link"
          id="accountLink"
        >
          👤 تسجيل الدخول
        </a>

        <a
          href="cart.html"
          class="cart-link"
          aria-label="السلة"
        >
          🛒
          <span
            class="cart-badge"
            id="cartCount"
          >
            0
          </span>
        </a>

      </div>

    </div>

  </header>


  <!-- =====================================================
       PAGE HEADER
  ====================================================== -->

  <section class="page-header">

    <div class="container">

      <div class="breadcrumb">

        <a href="index.html">
          الرئيسية
        </a>

        <span class="sep">
          /
        </span>

        <a href="cart.html">
          السلة
        </a>

        <span class="sep">
          /
        </span>

        <span class="current">
          إتمام الطلب
        </span>

      </div>

      <h1 class="page-title">
        إتمام الطلب
      </h1>

    </div>

  </section>


  <!-- =====================================================
       PROGRESS
  ====================================================== -->

  <div class="container">

    <div class="progress-steps">

      <div class="progress-step done">

        <div class="dot">
          ✓
        </div>

        <span class="label">
          السلة
        </span>

      </div>

      <div class="progress-line"></div>

      <div class="progress-step active">

        <div class="dot">
          2
        </div>

        <span class="label">
          بيانات الطلب
        </span>

      </div>

      <div class="progress-line"></div>

      <div class="progress-step">

        <div class="dot">
          3
        </div>

        <span class="label">
          التأكيد
        </span>

      </div>

    </div>

  </div>


  <!-- =====================================================
       CHECKOUT BODY
  ====================================================== -->

  <main class="page-body">

    <div class="container">

      <form id="checkoutForm" novalidate>

        <div class="checkout-layout">


          <!-- =================================================
               LEFT COLUMN
          ================================================== -->

          <div>


            <!-- =============================================
                 CUSTOMER DATA
            ============================================== -->

            <section class="form-card">

              <h3>
                <span class="badge-num">
                  1
                </span>

                بيانات العميل
              </h3>


              <div class="form-row">

                <label for="customerName">
                  الاسم بالكامل
                  <span class="req">*</span>
                </label>

                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  placeholder="اكتب اسمك بالكامل"
                  autocomplete="name"
                  required
                >

                <div class="field-error">
                  يرجى إدخال الاسم
                </div>

              </div>


              <div class="form-row">

                <label for="customerPhone">
                  رقم الهاتف
                  <span class="req">*</span>
                </label>

                <input
                  type="tel"
                  id="customerPhone"
                  name="customerPhone"
                  placeholder="01xxxxxxxxx"
                  maxlength="11"
                  inputmode="numeric"
                  autocomplete="tel"
                  required
                >

                <div class="field-hint">
                  يجب إدخال رقم هاتف مصري صحيح
                </div>

                <div class="field-error">
                  رقم الهاتف غير صحيح
                </div>

              </div>


              <div class="form-row">

                <label for="customerNotes">
                  ملاحظات إضافية
                </label>

                <textarea
                  id="customerNotes"
                  name="customerNotes"
                  rows="3"
                  placeholder="أي ملاحظات تريد إضافتها للطلب..."
                ></textarea>

              </div>

            </section>


            <!-- =============================================
                 LOCATION
            ============================================== -->

            <section class="form-card">

              <h3>
                <span class="badge-num">
                  2
                </span>

                عنوان التوصيل
              </h3>


              <div
                id="locationStatus"
                class="status-box info"
                hidden
              ></div>


              <div class="form-row">

                <label for="customerGovernorate">
                  المحافظة
                  <span class="req">*</span>
                </label>

                <select
                  id="customerGovernorate"
                  name="customerGovernorate"
                  title="اختر المحافظة"
                  required
                >

                  <option value="">
                    جاري تحميل المحافظات...
                  </option>

                </select>

                <div class="field-error">
                  يرجى اختيار المحافظة
                </div>

              </div>


              <div class="form-grid-2">


                <div class="form-row">

                  <label for="customerCity">
                    المركز
                    <span class="req">*</span>
                  </label>

                  <select
                    id="customerCity"
                    name="customerCity"
                    title="اختر المركز"
                    disabled
                    required
                  >

                    <option value="">
                      اختر المحافظة أولاً
                    </option>

                  </select>

                  <div class="field-error">
                    يرجى اختيار المركز
                  </div>

                </div>


                <div class="form-row">

                  <label for="customerVillage">
                    القرية / الحي
                    <span class="req">*</span>
                  </label>

                  <select
                    id="customerVillage"
                    name="customerVillage"
                    title="اختر القرية أو الحي"
                    disabled
                    required
                  >

                    <option value="">
                      اختر المركز أولاً
                    </option>

                  </select>

                  <div class="field-error">
                    يرجى اختيار القرية أو الحي
                  </div>

                </div>


              </div>


              <div class="form-row">

                <label for="customerAddress">
                  العنوان بالتفصيل
                  <span class="req">*</span>
                </label>

                <textarea
                  id="customerAddress"
                  name="customerAddress"
                  rows="4"
                  placeholder="اسم الشارع، رقم العقار، الدور، علامة مميزة..."
                  required
                ></textarea>

                <div class="field-error">
                  يرجى إدخال العنوان بالتفصيل
                </div>

              </div>


              <div
                id="shippingStatus"
                class="status-box info"
              >

                <span id="shippingPriceText">
                  اختر المحافظة والمنطقة لحساب سعر الشحن
                </span>

              </div>

            </section>


            <!-- =============================================
                 PAYMENT
            ============================================== -->

            <section class="form-card">

              <h3>
                <span class="badge-num">
                  3
                </span>

                طريقة الدفع والاستلام
              </h3>


              <div class="payment-methods">


                <!-- COD -->

                <div
                  class="payment-method selected"
                  data-method="cod"
                  role="button"
                  tabindex="0"
                >

                  <div class="pm-icon">
                    💵
                  </div>

                  <div class="pm-name">
                    الدفع عند الاستلام
                  </div>

                </div>


                <!-- ORANGE CASH -->

                <div
                  class="payment-method"
                  data-method="orange_cash"
                  role="button"
                  tabindex="0"
                >

                  <div class="pm-icon">
                    🟠
                  </div>

                  <div class="pm-name">
                    Orange Cash
                  </div>

                </div>


                <!-- INSTAPAY -->

                <div
                  class="payment-method"
                  data-method="instapay"
                  role="button"
                  tabindex="0"
                >

                  <div class="pm-icon">
                    🏦
                  </div>

                  <div class="pm-name">
                    InstaPay
                  </div>

                </div>


                <!-- LIBRARY PICKUP -->

                <div
                  id="libraryPickupMethod"
                  class="payment-method"
                  data-method="library_pickup"
                  role="button"
                  tabindex="0"
                  hidden
                >

                  <div class="pm-icon">
                    🏪
                  </div>

                  <div class="pm-name">
                    الاستلام من MMK
                  </div>

                </div>

              </div>


              <!-- PAYMENT DETAILS -->

              <div class="payment-details-box">


                <!-- PAYMENT AMOUNTS -->

                <div class="payment-amounts">

                  <div class="amount-chip prepaid">

                    <div class="label">
                      المبلغ المطلوب دفعه مقدمًا
                    </div>

                    <div
                      class="value"
                      id="prepaidAmountText"
                    >
                      0 ج.م
                    </div>

                  </div>


                  <div class="amount-chip remaining">

                    <div class="label">
                      المبلغ المتبقي
                    </div>

                    <div
                      class="value"
                      id="remainingAmountText"
                    >
                      0 ج.م
                    </div>

                  </div>

                </div>


                <!-- INSTRUCTIONS -->

                <div
                  id="paymentInstructions"
                  class="field-hint"
                >
                  يتم دفع مصاريف الشحن مقدمًا فقط،
                  والباقي عند الاستلام.
                </div>


                <!-- PAYMENT NUMBERS -->

                <div
                  id="paymentNumbers"
                  class="payment-numbers"
                  hidden
                ></div>


                <!-- TRANSACTION NUMBER -->

                <div class="form-row transaction-row">

                  <label for="transactionNumber">

                    رقم عملية التحويل

                    <span class="req">
                      *
                    </span>

                  </label>

                  <input
                    type="text"
                    id="transactionNumber"
                    name="transactionNumber"
                    placeholder="اكتب رقم العملية"
                    autocomplete="off"
                    required
                  >

                  <div class="field-error">
                    يرجى إدخال رقم عملية التحويل
                  </div>

                </div>


                <!-- RECEIPT -->

                <div class="form-row">

                  <label for="paymentReceipt">
                    صورة إيصال الدفع
                    <span class="req">*</span>
                  </label>


                  <input
                    type="file"
                    id="paymentReceipt"
                    name="paymentReceipt"
                    class="hidden-file-input"
                    accept="image/*"
                  >


                  <div
                    id="receiptUploadBox"
                    class="upload-box"
                    role="button"
                    tabindex="0"
                    aria-label="رفع صورة إيصال الدفع"
                  >

                    <div class="upload-icon">
                      📎
                    </div>

                    <p>
                      اضغط هنا لرفع صورة الإيصال
                    </p>

                    <p>
                      أو اسحب الصورة هنا
                    </p>

                    <p>
                      الحد الأقصى 5 ميجابايت
                    </p>

                  </div>


                  <img
                    id="receiptPreview"
                    src=""
                    alt="معاينة إيصال الدفع"
                  >

                </div>


              </div>

            </section>


            <!-- =============================================
                 MESSAGE
            ============================================== -->

            <div
              id="checkoutMessage"
              class="status-box error"
              role="alert"
              aria-live="assertive"
              hidden
            ></div>


            <!-- =============================================
                 CONFIRM
            ============================================== -->

            <button
              type="submit"
              id="confirmOrderBtn"
              class="btn btn-primary btn-lg btn-block"
            >
              ✅ تأكيد الطلب
            </button>


          </div>


          <!-- =================================================
               RIGHT COLUMN - SUMMARY
          ================================================== -->

          <aside>


            <div class="summary-card">

              <h3>
                ملخص طلبك
              </h3>


              <!-- PRODUCTS -->

              <div
                id="checkoutItems"
                class="checkout-summary-items"
              >

                <div class="page-loading">
                  جاري تحميل المنتجات...
                </div>

              </div>


              <!-- QUANTITY -->

              <div class="summary-row">

                <span>
                  عدد المنتجات
                </span>

                <strong id="checkoutQuantity">
                  0
                </strong>

              </div>


              <!-- SUBTOTAL -->

              <div class="summary-row">

                <span>
                  إجمالي المنتجات
                </span>

                <strong id="checkoutSubtotal">
                  0 ج.م
                </strong>

              </div>


              <!-- SHIPPING -->

              <div class="summary-row">

                <span>
                  الشحن
                </span>

                <strong id="checkoutShipping">
                  يُحدد حسب العنوان
                </strong>

              </div>


              <!-- TOTAL -->

              <div class="summary-row total">

                <span>
                  الإجمالي النهائي
                </span>

                <strong id="checkoutTotal">
                  0 ج.م
                </strong>

              </div>


              <p class="summary-note">
                يتم تأكيد الطلب بعد مراجعة بيانات الدفع والإيصال.
              </p>


              <a
                href="cart.html"
                class="btn btn-ghost btn-block"
              >
                ← العودة للسلة
              </a>

            </div>


          </aside>

        </div>

      </form>

    </div>

  </main>


  <!-- =====================================================
       FOOTER
  ====================================================== -->

  <footer class="site-footer">

    <div class="container">

      <div class="footer-bottom">

        &copy;
        <span id="footerYear"></span>
        MMK Store. جميع الحقوق محفوظة.

      </div>

    </div>

  </footer>


  <!-- =====================================================
       TOAST
  ====================================================== -->

  <div
    id="toastContainer"
    aria-live="polite"
  ></div>


  <!-- =====================================================
       JAVASCRIPT
       مهم: الترتيب مهم جدًا
  ====================================================== -->

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

  <script src="supabase.js"></script>

  <script src="script.js"></script>

  <script src="checkout.js"></script>


  <script>
    document.getElementById("footerYear").textContent =
      new Date().getFullYear();
  </script>

</body>
</html>