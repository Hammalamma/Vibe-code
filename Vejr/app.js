// =========================================================
// APP.JS — appens "hjerne"
// =========================================================


// =========================================================
// 1. VEJRTYPE: lav API'ens vejrkode om til en "type"
//    API'en giver et tal (f.eks. 61 = regn). Vi bruger "if" til at vælge.
// =========================================================
function vejrType(kode, erDag) {
  if (kode === 0)  return erDag ? "sol" : "nat";
  if (kode <= 2)   return "delvis";
  if (kode === 3)  return "skyet";
  if (kode <= 48)  return "tåge";
  if (kode <= 67)  return "regn";
  if (kode <= 77)  return "sne";
  if (kode <= 82)  return "regn";
  if (kode <= 86)  return "sne";
  return "torden";
}

const beskrivelser = {
  sol: "Sol fra en skyfri himmel",
  nat: "Klar nattehimmel",
  delvis: "Sol og skyer",
  skyet: "Gråt og overskyet",
  tåge: "Tåget",
  regn: "Regn",
  sne: "Sne",
  torden: "Torden og lyn"
};

// Farver til hver type: [baggrund, blæk, sol, sky, dråbe]
const farver = {
  sol:    ["#ff6b35", "#1b1b1b", "#ffd23f", "#f4f1e8", "#1b1b1b"],
  nat:    ["#1b1f3b", "#f4f1e8", "#ffd23f", "#f4f1e8", "#9ed0ff"],
  delvis: ["#4ecdc4", "#1b1b1b", "#ffd23f", "#f4f1e8", "#1b1b1b"],
  skyet:  ["#b8b8d1", "#1b1b1b", "#ffd23f", "#f4f1e8", "#1b1b1b"],
  tåge:   ["#c9c5ba", "#1b1b1b", "#ffd23f", "#f4f1e8", "#1b1b1b"],
  regn:   ["#2e5eaa", "#f4f1e8", "#ffd23f", "#f4f1e8", "#9ed0ff"],
  sne:    ["#dde7f0", "#1b1b1b", "#ffd23f", "#ffffff", "#2e5eaa"],
  torden: ["#3d1e6d", "#f4f1e8", "#ffd23f", "#b8b8d1", "#ffd23f"]
};


// =========================================================
// 2. TEGNINGER: vores egne vejrfigurer (i stedet for emojis)
//    SVG = tegning lavet af former: cirkler, firkanter og streger.
// =========================================================
const sky = `
  <g style="fill:var(--sky)">
    <circle cx="38" cy="62" r="16"/>
    <circle cx="56" cy="50" r="22"/>
    <circle cx="74" cy="62" r="15"/>
    <rect x="38" y="60" width="36" height="18"/>
  </g>`;

function solstråler(cx, cy, r) {
  let streger = "";
  for (let i = 0; i < 8; i++) {           // gentag 8 gange = 8 stråler
    const vinkel = i * 45;
    streger += `<rect x="${cx - 3}" y="${cy - r - 16}" width="6" height="12"
                 transform="rotate(${vinkel} ${cx} ${cy})"/>`;
  }
  return `<g style="fill:var(--sol)">
            <circle cx="${cx}" cy="${cy}" r="${r}"/>${streger}
          </g>`;
}

function tegning(type) {
  let indhold = "";
  if (type === "sol")    indhold = solstråler(50, 50, 22);
  if (type === "nat")    indhold = `<circle cx="50" cy="50" r="26" style="fill:var(--sky)"/>
                                    <circle cx="62" cy="42" r="22" style="fill:var(--baggrund)"/>`;
  if (type === "delvis") indhold = solstråler(36, 38, 16) + sky;
  if (type === "skyet")  indhold = sky;
  if (type === "tåge")   indhold = `<g style="fill:var(--sky)">
                                      <rect x="16" y="34" width="68" height="8"/>
                                      <rect x="26" y="50" width="58" height="8"/>
                                      <rect x="16" y="66" width="60" height="8"/></g>`;
  if (type === "regn")   indhold = sky + `<g style="stroke:var(--dråbe)" stroke-width="5" stroke-linecap="square">
                                      <line x1="42" y1="84" x2="38" y2="94"/>
                                      <line x1="56" y1="84" x2="52" y2="94"/>
                                      <line x1="70" y1="84" x2="66" y2="94"/></g>`;
  if (type === "sne")    indhold = sky + `<g style="fill:var(--dråbe)">
                                      <circle cx="42" cy="88" r="4"/>
                                      <circle cx="56" cy="92" r="4"/>
                                      <circle cx="70" cy="88" r="4"/></g>`;
  if (type === "torden") indhold = sky + `<polygon style="fill:var(--dråbe)"
                                      points="58,70 46,88 55,88 49,100 68,82 59,82 64,70"/>`;
  return `<svg viewBox="0 0 100 100">${indhold}</svg>`;
}

// Gør tekst fra internettet sikker, før den sættes ind på siden
function sikker(tekst) {
  return String(tekst).replace(/[&<>"']/g, tegn =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[tegn]));
}


// =========================================================
// 3. SKIFT FARVER efter vejret
// =========================================================
function skiftFarver(type) {
  const f = farver[type];
  const stil = document.documentElement.style;
  stil.setProperty("--baggrund", f[0]);
  stil.setProperty("--blæk", f[1]);
  stil.setProperty("--sol", f[2]);
  stil.setProperty("--sky", f[3]);
  stil.setProperty("--dråbe", f[4]);
}


// =========================================================
// 4. HENT VEJRET fra API'en og vis det
// =========================================================
let sidsteVejr = null;    // her gemmer vi det seneste svar, så grafen kan bruge det

function hentVejr(bredde, længde, navn) {
  const adresse = "https://api.open-meteo.com/v1/forecast"
    + "?latitude=" + bredde + "&longitude=" + længde
    + "&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day"
    + "&hourly=temperature_2m,weather_code,is_day"
    + "&daily=weather_code,temperature_2m_max,temperature_2m_min"
    + "&wind_speed_unit=ms&timezone=auto&forecast_days=6";

  fetch(adresse)
    .then(svar => svar.json())
    .then(vejr => {
      sidsteVejr = vejr;
      sidsteVejr.navn = navn;

      const nu = vejr.current;
      const type = vejrType(nu.weather_code, nu.is_day === 1);

      skiftFarver(type);
      document.getElementById("bynavn").textContent = navn;
      document.getElementById("beskrivelse").textContent = beskrivelser[type];
      document.getElementById("grader").textContent = Math.round(nu.temperature_2m) + "°";
      document.getElementById("stor-figur").innerHTML = tegning(type);
      document.getElementById("føles").textContent = Math.round(nu.apparent_temperature) + "°";
      document.getElementById("vind").textContent = Math.round(nu.wind_speed_10m) + " m/s";
      document.getElementById("fugt").textContent = nu.relative_humidity_2m + " %";

      // ---- De næste 5 dage: en LØKKE, der gentager det samme 5 gange ----
      const dage = vejr.daily;
      let html = "";
      for (let i = 1; i <= 5; i++) {
        const dagNavn = new Date(dage.time[i])
          .toLocaleDateString("da-DK", { weekday: "short" })
          .replace(".", "");
        html += `
          <div class="dag">
            <p class="dag-navn">${dagNavn}</p>
            ${tegning(vejrType(dage.weather_code[i], true))}
            <p class="dag-grader">${Math.round(dage.temperature_2m_max[i])}°
              <span>${Math.round(dage.temperature_2m_min[i])}°</span></p>
          </div>`;
      }
      document.getElementById("dage").innerHTML = html;

      tegnGraf();
    });
}


// =========================================================
// 5. GRAFEN: dagens temperatur time for time
//    Vi tegner selv grafen som SVG: punkter, en linje og tekst.
// =========================================================
function tegnGraf() {
  const boks = document.getElementById("graf");
  // Grafen kan kun tegnes, når siden kan ses (ellers er den 0 pixels bred)
  if (!sidsteVejr || boks.clientWidth === 0) return;

  const timer   = sidsteVejr.hourly;
  const temp    = timer.temperature_2m.slice(0, 24);   // de 24 timer i dag
  const nuTime  = parseInt(sidsteVejr.current.time.slice(11, 13));

  const B = boks.clientWidth;                // bredde
  const H = B < 600 ? 320 : 440;             // højde
  const top = 100, bund = 50, kant = 24;     // luft i kanterne

  const mindst = Math.min(...temp);
  const størst = Math.max(...temp);
  const lav = Math.floor(mindst) - 1;
  const høj = Math.ceil(størst) + 1;

  // Omregn time → x-position og grader → y-position
  const x = time   => kant + time * (B - 2 * kant) / 23;
  const y = grader => top + (høj - grader) / (høj - lav) * (H - top - bund);

  let svg = "";

  // Lodrette hjælpelinjer, klokkeslæt og små vejrfigurer hver 3. time
  for (let t = 0; t < 24; t += 3) {
    svg += `<line x1="${x(t)}" y1="${top - 20}" x2="${x(t)}" y2="${H - bund}"
              style="stroke:var(--blæk)" stroke-width="1" stroke-dasharray="2 6" opacity="0.5"/>`;
    svg += `<text x="${x(t)}" y="${H - 18}" text-anchor="middle" font-size="16"
              letter-spacing="2" style="fill:var(--blæk)">${String(t).padStart(2, "0")}</text>`;
    const figur = tegning(vejrType(timer.weather_code[t], timer.is_day[t] === 1));
    svg += figur.replace("<svg ", `<svg x="${x(t) - 24}" y="6" width="48" height="48" `);
  }

  // Området under linjen (svagt farvet) og selve linjen
  let punkter = "";
  for (let t = 0; t < 24; t++) punkter += `${x(t)},${y(temp[t])} `;
  svg += `<polygon points="${x(0)},${H - bund} ${punkter} ${x(23)},${H - bund}"
            style="fill:var(--blæk)" opacity="0.12"/>`;
  svg += `<polyline points="${punkter}" fill="none" style="stroke:var(--blæk)"
            stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>`;

  // Bundlinjen
  svg += `<line x1="0" y1="${H - bund}" x2="${B}" y2="${H - bund}" style="stroke:var(--blæk)" stroke-width="3"/>`;

  // Varmest og koldest
  const varmTime = temp.indexOf(størst);
  const koldTime = temp.indexOf(mindst);
  if (varmTime !== nuTime) {
    svg += `<text x="${x(varmTime)}" y="${y(størst) - 16}" text-anchor="middle" font-size="18"
              font-style="italic" style="fill:var(--blæk)">varmest ${Math.round(størst)}°</text>`;
  }
  if (koldTime !== nuTime) {
    svg += `<text x="${x(koldTime)}" y="${y(mindst) + 30}" text-anchor="middle" font-size="18"
              font-style="italic" style="fill:var(--blæk)">koldest ${Math.round(mindst)}°</text>`;
  }

  // NU: en stor gul prik der, hvor vi er lige nu
  const nx = x(nuTime), ny = y(temp[nuTime]);
  svg += `<line x1="${nx}" y1="${ny}" x2="${nx}" y2="${H - bund}" style="stroke:var(--blæk)" stroke-width="3"/>`;
  svg += `<circle cx="${nx}" cy="${ny}" r="11" style="fill:var(--sol);stroke:var(--blæk)" stroke-width="4"/>`;
  svg += `<text x="${nx}" y="${ny - 22}" text-anchor="middle" font-size="30" font-weight="bold"
            style="fill:var(--blæk)">${Math.round(temp[nuTime])}°</text>`;

  boks.innerHTML = `<svg viewBox="0 0 ${B} ${H}" height="${H}">${svg}</svg>`;

  document.getElementById("graf-by").textContent = sidsteVejr.navn;
  document.getElementById("graf-tekst").textContent =
    `Fra ${Math.round(mindst)}° til ${Math.round(størst)}° · varmest kl. ${String(varmTime).padStart(2, "0")}`;
}


// =========================================================
// 6. KORTET: byer der svæver over landet som balloner
//    Leaflet er et færdigt kort-værktøj. Vi bestemmer selv udseendet.
// =========================================================
const kortByer = [
  { navn: "Skagen",     lat: 57.721, lon: 10.583 },
  { navn: "Aalborg",    lat: 57.048, lon: 9.919 },
  { navn: "Aarhus",     lat: 56.157, lon: 10.211 },
  { navn: "Esbjerg",    lat: 55.476, lon: 8.459 },
  { navn: "Odense",     lat: 55.403, lon: 10.402 },
  { navn: "Sønderborg", lat: 54.909, lon: 9.792 },
  { navn: "København",  lat: 55.676, lon: 12.568 },
  { navn: "Rønne",      lat: 55.100, lon: 14.706 }
];

let kort = null;
let ballonLag = null;

function visKort() {
  if (!kort) {
    kort = L.map("kort", { zoomSnap: 0.25, scrollWheelZoom: false });

    // Vi tegner selv landene som flade former – havet er bare baggrundsfarven
    kort.attributionControl.addAttribution("Kort: Natural Earth");
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json")
      .then(svar => svar.json())
      .then(verden => {
        const lande = topojson.feature(verden, verden.objects.countries);
        L.geoJSON(lande, { className: "land", interactive: false }).addTo(kort);
      });

    ballonLag = L.layerGroup().addTo(kort);
    kort.fitBounds(kortByer.map(b => [b.lat, b.lon]), { paddingTopLeft: [40, 150], paddingBottomRight: [40, 30] });
  }
  kort.invalidateSize();
  opdaterKort();
}

function opdaterKort() {
  // Byerne på kortet = de faste danske byer + dine egne fra historikken
  const byer = [...kortByer];
  for (const h of hentHistorik()) {
    if (h.lat && !byer.some(b => b.navn === h.navn)) byer.push(h);
  }

  // Én bestilling til API'en med ALLE byerne på én gang
  const adresse = "https://api.open-meteo.com/v1/forecast"
    + "?latitude="  + byer.map(b => b.lat).join(",")
    + "&longitude=" + byer.map(b => b.lon).join(",")
    + "&current=temperature_2m,weather_code,is_day&timezone=auto";

  fetch(adresse)
    .then(svar => svar.json())
    .then(data => {
      const svarListe = Array.isArray(data) ? data : [data];
      ballonLag.clearLayers();

      byer.forEach((by, nummer) => {
        const nu = svarListe[nummer].current;
        const type = vejrType(nu.weather_code, nu.is_day === 1);
        const forsinkelse = -(nummer * 0.7) % 3.5;   // så de ikke svinger i takt

        const ikon = L.divIcon({
          className: "ballon-ikon",
          iconSize: [110, 150],
          iconAnchor: [55, 150],
          html: `
            <div class="ballon" style="animation-delay:${forsinkelse}s">
              ${tegning(type)}
              <div class="mærke"><b>${Math.round(nu.temperature_2m)}°</b><i>${sikker(by.navn)}</i></div>
              <div class="snor"></div>
              <div class="prik"></div>
            </div>`
        });

        L.marker([by.lat, by.lon], { icon: ikon })
          .on("click", () => {
            location.hash = "#nu";
            hentVejr(by.lat, by.lon, by.navn);
            gemIHistorik(by);
          })
          .addTo(ballonLag);
      });
    });
}


// =========================================================
// 7. SØG EFTER EN BY (først byens placering, så vejret)
// =========================================================
function søgBy() {
  const by = document.getElementById("by").value;
  const adresse = "https://geocoding-api.open-meteo.com/v1/search?count=1&language=da&name="
    + encodeURIComponent(by);

  fetch(adresse)
    .then(svar => svar.json())
    .then(data => {
      if (!data.results) {
        document.getElementById("bynavn").textContent = "Kender ikke " + by;
        return;
      }
      const sted = data.results[0];
      hentVejr(sted.latitude, sted.longitude, sted.name);
      gemIHistorik({ navn: sted.name, lat: sted.latitude, lon: sted.longitude });
    });
}


// =========================================================
// 8. HVOR ER JEG? Browseren spørger om lov til at bruge din placering
// =========================================================
function minPosition() {
  document.getElementById("bynavn").textContent = "Leder efter dig...";
  navigator.geolocation.getCurrentPosition(
    pos => hentVejr(pos.coords.latitude, pos.coords.longitude, "Der hvor du er"),
    ()  => document.getElementById("bynavn").textContent = "Fik ikke lov til at se, hvor du er"
  );
}


// =========================================================
// 9. HISTORIK: husk de 5 seneste byer (med deres placering)
//    localStorage = browserens lille "notesbog".
// =========================================================
function hentHistorik() {
  try {
    const liste = JSON.parse(localStorage.getItem("vejr-historik")) || [];
    // Den gamle udgave gemte kun navne – dem laver vi om til den nye form
    return liste.map(b => typeof b === "string" ? { navn: b } : b);
  } catch {
    return [];
  }
}

function gemIHistorik(sted) {
  let liste = hentHistorik();
  liste = liste.filter(b => b.navn !== sted.navn);   // fjern byen, hvis den allerede er der
  liste.unshift(sted);                               // sæt den forrest
  liste = liste.slice(0, 5);                         // behold kun de 5 første
  try {
    localStorage.setItem("vejr-historik", JSON.stringify(liste));
  } catch {}
  visHistorik();
  if (kort && location.hash === "#kort") opdaterKort();   // ny by → ny ballon på kortet
}

function visHistorik() {
  const liste = hentHistorik();
  const boks = document.getElementById("historik");
  if (liste.length === 0) { boks.innerHTML = ""; return; }

  let html = `<span class="etiket">Senest set</span>`;
  liste.forEach((by, nummer) => {
    if (nummer > 0) html += `<span class="skilletegn">/</span>`;
    html += `<button onclick="vælgFraHistorik(${nummer})">${sikker(by.navn)}</button>`;
  });
  boks.innerHTML = html;
}

function vælgFraHistorik(nummer) {
  const by = hentHistorik()[nummer];
  if (by.lat) {
    hentVejr(by.lat, by.lon, by.navn);
    gemIHistorik(by);
  } else {
    document.getElementById("by").value = by.navn;
    søgBy();
  }
}


// =========================================================
// 10. SIDERNE: vis den side, der står efter # i adressen
//     F.eks. .../Vejr/#kort viser kortet.
// =========================================================
function visSide() {
  const side = location.hash.slice(1) || "nu";

  document.querySelectorAll(".side").forEach(s =>
    s.classList.toggle("aktiv", s.id === "side-" + side));
  document.querySelectorAll(".menu a").forEach(a =>
    a.classList.toggle("aktiv", a.getAttribute("href") === "#" + side));

  if (side === "dagens") tegnGraf();
  if (side === "kort")   visKort();
}

window.addEventListener("hashchange", visSide);   // når man klikker i menuen
window.addEventListener("resize", tegnGraf);      // tegn grafen igen, hvis vinduet ændrer størrelse

// Søg med Enter-tasten også
document.getElementById("by").addEventListener("keydown", e => {
  if (e.key === "Enter") søgBy();
});


// =========================================================
// 11. START
// =========================================================
visSide();
visHistorik();

const sidsteBy = hentHistorik()[0];
if (sidsteBy && sidsteBy.lat) {
  hentVejr(sidsteBy.lat, sidsteBy.lon, sidsteBy.navn);
} else {
  if (sidsteBy) document.getElementById("by").value = sidsteBy.navn;
  søgBy();
}
