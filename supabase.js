/* =========================================================
   supabase.js — عميل Supabase المشترك لمكتبة مينا
   ========================================================= */

(function initSupabaseClient() {
  const SUPABASE_URL =
    "https://fmporjxfmjacqpppzgbs.supabase.co";

  const SUPABASE_ANON_KEY =
    "sb_publishable_f9EeMqMWY5NulG-9Oma3mQ_3xh6SHJj";

  if (window.supabaseClient) {
    return;
  }

  if (typeof window.supabase === "undefined") {
    console.error(
      "لم يتم تحميل مكتبة Supabase. تأكد من تحميل @supabase/supabase-js قبل supabase.js."
    );
    return;
  }

  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
      },
    }
  );

  window.MENA_CONFIG = {
    ORDERS_TABLE: "orders",
    PRODUCTS_TABLE: "products",
    RECEIPTS_BUCKET: "payment-receipts",
    PRODUCT_IMAGES_BUCKET: "product-images",
    CART_KEY: "libraryCart",
    LAST_ORDER_ID_KEY: "lastOrderId",
    LAST_ORDER_NUMBER_KEY: "lastOrderNumber",
  };

  console.log("✅ تم الاتصال بـ Supabase بنجاح");
})();

/* =========================================================
   دوال مساعدة
   ========================================================= */

function escapeHTML(str) {
  if (str === null || str === undefined) return "";

  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatPrice(value) {
  const num = Number(value) || 0;

  return (
    num.toLocaleString("ar-EG", {
      maximumFractionDigits: 2,
    }) + " ج.م"
  );
}

function generateOrderNumber() {
  const now = new Date();

  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");

  const rand = Math.floor(100000 + Math.random() * 900000);

  return `MN-${y}${m}${d}-${rand}`;
}