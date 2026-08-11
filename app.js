/* =====================================================
   NAYAKHAP AGRO RESEARCH
   SUPABASE CLOUD VERSION
===================================================== */


/* =====================================================
   SUPABASE CONFIG
===================================================== */

const SUPABASE_URL =
    "https://cuhffitgrgewewoqdhgn.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_d9g-n2-Q3jEpW447fT-hXA_RW29I84n";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


/* =====================================================
   GLOBAL DATA
===================================================== */

let currentUser = null;

let fields = [];
let farmers = [];
let observations = [];
let diaryEntries = [];


/* =====================================================
   DOM READY
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        setupNavigation();

        setupAuth();

        setupForms();

        setupSearch();

        setupModalBehavior();

        await checkAuth();

    }
);


/* =====================================================
   AUTH
===================================================== */

function setupAuth() {

    const loginTab =
        document.getElementById("loginTab");

    const signupTab =
        document.getElementById("signupTab");

    const authForm =
        document.getElementById("authForm");


    loginTab.addEventListener(
        "click",
        () => {

            loginTab.classList.add("active");

            signupTab.classList.remove("active");

            document
                .getElementById("authSubmit")
                .textContent = "Login";

            document
                .getElementById("confirmPasswordWrap")
                .classList.add("hidden");

            document
                .getElementById("authConfirmPassword")
                .required = false;

            clearAuthMessage();

        }
    );


    signupTab.addEventListener(
        "click",
        () => {

            signupTab.classList.add("active");

            loginTab.classList.remove("active");

            document
                .getElementById("authSubmit")
                .textContent = "Create Account";

            document
                .getElementById("confirmPasswordWrap")
                .classList.remove("hidden");

            document
                .getElementById("authConfirmPassword")
                .required = true;

            clearAuthMessage();

        }
    );


    authForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const isSignup =
                signupTab.classList.contains("active");

            const email =
                document
                    .getElementById("authEmail")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("authPassword")
                    .value;

            const confirmPassword =
                document
                    .getElementById("authConfirmPassword")
                    .value;


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

        }
    );


    document
        .getElementById("logoutBtn")
        .addEventListener(
            "click",
            logoutUser
        );
}


/* =====================================================
   SIGNUP
===================================================== */

async function signupUser(
    email,
    password
) {

    setAuthLoading(true);


    const redirectUrl =
        window.location.origin +
        window.location.pathname;


    const {
        data,
        error
    } = await supabaseClient.auth.signUp({

        email,

        password,

        options: {

            emailRedirectTo:
                redirectUrl

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

        currentUser =
            data.user;

        showAuthMessage(
            "Account created successfully.",
            "success"
        );

        await showApp();

    } else {

        showAuthMessage(
            "Account created. Please check your email and confirm your account before logging in.",
            "success"
        );

    }

}


/* =====================================================
   LOGIN
===================================================== */

async function loginUser(
    email,
    password
) {

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


    currentUser =
        data.user;


    await showApp();

}


/* =====================================================
   LOGOUT
===================================================== */

async function logoutUser() {

    const {
        error
    } = await supabaseClient.auth.signOut();


    if (error) {

        showToast(
            error.message
        );

        return;
    }


    currentUser = null;

    fields = [];

    farmers = [];

    observations = [];

    diaryEntries = [];


    document
        .getElementById("appShell")
        .style.display = "none";


    document
        .getElementById("authScreen")
        .style.display = "flex";


    showToast(
        "Logged out successfully."
    );

}


/* =====================================================
   AUTH CHECK
===================================================== */

async function checkAuth() {

    const {
        data
    } =
        await supabaseClient.auth.getSession();


    if (data.session) {

        currentUser =
            data.session.user;

        await showApp();

    } else {

        document
            .getElementById("authScreen")
            .style.display = "flex";

        document
            .getElementById("appShell")
            .style.display = "none";

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


/* =====================================================
   SHOW APP
===================================================== */

async function showApp() {

    document
        .getElementById("authScreen")
        .style.display = "none";


    document
        .getElementById("appShell")
        .style.display = "flex";


    document
        .getElementById("userEmail")
        .textContent =
        currentUser?.email || "";


    await loadAllData();

}


/* =====================================================
   LOAD DATA
===================================================== */

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
                .eq(
                    "user_id",
                    currentUser.id
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                ),


            supabaseClient
                .from("farmers")
                .select("*")
                .eq(
                    "user_id",
                    currentUser.id
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                ),


            supabaseClient
                .from("crop_observations")
                .select("*")
                .eq(
                    "user_id",
                    currentUser.id
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                ),


            supabaseClient
                .from("field_diary")
                .select("*")
                .eq(
                    "user_id",
                    currentUser.id
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )

        ]);


        if (fieldsResponse.error)
            console.error(
                "Fields:",
                fieldsResponse.error
            );


        if (farmersResponse.error)
            console.error(
                "Farmers:",
                farmersResponse.error
            );


        if (observationsResponse.error)
            console.error(
                "Observations:",
                observationsResponse.error
            );


        if (diaryResponse.error)
            console.error(
                "Diary:",
                diaryResponse.error
            );


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

        console.error(error);

        showToast(
            "Could not load cloud data."
        );

    }

}


/* =====================================================
   NAVIGATION
===================================================== */

function setupNavigation() {

    const buttons =
        document.querySelectorAll(
            ".nav-btn"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    showPage(
                        button.dataset.page
                    );

                }
            );

        }
    );


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
        .forEach(
            section => {

                section.classList
                    .remove("active");

            }
        );


    const target =
        document.getElementById(page);


    if (target) {

        target.classList.add("active");

    }


    document
        .querySelectorAll(".nav-btn")
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.page === page
                );

            }
        );


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


    document
        .getElementById("pageTitle")
        .textContent =
        titles[page] ||
        "Research Dashboard";


    document
        .querySelector(".sidebar")
        ?.classList
        .remove("open");

}


/* =====================================================
   FORMS
===================================================== */

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
        .getElementById("healthDate")
        .value =
        today();


    document
        .getElementById("diaryDate")
        .value =
        today();

}


/* =====================================================
   SAVE FIELD
===================================================== */

async function saveField(event) {

    event.preventDefault();


    if (!currentUser) {

        showToast(
            "Please login first."
        );

        return;
    }


    const record = {

        field_name:
            getValue("fieldId"),

        crop:
            getValue("fieldCrop"),

        variety:
            getValue("fieldVariety"),

        sowing_date:
            getValue("fieldDate") ||
            null,

        irrigation_source:
            getValue("fieldWater"),

        area:
            parseNumber(
                getValue("fieldSize")
            ),

        fertilizer:
            getValue("fieldFertilizer"),

        yield_value:
            parseNumber(
                getValue("fieldYield")
            ),

        notes:
            getValue("fieldNotes"),

        user_id:
            currentUser.id

    };


    const {
        error
    } = await supabaseClient
        .from("fields")
        .insert(record);


    if (error) {

        showToast(
            "Could not save field: " +
            error.message
        );

        return;
    }


    closeModal("fieldModal");

    event.target.reset();

    await loadAllData();

    showToast(
        "Field record saved successfully."
    );

}


/* =====================================================
   SAVE FARMER
===================================================== */

async function saveFarmer(event) {

    event.preventDefault();


    if (!currentUser) return;


    const record = {

        farmer_code:
            getValue("farmerCode"),

        main_crop:
            getValue("farmerCrop"),

        seed_source:
            getValue("seedSource"),

        farming_method:
            getValue("farmerWater"),

        notes:
            [

                getValue("farmerProblem"),

                getValue("farmerObservation")

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

        showToast(
            "Could not save farmer: " +
            error.message
        );

        return;
    }


    closeModal("farmerModal");

    event.target.reset();

    await loadAllData();

    showToast(
        "Farmer record saved successfully."
    );

}


/* =====================================================
   SAVE HEALTH
===================================================== */

async function saveHealthObservation(event) {

    event.preventDefault();


    if (!currentUser) return;


    const record = {

        observation_date:
            getValue("healthDate"),

        field_code:
            getValue("healthField"),

        crop_name:
            getValue("healthCrop") ||
            "Not specified",

        disease_symptoms:
            getValue("healthSymptoms"),

        crop_stage:
            getValue("healthIdentification"),

        treatment:
            getValue("healthTreatment"),

        pest_observation:
            getValue("healthSeverity"),

        user_id:
            currentUser.id

    };


    const {
        error
    } = await supabaseClient
        .from("crop_observations")
        .insert(record);


    if (error) {

        showToast(
            "Could not save observation: " +
            error.message
        );

        return;
    }


    closeModal("healthModal");

    event.target.reset();

    document
        .getElementById("healthDate")
        .value =
        today();

    await loadAllData();

    showToast(
        "Crop health observation saved."
    );

}


/* =====================================================
   SAVE DIARY
===================================================== */

async function saveDiaryEntry(event) {

    event.preventDefault();


    if (!currentUser) return;


    const record = {

        entry_date:
            getValue("diaryDate"),

        field_code:
            getValue("diaryField"),

        activity:
            "Field observation",

        observation:
            getValue("diaryObservation"),

        weather_condition:
            getValue("diaryWeather"),

        user_id:
            currentUser.id

    };


    const {
        error
    } = await supabaseClient
        .from("field_diary")
        .insert(record);


    if (error) {

        showToast(
            "Could not save diary: " +
            error.message
        );

        return;
    }


    closeModal("diaryModal");

    event.target.reset();

    document
        .getElementById("diaryDate")
        .value =
        today();

    await loadAllData();

    showToast(
        "Diary entry saved."
    );

}


/* =====================================================
   SEARCH
===================================================== */

function setupSearch() {

    const search =
        document.getElementById(
            "fieldSearch"
        );


    search?.addEventListener(
        "input",
        renderFields
    );

}


/* =====================================================
   RENDER ALL
===================================================== */

function renderAll() {

    renderFields();

    renderFarmers();

    renderHealth();

    renderDiary();

    updateDashboard();

}


/* =====================================================
   FIELD TABLE
===================================================== */

function renderFields() {

    const tbody =
        document.getElementById(
            "fieldTable"
        );


    const search =
        (
            document
                .getElementById(
                    "fieldSearch"
                )
                ?.value || ""
        )
        .toLowerCase();


    const filtered =
        fields.filter(
            field => {

                const text = [

                    field.field_name,

                    field.crop,

                    field.variety

                ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


                return text.includes(
                    search
                );

            }
        );


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
        filtered
            .map(
                field => `

                <tr>

                    <td>
                        <strong>
                            ${escapeHtml(
                                field.field_name || "-"
                            )}
                        </strong>
                    </td>

                    <td>
                        ${escapeHtml(
                            field.crop || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            field.variety || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            field.irrigation_source || "-"
                        )}
                    </td>

                    <td>
                        ${formatDate(
                            field.sowing_date
                        )}
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

            `
            )
            .join("");

}


/* =====================================================
   FARMER TABLE
===================================================== */

function renderFarmers() {

    const tbody =
        document.getElementById(
            "farmerTable"
        );


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
        farmers
            .map(
                farmer => `

                <tr>

                    <td>
                        <strong>
                            ${escapeHtml(
                                farmer.farmer_code || "-"
                            )}
                        </strong>
                    </td>

                    <td>
                        ${escapeHtml(
                            farmer.main_crop || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            farmer.seed_source || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            farmer.farming_method || "-"
                        )}
                    </td>

                    <td>

                        <button
                            class="profile-btn"
                            onclick="openFarmerProfile('${farmer.id}')"
                        >
                            Profile
                        </button>

                        <button
                            class="delete-btn"
                            onclick="deleteFarmer('${farmer.id}')"
                        >
                            Delete
                        </button>

                    </td>

                </tr>

            `
            )
            .join("");

}


/* =====================================================
   FARMER PROFILE
===================================================== */

function openFarmerProfile(id) {

    const farmer =
        farmers.find(
            item => String(item.id) === String(id)
        );


    if (!farmer) return;


    document
        .getElementById("profileTitle")
        .textContent =
        `Farmer ${farmer.farmer_code || ""}`;


    const notes =
        farmer.notes || "";


    const parts =
        notes.split(" | ");


    const problem =
        parts[0] || "Not recorded";


    const observation =
        parts.slice(1).join(" | ") ||
        "Not recorded";


    const relatedHealth =
        observations.filter(
            item =>
                String(item.field_code || "")
                    .toLowerCase()
                    ===
                String(farmer.farmer_code || "")
                    .toLowerCase()
        );


    const relatedDiary =
        diaryEntries.filter(
            item =>
                String(item.field_code || "")
                    .toLowerCase()
                    ===
                String(farmer.farmer_code || "")
                    .toLowerCase()
        );


    document
        .getElementById(
            "farmerProfileContent"
        )
        .innerHTML = `

            <div class="profile-header">

                <div class="profile-avatar">
                    👨‍🌾
                </div>

                <div>

                    <div class="profile-code">
                        FARMER CODE
                    </div>

                    <h3>
                        ${escapeHtml(
                            farmer.farmer_code || "-"
                        )}
                    </h3>

                </div>

            </div>


            <div class="profile-grid">

                <div class="profile-item">

                    <small>Main Crop</small>

                    <strong>
                        ${escapeHtml(
                            farmer.main_crop || "-"
                        )}
                    </strong>

                </div>


                <div class="profile-item">

                    <small>Seed Source</small>

                    <strong>
                        ${escapeHtml(
                            farmer.seed_source || "-"
                        )}
                    </strong>

                </div>


                <div class="profile-item">

                    <small>Irrigation</small>

                    <strong>
                        ${escapeHtml(
                            farmer.farming_method || "-"
                        )}
                    </strong>

                </div>


                <div class="profile-item">

                    <small>Health Records</small>

                    <strong>
                        ${relatedHealth.length}
                    </strong>

                </div>

            </div>


            <div class="profile-item">

                <small>Major Farming Problem</small>

                <strong>
                    ${escapeHtml(problem)}
                </strong>

            </div>

            <br>


            <div class="profile-item">

                <small>Farmer's Observation</small>

                <strong>
                    ${escapeHtml(observation)}
                </strong>

            </div>

            <br>


            <div class="profile-item">

                <small>Linked Diary Entries</small>

                <strong>
                    ${relatedDiary.length}
                </strong>

            </div>

        `;


    openModal(
        "farmerProfileModal"
    );

}


/* =====================================================
   HEALTH TABLE
===================================================== */

function renderHealth() {

    const tbody =
        document.getElementById(
            "healthTable"
        );


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
        observations
            .map(
                item => `

                <tr>

                    <td>
                        ${formatDate(
                            item.observation_date
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            item.field_code || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            item.crop_name || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            item.disease_symptoms || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            item.pest_observation || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            item.crop_stage || "-"
                        )}
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

            `
            )
            .join("");

}


/* =====================================================
   DIARY
===================================================== */

function renderDiary() {

    const container =
        document.getElementById(
            "diaryList"
        );


    if (!diaryEntries.length) {

        container.innerHTML = `
            <div class="empty">
                No diary entries yet.
            </div>
        `;

        return;
    }


    container.innerHTML =
        diaryEntries
            .map(
                entry => `

                <div class="diary-card">

                    <div class="diary-date">
                        ${formatDate(
                            entry.entry_date
                        )}
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

            `
            )
            .join("");

}


/* =====================================================
   DASHBOARD
===================================================== */

function updateDashboard() {

    animateNumber(
        "fieldCount",
        fields.length
    );

    animateNumber(
        "farmerCount",
        farmers.length
    );

    animateNumber(
        "healthCount",
        observations.length
    );

    animateNumber(
        "diaryCount",
        diaryEntries.length
    );


    renderCropDistribution();

    renderRecentActivity();

}


/* =====================================================
   NUMBER ANIMATION
===================================================== */

function animateNumber(
    id,
    target
) {

    const element =
        document.getElementById(id);


    if (!element) return;


    const start =
        Number(element.textContent) || 0;


    if (start === target) {

        element.textContent =
            target;

        return;
    }


    const duration =
        500;

    const startTime =
        performance.now();


    function update(currentTime) {

        const progress =
            Math.min(
                (currentTime - startTime) /
                duration,
                1
            );


        const value =
            Math.floor(
                start +
                (target - start) *
                progress
            );


        element.textContent =
            value;


        if (progress < 1) {

            requestAnimationFrame(
                update
            );

        }

    }


    requestAnimationFrame(
        update
    );

}


/* =====================================================
   CROP DISTRIBUTION
===================================================== */

function renderCropDistribution() {

    const container =
        document.getElementById(
            "cropDistribution"
        );


    if (!fields.length) {

        container.innerHTML = `
            <div class="empty">
                No field data yet.
            </div>
        `;

        return;
    }


    const counts = {};


    fields.forEach(
        field => {

            const crop =
                field.crop ||
                "Unknown";


            counts[crop] =
                (counts[crop] || 0) +
                1;

        }
    );


    const entries =
        Object.entries(counts)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            );


    const max =
        entries[0][1];


    container.innerHTML =
        entries
            .map(
                ([crop, count]) => {

                    const percentage =
                        Math.max(
                            8,
                            Math.round(
                                (count / max) *
                                100
                            )
                        );


                    return `

                        <div class="crop-row">

                            <div class="crop-top">

                                <span>
                                    🌱
                                    ${escapeHtml(crop)}
                                </span>

                                <strong>
                                    ${count}
                                </strong>

                            </div>

                            <div class="crop-bar">

                                <div
                                    class="crop-bar-fill"
                                    style="width:${percentage}%"
                                ></div>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");

}


/* =====================================================
   RECENT ACTIVITY
===================================================== */

function renderRecentActivity() {

    const container =
        document.getElementById(
            "recentActivity"
        );


    const activities = [];


    fields
        .slice(0, 5)
        .forEach(
            item => {

                activities.push({

                    date:
                        item.created_at,

                    text:
                        `Field added: ${
                            item.field_name ||
                            "Unknown"
                        }`

                });

            }
        );


    observations
        .slice(0, 5)
        .forEach(
            item => {

                activities.push({

                    date:
                        item.created_at,

                    text:
                        `Crop observation: ${
                            item.crop_name ||
                            "Unknown"
                        }`

                });

            }
        );


    diaryEntries
        .slice(0, 5)
        .forEach(
            item => {

                activities.push({

                    date:
                        item.created_at,

                    text:
                        `Diary entry: ${
                            item.field_code ||
                            "Field visit"
                        }`

                });

            }
        );


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
            .map(
                item => `

                    <div class="activity-item">

                        <span class="activity-dot">
                        </span>

                        <div>

                            <div class="activity-text">
                                ${escapeHtml(
                                    item.text
                                )}
                            </div>

                            <div class="activity-time">
                                ${formatDateTime(
                                    item.date
                                )}
                            </div>

                        </div>

                    </div>

                `
            )
            .join("");

}


/* =====================================================
   DELETE FIELD
===================================================== */

async function deleteField(id) {

    if (
        !confirm(
            "Delete this field record?"
        )
    ) return;


    const {
        error
    } = await supabaseClient
        .from("fields")
        .delete()
        .eq("id", id)
        .eq(
            "user_id",
            currentUser.id
        );


    if (error) {

        showToast(
            error.message
        );

        return;
    }


    await loadAllData();

    showToast(
        "Field deleted."
    );

}


/* =====================================================
   DELETE FARMER
===================================================== */

async function deleteFarmer(id) {

    if (
        !confirm(
            "Delete this farmer record?"
        )
    ) return;


    const {
        error
    } = await supabaseClient
        .from("farmers")
        .delete()
        .eq("id", id)
        .eq(
            "user_id",
            currentUser.id
        );


    if (error) {

        showToast(
            error.message
        );

        return;
    }


    await loadAllData();

    showToast(
        "Farmer deleted."
    );

}


/* =====================================================
   DELETE OBSERVATION
===================================================== */

async function deleteObservation(id) {

    if (
        !confirm(
            "Delete this health observation?"
        )
    ) return;


    const {
        error
    } = await supabaseClient
        .from("crop_observations")
        .delete()
        .eq("id", id)
        .eq(
            "user_id",
            currentUser.id
        );


    if (error) {

        showToast(
            error.message
        );

        return;
    }


    await loadAllData();

    showToast(
        "Health observation deleted."
    );

}


/* =====================================================
   DELETE DIARY
===================================================== */

async function deleteDiary(id) {

    if (
        !confirm(
            "Delete this diary entry?"
        )
    ) return;


    const {
        error
    } = await supabaseClient
        .from("field_diary")
        .delete()
        .eq("id", id)
        .eq(
            "user_id",
            currentUser.id
        );


    if (error) {

        showToast(
            error.message
        );

        return;
    }


    await loadAllData();

    showToast(
        "Diary entry deleted."
    );

}


/* =====================================================
   DELETE ALL
===================================================== */

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


    for (
        const table
        of tables
    ) {

        const {
            error
        } =
            await supabaseClient
                .from(table)
                .delete()
                .eq(
                    "user_id",
                    currentUser.id
                );


        if (error) {

            console.error(
                table,
                error
            );

            if (
                table ===
                "research_samples"
            ) {

                continue;

            }


            showToast(
                `Could not clear ${table}.`
            );

            return;
        }

    }


    await loadAllData();


    showToast(
        "All research data deleted."
    );

}


/* =====================================================
   EXPORT
===================================================== */

async function exportBackup() {

    if (!currentUser) {

        showToast(
            "Please login first."
        );

        return;
    }


    const backup = {

        app:
            "NayaKhap Agro Research",

        version:
            "2.0",

        exported_at:
            new Date().toISOString(),

        user:
            currentUser.email || "",

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


    document.body.appendChild(a);

    a.click();

    a.remove();


    URL.revokeObjectURL(url);


    showToast(
        "Backup downloaded."
    );

}


/* =====================================================
   RESTORE
===================================================== */

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
                "Invalid backup."
            );

        }


        alert(
            "Backup file is valid.\n\nFor safety, automatic cloud restore is disabled in this version. Your current cloud data has NOT been changed."
        );


    } catch (error) {

        showToast(
            "Invalid backup file."
        );

    }


    event.target.value = "";

}


/* =====================================================
   MODALS
===================================================== */

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


function setupModalBehavior() {

    document
        .querySelectorAll(".modal")
        .forEach(
            modal => {

                modal.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target ===
                            modal
                        ) {

                            modal.classList
                                .remove("open");

                        }

                    }
                );

            }
        );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                document
                    .querySelectorAll(
                        ".modal.open"
                    )
                    .forEach(
                        modal => {

                            modal.classList
                                .remove("open");

                        }
                    );

            }

        }
    );

}


/* =====================================================
   HELPERS
===================================================== */

function getValue(id) {

    return (
        document
            .getElementById(id)
            ?.value
            ?.trim() || ""
    );

}


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


/* =====================================================
   AUTH UI
===================================================== */

function setAuthLoading(
    loading
) {

    const button =
        document.getElementById(
            "authSubmit"
        );


    if (loading) {

        button.disabled = true;

        button.textContent =
            "Please wait...";

    } else {

        button.disabled = false;


        const signup =
            document
                .getElementById(
                    "signupTab"
                )
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
        document.getElementById(
            "authMessage"
        );


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


    box.textContent =
        "";


    box.className =
        "auth-message";

}


/* =====================================================
   TOAST
===================================================== */

let toastTimer = null;


function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );


    if (!toast) return;


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );

}
