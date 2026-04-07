const {
    init,
    onStoreUpdated,
    isFirebaseConfigured,
    isAdminSignedIn,
    isStorageConfigured,
    signInAdmin,
    signOutAdmin,
    sendAdminPasswordReset,
    onAdminAuthStateChanged,
    bootstrapRemoteFromLocalIfEmpty,
    uploadMediaFile,
    getPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost,
    togglePostStatus,
    setFeaturedPost,
    summarizeVisits,
    verifyAdminPasscode,
    openAdminSession,
    closeAdminSession,
    hasAdminSession,
    setAdminPasscode,
    formatDisplayDate,
    getLiveTickerItems,
    setLiveTickerItems,
    clearLiveTickerItems,
    getArchiveTickerItems,
    setArchiveTickerItems,
    clearArchiveTickerItems,
    saveMediaFile,
    getMediaBlob
} = window.NewsroomStore || {};

const loginGate = document.getElementById("loginGate");
const loginForm = document.getElementById("loginForm");
const firebaseLoginForm = document.getElementById("firebaseLoginForm");
const resetPasswordButton = document.getElementById("resetPasswordButton");
const loginStatus = document.getElementById("loginStatus");
const loginStatusLocal = document.getElementById("loginStatusLocal");
const adminShell = document.getElementById("adminShell");
const logoutButton = document.getElementById("logoutButton");
const analyticsGrid = document.getElementById("analyticsGrid");
const heroAssignment = document.getElementById("heroAssignment");
const postForm = document.getElementById("postForm");
const savePostButton = postForm ? postForm.querySelector("button[type=\"submit\"]") : null;
const postIdInput = document.getElementById("postId");
const editorTitle = document.getElementById("editorTitle");
const editorStatus = document.getElementById("editorStatus");
const postsList = document.getElementById("postsList");
const adminSearchForm = document.getElementById("adminSearchForm");
const adminSearchInput = document.getElementById("adminSearchInput");
const adminSearchClearButton = document.getElementById("adminSearchClear");
const adminSearchMeta = document.getElementById("adminSearchMeta");
const resetEditorButton = document.getElementById("resetEditorButton");
const settingsForm = document.getElementById("settingsForm");
const settingsStatus = document.getElementById("settingsStatus");
const liveTickerForm = document.getElementById("liveTickerForm");
const liveTicker1Input = document.getElementById("liveTicker1");
const liveTicker2Input = document.getElementById("liveTicker2");
const liveTicker3Input = document.getElementById("liveTicker3");
const liveTickerStatus = document.getElementById("liveTickerStatus");
const clearLiveTickerButton = document.getElementById("clearLiveTickerButton");
const archiveTickerForm = document.getElementById("archiveTickerForm");
const archiveTicker1Input = document.getElementById("archiveTicker1");
const archiveTicker2Input = document.getElementById("archiveTicker2");
const archiveTicker3Input = document.getElementById("archiveTicker3");
const archiveTickerStatus = document.getElementById("archiveTickerStatus");
const clearArchiveTickerButton = document.getElementById("clearArchiveTickerButton");
const imageFileInput = document.getElementById("postImageFile");
const imageFileInput2 = document.getElementById("postImageFile2");
const imageFileInput3 = document.getElementById("postImageFile3");
const imageUrlInput = document.getElementById("postImageUrl");
const imageUrlInput2 = document.getElementById("postImageUrl2");
const imageUrlInput3 = document.getElementById("postImageUrl3");
const imagePreview = document.getElementById("imagePreview");
const imagePreview2 = document.getElementById("imagePreview2");
const imagePreview3 = document.getElementById("imagePreview3");
const removeImage1Button = document.getElementById("removeImage1");
const removeImage2Button = document.getElementById("removeImage2");
const removeImage3Button = document.getElementById("removeImage3");
const videoFileInput = document.getElementById("postVideoFile");
const videoFileInput2 = document.getElementById("postVideoFile2");
const videoFileInput3 = document.getElementById("postVideoFile3");
const videoPreview = document.getElementById("videoPreview");
const videoPreview2 = document.getElementById("videoPreview2");
const videoPreview3 = document.getElementById("videoPreview3");
const postSensitiveToggle = document.getElementById("postSensitive");
const postDisclaimerInput = document.getElementById("postDisclaimer");

let pendingImageDataUrls = [];
let pendingImageFiles = [];
let pendingImageUploadHadFailures = false;
let disableStorageUploadsForSession = false;
let pendingVideoIds = [];
let pendingVideoFiles = [];
let pendingVideoPreviewUrls = [];
let activeAdminSearchQuery = "";

const DEFAULT_DISCLAIMER_TEXT =
    "Viewer discretion advised. This report contains details some readers may find distressing.";

const localOnlySections = Array.from(document.querySelectorAll("[data-local-only]"));

function syncRemoveImageButtons() {
    const buttons = [removeImage1Button, removeImage2Button, removeImage3Button];

    buttons.forEach((button, index) => {
        if (!button) {
            return;
        }

        const hasImage = Boolean(pendingImageDataUrls[index]);
        button.disabled = !hasImage;
    });
}

function syncDisclaimerControls() {
    if (!postSensitiveToggle || !postDisclaimerInput) {
        return;
    }

    if (postSensitiveToggle.checked) {
        postDisclaimerInput.disabled = false;
        if (!postDisclaimerInput.value.trim()) {
            postDisclaimerInput.value = DEFAULT_DISCLAIMER_TEXT;
        }
        return;
    }

    postDisclaimerInput.value = "";
    postDisclaimerInput.disabled = true;
}

function removeImageSlot(slotIndex) {
    pendingImageDataUrls[slotIndex] = "";
    pendingImageFiles[slotIndex] = null;

    const previews = [imagePreview, imagePreview2, imagePreview3];
    const inputs = [imageFileInput, imageFileInput2, imageFileInput3];
    const preview = previews[slotIndex];
    const input = inputs[slotIndex];

    if (preview) {
        preview.hidden = true;
        preview.removeAttribute("src");
    }

    if (input) {
        input.value = "";
    }

    syncRemoveImageButtons();
}

function setStatus(element, message, tone) {
    element.textContent = message;
    element.classList.remove("is-error", "is-success");

    if (tone) {
        element.classList.add(tone === "error" ? "is-error" : "is-success");
    }
}

function withTimeout(promise, timeoutMs, timeoutMessage) {
    const ms = Number(timeoutMs);

    if (!Number.isFinite(ms) || ms <= 0) {
        return promise;
    }

    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(timeoutMessage || "Timed out.")), ms))
    ]);
}

function setConsoleVisibility(isVisible) {
    loginGate.hidden = isVisible;
    adminShell.hidden = !isVisible;
}

function resetEditor() {
    postForm.reset();
    postIdInput.value = "";
    pendingImageDataUrls = [];
    pendingImageFiles = [];
    pendingImageUploadHadFailures = false;
    pendingVideoIds = [];
    pendingVideoFiles = [];
    pendingVideoPreviewUrls.forEach((url) => {
        if (url) {
            URL.revokeObjectURL(url);
        }
    });
    pendingVideoPreviewUrls = [];
    [imagePreview, imagePreview2, imagePreview3].forEach((preview) => {
        preview.hidden = true;
        preview.removeAttribute("src");
    });
    syncRemoveImageButtons();
    [videoPreview, videoPreview2, videoPreview3].forEach((preview) => {
        preview.hidden = true;
        preview.removeAttribute("src");
    });
    editorTitle.textContent = "Create a post";
    setStatus(editorStatus, "", "");
    syncDisclaimerControls();
}

function renderAnalytics() {
    if (!analyticsGrid || typeof summarizeVisits !== "function") {
        return;
    }

    const summaries = summarizeVisits();
    analyticsGrid.innerHTML = summaries
        .map(
            (summary) => `
                <article class="analytics-card">
                    <h3>${summary.label}</h3>
                    <div class="analytics-number">${summary.pageViews}</div>
                    <p class="analytics-meta">${summary.uniqueVisitors} unique visitor${summary.uniqueVisitors === 1 ? "" : "s"} recorded in this browser-backed build.</p>
                </article>
            `
        )
        .join("");
}

function createPostCard(post) {
    return `
        <article class="post-card" data-post-id="${post.id}">
            <div class="post-card-top">
                <div>
                    <h3>${post.title}</h3>
                    <div class="post-meta">
                        <span class="post-chip">${post.category}</span>
                        <span class="post-chip">${post.region}</span>
                        <span class="post-chip">${post.status}</span>
                        ${post.disclaimer ? '<span class="post-chip">sensitive</span>' : ""}
                        ${post.featured ? '<span class="post-chip">homepage hero</span>' : ""}
                    </div>
                </div>
                <span class="status-text">Updated ${formatDisplayDate(post.updatedAt)}</span>
            </div>
            <p>${post.summary}</p>
            <div class="post-actions">
                <button type="button" class="post-action" data-action="edit">Edit</button>
                <button type="button" class="post-action is-primary" data-action="feature">${post.featured ? "Featured Now" : "Set as Hero"}</button>
                <button type="button" class="post-action" data-action="toggle-status">${post.status === "published" ? "Archive" : "Publish"}</button>
                <button type="button" class="post-action" data-action="delete">Delete</button>
            </div>
        </article>
    `;
}

function renderHeroAssignment() {
    if (!heroAssignment || typeof getPosts !== "function") {
        return;
    }

    const featuredPost = getPosts().find((post) => post.featured && post.status === "published");

    heroAssignment.innerHTML = featuredPost
        ? `
            <h3>${featuredPost.title}</h3>
            <p>${featuredPost.category} | ${featuredPost.region} | ${featuredPost.location}</p>
            <p>Updated ${formatDisplayDate(featuredPost.updatedAt)}</p>
        `
        : `
            <h3>No homepage hero selected</h3>
            <p>Use "Set as Hero" on any published post below to control the top story on the homepage.</p>
        `;
}

function renderPostsList() {
    if (!postsList || typeof getPosts !== "function") {
        return;
    }

    const posts = getPosts();
    const query = activeAdminSearchQuery.trim();

    const filtered = query
        ? posts.filter((post) => getPostSearchText(post).includes(query))
        : posts;

    if (adminSearchMeta) {
        adminSearchMeta.textContent = query
            ? `Showing ${filtered.length} of ${posts.length} posts for “${query}”.`
            : `Showing ${posts.length} post${posts.length === 1 ? "" : "s"}.`;
    }

    postsList.innerHTML = filtered.map(createPostCard).join("");
}

function getPostSearchText(post) {
    return [
        post?.id,
        post?.title,
        post?.summary,
        post?.content,
        post?.category,
        post?.region,
        post?.location,
        post?.status
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
}

function applyAdminSearch(query) {
    activeAdminSearchQuery = String(query || "").trim().toLowerCase();
    renderPostsList();
}

function populateEditor(post) {
    postIdInput.value = String(post.id);
    postForm.title.value = post.title;
    postForm.summary.value = post.summary;
    postForm.content.value = post.content;
    postForm.category.value = post.category;
    postForm.region.value = post.region;
    postForm.location.value = post.location;
    postForm.status.value = post.status;
    postForm.imageAlt.value = post.imageAlt;
    postForm.featured.checked = Boolean(post.featured);
    postForm.trending.checked = Boolean(post.trending);
    const disclaimer = String(post.disclaimer || "").trim();
    if (postSensitiveToggle) {
        postSensitiveToggle.checked = Boolean(disclaimer);
    }
    if (postDisclaimerInput) {
        postDisclaimerInput.value = disclaimer;
    }
    syncDisclaimerControls();
    pendingImageDataUrls = Array.isArray(post.galleryImages) && post.galleryImages.length ? [...post.galleryImages] : [post.imageSrc];
    pendingImageFiles = [];
    syncRemoveImageButtons();
    pendingVideoIds = Array.isArray(post.videoIds) ? post.videoIds.map((id) => String(id || "")).slice(0, 3) : [];
    pendingVideoFiles = [];
    [imagePreview, imagePreview2, imagePreview3].forEach((preview, index) => {
        const imageSrc = pendingImageDataUrls[index];
        preview.hidden = !imageSrc;
        if (imageSrc) {
            preview.src = imageSrc;
        } else {
            preview.removeAttribute("src");
        }
    });

    const urlInputs = [imageUrlInput, imageUrlInput2, imageUrlInput3];
    urlInputs.forEach((input, index) => {
        if (!input) {
            return;
        }

        const src = String(pendingImageDataUrls[index] || "");
        input.value = src.startsWith("http://") || src.startsWith("https://") ? src : "";
    });

    hydrateVideoPreviews();
    editorTitle.textContent = "Edit post";
    setStatus(editorStatus, `Editing "${post.title}"`, "success");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function readImageAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Unable to read image."));
        reader.readAsDataURL(file);
    });
}

function normalizeImageUrl(value) {
    const raw = String(value || "").trim();
    // Users often paste URLs followed by punctuation (e.g. trailing comma from a sentence).
    const url = raw.replace(/[)\],.]+$/g, "").trim();

    if (!url) {
        return "";
    }

    try {
        const parsed = new URL(url);
        const protocol = parsed.protocol.toLowerCase();

        if (protocol !== "https:" && protocol !== "http:") {
            return "";
        }

        const path = parsed.pathname.toLowerCase();
        const looksLikeImage = /\.(png|jpe?g|webp|gif|svg)$/i.test(path);

        // Require a direct image URL; pasting an article URL will not render in <img>.
        if (!looksLikeImage) {
            return "";
        }

        return parsed.toString();
    } catch (error) {
        return "";
    }
}

function applyImageUrlsToSlots() {
    const urls = [imageUrlInput?.value, imageUrlInput2?.value, imageUrlInput3?.value].map(normalizeImageUrl);
    const fileInputs = [imageFileInput, imageFileInput2, imageFileInput3];
    const previews = [imagePreview, imagePreview2, imagePreview3];

    urls.forEach((url, index) => {
        if (!url) {
            return;
        }

        pendingImageFiles[index] = null;
        pendingImageDataUrls[index] = url;

        const fileInput = fileInputs[index];
        if (fileInput) {
            fileInput.value = "";
        }

        const preview = previews[index];
        if (preview) {
            preview.src = url;
            preview.hidden = false;
        }
    });

    syncRemoveImageButtons();
}

async function updateImageSlot(fileInput, previewElement, slotIndex) {
    const file = fileInput.files?.[0];

    if (!file) {
        pendingImageDataUrls[slotIndex] = pendingImageDataUrls[slotIndex] || "";
        pendingImageFiles[slotIndex] = pendingImageFiles[slotIndex] || null;
        syncRemoveImageButtons();
        return;
    }

    const urlInputs = [imageUrlInput, imageUrlInput2, imageUrlInput3];
    if (urlInputs[slotIndex]) {
        urlInputs[slotIndex].value = "";
    }

    pendingImageFiles[slotIndex] = file;
    const imageDataUrl = await readImageAsDataUrl(file);
    pendingImageDataUrls[slotIndex] = imageDataUrl;
    previewElement.src = imageDataUrl;
    previewElement.hidden = false;
    syncRemoveImageButtons();
}

async function handleAllImagePreviews() {
    await Promise.all([
        updateImageSlot(imageFileInput, imagePreview, 0),
        updateImageSlot(imageFileInput2, imagePreview2, 1),
        updateImageSlot(imageFileInput3, imagePreview3, 2)
    ]);
}

async function persistPendingImages() {
    if (typeof isStorageConfigured !== "function" || !isStorageConfigured()) {
        return pendingImageDataUrls;
    }

    if (typeof uploadMediaFile !== "function") {
        return pendingImageDataUrls;
    }

    if (disableStorageUploadsForSession) {
        pendingImageFiles = pendingImageFiles.map(() => null);
        pendingImageDataUrls = pendingImageDataUrls.map(() => "");
        pendingImageUploadHadFailures = true;
        return pendingImageDataUrls;
    }

    const failures = [];
    pendingImageUploadHadFailures = false;

    await Promise.all(
        pendingImageFiles.map(async (file, index) => {
            if (!file) {
                return;
            }

            try {
                // If Storage is not enabled (Spark plan) or blocked by network, the SDK can retry for a while.
                // Keep the UI responsive by timing out quickly and publishing without uploaded images.
                const result = await withTimeout(uploadMediaFile(file, { folder: "images" }), 15000, "Image upload timed out.");
                pendingImageDataUrls[index] = result?.url || "";
            } catch (error) {
                // Avoid saving large data URLs into Firestore when Storage upload fails.
                const code = String(error?.code || "");
                const message = String(error?.message || "").toLowerCase();
                if (code.includes("storage/") || message.includes("storage") || message.includes("timed out")) {
                    // If Storage isn't enabled or repeatedly failing, don't keep retrying on every save.
                    disableStorageUploadsForSession = true;
                }
                failures.push(index);
                pendingImageDataUrls[index] = "";
            } finally {
                pendingImageFiles[index] = null;
            }
        })
    );

    if (failures.length && editorStatus) {
        pendingImageUploadHadFailures = true;
        setStatus(editorStatus, "Some images failed to upload. The post will use the default placeholder image.", "error");
    }

    return pendingImageDataUrls;
}

async function hydrateVideoPreviews() {
    const slots = [
        { preview: videoPreview, slotIndex: 0 },
        { preview: videoPreview2, slotIndex: 1 },
        { preview: videoPreview3, slotIndex: 2 }
    ];

    if (typeof getMediaBlob !== "function") {
        return;
    }

    await Promise.all(
        slots.map(async ({ preview, slotIndex }) => {
            if (!preview) {
                return;
            }

            const mediaId = pendingVideoIds[slotIndex];

            if (!mediaId) {
                preview.hidden = true;
                preview.removeAttribute("src");
                return;
            }

            try {
                const blob = await getMediaBlob(mediaId);

                if (!blob) {
                    preview.hidden = true;
                    preview.removeAttribute("src");
                    return;
                }

                if (pendingVideoPreviewUrls[slotIndex]) {
                    URL.revokeObjectURL(pendingVideoPreviewUrls[slotIndex]);
                }

                const url = URL.createObjectURL(blob);
                pendingVideoPreviewUrls[slotIndex] = url;
                preview.src = url;
                preview.hidden = false;
            } catch (error) {
                preview.hidden = true;
                preview.removeAttribute("src");
            }
        })
    );
}

function updateVideoPreviewFromFile(file, previewElement, slotIndex) {
    if (!file || !previewElement) {
        return;
    }

    if (pendingVideoPreviewUrls[slotIndex]) {
        URL.revokeObjectURL(pendingVideoPreviewUrls[slotIndex]);
    }

    const url = URL.createObjectURL(file);
    pendingVideoPreviewUrls[slotIndex] = url;
    previewElement.src = url;
    previewElement.hidden = false;
}

async function persistPendingVideos() {
    if (typeof saveMediaFile !== "function") {
        return pendingVideoIds.filter(Boolean).slice(0, 3);
    }

    for (let i = 0; i < 3; i += 1) {
        const file = pendingVideoFiles[i];

        if (!file) {
            continue;
        }

        const mediaId = await saveMediaFile(file);
        pendingVideoIds[i] = mediaId;
        pendingVideoFiles[i] = null;
    }

    return pendingVideoIds.filter(Boolean).slice(0, 3);
}

function getPostPayload() {
    const formData = new FormData(postForm);
    const wantsDisclaimer = Boolean(formData.get("sensitive"));
    const disclaimerText = wantsDisclaimer
        ? (formData.get("disclaimer")?.toString().trim() || DEFAULT_DISCLAIMER_TEXT)
        : "";
    return {
        title: formData.get("title")?.toString().trim(),
        summary: formData.get("summary")?.toString().trim(),
        content: formData.get("content")?.toString().trim(),
        category: formData.get("category")?.toString().trim(),
        region: formData.get("region")?.toString().trim(),
        location: formData.get("location")?.toString().trim(),
        status: formData.get("status")?.toString().trim(),
        imageAlt: formData.get("imageAlt")?.toString().trim(),
        imageSrc: pendingImageDataUrls.find(Boolean) || "./images/Read More Icon.png",
        galleryImages: pendingImageDataUrls.filter(Boolean).slice(0, 3),
        videoIds: pendingVideoIds.filter(Boolean).slice(0, 3),
        featured: Boolean(formData.get("featured")),
        trending: Boolean(formData.get("trending")),
        disclaimer: disclaimerText
    };
}

function validatePayload(payload) {
    return payload.title && payload.summary && payload.content && payload.location && payload.imageAlt;
}

function refreshDashboard() {
    renderAnalytics();
    renderHeroAssignment();
    renderPostsList();
}

function getIsFirebaseLoginActive() {
    return typeof isFirebaseConfigured === "function" && isFirebaseConfigured();
}

function syncLoginModeUi() {
    const firebaseMode = getIsFirebaseLoginActive();

    if (firebaseLoginForm) {
        firebaseLoginForm.hidden = !firebaseMode;
    }

    if (loginForm) {
        loginForm.hidden = firebaseMode;
    }

    localOnlySections.forEach((section) => {
        section.hidden = firebaseMode;
    });
}

syncLoginModeUi();

if (typeof init === "function") {
    init();
}

if (adminSearchForm && adminSearchInput) {
    adminSearchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        applyAdminSearch(adminSearchInput.value);
    });

    adminSearchInput.addEventListener("input", () => {
        applyAdminSearch(adminSearchInput.value);
    });
}

if (adminSearchClearButton && adminSearchInput) {
    adminSearchClearButton.addEventListener("click", () => {
        adminSearchInput.value = "";
        applyAdminSearch("");
        adminSearchInput.focus();
    });
}

if (firebaseLoginForm) {
    firebaseLoginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (typeof signInAdmin !== "function") {
            setStatus(loginStatus, "Firebase login is unavailable in this build.", "error");
            return;
        }

        const formData = new FormData(firebaseLoginForm);
        const email = formData.get("adminEmail")?.toString().trim();
        const password = formData.get("adminPassword")?.toString();

        if (!email || !password) {
            setStatus(loginStatus, "Enter your email and password to continue.", "error");
            return;
        }

        setStatus(loginStatus, "Signing in…");

        try {
            await signInAdmin(email, password);
            if (typeof bootstrapRemoteFromLocalIfEmpty === "function") {
                try {
                    await bootstrapRemoteFromLocalIfEmpty();
                } catch (error) {
                    // Ignore bootstrap errors; admin can still work normally.
                }
            }
            setConsoleVisibility(true);
            refreshDashboard();
            setStatus(loginStatus, "Signed in successfully.", "success");
        } catch (error) {
            setConsoleVisibility(false);
            setStatus(loginStatus, "Sign-in failed. Check your credentials and try again.", "error");
        }
    });
}

if (resetPasswordButton) {
    resetPasswordButton.addEventListener("click", async () => {
        if (typeof sendAdminPasswordReset !== "function") {
            setStatus(loginStatus, "Password reset is unavailable in this build.", "error");
            return;
        }

        const emailInput = document.getElementById("adminEmail");
        const email = emailInput?.value?.toString().trim();

        if (!email) {
            setStatus(loginStatus, "Enter your email first, then click “Forgot password”.", "error");
            return;
        }

        setStatus(loginStatus, "Sending reset email…");

        try {
            await sendAdminPasswordReset(email);
            setStatus(loginStatus, "Password reset email sent.", "success");
        } catch (error) {
            setStatus(loginStatus, "Unable to send reset email. Check the email and try again.", "error");
        }
    });
}

if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(loginForm);
        const passcode = formData.get("adminPasscode")?.toString();

        if (typeof verifyAdminPasscode !== "function" || !verifyAdminPasscode(passcode)) {
            setStatus(loginStatusLocal, "Access denied. Check your passcode and try again.", "error");
            return;
        }

        openAdminSession();
        setConsoleVisibility(true);
        refreshDashboard();
    });
}

if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        closeAdminSession();

        if (getIsFirebaseLoginActive() && typeof signOutAdmin === "function") {
            try {
                await signOutAdmin();
            } catch (error) {
                // Ignore.
            }
        }

        setConsoleVisibility(false);
        setStatus(loginStatus, "", "");
        setStatus(loginStatusLocal, "", "");
    });
}

if (imageFileInput) {
    imageFileInput.addEventListener("change", async () => {
        try {
            await updateImageSlot(imageFileInput, imagePreview, 0);
        } catch (error) {
            setStatus(editorStatus, "Image upload failed. Try another file.", "error");
        }
    });
}

[imageUrlInput, imageUrlInput2, imageUrlInput3].forEach((input, index) => {
    if (!input) {
        return;
    }

    const previews = [imagePreview, imagePreview2, imagePreview3];
    const fileInputs = [imageFileInput, imageFileInput2, imageFileInput3];

    input.addEventListener("input", () => {
        const url = normalizeImageUrl(input.value);

        if (!url) {
            return;
        }

        pendingImageFiles[index] = null;
        pendingImageDataUrls[index] = url;

        const fileInput = fileInputs[index];
        if (fileInput) {
            fileInput.value = "";
        }

        const preview = previews[index];
        if (preview) {
            preview.src = url;
            preview.hidden = false;
        }

        syncRemoveImageButtons();
    });
});

[removeImage1Button, removeImage2Button, removeImage3Button].forEach((button, index) => {
    if (!button) {
        return;
    }

    button.addEventListener("click", () => {
        removeImageSlot(index);
    });
});

[imageFileInput2, imageFileInput3].forEach((input, index) => {
    if (!input) {
        return;
    }

    const preview = index === 0 ? imagePreview2 : imagePreview3;
    const slotIndex = index === 0 ? 1 : 2;

    input.addEventListener("change", async () => {
        try {
            await updateImageSlot(input, preview, slotIndex);
        } catch (error) {
            setStatus(editorStatus, "Image upload failed. Try another file.", "error");
        }
    });
});

if (postForm) {
    postForm.addEventListener(
        "invalid",
        (event) => {
            const field = event.target;

            if (editorStatus) {
                setStatus(editorStatus, "Complete all required fields before saving.", "error");
            }

            if (field && typeof field.scrollIntoView === "function") {
                field.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        },
        true
    );

    if (savePostButton) {
        savePostButton.addEventListener("click", () => {
            if (typeof postForm.reportValidity === "function") {
                postForm.reportValidity();
            }
        });
    }

    postForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        pendingImageUploadHadFailures = false;
        if (savePostButton) {
            savePostButton.disabled = true;
        }
        if (editorStatus) {
            setStatus(editorStatus, "Saving…");
        }

        try {
            applyImageUrlsToSlots();

            try {
                await handleAllImagePreviews();
            } catch (error) {
                setStatus(editorStatus, "Image upload failed. Try another file.", "error");
                return;
            }

            try {
                if (editorStatus) {
                    setStatus(editorStatus, "Uploading images…");
                }
                await persistPendingImages();
            } catch (error) {
                // persistPendingImages is best-effort; continue saving even if Storage fails.
                if (editorStatus) {
                    const message = String(error?.message || "").trim();
                    setStatus(
                        editorStatus,
                        message ? `Image upload warning: ${message}` : "Image upload warning. Continuing without uploaded images.",
                        "error"
                    );
                }
            }

            try {
                if (editorStatus) {
                    setStatus(editorStatus, "Saving videos…");
                }
                pendingVideoIds = await withTimeout(persistPendingVideos(), 30000, "Video save timed out.");
            } catch (error) {
                setStatus(editorStatus, "Video upload failed. Try a smaller file or another format.", "error");
                return;
            }

            const payload = getPostPayload();

            if (!validatePayload(payload)) {
                setStatus(editorStatus, "Complete all required fields before saving.", "error");
                return;
            }

            const postId = postIdInput.value;

            try {
                if (postId) {
                    if (editorStatus) {
                        setStatus(editorStatus, "Updating post…");
                    }
                    await withTimeout(updatePost(postId, payload), 20000, "Update timed out.");
                    setStatus(
                        editorStatus,
                        pendingImageUploadHadFailures ? "Post updated (some images were skipped)." : "Post updated successfully.",
                        "success"
                    );
                } else {
                    if (editorStatus) {
                        setStatus(editorStatus, "Publishing post…");
                    }
                    await withTimeout(createPost(payload), 20000, "Publish timed out.");
                    setStatus(
                        editorStatus,
                        pendingImageUploadHadFailures ? "Post published (some images were skipped)." : "Post published successfully.",
                        "success"
                    );
                }
            } catch (error) {
                const message = String(error?.message || "").trim();
                const code = String(error?.code || "").trim();
                setStatus(
                    editorStatus,
                    code || message
                        ? `Save failed: ${[code, message].filter(Boolean).join(" - ")}`
                        : "Save failed. Check your connection and permissions, then try again.",
                    "error"
                );
                return;
            }

            refreshDashboard();
            resetEditor();
        } finally {
            if (savePostButton) {
                savePostButton.disabled = false;
            }
        }
    });
}

if (videoFileInput) {
    videoFileInput.addEventListener("change", () => {
        const file = videoFileInput.files?.[0];
        pendingVideoFiles[0] = file || null;
        if (file) {
            updateVideoPreviewFromFile(file, videoPreview, 0);
        }
    });
}

[videoFileInput2, videoFileInput3].forEach((input, index) => {
    if (!input) {
        return;
    }

    const preview = index === 0 ? videoPreview2 : videoPreview3;
    const slotIndex = index === 0 ? 1 : 2;

    input.addEventListener("change", () => {
        const file = input.files?.[0];
        pendingVideoFiles[slotIndex] = file || null;
        if (file) {
            updateVideoPreviewFromFile(file, preview, slotIndex);
        }
    });
});

if (postsList) {
    postsList.addEventListener("click", (event) => {
        const actionButton = event.target.closest(".post-action");
        const postCard = event.target.closest(".post-card");

        if (!actionButton || !postCard) {
            return;
        }

        const postId = Number(postCard.dataset.postId);
        const action = actionButton.dataset.action;

        if (action === "edit") {
            const post = getPostById(postId);

            if (post) {
                populateEditor(post);
            }

            return;
        }

        if (action === "feature") {
            const post = getPostById(postId);

            if (!post) {
                return;
            }

            if (post.status !== "published") {
                setStatus(editorStatus, "Publish the post before sending it to the homepage hero.", "error");
                return;
            }

            setFeaturedPost(postId)
                .then(() => {
                    refreshDashboard();
                    setStatus(editorStatus, "Homepage hero updated.", "success");
                })
                .catch(() => {
                    setStatus(editorStatus, "Unable to update homepage hero. Check permissions and try again.", "error");
                });
            return;
        }

        if (action === "toggle-status") {
            togglePostStatus(postId)
                .then(() => {
                    refreshDashboard();
                    setStatus(editorStatus, "Post status updated.", "success");
                })
                .catch(() => {
                    setStatus(editorStatus, "Unable to update post status. Check permissions and try again.", "error");
                });
            return;
        }

        if (action === "delete") {
            const confirmed = window.confirm("Delete this post permanently?");

            if (!confirmed) {
                return;
            }

            deletePost(postId)
                .then(() => {
                    refreshDashboard();
                    setStatus(editorStatus, "Post deleted.", "success");
                })
                .catch(() => {
                    setStatus(editorStatus, "Unable to delete post. Check permissions and try again.", "error");
                });
        }
    });
}

if (resetEditorButton) {
    resetEditorButton.addEventListener("click", resetEditor);
}

if (settingsForm) {
    settingsForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(settingsForm);
        const newPasscode = formData.get("newPasscode")?.toString().trim();

        if (!newPasscode || newPasscode.length < 8) {
            setStatus(settingsStatus, "Use at least 8 characters for the new passcode.", "error");
            return;
        }

        setAdminPasscode(newPasscode);
        settingsForm.reset();
        setStatus(settingsStatus, "Passcode updated successfully.", "success");
    });
}

if (liveTickerForm) {
    const existing = typeof getLiveTickerItems === "function" ? getLiveTickerItems() : [];

    if (liveTicker1Input) {
        liveTicker1Input.value = existing[0] || "";
    }

    if (liveTicker2Input) {
        liveTicker2Input.value = existing[1] || "";
    }

    if (liveTicker3Input) {
        liveTicker3Input.value = existing[2] || "";
    }

    liveTickerForm.addEventListener("submit", (event) => {
        event.preventDefault();

        if (typeof setLiveTickerItems !== "function") {
            if (liveTickerStatus) {
                setStatus(liveTickerStatus, "Live Ticker settings are unavailable in this build.", "error");
            }
            return;
        }

        const items = [
            liveTicker1Input?.value || "",
            liveTicker2Input?.value || "",
            liveTicker3Input?.value || ""
        ]
            .map((value) => String(value || "").trim())
            .filter(Boolean);

        if (items.length < 3) {
            if (liveTickerStatus) {
                setStatus(liveTickerStatus, "Add all 3 Live items before saving.", "error");
            }
            return;
        }

        setLiveTickerItems(items.slice(0, 3));

        if (liveTickerStatus) {
            setStatus(liveTickerStatus, "Live Ticker updated.", "success");
        }
    });

    if (clearLiveTickerButton) {
        clearLiveTickerButton.addEventListener("click", () => {
            if (typeof clearLiveTickerItems !== "function") {
                if (liveTickerStatus) {
                    setStatus(liveTickerStatus, "Live Ticker settings are unavailable in this build.", "error");
                }
                return;
            }

            clearLiveTickerItems();

            if (liveTicker1Input) liveTicker1Input.value = "";
            if (liveTicker2Input) liveTicker2Input.value = "";
            if (liveTicker3Input) liveTicker3Input.value = "";

            if (liveTickerStatus) {
                setStatus(liveTickerStatus, "Live Ticker cleared (homepage uses default text).", "success");
            }
        });
    }
}

if (archiveTickerForm) {
    const existing = typeof getArchiveTickerItems === "function" ? getArchiveTickerItems() : [];

    if (archiveTicker1Input) {
        archiveTicker1Input.value = existing[0] || "";
    }

    if (archiveTicker2Input) {
        archiveTicker2Input.value = existing[1] || "";
    }

    if (archiveTicker3Input) {
        archiveTicker3Input.value = existing[2] || "";
    }

    archiveTickerForm.addEventListener("submit", (event) => {
        event.preventDefault();

        if (typeof setArchiveTickerItems !== "function") {
            if (archiveTickerStatus) {
                setStatus(archiveTickerStatus, "Archive Ticker settings are unavailable in this build.", "error");
            }
            return;
        }

        const items = [
            archiveTicker1Input?.value || "",
            archiveTicker2Input?.value || "",
            archiveTicker3Input?.value || ""
        ]
            .map((value) => String(value || "").trim())
            .filter(Boolean);

        if (!items.length) {
            if (archiveTickerStatus) {
                setStatus(archiveTickerStatus, "Add at least 1 Browse item before saving.", "error");
            }
            return;
        }

        setArchiveTickerItems(items.slice(0, 3));

        if (archiveTickerStatus) {
            setStatus(archiveTickerStatus, "Archive Ticker updated.", "success");
        }
    });

    if (clearArchiveTickerButton) {
        clearArchiveTickerButton.addEventListener("click", () => {
            if (typeof clearArchiveTickerItems !== "function") {
                if (archiveTickerStatus) {
                    setStatus(archiveTickerStatus, "Archive Ticker settings are unavailable in this build.", "error");
                }
                return;
            }

            clearArchiveTickerItems();

            if (archiveTicker1Input) archiveTicker1Input.value = "";
            if (archiveTicker2Input) archiveTicker2Input.value = "";
            if (archiveTicker3Input) archiveTicker3Input.value = "";

            if (archiveTickerStatus) {
                setStatus(archiveTickerStatus, "Archive Ticker cleared (archive page uses default text).", "success");
            }
        });
    }
}

syncRemoveImageButtons();
syncDisclaimerControls();

if (postSensitiveToggle) {
    postSensitiveToggle.addEventListener("change", () => {
        syncDisclaimerControls();
    });
}

if (getIsFirebaseLoginActive()) {
    if (typeof onAdminAuthStateChanged === "function") {
        onAdminAuthStateChanged((user) => {
            syncLoginModeUi();
            if (user) {
                setConsoleVisibility(true);
                refreshDashboard();
            } else {
                setConsoleVisibility(false);
            }
        });
    } else if (typeof isAdminSignedIn === "function" && isAdminSignedIn()) {
        setConsoleVisibility(true);
        refreshDashboard();
    } else {
        setConsoleVisibility(false);
    }
} else if (typeof hasAdminSession === "function" && hasAdminSession()) {
    setConsoleVisibility(true);
    refreshDashboard();
} else {
    setConsoleVisibility(false);
}

if (typeof onStoreUpdated === "function") {
    onStoreUpdated(() => {
        if (!adminShell.hidden) {
            refreshDashboard();
        }
    });
}

window.addEventListener("storage", (event) => {
    if (event.key === "daily-affairs.posts.v2" && !adminShell.hidden) {
        refreshDashboard();
    }
});
