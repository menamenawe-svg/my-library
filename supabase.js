/* =========================================================
   supabase.js — MMK Store
   ========================================================= */

(function initSupabaseClient() {

const SUPABASE_URL =
  "https://ydguqnvkxceunhjptzpl.supabase.co";
const SUPABASE_ANON_KEY =
  "sb_publishable_vcWvym2vc-Elec2C9M81rA_q9fdDwP6";

  if (
    typeof window.supabase === "undefined" ||
    typeof window.supabase.createClient !== "function"
  ) {
    console.error(
      "❌ مكتبة Supabase غير محملة قبل supabase.js"
    );
    return;
  }

  try {

    window.supabaseClient =
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
      );

    window.MENA_CONFIG = {
      ORDERS_TABLE: "orders",
      PRODUCTS_TABLE: "products",
      RECEIPTS_BUCKET: "payment-receipts",
      PRODUCT_IMAGES_BUCKET: "product-images",
      CART_KEY: "libraryCart",
      LAST_ORDER_ID_KEY: "lastOrderId",
      LAST_ORDER_NUMBER_KEY: "lastOrderNumber"
    };

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
