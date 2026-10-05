(function () {
  "use strict";

  var intro = document.getElementById("intro");
  var body = document.body;
  var opened = false;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Ouverture de l'enveloppe ---------- */
  function openEnvelope() {
    if (opened) return;
    opened = true;

    var steps = reduced
      ? [[0, "is-opening"], [0, "step-zoom"], [0, "step-flap"], [0, "flap-behind"], [0, "step-card"], [50, "done"]]
      : [
          [0, "is-opening"],     // le sceau se détache
          [450, "step-zoom"],    // on recule, l'enveloppe apparaît en entier
          [1350, "step-flap"],   // le rabat s'ouvre
          [1850, "flap-behind"], // le rabat passe derrière la carte
          [2350, "step-card"],   // la carte sort de l'enveloppe
          [3700, "done"]         // on arrive sur le save the date
        ];

    steps.forEach(function (s) {
      setTimeout(function () {
        if (s[1] === "done") return reveal();
        intro.classList.add(s[1]);
      }, s[0]);
    });
  }

  function reveal() {
    window.scrollTo(0, 0);
    intro.classList.add("is-gone");
    body.classList.remove("is-locked");
    body.classList.add("is-revealed");
    setTimeout(function () { intro.setAttribute("hidden", ""); }, 1200);
  }

  document.getElementById("seal").addEventListener("click", openEnvelope);

  /* ---------- Apparition au défilement ---------- */
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Formulaire de présence ----------
     Les réponses partent dans un Google Sheets : collez dans FORM_ENDPOINT
     l'URL de l'application Web Apps Script (voir google-apps-script.gs). */
  var FORM_ENDPOINT = "https://script.google.com/macros/s/AKfycbxrbOZdFxDcIyDqi0ccH0LliYHYACRD_DxQHFgpM7ruQXjmvWHpAM8_7VWEptZUPRpWNQ/exec";

  var form = document.getElementById("rsvpForm");
  var errorBox = document.getElementById("rsvpError");
  var submitBtn = document.getElementById("rsvpSubmit");
  var guestsField = document.getElementById("guestsField");

  form.addEventListener("change", function (e) {
    if (e.target.name === "attending") guestsField.hidden = e.target.value === "non";
  });

  function showError(msg) { errorBox.textContent = msg; errorBox.hidden = false; }

  function saveToArtifact(data) {
    // Dans l'aperçu Claude, les réponses sont gardées dans la base de la page.
    if (!window.claude || !window.claude.use) return Promise.resolve(false);
    return Promise.all([window.claude.use("db"), window.claude.use("user")]).then(function (r) {
      var db = r[0], user = r[1];
      if (!db || !user) return false;
      return user.id().then(function (id) {
        if (!id) return false;
        return db.doc("rsvp/" + id).set(data).then(function () { return true; });
      });
    });
  }

  function saveToEndpoint(data) {
    if (!FORM_ENDPOINT) return Promise.resolve(false);
    // Google Apps Script ne renvoie pas d'en-têtes CORS lisibles : on envoie
    // en mode « no-cors » ; seule une panne réseau fait échouer l'envoi.
    return fetch(FORM_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      body: new URLSearchParams(data)
    }).then(function () { return true; });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorBox.hidden = true;
    var fd = new FormData(form);
    var name = (fd.get("name") || "").trim();
    var attending = fd.get("attending");
    if (!name) return showError("Merci d'indiquer votre nom et prénom.");
    if (!attending) return showError("Merci de nous dire si vous serez présent(e).");

    var data = {
      nom: name,
      presence: attending,
      personnes: attending === "oui" ? Number(fd.get("guests")) : 0,
      message: (fd.get("message") || "").trim(),
      date: new Date().toISOString()
    };

    submitBtn.disabled = true;
    saveToEndpoint(data)
      .then(function (ok) { return ok || saveToArtifact(data); })
      .then(function (ok) {
        if (!ok) throw new Error("no backend");
        form.hidden = true;
        document.getElementById("rsvpThanksText").textContent = attending === "oui"
          ? "Votre réponse a bien été enregistrée. Nous avons hâte de vous voir !"
          : "Votre réponse a bien été enregistrée. Vous nous manquerez.";
        document.getElementById("rsvpThanks").hidden = false;
      })
      .catch(function () {
        showError("Votre réponse n'a pas pu être envoyée. Réessayez dans un instant ou contactez directement les mariés.");
      })
      .then(function () { submitBtn.disabled = false; });
  });

  /* ---------- Compte à rebours ---------- */
  var target = new Date("2026-11-06T15:30:00+01:00").getTime();
  var units = {};
  document.querySelectorAll("#timer [data-unit]").forEach(function (el) {
    units[el.getAttribute("data-unit")] = el;
  });

  function pad(n) { return n < 10 ? "0" + n : String(n); }

  function tick() {
    var diff = Math.max(0, target - Date.now());
    var s = Math.floor(diff / 1000);
    units.days.textContent = Math.floor(s / 86400);
    units.hours.textContent = pad(Math.floor((s % 86400) / 3600));
    units.minutes.textContent = pad(Math.floor((s % 3600) / 60));
    units.seconds.textContent = pad(s % 60);
  }
  tick();
  setInterval(tick, 1000);
})();
