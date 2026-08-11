// ======================================================
// NAYAKHAP AGRO RESEARCH
// SUPABASE CLOUD VERSION - DASHBOARD 2.0
// ======================================================

// ======================================================
// SUPABASE CONFIG
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

let dashboardInitialized = false;

// ======================================================
// DOM READY
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {

    setupNavigation();
    setupAuth();
    setupForms();
    setupSearch();
    setupDashboardEffects();

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

    if (!loginTab || !signupTab || !authForm) return;

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
        ?.addEventListener(
            "click",
            logoutUser
        );

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
// CHECK AUTH
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

    const userEmail =
        document.getElementById("userEmail");

    if (userEmail) {

        userEmail.textContent =
            currentUser?.email || "";

    }

    updateConnectionStatus();

    updateGreeting();

    await loadAllData();

}

// ======================================================
// LOAD CLOUD DATA
// ======================================================

async function loadAllData() {

    if (!currentUser) return;

    try {

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

    } catch (error) {

        console.error(
            "Cloud data error:",
            error
        );

        showToast(
            "Could not refresh cloud data.",
            "error"
        );

    }

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
                    ?.classList
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

        target.classList.add("page-enter");

        setTimeout(() => {

            target.classList.remove("page-enter");

        }, 450);

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

    const pageTitle =
        document.getElementById("pageTitle");

    if (pageTitle) {

        pageTitle.textContent =
            titles[page] || "Research Dashboard";

    }

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
        ?.addEventListener(
            "submit",
            saveField
        );

    document
        .getElementById("farmerForm")
        ?.addEventListener(
            "submit",
            saveFarmer
        );

    document
        .getElementById("healthForm")
        ?.addEventListener(
            "submit",
            saveHealthObservation
        );

    document
        .getElementById("diaryForm")
        ?.addEventListener(
            "submit",
            saveDiaryEntry
        );

    const healthDate =
        document.getElementById("healthDate");

    if (healthDate) {

        healthDate.value =
            today();

    }

    const diaryDate =
        document.getElementById("diaryDate");

    if (diaryDate) {

        diaryDate.value =
            today();

    }

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

    showToast(
        "🌱 Field record saved successfully!",
        "success"
    );

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

    showToast(
        "👨‍🌾 Farmer record added!",
        "success"
    );

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

    showToast(
        "🔬 Crop-health observation saved!",
        "success"
    );

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

    showToast(
        "📔 Field diary entry saved!",
        "success"
    );

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

    if (!tbody) return;

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
                    🌱 No field records found.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML =
        filtered.map(field => `

            <tr class="table-row-animated">

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

    if (!tbody) return;

    if (!farmers.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty">
                    👨‍🌾 No farmer records found.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML =
        farmers.map(farmer => `

            <tr class="table-row-animated">

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

    if (!tbody) return;

    if (!observations.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty">
                    🔬 No crop-health observations yet.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML =
        observations.map(item => `

            <tr class="table-row-animated">

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

    if (!container) return;

    if (!diaryEntries.length) {

        container.innerHTML = `
            <div class="empty">
                📔 No diary entries yet.
            </div>
        `;

        return;
    }

    container.innerHTML =
        diaryEntries.map(entry => `

            <div class="diary-card animated-card">

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

    animateCounter(
        "fieldCount",
        fields.length
    );

    animateCounter(
        "farmerCount",
        farmers.length
    );

    animateCounter(
        "healthCount",
        observations.length
    );

    animateCounter(
        "diaryCount",
        diaryEntries.length
    );

    renderCropDistribution();

    renderRecentActivity();

    renderResearchInsights();

}

// ======================================================
// ANIMATED COUNTER
// ======================================================

function animateCounter(id, target) {

    const element =
        document.getElementById(id);

    if (!element) return;

    const start =
        Number(element.textContent) || 0;

    const duration = 800;

    const startTime =
        performance.now();

    function update(time) {

        const progress =
            Math.min(
                (time - startTime) / duration,
                1
            );

        const eased =
            1 - Math.pow(
                1 - progress,
                3
            );

        const value =
            Math.round(
                start +
                (target - start) * eased
            );

        element.textContent =
            value;

        if (progress < 1) {

            requestAnimationFrame(update);

        }

    }

    requestAnimationFrame(update);

}

// ======================================================
// CROP DISTRIBUTION
// ======================================================

function renderCropDistribution() {

    const container =
        document.getElementById("cropDistribution");

    if (!container) return;

    if (!fields.length) {

        container.innerHTML = `
            <div class="empty">
                🌱 No field data yet.
            </div>
        `;

        return;
    }

    const counts = {};

    fields.forEach(field => {

        const crop =
            field.crop?.trim() ||
            "Unknown";

        counts[crop] =
            (counts[crop] || 0) + 1;

    });

    const sorted =
        Object.entries(counts)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            );

    const max =
        sorted[0]?.[1] || 1;

    container.innerHTML =
        sorted
            .map(([crop, count]) => {

                const percentage =
                    Math.round(
                        (count / fields.length) *
                        100
                    );

                const width =
                    Math.max(
                        8,
                        (count / max) * 100
                    );

                return `

                    <div class="crop-stat">

                        <div class="crop-stat-top">

                            <span>
                                🌱 ${escapeHtml(crop)}
                            </span>

                            <strong>
                                ${count}
                                <small>
                                    (${percentage}%)
                                </small>
                            </strong>

                        </div>

                        <div class="crop-progress">

                            <div
                                class="crop-progress-fill"
                                style="width:${width}%"
                            ></div>

                        </div>

                    </div>

                `;

            })
            .join("");

}

// ======================================================
// RECENT ACTIVITY
// ======================================================

function renderRecentActivity() {

    const container =
        document.getElementById("recentActivity");

    if (!container) return;

    const activities = [];

    fields.slice(0, 5)
        .forEach(item => {

            activities.push({

                date:
                    item.created_at,

                icon:
                    "🌱",

                text:
                    `Field added: ${item.field_name || "Unnamed field"}`

            });

        });

    farmers.slice(0, 5)
        .forEach(item => {

            activities.push({

                date:
                    item.created_at,

                icon:
                    "👨‍🌾",

                text:
                    `Farmer added: ${item.farmer_code || "New farmer"}`

            });

        });

    observations.slice(0, 5)
        .forEach(item => {

            activities.push({

                date:
                    item.created_at,

                icon:
                    "🔬",

                text:
                    `Crop observation: ${item.crop_name || "Crop"}`

            });

        });

    diaryEntries.slice(0, 5)
        .forEach(item => {

            activities.push({

                date:
                    item.created_at,

                icon:
                    "📔",

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
                📊 No research activity yet.
            </div>
        `;

        return;
    }

    container.innerHTML =
        activities
            .slice(0, 8)
            .map(item => `

                <div class="activity-item">

                    <div class="activity-icon">
                        ${item.icon}
                    </div>

                    <div class="activity-content">

                        <strong>
                            ${escapeHtml(item.text)}
                        </strong>

                        <span>
                            ${formatDateTime(item.date)}
                        </span>

                    </div>

                </div>

            `)
            .join("");

}

// ======================================================
// RESEARCH INSIGHTS
// ======================================================

function renderResearchInsights() {

    const container =
        document.getElementById("researchInsights");

    if (!container) return;

    const totalArea =
        fields.reduce(
            (sum, field) =>
                sum +
                (Number(field.area) || 0),
            0
        );

    const totalYield =
        fields.reduce(
            (sum, field) =>
                sum +
                (Number(field.yield_value) || 0),
            0
        );

    const uniqueCrops =
        new Set(
            fields
                .map(field =>
                    field.crop?.trim()
                )
                .filter(Boolean)
        ).size;

    const latestObservation =
        observations[0];

    container.innerHTML = `

        <div class="insight-item">

            <span>🌾 Total Recorded Area</span>

            <strong>
                ${formatNumber(totalArea)}
            </strong>

        </div>

        <div class="insight-item">

            <span>🌱 Crop Diversity</span>

            <strong>
                ${uniqueCrops}
                crop${uniqueCrops === 1 ? "" : "s"}
            </strong>

        </div>

        <div class="insight-item">

            <span>📦 Recorded Yield</span>

            <strong>
                ${formatNumber(totalYield)}
            </strong>

        </div>

        <div class="insight-item">

            <span>🔬 Latest Observation</span>

            <strong>
                ${
                    latestObservation
                    ? escapeHtml(
                        latestObservation.crop_name ||
                        "Recorded"
                    )
                    : "None"
                }
            </strong>

        </div>

    `;

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

    showToast(
        "Field record deleted.",
        "success"
    );

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

    showToast(
        "Farmer record deleted.",
        "success"
    );

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

    showToast(
        "Observation deleted.",
        "success"
    );

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

    showToast(
        "Diary entry deleted.",
        "success"
    );

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

    showToast(
        "All research data has been deleted.",
        "success"
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

    a.href =
        url;

    a.download =
        `nayakhap-research-backup-${today()}.json`;

    document.body.appendChild(a);

    a.click();

    a.remove();

    URL.revokeObjectURL(url);

    showToast(
        "☁️ Research backup downloaded.",
        "success"
    );

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

        if (
            !backup ||
            typeof backup !== "object"
        ) {

            throw new Error(
                "Invalid backup"
            );

        }

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

    const modal =
        document.getElementById(id);

    if (!modal) return;

    modal.classList.add("open");

}

function closeModal(id) {

    const modal =
        document.getElementById(id);

    if (!modal) return;

    modal.classList.remove("open");

}

// ======================================================
// DASHBOARD EFFECTS
// ======================================================

function setupDashboardEffects() {

    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {

                document
                    .querySelectorAll(".modal.open")
                    .forEach(modal => {

                        modal.classList.remove("open");

                    });

            }

        }
    );

    document.addEventListener(
        "click",
        event => {

            const modal =
                event.target.closest(".modal");

            if (
                modal &&
                event.target === modal
            ) {

                modal.classList.remove("open");

            }

        }
    );

}

// ======================================================
// GREETING
// ======================================================

function updateGreeting() {

    const element =
        document.getElementById("welcomeTitle");

    if (!element) return;

    const hour =
        new Date().getHours();

    let greeting =
        "Welcome back";

    if (hour < 12) {

        greeting =
            "Good morning";

    } else if (hour < 17) {

        greeting =
            "Good afternoon";

    } else {

        greeting =
            "Good evening";

    }

    const email =
        currentUser?.email || "";

    const name =
        email
            .split("@")[0]
            .replace(/[._-]/g, " ");

    const displayName =
        name
            ? capitalizeWords(name)
            : "Researcher";

    element.textContent =
        `${greeting}, ${displayName} 🌱`;

}

// ======================================================
// CONNECTION STATUS
// ======================================================

function updateConnectionStatus() {

    const status =
        document.querySelector(".status");

    if (!status) return;

    status.innerHTML = `
        <span class="status-dot"></span>
        Cloud Synced
    `;

}

// ======================================================
// TOAST NOTIFICATION
// ======================================================

function showToast(
    message,
    type = "success"
) {

    let container =
        document.getElementById(
            "toastContainer"
        );

    if (!container) {

        container =
            document.createElement("div");

        container.id =
            "toastContainer";

        container.style.position =
            "fixed";

        container.style.right =
            "22px";

        container.style.bottom =
            "22px";

        container.style.zIndex =
            "9999";

        container.style.display =
            "flex";

        container.style.flexDirection =
            "column";

        container.style.gap =
            "10px";

        document.body.appendChild(
            container
        );

    }

    const toast =
        document.createElement("div");

    toast.textContent =
        message;

    toast.style.padding =
        "13px 18px";

    toast.style.borderRadius =
        "12px";

    toast.style.background =
        type === "error"
            ? "#c0392b"
            : "#185b31";

    toast.style.color =
        "white";

    toast.style.fontSize =
        "13px";

    toast.style.fontWeight =
        "600";

    toast.style.boxShadow =
        "0 12px 30px rgba(0,0,0,.18)";

    toast.style.animation =
        "toastIn .35s ease";

    container.appendChild(
        toast
    );

    setTimeout(() => {

        toast.style.animation =
            "toastOut .3s ease";

        setTimeout(() => {

            toast.remove();

        }, 300);

    }, 2600);

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

function formatNumber(value) {

    return Number(value || 0)
        .toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 2
            }
        );

}

function formatDate(value) {

    if (!value) return "-";

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

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

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

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
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}

function capitalizeWords(value) {

    return value
        .split(" ")
        .filter(Boolean)
        .map(
            word =>
                word.charAt(0).toUpperCase() +
                word.slice(1)
        )
        .join(" ");

}

// ======================================================
// AUTH UI HELPERS
// ======================================================

function setAuthLoading(loading) {

    const button =
        document.getElementById(
            "authSubmit"
        );

    if (!button) return;

    if (loading) {

        button.disabled =
            true;

        button.textContent =
            "Please wait...";

    } else {

        button.disabled =
            false;

        const signup =
            document
                .getElementById(
                    "signupTab"
                )
                ?.classList
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
        document.getElementById(
            "authMessage"
        );

    if (!box) return;

    box.textContent =
        message;

    box.className =
        `auth-message ${type}`;

}

function clearAuthMessage() {

    const box =
        document.getElementById(
            "authMessage"
        );

    if (!box) return;

    box.textContent =
        "";

    box.className =
        "auth-message";

}

// ======================================================
// EXTRA DASHBOARD ANIMATION CSS
// ======================================================

(function injectDashboardStyles() {

    if (
        document.getElementById(
            "dashboardAnimationStyles"
        )
    ) return;

    const style =
        document.createElement("style");

    style.id =
        "dashboardAnimationStyles";

    style.textContent = `

        .page-enter {
            animation:
                dashboardPageIn
                .4s
                ease
                both;
        }

        @keyframes dashboardPageIn {

            from {
                opacity: 0;
                transform:
                    translateY(10px);
            }

            to {
                opacity: 1;
                transform:
                    translateY(0);
            }

        }

        .table-row-animated {
            animation:
                rowIn
                .35s
                ease
                both;
        }

        @keyframes rowIn {

            from {
                opacity: 0;
                transform:
                    translateX(-8px);
            }

            to {
                opacity: 1;
                transform:
                    translateX(0);
            }

        }

        .animated-card {
            animation:
                cardIn
                .45s
                ease
                both;
        }

        @keyframes cardIn {

            from {
                opacity: 0;
                transform:
                    translateY(12px)
                    scale(.98);
            }

            to {
                opacity: 1;
                transform:
                    translateY(0)
                    scale(1);
            }

        }

        .crop-stat {
            margin-bottom: 14px;
            animation:
                cropIn
                .45s
                ease
                both;
        }

        .crop-stat-top {
            display:
                flex;
            justify-content:
                space-between;
            align-items:
                center;
            gap:
                10px;
            font-size:
                13px;
            margin-bottom:
                7px;
        }

        .crop-stat-top small {
            color:
                var(--muted);
            font-weight:
                400;
        }

        .crop-progress {
            width:
                100%;
            height:
                7px;
            background:
                var(--green-light);
            border-radius:
                20px;
            overflow:
                hidden;
        }

        .crop-progress-fill {
            height:
                100%;
            background:
                linear-gradient(
                    90deg,
                    #185b31,
                    #45b96c
                );
            border-radius:
                20px;
            animation:
                progressGrow
                1s
                cubic-bezier(
                    .22,
                    1,
                    .36,
                    1
                );
        }

        @keyframes progressGrow {

            from {
                width: 0 !important;
            }

        }

        @keyframes cropIn {

            from {
                opacity: 0;
                transform:
                    translateX(-10px);
            }

            to {
                opacity: 1;
                transform:
                    translateX(0);
            }

        }

        .activity-item {
            display:
                flex;
            gap:
                12px;
            align-items:
                center;
            padding:
                12px 0;
            border-bottom:
                1px solid var(--border);
            animation:
                activityIn
                .4s
                ease
                both;
        }

        .activity-icon {
            width:
                38px;
            height:
                38px;
            min-width:
                38px;
            border-radius:
                11px;
            background:
                var(--green-light);
            display:
                flex;
            align-items:
                center;
            justify-content:
                center;
            font-size:
                18px;
        }

        .activity-content {
            display:
                flex;
            flex-direction:
                column;
            gap:
                3px;
            min-width:
                0;
        }

        .activity-content strong {
            font-size:
                13px;
            font-weight:
                600;
        }

        .activity-content span {
            color:
                var(--muted);
            font-size:
                11px;
        }

        .insight-item {
            display:
                flex;
            justify-content:
                space-between;
            align-items:
                center;
            padding:
                13px 0;
            border-bottom:
                1px solid var(--border);
            gap:
                15px;
        }

        .insight-item span {
            color:
                var(--muted);
            font-size:
                13px;
        }

        .insight-item strong {
            font-size:
                14px;
        }

        #fieldCount,
        #farmerCount,
        #healthCount,
        #diaryCount {
            transition:
                transform
                .2s
                ease;
        }

        .stat-card:hover {
            transform:
                translateY(-4px);
            box-shadow:
                0 12px 30px
                rgba(
                    24,
                    91,
                    49,
                    .08
                );
        }

        .stat-card {
            transition:
                transform
                .25s
                ease,
                box-shadow
                .25s
                ease;
        }

        .card,
        .backup-card,
        .diary-card {
            transition:
                transform
                .25s
                ease,
                box-shadow
                .25s
                ease;
        }

        .card:hover,
        .backup-card:hover,
        .diary-card:hover {
            transform:
                translateY(-3px);
            box-shadow:
                0 12px 28px
                rgba(
                    23,
                    35,
                    26,
                    .07
                );
        }

        @keyframes activityIn {

            from {
                opacity: 0;
                transform:
                    translateY(8px);
            }

            to {
                opacity: 1;
                transform:
                    translateY(0);
            }

        }

        @keyframes toastIn {

            from {
                opacity: 0;
                transform:
                    translateY(15px)
                    scale(.95);
            }

            to {
                opacity: 1;
                transform:
                    translateY(0)
                    scale(1);
            }

        }

        @keyframes toastOut {

            from {
                opacity: 1;
                transform:
                    translateY(0)
                    scale(1);
            }

            to {
                opacity: 0;
                transform:
                    translateY(10px)
                    scale(.96);
            }

        }

        @media (
            prefers-reduced-motion:
            reduce
        ) {

            *,
            *::before,
            *::after {
                animation-duration:
                    .01ms !important;
                animation-iteration-count:
                    1 !important;
                transition-duration:
                    .01ms !important;
            }

        }

    `;

    document.head.appendChild(
        style
    );

})();
