
/* =========================================================
   supabase.js — عميل Supabase المشترك لمتجر MMK
   ========================================================= */

(function initSupabaseClient() {

  const SUPABASE_URL =
    "https://fmporjxfmjacqpppzgbs.supabase.co";

  const SUPABASE_ANON_KEY =
    "sb_publishable_f9EeMqMWY5NulG-9Oma3mQ_3xh6SHJj";

  /* -----------------------------------------
     منع إنشاء Client أكثر من مرة
  ----------------------------------------- */

  if (window.supabaseClient) {
    return;
  }

  /* -----------------------------------------
     التأكد من تحميل مكتبة Supabase
  ----------------------------------------- */

  if (
    typeof window.supabase === "undefined" ||
    typeof window.supabase.createClient !== "function"
  ) {
    console.error(
      "❌ مكتبة Supabase غير محملة. تأكد من تحميل @supabase/supabase-js قبل supabase.js."
    );

    return;
  }

  /* -----------------------------------------
     إنشاء Supabase Client
  ----------------------------------------- */

  try {

    window.supabaseClient =
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: window.localStorage
          }
        }
      );

    /* -----------------------------------------
       إعدادات المشروع
    ----------------------------------------- */

    window.MENA_CONFIG = {

      ORDERS_TABLE:
        "orders",

      PRODUCTS_TABLE:
        "products",

      RECEIPTS_BUCKET:
        "payment-receipts",

      PRODUCT_IMAGES_BUCKET:
        "product-images",

      CART_KEY:
        "libraryCart",

      LAST_ORDER_ID_KEY:
        "lastOrderId",

      LAST_ORDER_NUMBER_KEY:
        "lastOrderNumber"
    };

    /* -----------------------------------------
       دعم الاسم الجديد أيضًا
    ----------------------------------------- */

    window.MMK_CONFIG =
      window.MENA_CONFIG;

    console.log(
      "✅ تم الاتصال بـ Supabase بنجاح"
    );

  } catch (error) {

    console.error(
      "❌ فشل إنشاء Supabase Client:",
      error
    );

  }

})();


/* =========================================================
   توليد رقم طلب
   ========================================================= */

function generateOrderNumber() {

  const now =
    new Date();

  const y =
    now.getFullYear();

  const m =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");

  const d =
    String(
      now.getDate()
    ).padStart(2, "0");

  const random =
    Math.floor(
      100000 +
      Math.random() * 900000
    );

  return (
    `MN-${y}${m}${d}-${random}`
  );
}

