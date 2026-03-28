const {
    init,
    onStoreUpdated,
    isFirebaseConfigured,
    isAdminSignedIn,
    signInAdmin,
    signOutAdmin,
    sendAdminPasswordReset,
    onAdminAuthStateChanged,
    bootstrapRemoteFromLocalIfEmpty,
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
const postIdInput = document.getElementById("postId");
const editorTitle = document.getElementById("editorTitle");
const editorStatus = document.getElementById("editorStatus");
const postsList = document.getElementById("postsList");
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
let pendingVideoIds = [];
let pendingVideoFiles = [];
let pendingVideoPreviewUrls = [];

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

function setConsoleVisibility(isVisible) {
    loginGate.hidden = isVisible;
    adminShell.hidden = !isVisible;
}

function resetEditor() {
    postForm.reset();
    postIdInput.value = "";
    pendingImageDataUrls = [];
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
    postsList.innerHTML = posts.map(createPostCard).join("");
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

async function updateImageSlot(fileInput, previewElement, slotIndex) {
    const file = fileInput.files?.[0];

    if (!file) {
        pendingImageDataUrls[slotIndex] = pendingImageDataUrls[slotIndex] || "";
        syncRemoveImageButtons();
        return;
    }

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
    postForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        try {
            await handleAllImagePreviews();
        } catch (error) {
            setStatus(editorStatus, "Image upload failed. Try another file.", "error");
            return;
        }

        try {
            pendingVideoIds = await persistPendingVideos();
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
                await updatePost(postId, payload);
                setStatus(editorStatus, "Post updated successfully.", "success");
            } else {
                await createPost(payload);
                setStatus(editorStatus, "Post published successfully.", "success");
            }
        } catch (error) {
            setStatus(editorStatus, "Save failed. Check your connection and permissions, then try again.", "error");
            return;
        }

        refreshDashboard();
        resetEditor();
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
    if (event.key === "daily-affairs.posts.v1" && !adminShell.hidden) {
        refreshDashboard();
    }
});
