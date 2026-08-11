// ======================================================
// NAYAKHAP AGRO RESEARCH
// SUPABASE CLOUD VERSION
// ======================================================

const SUPABASE_URL =
    "https://cuhffitgrgewewoqdhgn.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_d9g-n2-Q3jEpW447fT-hXA_RW29I84n";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


// ======================================================
// GLOBAL DATA
// ======================================================

let currentUser = null;

let fields = [];
let farmers = [];
let observations = [];
let diaryEntries = [];


// ======================================================
// DOM READY
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {

    setupNavigation();
    setupAuth();
    setupForms();
    setupSearch();

    await checkAuth();

});


// ======================================================
// AUTHENTICATION
// ======================================================

function setupAuth() {

    const loginTab =
        document.getElementById("loginTab");

    const signupTab =
        document.getElementById("signupTab");

    const authForm =
        document.getElementById("authForm");

    loginTab.addEventListener("click", () => {

        loginTab.classList.add("active");
        signupTab.classList.remove("active");

        document.getElementById("authSubmit").textContent =
            "Login";

        document.getElementById("confirmPasswordWrap").style.display =
            "none";

        document.getElementById("authConfirmPassword").required =
            false;

        clearAuthMessage();

    });


    signupTab.addEventListener("click", () => {

        signupTab.classList.add("active");
        loginTab.classList.remove("active");

        document.getElementById("authSubmit").textContent =
            "Create Account";

        document.getElementById("confirmPasswordWrap").style.display =
            "block";

        document.getElementById("authConfirmPassword").required =
            true;

        clearAuthMessage();

    });


    authForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const isSignup =
            signupTab.classList.contains("active");

        const email =
            document.getElementById("authEmail").value.trim();

        const password =
            document.getElementById("authPassword").value;

        const confirmPassword =
            document.getElementById("authConfirmPassword").value;


        if (!email || !password) {

            showAuthMessage(
                "Please enter email and password.",
                "error"
            );

            return;
        }


        if (isSignup) {

            if (password !== confirmPassword) {

                showAuthMessage(
                    "Passwords do not match.",
                    "error"
                );

                return;
            }


            if (password.length < 6) {

                showAuthMessage(
                    "Password must contain at least 6 characters.",
                    "error"
                );

                return;
            }


            await signupUser(
                email,
                password
            );

        } else {

            await loginUser(
                email,
                password
            );

        }

    });


    document
        .getElementById("logoutBtn")
        .addEventListener("click", logoutUser);

}


// ======================================================
// SIGN UP
// ======================================================

async function signupUser(email, password) {

    setAuthLoading(true);

    const {
        data,
        error
    } = await supabaseClient.auth.signUp({

        email,
        password,

        options: {

            emailRedirectTo:
                "https://sumit2728.github.io/nayakhap-agro-research/"

        }

    });


    setAuthLoading(false);


    if (error) {

        showAuthMessage(
            error.message,
            "error"
        );

        return;
    }


    if (data.session) {

        showAuthMessage(
            "Account created successfully.",
            "success"
        );

        currentUser = data.user;

        await showApp();

    } else {

        showAuthMessage(
            "Account created. Please check your email and confirm your account before logging in.",
            "success"
        );

    }

}


// ======================================================
// LOGIN
// ======================================================

async function loginUser(email, password) {

    setAuthLoading(true);

    const {
        data,
        error
    } = await supabaseClient.auth.signInWithPassword({

        email,
        password

    });


    setAuthLoading(false);


    if (error) {

        showAuthMessage(
            error.message,
            "error"
        );

        return;
    }


    currentUser = data.user;

    await showApp();

}


// ======================================================
// LOGOUT
// ======================================================

async function logoutUser() {

    const {
        error
    } = await supabaseClient.auth.signOut();


    if (error) {

        alert(error.message);

        return;
    }


    currentUser = null;

    fields = [];
    farmers = [];
    observations = [];
    diaryEntries = [];


    document.getElementById("appShell").style.display =
        "none";

    document.getElementById("authScreen").style.display =
        "flex";

}


// ======================================================
// CHECK EXISTING SESSION
// ======================================================

async function checkAuth() {

    const {
        data
    } = await supabaseClient.auth.getSession();


    if (data.session) {

        currentUser =
            data.session.user;

        await showApp();

    } else {

        document.getElementById("authScreen").style.display =
            "flex";

        document.getElementById("appShell").style.display =
            "none";

    }


    supabaseClient.auth.onAuthStateChange(
        async (_event, session) => {

            if (session) {

                currentUser =
                    session.user;

            }

        }
    );

}


// ======================================================
// SHOW APPLICATION
// ======================================================

async function showApp() {

    document.getElementById("authScreen").style.display =
        "none";

    document.getElementById("appShell").style.display =
        "flex";


    document.getElementById("userEmail").textContent =
        currentUser?.email || "";


    await loadAllData();

    updateDashboard();

}


// ======================================================
// LOAD ALL CLOUD DATA
// ======================================================

async function loadAllData() {

    if (!currentUser) return;


    const [
        fieldsResponse,
        farmersResponse,
        observationsResponse,
        diaryResponse
    ] = await Promise.all([

        supabaseClient
            .from("fields")
            .select("*")
            .eq("user_id", currentUser.id)
            .order("created_at", {
                ascending: false
            }),

        supabaseClient
            .from("farmers")
            .select("*")
            .eq("user_id", currentUser.id)
            .order("created_at", {
                ascending: false
            }),

        supabaseClient
            .from("crop_observations")
            .select("*")
            .eq("user_id", currentUser.id)
            .order("created_at", {
                ascending: false
            }),

        supabaseClient
            .from("field_diary")
            .select("*")
            .eq("user_id", currentUser.id)
            .order("created_at", {
                ascending: false
            })

    ]);


    if (fieldsResponse.error) {

        console.error(
            "Fields:",
            fieldsResponse.error
        );

    }


    if (farmersResponse.error) {

        console.error(
            "Farmers:",
            farmersResponse.error
        );

    }


    if (observationsResponse.error) {

        console.error(
            "Observations:",
            observationsResponse.error
        );

    }


    if (diaryResponse.error) {

        console.error(
            "Diary:",
            diaryResponse.error
        );

    }


    fields =
        fieldsResponse.data || [];

    farmers =
        farmersResponse.data || [];

    observations =
        observationsResponse.data || [];

    diaryEntries =
        diaryResponse.data || [];


    renderAll();

}


// ======================================================
// NAVIGATION
// ======================================================

function setupNavigation() {

    const buttons =
        document.querySelectorAll(".nav-btn");


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const page =
                    button.dataset.page;

                showPage(page);

            }
        );

    });


    document
        .getElementById("mobileMenu")
        ?.addEventListener(
            "click",
            () => {

                document
                    .querySelector(".sidebar")
                    .classList
                    .toggle("open");

            }
        );

}


function showPage(page) {

    document
        .querySelectorAll(".page")
        .forEach(section => {

            section.classList.remove("active");

        });


    const target =
        document.getElementById(page);

    if (target) {

        target.classList.add("active");

    }


    document
        .querySelectorAll(".nav-btn")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.page === page
            );

        });


    const titles = {

        dashboard:
            "Research Dashboard",

        fields:
            "Field Records",

        farmers:
            "Farmer Records",

        health:
            "Crop Health",

        diary:
            "Field Diary",

        backup:
            "Backup & Data"

    };


    document.getElementById("pageTitle").textContent =
        titles[page] || "Research Dashboard";


    document
        .querySelector(".sidebar")
        ?.classList
        .remove("open");

}


// ======================================================
// FORMS
// ======================================================

function setupForms() {

    document
        .getElementById("fieldForm")
        .addEventListener(
            "submit",
            saveField
        );


    document
        .getElementById("farmerForm")
        .addEventListener(
            "submit",
            saveFarmer
        );


    document
        .getElementById("healthForm")
        .addEventListener(
            "submit",
            saveHealthObservation
        );


    document
        .getElementById("diaryForm")
        .addEventListener(
            "submit",
            saveDiaryEntry
        );


    document
        .getElementById("healthDate").value =
        today();


    document
        .getElementById("diaryDate").value =
        today();

}


// ======================================================
// SAVE FIELD
// ======================================================

async function saveField(event) {

    event.preventDefault();


    if (!currentUser) {

        alert("Please login first.");

        return;
    }


    const record = {

        field_name:
            document.getElementById("fieldId").value.trim(),

        crop:
            document.getElementById("fieldCrop").value.trim(),

        variety:
            document.getElementById("fieldVariety").value.trim(),

        sowing_date:
            document.getElementById("fieldDate").value || null,

        irrigation_source:
            document.getElementById("fieldWater").value,

        area:
            parseNumber(
                document.getElementById("fieldSize").value
            ),

        fertilizer:
            document.getElementById("fieldFertilizer").value.trim(),

        yield_value:
            parseNumber(
                document.getElementById("fieldYield").value
            ),

        notes:
            document.getElementById("fieldNotes").value.trim(),

        user_id:
            currentUser.id

    };


    const {
        error
    } = await supabaseClient
        .from("fields")
        .insert(record);


    if (error) {

        alert(
            "Could not save field:\n" +
            error.message
        );

        return;
    }


    closeModal("fieldModal");

    event.target.reset();

    await loadAllData();

}


// ======================================================
// SAVE FARMER
// ======================================================

async function saveFarmer(event) {

    event.preventDefault();


    if (!currentUser) return;


    const record = {

        farmer_code:
            document.getElementById("farmerCode").value.trim(),

        main_crop:
            document.getElementById("farmerCrop").value.trim(),

        seed_source:
            document.getElementById("seedSource").value.trim(),

        farming_method:
            document.getElementById("farmerWater").value,

        notes:
            [
                document.getElementById("farmerProblem").value.trim(),
                document.getElementById("farmerObservation").value.trim()
            ]
            .filter(Boolean)
            .join(" | "),

        user_id:
            currentUser.id

    };


    const {
        error
    } = await supabaseClient
        .from("farmers")
        .insert(record);


    if (error) {

        alert(
            "Could not save farmer:\n" +
            error.message
        );

        return;
    }


    closeModal("farmerModal");

    event.target.reset();

    await loadAllData();

}


// ======================================================
// SAVE CROP HEALTH
// ======================================================

async function saveHealthObservation(event) {

    event.preventDefault();


    if (!currentUser) return;


    const record = {

        observation_date:
            document.getElementById("healthDate").value,

        field_code:
            document.getElementById("healthField").value.trim(),

        crop_name:
            document.getElementById("healthCrop").value.trim() ||
            "Not specified",

        disease_symptoms:
            document.getElementById("healthSymptoms").value.trim(),

        crop_stage:
            document.getElementById("healthIdentification").value.trim(),

        treatment:
            document.getElementById("healthTreatment").value.trim(),

        pest_observation:
            document.getElementById("healthSeverity").value,

        user_id:
            currentUser.id

    };


    const {
        error
    } = await supabaseClient
        .from("crop_observations")
        .insert(record);


    if (error) {

        alert(
            "Could not save observation:\n" +
            error.message
        );

        return;
    }


    closeModal("healthModal");

    event.target.reset();

    document.getElementById("healthDate").value =
        today();

    await loadAllData();

}


// ======================================================
// SAVE DIARY
// ======================================================

async function saveDiaryEntry(event) {

    event.preventDefault();


    if (!currentUser) return;


    const record = {

        entry_date:
            document.getElementById("diaryDate").value,

        field_code:
            document.getElementById("diaryField").value.trim(),

        activity:
            "Field observation",

        observation:
            document.getElementById("diaryObservation").value.trim(),

        weather_condition:
            document.getElementById("diaryWeather").value.trim(),

        user_id:
            currentUser.id

    };


    const {
        error
    } = await supabaseClient
        .from("field_diary")
        .insert(record);


    if (error) {

        alert(
            "Could not save diary entry:\n" +
            error.message
        );

        return;
    }


    closeModal("diaryModal");

    event.target.reset();

    document.getElementById("diaryDate").value =
        today();

    await loadAllData();

}


// ======================================================
// SEARCH
// ======================================================

function setupSearch() {

    const search =
        document.getElementById("fieldSearch");


    search?.addEventListener(
        "input",
        renderFields
    );

}


// ======================================================
// RENDER EVERYTHING
// ======================================================

function renderAll() {

    renderFields();

    renderFarmers();

    renderHealth();

    renderDiary();

    updateDashboard();

}


// ======================================================
// FIELD TABLE
// ======================================================

function renderFields() {

    const tbody =
        document.getElementById("fieldTable");

    const search =
        (
            document.getElementById("fieldSearch")
                ?.value || ""
        )
        .toLowerCase();


    const filtered =
        fields.filter(field => {

            const text = [

                field.field_name,
                field.crop,
                field.variety

            ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


            return text.includes(search);

        });


    if (!filtered.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty">
                    No field records found.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        filtered.map(field => `

            <tr>

                <td>
                    <strong>
                        ${escapeHtml(field.field_name || "-")}
                    </strong>
                </td>

                <td>
                    ${escapeHtml(field.crop || "-")}
                </td>

                <td>
                    ${escapeHtml(field.variety || "-")}
                </td>

                <td>
                    ${escapeHtml(field.irrigation_source || "-")}
                </td>

                <td>
                    ${formatDate(field.sowing_date)}
                </td>

                <td>

                    <button
                        class="delete-btn"
                        onclick="deleteField('${field.id}')"
                    >
                        Delete
                    </button>

                </td>

            </tr>

        `)
        .join("");

}


// ======================================================
// FARMER TABLE
// ======================================================

function renderFarmers() {

    const tbody =
        document.getElementById("farmerTable");


    if (!farmers.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty">
                    No farmer records found.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        farmers.map(farmer => `

            <tr>

                <td>
                    <strong>
                        ${escapeHtml(farmer.farmer_code || "-")}
                    </strong>
                </td>

                <td>
                    ${escapeHtml(farmer.main_crop || "-")}
                </td>

                <td>
                    ${escapeHtml(farmer.seed_source || "-")}
                </td>

                <td>
                    ${escapeHtml(farmer.farming_method || "-")}
                </td>

                <td>

                    <button
                        class="delete-btn"
                        onclick="deleteFarmer('${farmer.id}')"
                    >
                        Delete
                    </button>

                </td>

            </tr>

        `)
        .join("");

}


// ======================================================
// HEALTH TABLE
// ======================================================

function renderHealth() {

    const tbody =
        document.getElementById("healthTable");


    if (!observations.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty">
                    No crop-health observations yet.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        observations.map(item => `

            <tr>

                <td>
                    ${formatDate(item.observation_date)}
                </td>

                <td>
                    ${escapeHtml(item.field_code || "-")}
                </td>

                <td>
                    ${escapeHtml(item.crop_name || "-")}
                </td>

                <td>
                    ${escapeHtml(item.disease_symptoms || "-")}
                </td>

                <td>
                    ${escapeHtml(item.pest_observation || "-")}
                </td>

                <td>
                    ${escapeHtml(item.crop_stage || "-")}
                </td>

                <td>

                    <button
                        class="delete-btn"
                        onclick="deleteObservation('${item.id}')"
                    >
                        Delete
                    </button>

                </td>

            </tr>

        `)
        .join("");

}


// ======================================================
// DIARY
// ======================================================

function renderDiary() {

    const container =
        document.getElementById("diaryList");


    if (!diaryEntries.length) {

        container.innerHTML = `
            <div class="empty">
                No diary entries yet.
            </div>
        `;

        return;
    }


    container.innerHTML =
        diaryEntries.map(entry => `

            <div class="diary-card">

                <div class="diary-date">

                    ${formatDate(entry.entry_date)}

                </div>

                <h3>

                    ${escapeHtml(
                        entry.field_code ||
                        "General Field Visit"
                    )}

                </h3>

                <p>

                    ${escapeHtml(
                        entry.observation || "-"
                    )}

                </p>

                ${
                    entry.weather_condition
                    ?
                    `
                    <p style="margin-top:10px">

                        <strong>
                            Weather:
                        </strong>

                        ${escapeHtml(
                            entry.weather_condition
                        )}

                    </p>
                    `
                    :
                    ""
                }

                <button
                    class="delete-btn"
                    style="margin-top:12px"
                    onclick="deleteDiary('${entry.id}')"
                >
                    Delete
                </button>

            </div>

        `)
        .join("");

}


// ======================================================
// DASHBOARD
// ======================================================

function updateDashboard() {

    document.getElementById("fieldCount").textContent =
        fields.length;

    document.getElementById("farmerCount").textContent =
        farmers.length;

    document.getElementById("healthCount").textContent =
        observations.length;

    document.getElementById("diaryCount").textContent =
        diaryEntries.length;


    renderCropDistribution();

    renderRecentActivity();

}


// ======================================================
// CROP DISTRIBUTION
// ======================================================

function renderCropDistribution() {

    const container =
        document.getElementById("cropDistribution");


    if (!fields.length) {

        container.innerHTML = `
            <div class="empty">
                No field data yet.
            </div>
        `;

        return;
    }


    const counts = {};


    fields.forEach(field => {

        const crop =
            field.crop || "Unknown";

        counts[crop] =
            (counts[crop] || 0) + 1;

    });


    container.innerHTML =
        Object.entries(counts)
            .map(([crop, count]) => `

                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        padding:10px 0;
                        border-bottom:1px solid var(--border);
                    "
                >

                    <span>
                        🌱 ${escapeHtml(crop)}
                    </span>

                    <strong>
                        ${count}
                    </strong>

                </div>

            `)
            .join("");

}


// ======================================================
// RECENT ACTIVITY
// ======================================================

function renderRecentActivity() {

    const container =
        document.getElementById("recentActivity");


    const activities = [];


    fields.slice(0, 3)
        .forEach(item => {

            activities.push({

                date:
                    item.created_at,

                text:
                    `Field added: ${item.field_name}`

            });

        });


    observations.slice(0, 3)
        .forEach(item => {

            activities.push({

                date:
                    item.created_at,

                text:
                    `Crop observation: ${item.crop_name}`

            });

        });


    diaryEntries.slice(0, 3)
        .forEach(item => {

            activities.push({

                date:
                    item.created_at,

                text:
                    `Diary entry: ${item.field_code || "Field visit"}`

            });

        });


    activities.sort(
        (a, b) =>
            new Date(b.date) -
            new Date(a.date)
    );


    if (!activities.length) {

        container.innerHTML = `
            <div class="empty">
                No activity yet.
            </div>
        `;

        return;
    }


    container.innerHTML =
        activities
            .slice(0, 6)
            .map(item => `

                <div
                    style="
                        padding:10px 0;
                        border-bottom:1px solid var(--border);
                        font-size:13px;
                    "
                >

                    <strong>
                        ${escapeHtml(item.text)}
                    </strong>

                    <div
                        style="
                            color:var(--muted);
                            margin-top:4px;
                        "
                    >

                        ${formatDateTime(item.date)}

                    </div>

                </div>

            `)
            .join("");

}


// ======================================================
// DELETE FIELD
// ======================================================

async function deleteField(id) {

    if (!confirm(
        "Delete this field record?"
    )) return;


    const {
        error
    } = await supabaseClient
        .from("fields")
        .delete()
        .eq("id", id)
        .eq("user_id", currentUser.id);


    if (error) {

        alert(error.message);

        return;
    }


    await loadAllData();

}


// ======================================================
// DELETE FARMER
// ======================================================

async function deleteFarmer(id) {

    if (!confirm(
        "Delete this farmer record?"
    )) return;


    const {
        error
    } = await supabaseClient
        .from("farmers")
        .delete()
        .eq("id", id)
        .eq("user_id", currentUser.id);


    if (error) {

        alert(error.message);

        return;
    }


    await loadAllData();

}


// ======================================================
// DELETE HEALTH OBSERVATION
// ======================================================

async function deleteObservation(id) {

    if (!confirm(
        "Delete this health observation?"
    )) return;


    const {
        error
    } = await supabaseClient
        .from("crop_observations")
        .delete()
        .eq("id", id)
        .eq("user_id", currentUser.id);


    if (error) {

        alert(error.message);

        return;
    }


    await loadAllData();

}


// ======================================================
// DELETE DIARY
// ======================================================

async function deleteDiary(id) {

    if (!confirm(
        "Delete this diary entry?"
    )) return;


    const {
        error
    } = await supabaseClient
        .from("field_diary")
        .delete()
        .eq("id", id)
        .eq("user_id", currentUser.id);


    if (error) {

        alert(error.message);

        return;
    }


    await loadAllData();

}


// ======================================================
// DELETE EVERYTHING
// ======================================================

async function deleteAllData() {

    if (!currentUser) return;


    const confirmed =
        confirm(
            "WARNING!\n\nThis will permanently delete ALL your research data.\n\nContinue?"
        );


    if (!confirmed) return;


    const tables = [

        "crop_observations",
        "field_diary",
        "research_samples",
        "fields",
        "farmers"

    ];


    for (const table of tables) {

        const {
            error
        } = await supabaseClient
            .from(table)
            .delete()
            .eq("user_id", currentUser.id);


        if (error) {

            alert(
                `Could not clear ${table}:\n${error.message}`
            );

            return;
        }

    }


    await loadAllData();

    alert(
        "All research data has been deleted."
    );

}


// ======================================================
// BACKUP EXPORT
// ======================================================

async function exportBackup() {

    const backup = {

        exported_at:
            new Date().toISOString(),

        user:
            currentUser?.email || "",

        fields,

        farmers,

        observations,

        diaryEntries

    };


    const blob =
        new Blob(
            [
                JSON.stringify(
                    backup,
                    null,
                    2
                )
            ],
            {
                type:
                    "application/json"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const a =
        document.createElement("a");


    a.href = url;

    a.download =
        `nayakhap-research-backup-${today()}.json`;

    a.click();


    URL.revokeObjectURL(url);

}


// ======================================================
// RESTORE BACKUP
// ======================================================

async function restoreBackup(event) {

    const file =
        event.target.files[0];


    if (!file) return;


    try {

        const text =
            await file.text();

        const backup =
            JSON.parse(text);


        alert(
            "Backup file read successfully.\n\nFor safety, restore is not automatic yet. Your current cloud data has NOT been changed."
        );


    } catch (error) {

        alert(
            "Invalid backup file."
        );

    }


    event.target.value = "";

}


// ======================================================
// MODALS
// ======================================================

function openModal(id) {

    document
        .getElementById(id)
        .classList
        .add("open");

}


function closeModal(id) {

    document
        .getElementById(id)
        .classList
        .remove("open");

}


// ======================================================
// HELPERS
// ======================================================

function today() {

    return new Date()
        .toISOString()
        .split("T")[0];

}


function parseNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return null;

    }


    const number =
        Number(value);


    return Number.isFinite(number)
        ? number
        : null;

}


function formatDate(value) {

    if (!value) return "-";


    const date =
        new Date(value);


    if (Number.isNaN(date.getTime())) {

        return value;

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


function formatDateTime(value) {

    if (!value) return "-";


    const date =
        new Date(value);


    if (Number.isNaN(date.getTime())) {

        return "-";

    }


    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


function escapeHtml(value) {

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


// ======================================================
// AUTH UI HELPERS
// ======================================================

function setAuthLoading(loading) {

    const button =
        document.getElementById("authSubmit");


    if (loading) {

        button.disabled = true;

        button.textContent =
            "Please wait...";

    } else {

        button.disabled = false;

        const signup =
            document
                .getElementById("signupTab")
                .classList
                .contains("active");


        button.textContent =
            signup
                ? "Create Account"
                : "Login";

    }

}


function showAuthMessage(
    message,
    type = ""
) {

    const box =
        document.getElementById("authMessage");


    box.textContent =
        message;

    box.className =
        `auth-message ${type}`;

}


function clearAuthMessage() {

    const box =
        document.getElementById("authMessage");


    box.textContent =
        "";

    box.className =
        "auth-message";

}
