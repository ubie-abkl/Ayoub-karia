/**
 * Réception des réponses du formulaire de présence dans Google Sheets.
 *
 * Installation (une seule fois) :
 * 1. Créez un Google Sheets vide (par ex. « Mariage Cheïma & Amine — Réponses »).
 * 2. Menu Extensions > Apps Script, effacez le contenu et collez ce fichier.
 * 3. Cliquez sur Déployer > Nouveau déploiement > type « Application Web ».
 *    - Exécuter en tant que : Moi
 *    - Qui a accès : Tout le monde
 * 4. Autorisez l'accès quand Google le demande, puis copiez l'URL
 *    (elle se termine par /exec) dans FORM_ENDPOINT, en haut de script.js.
 */

var SHEET_NAME = "Réponses";
var HEADERS = ["Horodateur", "Nom & Prénom", "Serez-vous présent(e) ?", "Nombre de personnes", "Petit mot"];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getSheet_();
    var p = (e && e.parameter) || {};
    sheet.appendRow([
      new Date(),
      clean_(p.nom),
      p.presence === "non" ? "Non" : "Oui",
      p.presence === "non" ? 0 : Number(p.personnes) || 1,
      clean_(p.message)
    ]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#4e3a2b").setFontColor("#ebe1d1");
    sheet.setFrozenRows(1);
    sheet.getRange("A:A").setNumberFormat("dd/MM/yyyy HH:mm:ss");
  }
  return sheet;
}

// Empêche une réponse de devenir une formule dans le tableur.
function clean_(v) {
  v = String(v || "").trim().slice(0, 1000);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
