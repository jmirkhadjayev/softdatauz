(function () {
  "use strict";

  var PRESETS = [
    { id: "1", name: "1. Silicon Valley ⭐", font: "Plus Jakarta + Inter", tip: "Tavsiya: Zamonaviy AI/SaaS", url: "variant-1.html" },
    { id: "2", name: "2. Cyber Future", font: "Unbounded + Onest", tip: "Futuristik neon robototexnika", url: "variant-2.html" },
    { id: "3", name: "3. Industrial", font: "Space Grotesk + DM Sans", tip: "Nemis muhandislik & Siemens", url: "variant-3.html" },
    { id: "4", name: "4. Luxury Tech", font: "Outfit + Outfit", tip: "Apple / Nothing nafisligi", url: "variant-4.html" },
    { id: "5", name: "5. Fintech AI", font: "Sora + Jakarta", tip: "Stripe & Vercel ma'lumot tahlili", url: "variant-5.html" },
    { id: "6", name: "6. Bold Editorial", font: "Syne + Manrope", tip: "Dovyurak katta marketing aksenti", url: "variant-6.html" },
    { id: "7", name: "7. Nordic Clean", font: "Manrope + Manrope", tip: "Skandinavcha bosiq tozalik", url: "variant-7.html" },
    { id: "8", name: "8. Enterprise", font: "Jakarta + Inter Mono", tip: "IBM / Azure korporativ tizimlar", url: "variant-8.html" }
  ];

  function getActivePreset() {
    // 1. From URL param ?preset=X
    var params = new URLSearchParams(window.location.search);
    var p = params.get("preset");
    if (p && /^[1-8]$/.test(p)) return p;

    // 2. From HTML attribute
    var attr = document.documentElement.getAttribute("data-preset");
    if (attr && /^[1-8]$/.test(attr)) return attr;

    // 3. From filename (e.g. variant-3.html)
    var match = window.location.pathname.match(/variant-([1-8])\.html/i);
    if (match) return match[1];

    // 4. From localStorage
    try {
      var saved = localStorage.getItem("softdata_preset");
      if (saved && /^[1-8]$/.test(saved)) return saved;
    } catch (e) {}

    // Default: 1
    return "1";
  }

  function applyPreset(id) {
    document.documentElement.setAttribute("data-preset", id);
    try { localStorage.setItem("softdata_preset", id); } catch (e) {}
  }

  // Initial apply
  var active = getActivePreset();
  applyPreset(active);
})();
