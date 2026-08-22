/* =====================================================
   NAYAKHAP AGRO RESEARCH
   SUPABASE CLOUD VERSION
   UPDATED AUTH + DATABASE VERSION
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

let toastTimer = null;


/* =====================================================
   DOM READY
===================================================== */

document.addEventListener("DOMContentLoaded", async () => {

    setupNavigation();
    setupAuth();
    setupForms();
    setupSearch();
    setupModalBehavior();

    await checkAuth();

});


/* =====================================================
   AUTH SETUP
===================================================== */

function setupAuth() {

    const loginTab =
        document.getElementById("loginTab");

    const signupTab =
        document.getElementById("signupTab");

    const authForm =
        document.getElementById("authForm");

    const confirmWrap =
        document.getElementById("confirmPasswordWrap");

    const confirmInput =
        document.getElementById("authConfirmPassword");

    const submitButton =
        document.getElementById("authSubmit");


    if (!loginTab || !signupTab || !authForm) {
        console.error("Authentication elements not found.");
        return;
    }


    /* ---------------------------------------------
       LOGIN TAB
    --------------------------------------------- */

    loginTab.addEventListener("click", () => {

        loginTab.classList.add("active");
        signupTab.classList.remove("active");

        submitButton.textContent = "Login";

        if (confirmWrap) {
            confirmWrap.classList.add("hidden");
        }

        if (confirmInput) {

            confirmInput.required = false;
            confirmInput.disabled = true;
            confirmInput.value = "";

        }

        clearAuthMessage();

    });


    /* ---------------------------------------------
       SIGNUP TAB
    --------------------------------------------- */

    signupTab.addEventListener("click", () => {

        signupTab.classList.add("active");
        loginTab.classList.remove("active");

        submitButton.textContent = "Create Account";

        if (confirmWrap) {
            confirmWrap.classList.remove("hidden");
        }

        if (confirmInput) {

            confirmInput.disabled = false;
            confirmInput.required = true;

        }

        clearAuthMessage();

    });


    /* ---------------------------------------------
       AUTH FORM SUBMIT
    --------------------------------------------- */

    authForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const isSignup =
            signupTab.classList.contains("active");


        const email =
            document
                .getElementById("authEmail")
                ?.value
                ?.trim()
                ?.toLowerCase() || "";


        const password =
            document
                .getElementById("authPassword")
                ?.value || "";


        const confirmPassword =
            document
                .getElementById("authConfirmPassword")
                ?.value || "";


        /* -----------------------------------------
           BASIC VALIDATION
        ----------------------------------------- */

        if (!email) {

            showAuthMessage(
                "Please enter your email address.",
                "error"
            );

            return;

        }


        if (!password) {

            showAuthMessage(
                "Please enter your password.",
                "error"
            );

            return;

        }


        if (isSignup) {

            if (password.length < 6) {

                showAuthMessage(
                    "Password must contain at least 6 characters.",
                    "error"
                );

                return;

            }


            if (password !== confirmPassword) {

                showAuthMessage(
                    "Passwords do not match.",
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


    /* ---------------------------------------------
       LOGOUT
    --------------------------------------------- */

    const logoutButton =
        document.getElementById("logoutBtn");


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logoutUser
        );

    }


    /* ---------------------------------------------
       INITIAL AUTH MODE
    --------------------------------------------- */

    if (signupTab.classList.contains("active")) {

        if (confirmWrap) {
            confirmWrap.classList.remove("hidden");
        }

        if (confirmInput) {
            confirmInput.disabled = false;
            confirmInput.required = true;
        }

        submitButton.textContent =
            "Create Account";

    } else {

        if (confirmWrap) {
            confirmWrap.classList.add("hidden");
        }

        if (confirmInput) {
            confirmInput.disabled = true;
            confirmInput.required = false;
        }

        submitButton.textContent =
            "Login";

    }

}


/* =====================================================
   SIGNUP
===================================================== */

async function signupUser(email, password) {

    setAuthLoading(true);
    clearAuthMessage();


    try {

        const redirectUrl =
            window.location.origin +
            window.location.pathname;


        const {
            data,
            error
        } = await supabaseClient.auth.signUp({

            email: email,

            password: password,

            options: {

                emailRedirectTo:
                    redirectUrl

            }

        });


        if (error) {

            console.error(
                "Signup error:",
                error
            );

            showAuthMessage(
                getFriendlyAuthError(error),
                "error"
            );

            return;

        }


        /* -----------------------------------------
           USER CREATED
        ----------------------------------------- */

        if (data?.user) {

            currentUser =
                data.user;

        }


        /* -----------------------------------------
           EMAIL CONFIRMATION ENABLED
        ----------------------------------------- */

        if (!data?.session) {

            showAuthMessage(
                "Account created successfully! Please check your email and confirm your account before logging in.",
                "success"
            );

            document
                .getElementById("authForm")
                ?.reset();

            return;

        }


        /* -----------------------------------------
           SESSION AVAILABLE
        ----------------------------------------- */

        showAuthMessage(
            "Account created successfully.",
            "success"
        );


        await showApp();


    } catch (error) {

        console.error(
            "Signup exception:",
            error
        );

        showAuthMessage(
            "Something went wrong while creating the account.",
            "error"
        );

    } finally {

        setAuthLoading(false);

    }

}


/* =====================================================
   LOGIN
===================================================== */

async function loginUser(email, password) {

    setAuthLoading(true);
    clearAuthMessage();


    try {

        const {
            data,
            error
        } = await supabaseClient.auth.signInWithPassword({

            email: email,

            password: password

        });


        if (error) {

            console.error(
                "Login error:",
                error
            );

            showAuthMessage(
                getFriendlyAuthError(error),
                "error"
            );

            return;

        }


        currentUser =
            data.user;


        await showApp();


    } catch (error) {

        console.error(
            "Login exception:",
            error
        );

        showAuthMessage(
            "Something went wrong while logging in.",
            "error"
        );

    } finally {

        setAuthLoading(false);

    }

}


/* =====================================================
   FRIENDLY AUTH ERRORS
===================================================== */

function getFriendlyAuthError(error) {

    const message =
        error?.message || "";


    const lower =
        message.toLowerCase();


    if (
        lower.includes("user already registered")
    ) {

        return "This email is already registered. Please login instead.";

    }


    if (
        lower.includes("invalid login credentials")
    ) {

        return "Incorrect email or password.";

    }


    if (
        lower.includes("email not confirmed")
    ) {

        return "Please confirm your email address before logging in.";

    }


    if (
        lower.includes("password should be at least")
    ) {

        return "Password must contain at least 6 characters.";

    }


    if (
        lower.includes("rate limit")
    ) {

        return "Too many attempts. Please wait a little and try again.";

    }


    return message ||
        "Authentication failed. Please try again.";

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


    const appShell =
        document.getElementById("appShell");

    const authScreen =
        document.getElementById("authScreen");


    if (appShell) {
        appShell.style.display = "none";
    }


    if (authScreen) {
        authScreen.style.display = "flex";
    }


    showToast(
        "Logged out successfully."
    );

}


/* =====================================================
   AUTH CHECK
===================================================== */

async function checkAuth() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();


        if (error) {

            console.error(
                "Session error:",
                error
            );

        }


        if (data?.session) {

            currentUser =
                data.session.user;

            await showApp();

        } else {

            const authScreen =
                document.getElementById("authScreen");

            const appShell =
                document.getElementById("appShell");


            if (authScreen) {
                authScreen.style.display = "flex";
            }


            if (appShell) {
                appShell.style.display = "none";
            }

        }


        supabaseClient.auth.onAuthStateChange(
            async (_event, session) => {

                if (session) {

                    currentUser =
                        session.user;

                } else {

                    currentUser = null;

                }

            }
        );


    } catch (error) {

        console.error(
            "Auth check error:",
            error
        );

    }

}


/* =====================================================
   SHOW APP
===================================================== */

async function showApp() {

    const authScreen =
        document.getElementById("authScreen");

    const appShell =
        document.getElementById("appShell");


    if (authScreen) {
        authScreen.style.display = "none";
    }


    if (appShell) {
        appShell.style.display = "flex";
    }


    const userEmail =
        document.getElementById("userEmail");


    if (userEmail) {

        userEmail.textContent =
            currentUser?.email || "";

    }


    await loadAllData();

}


/* =====================================================
   LOAD ALL DATA
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
            "Load data error:",
            error
        );

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
        document.querySelectorAll(".nav-btn");


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                showPage(
                    button.dataset.page
                );

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


/* =====================================================
   SHOW PAGE
===================================================== */

function showPage(page) {

    document
        .querySelectorAll(".page")
        .forEach(section => {

            section.classList.remove(
                "active"
            );

        });


    const target =
        document.getElementById(page);


    if (target) {

        target.classList.add(
            "active"
        );

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
            titles[page] ||
            "Research Dashboard";

    }


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
        healthDate.value = today();
    }


    const diaryDate =
        document.getElementById("diaryDate");


    if (diaryDate) {
        diaryDate.value = today();
    }

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
    } =
        await supabaseClient
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


    if (!currentUser) {

        showToast(
            "Please login first."
        );

        return;

    }


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
    } =
        await supabaseClient
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
   SAVE HEALTH OBSERVATION
===================================================== */

async function saveHealthObservation(event) {

    event.preventDefault();


    if (!currentUser) {

        showToast(
            "Please login first."
        );

        return;

    }


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
    } =
        await supabaseClient
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


    const healthDate =
        document.getElementById("healthDate");


    if (healthDate) {
        healthDate.value = today();
    }


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


    if (!currentUser) {

        showToast(
            "Please login first."
        );

        return;

    }


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
    } =
        await supabaseClient
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


    const diaryDate =
        document.getElementById("diaryDate");


    if (diaryDate) {
        diaryDate.value = today();
    }


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


    if (!tbody) return;


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
        filtered
            .map(field => `

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

            `)
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


    if (!tbody) return;


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
            .map(farmer => `

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

            `)
            .join("");

}


/* =====================================================
   FARMER PROFILE
===================================================== */

function openFarmerProfile(id) {

    const farmer =
        farmers.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!farmer) return;


    const title =
        document.getElementById(
            "profileTitle"
        );


    if (title) {

        title.textContent =
            `Farmer ${farmer.farmer_code || ""}`;

    }


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
                    .toLowerCase() ===
                String(
                    farmer.farmer_code || ""
                )
                    .toLowerCase()
        );


    const relatedDiary =
        diaryEntries.filter(
            item =>
                String(item.field_code || "")
                    .toLowerCase() ===
                String(
                    farmer.farmer_code || ""
                )
                    .toLowerCase()
        );


    const content =
        document.getElementById(
            "farmerProfileContent"
        );


    if (!content) return;


    content.innerHTML = `

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


    if (!tbody) return;


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
            .map(item => `

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

            `)
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


    if (!container) return;


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
            .map(entry => `

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

            `)
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

function animateNumber(id, target) {

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


    const duration = 500;

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


    if (!container) return;


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
            field.crop ||
            "Unknown";


        counts[crop] =
            (counts[crop] || 0) +
            1;

    });


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
            .map(([crop, count]) => {

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

            })
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


    if (!container) return;


    const activities = [];


    fields
        .slice(0, 5)
        .forEach(item => {

            activities.push({

                date:
                    item.created_at,

                text:
                    `Field added: ${
                        item.field_name ||
                        "Unknown"
                    }`

            });

        });


    observations
        .slice(0, 5)
        .forEach(item => {

            activities.push({

                date:
                    item.created_at,

                text:
                    `Crop observation: ${
                        item.crop_name ||
                        "Unknown"
                    }`

            });

        });


    diaryEntries
        .slice(0, 5)
        .forEach(item => {

            activities.push({

                date:
                    item.created_at,

                text:
                    `Diary entry: ${
                        item.field_code ||
                        "Field visit"
                    }`

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

            `)
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
    } =
        await supabaseClient
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
    } =
        await supabaseClient
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
    } =
        await supabaseClient
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
    } =
        await supabaseClient
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
   DELETE ALL DATA
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


    for (const table of tables) {

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
   EXPORT BACKUP
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
   RESTORE BACKUP
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
            "Backup file is valid.\n\nAutomatic cloud restore is disabled in this version for safety. Your current cloud data has NOT been changed."
        );


    } catch (error) {

        console.error(
            error
        );


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


    modal.classList.add(
        "open"
    );

}


function closeModal(id) {

    const modal =
        document.getElementById(id);


    if (!modal) return;


    modal.classList.remove(
        "open"
    );

}


/* =====================================================
   MODAL BEHAVIOR
===================================================== */

function setupModalBehavior() {

    document
        .querySelectorAll(".modal")
        .forEach(modal => {

            modal.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        modal
                    ) {

                        modal.classList.remove(
                            "open"
                        );

                    }

                }
            );

        });


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                document
                    .querySelectorAll(
                        ".modal.open"
                    )
                    .forEach(modal => {

                        modal.classList.remove(
                            "open"
                        );

                    });

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


/* =====================================================
   FORMAT DATE
===================================================== */

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


/* =====================================================
   FORMAT DATE + TIME
===================================================== */

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


/* =====================================================
   ESCAPE HTML
===================================================== */

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
   AUTH LOADING
===================================================== */

function setAuthLoading(loading) {

    const button =
        document.getElementById(
            "authSubmit"
        );


    if (!button) return;


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
                ?.classList
                .contains("active");


        button.textContent =
            signup
                ? "Create Account"
                : "Login";

    }

}


/* =====================================================
   AUTH MESSAGE
===================================================== */

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


/* =====================================================
   TOAST
===================================================== */

function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );


    if (!toast) {

        console.log(
            "Toast:",
            message
        );

        return;

    }


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
