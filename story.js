const { getPostBySlug, getPublishedPosts, trackVisit, formatDisplayDate, getMediaBlob } = window.NewsroomStore || {};

const storyPanel = document.getElementById("storyPanel");
const relatedStories = document.getElementById("relatedStories");
const query = new URLSearchParams(window.location.search);
const storySlug = query.get("slug");
const interactionStorageKey = "daily-affairs.interactions.v1";
const instagramShareMessage = "Instagram does not support direct web link sharing. The story link has been copied so you can paste it into a post, bio, story, or DM.";

let currentPost = null;
let shareModal = null;
let activeVideoObjectUrls = [];

function clearActiveVideoUrls() {
    activeVideoObjectUrls.forEach((url) => {
        if (url) {
            URL.revokeObjectURL(url);
        }
    });
    activeVideoObjectUrls = [];
}

async function hydrateStoryVideos(post) {
    const container = document.getElementById("storyVideoGrid");

    if (!container) {
        return;
    }

    const videoIds = Array.isArray(post.videoIds) ? post.videoIds.filter(Boolean).slice(0, 3) : [];

    if (!videoIds.length || typeof getMediaBlob !== "function") {
        container.hidden = true;
        container.innerHTML = "";
        return;
    }

    try {
        const blobs = await Promise.all(videoIds.map((id) => getMediaBlob(id)));
        const urls = blobs
            .filter(Boolean)
            .map((blob) => {
                const url = URL.createObjectURL(blob);
                activeVideoObjectUrls.push(url);
                return url;
            });

        if (!urls.length) {
            container.hidden = true;
            container.innerHTML = "";
            return;
        }

        container.innerHTML = urls
            .map(
                (url) => `
                <video class="story-video" controls playsinline preload="metadata" src="${escapeHtml(url)}"></video>
            `
            )
            .join("");
        container.hidden = false;
    } catch (error) {
        container.hidden = true;
        container.innerHTML = "";
    }
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

function getInteractionsStore() {
    try {
        const stored = JSON.parse(localStorage.getItem(interactionStorageKey) || "{}");
        return stored && typeof stored === "object" ? stored : {};
    } catch (error) {
        return {};
    }
}

function saveInteractionsStore(store) {
    localStorage.setItem(interactionStorageKey, JSON.stringify(store));
}

function ensureInteractionState(postId) {
    const store = getInteractionsStore();

    if (!store[postId]) {
        store[postId] = {
            likes: 0,
            shares: 0,
            liked: false,
            comments: []
        };
        saveInteractionsStore(store);
    }

    return store[postId];
}

function updateInteractionState(postId, updater) {
    const store = getInteractionsStore();
    const existing = store[postId] || {
        likes: 0,
        shares: 0,
        liked: false,
        comments: []
    };

    store[postId] = updater(existing);
    saveInteractionsStore(store);
}

function getShareDetails(post) {
    const shareUrl = new URL(`story.html?slug=${encodeURIComponent(post.slug)}`, window.location.href).href;
    const shareText = `${post.title} - ${post.summary}`;

    return { shareUrl, shareText };
}

function getCategoryFilterUrl(category) {
    return `index.html?filter=category&value=${encodeURIComponent(category)}#mainFeed`;
}

function getRegionFilterUrl(region) {
    return `index.html?filter=region&value=${encodeURIComponent(region)}#mainFeed`;
}

async function copyTextToClipboard(value) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
    }

    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();

    try {
        return document.execCommand("copy");
    } finally {
        textarea.remove();
    }
}

function incrementShareCount(postId) {
    updateInteractionState(postId, (state) => ({
        ...state,
        shares: state.shares + 1
    }));

    renderStory(currentPost);
}

function openShareWindow(url) {
    window.open(url, "_blank", "noopener,noreferrer,width=680,height=720");
}

function updateShareStatus(message, isSuccess = true) {
    if (!shareModal) {
        return;
    }

    shareModal.status.textContent = message;
    shareModal.status.classList.toggle("is-error", !isSuccess);
}

function closeShareModal() {
    if (!shareModal) {
        return;
    }

    shareModal.overlay.hidden = true;
    shareModal.dialog.hidden = true;
    document.body.classList.remove("share-modal-open");
}

function createShareModal() {
    const overlay = document.createElement("div");
    overlay.className = "share-modal-overlay";
    overlay.hidden = true;

    const dialog = document.createElement("div");
    dialog.className = "share-modal";
    dialog.hidden = true;
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "shareModalTitle");

    dialog.innerHTML = `
        <button type="button" class="share-modal-close" aria-label="Close share options">
            <span></span>
            <span></span>
        </button>
        <div class="share-modal-kicker">Share Story</div>
        <h2 id="shareModalTitle">Send this update anywhere</h2>
        <p class="share-modal-copy">Copy the story link or share it directly with your audience.</p>
        <div class="share-modal-preview">
            <span class="share-modal-tag" id="shareModalCategory">News Desk</span>
            <h3 id="shareModalHeading">Story title</h3>
            <p id="shareModalSummary">Story summary</p>
        </div>
        <label class="share-modal-field" for="shareModalUrl">Story Link</label>
        <div class="share-link-row">
            <input id="shareModalUrl" class="share-link-input" type="text" readonly>
            <button type="button" class="share-copy-button" data-share-action="copy">Copy Link</button>
        </div>
        <div class="share-network-grid">
            <button type="button" class="share-network whatsapp" data-share-action="whatsapp">WhatsApp</button>
            <button type="button" class="share-network facebook" data-share-action="facebook">Facebook</button>
            <button type="button" class="share-network x" data-share-action="x">X</button>
            <button type="button" class="share-network instagram" data-share-action="instagram">Instagram</button>
            <button type="button" class="share-network native" data-share-action="native">More Apps</button>
        </div>
        <p class="share-modal-status" id="shareModalStatus">Choose an option to share this story.</p>
    `;

    document.body.append(overlay, dialog);

    shareModal = {
        overlay,
        dialog,
        title: dialog.querySelector("#shareModalHeading"),
        summary: dialog.querySelector("#shareModalSummary"),
        category: dialog.querySelector("#shareModalCategory"),
        urlInput: dialog.querySelector("#shareModalUrl"),
        status: dialog.querySelector("#shareModalStatus"),
        closeButton: dialog.querySelector(".share-modal-close")
    };

    overlay.addEventListener("click", closeShareModal);
    shareModal.closeButton.addEventListener("click", closeShareModal);
    dialog.addEventListener("click", handleShareModalClick);
}

function openShareModal(post) {
    if (!shareModal) {
        createShareModal();
    }

    const { shareUrl } = getShareDetails(post);

    shareModal.title.textContent = post.title;
    shareModal.summary.textContent = post.summary;
    shareModal.category.textContent = post.category || "News Desk";
    shareModal.urlInput.value = shareUrl;
    updateShareStatus("Choose an option to share this story.");

    shareModal.overlay.hidden = false;
    shareModal.dialog.hidden = false;
    document.body.classList.add("share-modal-open");
}

async function sharePostToNetwork(action) {
    if (!currentPost) {
        return;
    }

    const { shareUrl, shareText } = getShareDetails(currentPost);

    if (action === "copy") {
        try {
            await copyTextToClipboard(shareUrl);
            incrementShareCount(currentPost.id);
            updateShareStatus("Story link copied. You can paste it anywhere.");
        } catch (error) {
            updateShareStatus("Copy failed on this device. Try selecting the link manually.", false);
        }
        return;
    }

    if (action === "native") {
        if (!navigator.share) {
            updateShareStatus("Your browser does not support direct app sharing here. Try Copy Link instead.", false);
            return;
        }

        try {
            await navigator.share({
                title: currentPost.title,
                text: currentPost.summary,
                url: shareUrl
            });
            incrementShareCount(currentPost.id);
            updateShareStatus("Share sheet opened.");
        } catch (error) {
            updateShareStatus("Share was cancelled or could not be opened.", false);
        }
        return;
    }

    if (action === "instagram") {
        try {
            await copyTextToClipboard(shareUrl);
            incrementShareCount(currentPost.id);
            updateShareStatus(instagramShareMessage);
            openShareWindow("https://www.instagram.com/");
        } catch (error) {
            updateShareStatus("Instagram link sharing could not copy automatically. Copy the link manually below.", false);
        }
        return;
    }

    const networkUrls = {
        whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    };

    if (!networkUrls[action]) {
        return;
    }

    incrementShareCount(currentPost.id);
    updateShareStatus(`Opening ${action === "x" ? "X" : action.charAt(0).toUpperCase() + action.slice(1)} share window...`);
    openShareWindow(networkUrls[action]);
}

function handleShareModalClick(event) {
    const actionButton = event.target.closest("[data-share-action]");

    if (!actionButton) {
        return;
    }

    sharePostToNetwork(actionButton.dataset.shareAction);
}

function createStoryEngagement(post) {
    const state = ensureInteractionState(post.id);
    const commentsMarkup = state.comments.length
        ? state.comments
              .map(
                  (comment) => `
                    <div class="story-comment-item">
                        <strong>${escapeHtml(comment.name)}</strong>
                        <p>${escapeHtml(comment.text)}</p>
                    </div>
                `
              )
              .join("")
        : `<p class="story-comments-empty">No comments yet. Be the first to join the conversation.</p>`;

    return `
        <section class="story-engagement" aria-label="Story engagement">
            <div class="story-engagement-actions">
                <button type="button" class="story-action-button comment-trigger">
                    Comment <span>${state.comments.length}</span>
                </button>
                <button type="button" class="story-action-button like-trigger ${state.liked ? "is-active" : ""}">
                    Like <span>${state.likes}</span>
                </button>
                <button type="button" class="story-action-button share-trigger">
                    Share <span>${state.shares}</span>
                </button>
            </div>
            <div class="story-comments-block" id="storyCommentsBlock">
                <div class="story-comments-list">${commentsMarkup}</div>
                <form class="story-comment-form" id="storyCommentForm">
                    <input type="text" name="name" placeholder="Your name" maxlength="40" required>
                    <textarea name="comment" placeholder="Write your comment" maxlength="240" required></textarea>
                    <button type="submit">Post Comment</button>
                </form>
            </div>
        </section>
    `;
}

function renderMissingStory() {
    document.title = "Story Not Found | The Daily Affairs";
    storyPanel.innerHTML = `
        <p class="story-empty">That story could not be found. It may have been archived, renamed, or removed.</p>
    `;
}

function bindStoryInteractions(post) {
    const commentButton = storyPanel.querySelector(".comment-trigger");
    const likeButton = storyPanel.querySelector(".like-trigger");
    const shareButton = storyPanel.querySelector(".share-trigger");
    const commentForm = storyPanel.querySelector("#storyCommentForm");
    const commentsBlock = storyPanel.querySelector("#storyCommentsBlock");

    if (commentButton && commentsBlock) {
        commentButton.addEventListener("click", () => {
            commentsBlock.scrollIntoView({ behavior: "smooth", block: "start" });
            const nameField = commentForm?.querySelector('input[name="name"]');
            if (nameField) {
                nameField.focus();
            }
        });
    }

    if (likeButton) {
        likeButton.addEventListener("click", () => {
            updateInteractionState(post.id, (state) => ({
                ...state,
                liked: !state.liked,
                likes: state.likes + (state.liked ? -1 : 1)
            }));

            renderStory(post);
        });
    }

    if (shareButton) {
        shareButton.addEventListener("click", () => {
            openShareModal(post);
        });
    }

    if (commentForm) {
        commentForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const formData = new FormData(commentForm);
            const name = formData.get("name")?.toString().trim();
            const comment = formData.get("comment")?.toString().trim();

            if (!name || !comment) {
                return;
            }

            updateInteractionState(post.id, (state) => ({
                ...state,
                comments: [{ name, text: comment }, ...state.comments]
            }));

            renderStory(post);
        });
    }
}

function renderStory(post) {
    currentPost = post;
    document.title = `${post.title} | The Daily Affairs`;
    clearActiveVideoUrls();
    const galleryImages = Array.isArray(post.galleryImages) && post.galleryImages.length ? post.galleryImages : [post.imageSrc];
    const galleryMarkup = galleryImages
        .map(
            (imageSrc, index) => `
                <img
                    class="${index === 0 ? "story-hero" : "story-gallery-image"}"
                    src="${escapeHtml(imageSrc)}"
                    alt="${escapeHtml(post.imageAlt)}"
                >
            `
        )
        .join("");

    const paragraphs = post.content
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
        .join("");

    storyPanel.innerHTML = `
        <div class="story-topline">
            <a class="story-chip story-chip-link" href="${getCategoryFilterUrl(post.category)}">${escapeHtml(post.category)}</a>
            <a class="story-chip story-chip-link" href="${getRegionFilterUrl(post.region)}">${escapeHtml(post.region)}</a>
        </div>
        <h1>${escapeHtml(post.title)}</h1>
        <div class="story-meta">
            <span>${escapeHtml(post.location)}</span>
            <span>${escapeHtml(formatDisplayDate(post.publishedAt))}</span>
        </div>
        <div class="story-video-grid" id="storyVideoGrid" hidden></div>
        <div class="story-gallery ${galleryImages.length > 1 ? "is-multi" : ""}">${galleryMarkup}</div>
        <div class="story-body">${paragraphs}</div>
        ${createStoryEngagement(post)}
    `;

    bindStoryInteractions(post);
    hydrateStoryVideos(post);
}

function renderRelated(currentStory) {
    if (!relatedStories || typeof getPublishedPosts !== "function") {
        return;
    }

    const relatedPosts = getPublishedPosts()
        .filter((post) => post.slug !== currentStory.slug)
        .slice(0, 3);

    relatedStories.innerHTML = relatedPosts
        .map(
            (post) => `
                <a class="related-card" href="story.html?slug=${encodeURIComponent(post.slug)}">
                    <img src="${escapeHtml(post.imageSrc)}" alt="${escapeHtml(post.imageAlt)}">
                    <h3>${escapeHtml(post.title)}</h3>
                    <p>${escapeHtml(post.summary)}</p>
                </a>
            `
        )
        .join("");
}

window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeShareModal();
    }
});

if (typeof trackVisit === "function") {
    trackVisit("story");
}

if (!storySlug || typeof getPostBySlug !== "function") {
    renderMissingStory();
} else {
    const post = getPostBySlug(storySlug);

    if (!post) {
        renderMissingStory();
    } else {
        renderStory(post);
        renderRelated(post);
    }
}
