const {
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
    formatDisplayDate
} = window.NewsroomStore || {};

const loginGate = document.getElementById("loginGate");
const loginForm = document.getElementById("loginForm");
const loginStatus = document.getElementById("loginStatus");
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
const imageFileInput = document.getElementById("postImageFile");
const imageFileInput2 = document.getElementById("postImageFile2");
const imageFileInput3 = document.getElementById("postImageFile3");
const imagePreview = document.getElementById("imagePreview");
const imagePreview2 = document.getElementById("imagePreview2");
const imagePreview3 = document.getElementById("imagePreview3");

let pendingImageDataUrls = [];

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
    [imagePreview, imagePreview2, imagePreview3].forEach((preview) => {
        preview.hidden = true;
        preview.removeAttribute("src");
    });
    editorTitle.textContent = "Create a post";
    setStatus(editorStatus, "", "");
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
    pendingImageDataUrls = Array.isArray(post.galleryImages) && post.galleryImages.length ? [...post.galleryImages] : [post.imageSrc];
    [imagePreview, imagePreview2, imagePreview3].forEach((preview, index) => {
        const imageSrc = pendingImageDataUrls[index];
        preview.hidden = !imageSrc;
        if (imageSrc) {
            preview.src = imageSrc;
        } else {
            preview.removeAttribute("src");
        }
    });
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
        return;
    }

    const imageDataUrl = await readImageAsDataUrl(file);
    pendingImageDataUrls[slotIndex] = imageDataUrl;
    previewElement.src = imageDataUrl;
    previewElement.hidden = false;
}

async function handleAllImagePreviews() {
    await Promise.all([
        updateImageSlot(imageFileInput, imagePreview, 0),
        updateImageSlot(imageFileInput2, imagePreview2, 1),
        updateImageSlot(imageFileInput3, imagePreview3, 2)
    ]);
}

function getPostPayload() {
    const formData = new FormData(postForm);
    return {
        title: formData.get("title")?.toString().trim(),
        summary: formData.get("summary")?.toString().trim(),
        content: formData.get("content")?.toString().trim(),
        category: formData.get("category")?.toString().trim(),
        region: formData.get("region")?.toString().trim(),
        location: formData.get("location")?.toString().trim(),
        status: formData.get("status")?.toString().trim(),
        imageAlt: formData.get("imageAlt")?.toString().trim(),
        imageSrc: pendingImageDataUrls.find(Boolean) || "./images/news-world.jpg",
        galleryImages: pendingImageDataUrls.filter(Boolean).slice(0, 3),
        featured: Boolean(formData.get("featured")),
        trending: Boolean(formData.get("trending"))
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

if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(loginForm);
        const passcode = formData.get("adminPasscode")?.toString();

        if (typeof verifyAdminPasscode !== "function" || !verifyAdminPasscode(passcode)) {
            setStatus(loginStatus, "Access denied. Check your passcode and try again.", "error");
            return;
        }

        openAdminSession();
        setConsoleVisibility(true);
        refreshDashboard();
    });
}

if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        closeAdminSession();
        setConsoleVisibility(false);
        setStatus(loginStatus, "", "");
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

        const payload = getPostPayload();

        if (!validatePayload(payload)) {
            setStatus(editorStatus, "Complete all required fields before saving.", "error");
            return;
        }

        const postId = postIdInput.value;

        if (postId) {
            updatePost(postId, payload);
            setStatus(editorStatus, "Post updated successfully.", "success");
        } else {
            createPost(payload);
            setStatus(editorStatus, "Post published successfully.", "success");
        }

        refreshDashboard();
        resetEditor();
    });
}

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

            setFeaturedPost(postId);
            refreshDashboard();
            setStatus(editorStatus, "Homepage hero updated.", "success");
            return;
        }

        if (action === "toggle-status") {
            togglePostStatus(postId);
            refreshDashboard();
            setStatus(editorStatus, "Post status updated.", "success");
            return;
        }

        if (action === "delete") {
            const confirmed = window.confirm("Delete this post permanently?");

            if (!confirmed) {
                return;
            }

            deletePost(postId);
            refreshDashboard();
            setStatus(editorStatus, "Post deleted.", "success");
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

if (typeof hasAdminSession === "function" && hasAdminSession()) {
    setConsoleVisibility(true);
    refreshDashboard();
} else {
    setConsoleVisibility(false);
}

window.addEventListener("storage", (event) => {
    if (event.key === "daily-affairs.posts.v1" && !adminShell.hidden) {
        refreshDashboard();
    }
});
