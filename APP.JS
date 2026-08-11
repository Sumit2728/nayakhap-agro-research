/*
    NayaKhap Agro Research
    Offline-first agricultural research database
*/

const STORAGE_KEY = "nayakhap_agro_research_v1";

let db = {
    fields: [],
    farmers: [],
    health: [],
    diary: []
};


// -------------------------
// DATABASE
// -------------------------

function saveDB() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    refreshDashboard();
}

function loadDB() {

    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
        try {
            db = JSON.parse(saved);

            db.fields ||= [];
            db.farmers ||= [];
            db.health ||= [];
            db.diary ||= [];

        } catch (error) {
            console.error("Database error:", error);
        }
    }

    refreshDashboard();
}


// -------------------------
// NAVIGATION
// -------------------------

const navButtons = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");

const titles = {
    dashboard: "Research Dashboard",
    fields: "Field Records",
    farmers: "Farmer Records",
    health: "Crop Health",
    diary: "Field Diary",
    backup: "Backup & Data"
};

navButtons.forEach(button => {

    button.addEventListener("click", () => {

        const page = button.dataset.page;

        navButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");

        pages.forEach(section => {
            section.classList.remove("active");
        });

        document.getElementById(page).classList.add("active");

        document.getElementById("pageTitle").textContent =
            titles[page];

        document.querySelector(".sidebar").classList.remove("open");

        refreshPage(page);
    });

});


document.getElementById("mobileMenu").addEventListener("click", () => {
    document.querySelector(".sidebar").classList.toggle("open");
});


// -------------------------
// MODALS
// -------------------------

function openModal(id) {
    document.getElementById(id).classList.add("open");
}

function closeModal(id) {
    document.getElementById(id).classList.remove("open");
}


// Close when clicking outside

document.querySelectorAll(".modal").forEach(modal => {

    modal.addEventListener("click", event => {

        if (event.target === modal) {
            modal.classList.remove("open");
        }

    });

});


// -------------------------
// FIELD FORM
// -------------------------

document.getElementById("fieldForm").addEventListener("submit", event => {

    event.preventDefault();

    const record = {

        id: document.getElementById("fieldId").value.trim(),

        crop: document.getElementById("fieldCrop").value.trim(),

        variety: document.getElementById("fieldVariety").value.trim(),

        date: document.getElementById("fieldDate").value,

        water: document.getElementById("fieldWater").value,

        size: document.getElementById("fieldSize").value.trim(),

        fertilizer:
            document.getElementById("fieldFertilizer").value.trim(),

        yield:
            document.getElementById("fieldYield").value.trim(),

        notes:
            document.getElementById("fieldNotes").value.trim(),

        createdAt: new Date().toISOString()

    };


    const exists = db.fields.some(field => field.id === record.id);

    if (exists) {
        alert("This Field ID already exists.");
        return;
    }


    db.fields.push(record);

    saveDB();

    event.target.reset();

    closeModal("fieldModal");

    renderFields();

    alert("Field record saved successfully.");
});


// -------------------------
// FARMER FORM
// -------------------------

document.getElementById("farmerForm").addEventListener("submit", event => {

    event.preventDefault();

    const record = {

        code:
            document.getElementById("farmerCode").value.trim(),

        crop:
            document.getElementById("farmerCrop").value.trim(),

        seed:
            document.getElementById("seedSource").value.trim(),

        water:
            document.getElementById("farmerWater").value,

        problem:
            document.getElementById("farmerProblem").value.trim(),

        observation:
            document.getElementById("farmerObservation").value.trim(),

        createdAt: new Date().toISOString()

    };


    db.farmers.push(record);

    saveDB();

    event.target.reset();

    closeModal("farmerModal");

    renderFarmers();

    alert("Farmer record saved.");
});


// -------------------------
// HEALTH FORM
// -------------------------

document.getElementById("healthForm").addEventListener("submit", event => {

    event.preventDefault();

    const record = {

        date:
            document.getElementById("healthDate").value,

        field:
            document.getElementById("healthField").value.trim(),

        crop:
            document.getElementById("healthCrop").value.trim(),

        severity:
            document.getElementById("healthSeverity").value,

        symptoms:
            document.getElementById("healthSymptoms").value.trim(),

        identification:
            document.getElementById("healthIdentification").value.trim(),

        treatment:
            document.getElementById("healthTreatment").value.trim(),

        createdAt: new Date().toISOString()

    };


    db.health.push(record);

    saveDB();

    event.target.reset();

    closeModal("healthModal");

    renderHealth();

    alert("Crop-health observation saved.");
});


// -------------------------
// DIARY FORM
// -------------------------

document.getElementById("diaryForm").addEventListener("submit", event => {

    event.preventDefault();

    const record = {

        date:
            document.getElementById("diaryDate").value,

        field:
            document.getElementById("diaryField").value.trim(),

        observation:
            document.getElementById("diaryObservation").value.trim(),

        weather:
            document.getElementById("diaryWeather").value.trim(),

        createdAt: new Date().toISOString()

    };


    db.diary.unshift(record);

    saveDB();

    event.target.reset();

    closeModal("diaryModal");

    renderDiary();

    alert("Diary entry saved.");
});


// -------------------------
// FIELD TABLE
// -------------------------

function renderFields(search = "") {

    const table = document.getElementById("fieldTable");

    const query = search.toLowerCase();

    const records = db.fields.filter(field =>

        field.id.toLowerCase().includes(query) ||

        field.crop.toLowerCase().includes(query) ||

        field.variety.toLowerCase().includes(query)

    );


    if (!records.length) {

        table.innerHTML = `
            <tr>
                <td colspan="6" class="empty">
                    No field records found.
                </td>
            </tr>
        `;

        return;
    }


    table.innerHTML = records.map(field => `

        <tr>

            <td><strong>${escapeHTML(field.id)}</strong></td>

            <td>${escapeHTML(field.crop)}</td>

            <td>${escapeHTML(field.variety || "-")}</td>

            <td>${escapeHTML(field.water)}</td>

            <td>${escapeHTML(field.date || "-")}</td>

            <td>
                <button
                    class="delete-btn"
                    onclick="deleteRecord('fields', '${field.id}')">
                    Delete
                </button>
            </td>

        </tr>

    `).join("");
}


// -------------------------
// FARMER TABLE
// -------------------------

function renderFarmers() {

    const table = document.getElementById("farmerTable");

    if (!db.farmers.length) {

        table.innerHTML = `
            <tr>
                <td colspan="6" class="empty">
                    No farmer records yet.
                </td>
            </tr>
        `;

        return;
    }


    table.innerHTML = db.farmers.map((farmer, index) => `

        <tr>

            <td><strong>${escapeHTML(farmer.code)}</strong></td>

            <td>${escapeHTML(farmer.crop || "-")}</td>

            <td>${escapeHTML(farmer.seed || "-")}</td>

            <td>${escapeHTML(farmer.water)}</td>

            <td>${escapeHTML(farmer.problem || "-")}</td>

            <td>
                <button
                    class="delete-btn"
                    onclick="deleteRecord('farmers', ${index})">
                    Delete
                </button>
            </td>

        </tr>

    `).join("");
}


// -------------------------
// HEALTH TABLE
// -------------------------

function renderHealth() {

    const table = document.getElementById("healthTable");

    if (!db.health.length) {

        table.innerHTML = `
            <tr>
                <td colspan="7" class="empty">
                    No crop-health observations yet.
                </td>
            </tr>
        `;

        return;
    }


    table.innerHTML = db.health.map((record, index) => `

        <tr>

            <td>${escapeHTML(record.date)}</td>

            <td>${escapeHTML(record.field || "-")}</td>

            <td>${escapeHTML(record.crop || "-")}</td>

            <td>${escapeHTML(record.symptoms)}</td>

            <td>${escapeHTML(record.severity)}</td>

            <td>${escapeHTML(record.identification || "Unknown")}</td>

            <td>

                <button
                    class="delete-btn"
                    onclick="deleteRecord('health', ${index})">

                    Delete

                </button>

            </td>

        </tr>

    `).join("");
}


// -------------------------
// DIARY
// -------------------------

function renderDiary() {

    const container = document.getElementById("diaryList");

    if (!db.diary.length) {

        container.innerHTML = `
            <div class="empty">
                No diary entries yet.
            </div>
        `;

        return;
    }


    container.innerHTML = db.diary.map((entry, index) => `

        <article class="diary-card">

            <span class="diary-date">
                ${escapeHTML(entry.date)}
            </span>

            <h3>
                Field:
                ${escapeHTML(entry.field || "Not specified")}
            </h3>

            <p>
                ${escapeHTML(entry.observation)}
            </p>

            ${
                entry.weather
                    ? `
                    <p style="margin-top:10px">
                        <strong>Weather:</strong>
                        ${escapeHTML(entry.weather)}
                    </p>
                    `
                    : ""
            }

            <button
                class="delete-btn"
                style="margin-top:12px"
                onclick="deleteRecord('diary', ${index})">

                Delete

            </button>

        </article>

    `).join("");
}


// -------------------------
// DASHBOARD
// -------------------------

function refreshDashboard() {

    document.getElementById("fieldCount").textContent =
        db.fields.length;

    document.getElementById("farmerCount").textContent =
        db.farmers.length;

    document.getElementById("healthCount").textContent =
        db.health.length;

    document.getElementById("diaryCount").textContent =
        db.diary.length;


    renderCropDistribution();

    renderRecentActivity();

    renderFields();

    renderFarmers();

    renderHealth();

    renderDiary();
}


function renderCropDistribution() {

    const container =
        document.getElementById("cropDistribution");

    const crops = {};

    db.fields.forEach(field => {

        const crop = field.crop || "Unknown";

        crops[crop] = (crops[crop] || 0) + 1;

    });


    const entries = Object.entries(crops);

    if (!entries.length) {

        container.innerHTML =
            `<div class="empty">No field data yet.</div>`;

        return;
    }


    container.innerHTML = entries.map(([crop, count]) => `

        <div style="
            display:flex;
            justify-content:space-between;
            padding:12px;
            border-bottom:1px solid #e3e9e4;
        ">

            <span>🌱 ${escapeHTML(crop)}</span>

            <strong>${count}</strong>

        </div>

    `).join("");
}


function renderRecentActivity() {

    const container =
        document.getElementById("recentActivity");

    const activities = [

        ...db.fields.map(item => ({
            type: "🌾 Field",
            text: `${item.id} — ${item.crop}`,
            date: item.createdAt
        })),

        ...db.health.map(item => ({
            type: "🦠 Health",
            text: `${item.crop || "Crop"} — ${item.symptoms}`,
            date: item.createdAt
        })),

        ...db.diary.map(item => ({
            type: "📓 Diary",
            text: item.observation,
            date: item.createdAt
        }))

    ];


    activities.sort(
        (a, b) =>
            new Date(b.date) -
            new Date(a.date)
    );


    const latest = activities.slice(0, 6);


    if (!latest.length) {

        container.innerHTML =
            `<div class="empty">No activity yet.</div>`;

        return;
    }


    container.innerHTML = latest.map(item => `

        <div style="
            padding:12px 0;
            border-bottom:1px solid #e3e9e4;
        ">

            <strong>${item.type}</strong>

            <div style="
                color:#657167;
                font-size:13px;
                margin-top:4px;
            ">

                ${escapeHTML(item.text)}

            </div>

        </div>

    `).join("");
}


// -------------------------
// SEARCH
// -------------------------

document
    .getElementById("fieldSearch")
    .addEventListener("input", event => {

        renderFields(event.target.value);

    });


// -------------------------
// DELETE
// -------------------------

function deleteRecord(collection, identifier) {

    if (!confirm("Delete this record?")) {
        return;
    }


    if (collection === "fields") {

        db.fields =
            db.fields.filter(field =>
                field.id !== identifier
            );

    } else {

        db[collection].splice(identifier, 1);

    }


    saveDB();

    refreshDashboard();
}


// -------------------------
// BACKUP
// -------------------------

function exportBackup() {

    const backup = {

        app: "NayaKhap Agro Research",

        version: 1,

        exportedAt:
            new Date().toISOString(),

        data: db

    };


    const blob = new Blob(
        [JSON.stringify(backup, null, 2)],
        {
            type: "application/json"
        }
    );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        `nayakhap-research-backup-${dateStamp()}.json`;

    link.click();

    URL.revokeObjectURL(url);
}


// -------------------------
// RESTORE
// -------------------------

function restoreBackup(event) {

    const file =
        event.target.files[0];

    if (!file) {
        return;
    }


    const reader =
        new FileReader();


    reader.onload = function () {

        try {

            const backup =
                JSON.parse(reader.result);


            if (!backup.data) {
                throw new Error("Invalid backup.");
            }


            if (
                !confirm(
                    "Restore this backup? Existing local data will be replaced."
                )
            ) {
                return;
            }


            db = {

                fields:
                    backup.data.fields || [],

                farmers:
                    backup.data.farmers || [],

                health:
                    backup.data.health || [],

                diary:
                    backup.data.diary || []

            };


            saveDB();

            alert("Backup restored successfully.");

        }

        catch (error) {

            alert(
                "Could not restore this backup file."
            );

        }

    };


    reader.readAsText(file);
}


// -------------------------
// DELETE ALL
// -------------------------

function deleteAllData() {

    const confirmation =
        prompt(
            "Type DELETE to permanently remove all research data:"
        );


    if (confirmation !== "DELETE") {
        return;
    }


    localStorage.removeItem(STORAGE_KEY);

    db = {
        fields: [],
        farmers: [],
        health: [],
        diary: []
    };


    refreshDashboard();

    alert("All local research data has been deleted.");
}


// -------------------------
// HELPERS
// -------------------------

function dateStamp() {

    const d = new Date();

    return d.toISOString()
        .slice(0, 10);

}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function refreshPage(page) {

    if (page === "fields")
        renderFields();

    if (page === "farmers")
        renderFarmers();

    if (page === "health")
        renderHealth();

    if (page === "diary")
        renderDiary();

}


// -------------------------
// START APPLICATION
// -------------------------

loadDB();