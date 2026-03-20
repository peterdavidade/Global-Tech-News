const {
    getPublishedPosts,
    getArchivedPosts,
    getPostById,
    trackVisit,
    formatDisplayDate,
    getMinutesAgo
} = window.NewsroomStore || {};

const feedContainer = document.getElementById("mainFeed");
const globalFeed = document.getElementById("globalFeed");
const ghanaFeed = document.getElementById("ghanaFeed");
const trendingList = document.getElementById("trendingList");
const latestUpdatesList = document.getElementById("latestUpdatesList");
const searchInput = document.getElementById("searchInput");
const searchForm = document.getElementById("searchForm");
const currentDate = document.getElementById("currentDate");
const heroTimestamp = document.getElementById("heroTimestamp");
const heroPanel = document.querySelector(".hero-panel");
const heroChip = document.querySelector(".hero-topline .section-chip");
const heroLivePill = document.querySelector(".hero-topline .live-pill");
const heroTitle = document.querySelector(".hero-content h1");
const heroSummary = document.querySelector(".hero-content p");
const heroMetaItems = Array.from(document.querySelectorAll(".hero-meta span"));
const heroPrimaryLink = document.querySelector(".hero-actions .primary-button");
const heroSecondaryLink = document.querySelector(".hero-actions .ghost-link");
const hamburgerButton = document.getElementById("hamburgerButton");
const sidebarNav = document.getElementById("sidebarNav");
const sidebarCloseButton = document.getElementById("sidebarCloseButton");
const navOverlay = document.getElementById("navOverlay");
const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));
const hashNavLinks = navLinks.filter((link) => link.getAttribute("href")?.startsWith("#"));
const observedSections = hashNavLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
const archiveGrid = document.querySelector(".archive-grid");

const interactionStorageKey = "daily-affairs.interactions.v1";

let allPublishedPosts = typeof getPublishedPosts === "function" ? getPublishedPosts() : [];
let visiblePosts = [...allPublishedPosts];

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
            commentsOpen: false,
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
        commentsOpen: false,
        comments: []
    };

    store[postId] = updater(existing);
    saveInteractionsStore(store);
}

function formatRelativeTime(isoString) {
    const minutesAgo = getMinutesAgo(isoString);

    if (minutesAgo < 60) {
        return `${minutesAgo} minutes ago`;
    }

    const hours = Math.floor(minutesAgo / 60);
    const remainder = minutesAgo % 60;

    if (hours < 24) {
        return remainder ? `${hours}h ${remainder}m ago` : `${hours} hours ago`;
    }

    const days = Math.floor(hours / 24);
    return days === 1 ? "1 day ago" : `${days} days ago`;
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

function getStoryUrl(post) {
    return `story.html?slug=${encodeURIComponent(post.slug)}`;
}

function createEngagementSection(post) {
    const state = ensureInteractionState(post.id);
    const commentsMarkup = state.comments.length
        ? state.comments
              .map(
                  (comment) => `
                    <div class="comment-item">
                        <strong>${escapeHtml(comment.name)}</strong>
                        <p>${escapeHtml(comment.text)}</p>
                    </div>
                `
              )
              .join("")
        : "<p>No comments yet. Start the conversation.</p>";

    return `
        <div class="article-engagement">
            <div class="engagement-actions">
                <button type="button" class="engagement-button comment-toggle" data-post-id="${post.id}">
                    Comment <span>${state.comments.length}</span>
                </button>
                <button
                    type="button"
                    class="engagement-button like-button ${state.liked ? "is-active" : ""}"
                    data-post-id="${post.id}"
                >
                    Like <span>${state.likes}</span>
                </button>
                <button type="button" class="engagement-button share-button" data-post-id="${post.id}">
                    Share <span>${state.shares}</span>
                </button>
            </div>
            ${
                state.commentsOpen
                    ? `
                <div class="comment-panel">
                    <div class="comment-list">${commentsMarkup}</div>
                    <form class="comment-form" data-post-id="${post.id}">
                        <input type="text" name="name" placeholder="Your name" maxlength="40" required>
                        <textarea name="comment" placeholder="Write your comment" maxlength="240" required></textarea>
                        <button type="submit">Post Comment</button>
                    </form>
                </div>
            `
                    : ""
            }
        </div>
    `;
}

function createArticleCard(post) {
    return `
        <article class="article-card" data-post-id="${post.id}">
            <div class="article-thumb">
                <img src="${escapeHtml(post.imageSrc)}" alt="${escapeHtml(post.imageAlt)}">
            </div>
            <div class="article-body">
                <div class="article-topline">
                    <span class="article-tag">${escapeHtml(post.category)}</span>
                    <span class="article-location">${escapeHtml(post.location)}</span>
                    <span class="article-time">${formatRelativeTime(post.publishedAt)}</span>
                </div>
                <h3 class="article-title">${escapeHtml(post.title)}</h3>
                <p class="article-summary">${escapeHtml(post.summary)}</p>
                <div class="article-footer">
                    <span class="article-time">${escapeHtml(formatDisplayDate(post.publishedAt))}</span>
                    <a href="${getStoryUrl(post)}" class="read-more">Read More</a>
                </div>
                ${createEngagementSection(post)}
            </div>
        </article>
    `;
}

function createUpdateCard(post) {
    return `
        <article class="update-card" data-post-id="${post.id}">
            <div class="update-visual">
                <img src="${escapeHtml(post.imageSrc)}" alt="${escapeHtml(post.imageAlt)}">
            </div>
            <div class="article-topline">
                <span class="article-tag">${escapeHtml(post.category)}</span>
                <span class="article-time">${formatRelativeTime(post.publishedAt)}</span>
            </div>
            <h3>${escapeHtml(post.title)}</h3>
            <p>${escapeHtml(post.summary)}</p>
            <a href="${getStoryUrl(post)}" class="read-more">Read More</a>
            ${createEngagementSection(post)}
        </article>
    `;
}

function createStackItem(post) {
    return `
        <article class="stack-item">
            <span class="article-tag">${escapeHtml(post.category)}</span>
            <h4>${escapeHtml(post.title)}</h4>
            <p>${escapeHtml(post.summary)}</p>
            <span class="stack-meta">${escapeHtml(post.location)} | ${formatRelativeTime(post.publishedAt)}</span>
        </article>
    `;
}

function getFeaturedPost() {
    const featuredPost = allPublishedPosts.find((post) => post.featured);
    return featuredPost || allPublishedPosts[0] || null;
}

function renderHeroPost() {
    const featuredPost = getFeaturedPost();

    if (!featuredPost || !heroPanel || !heroTitle || !heroSummary) {
        return;
    }

    heroPanel.style.background = `
        linear-gradient(180deg, rgba(10, 14, 20, 0.28), rgba(10, 14, 20, 0.86)),
        url("${featuredPost.imageSrc}") center/cover no-repeat
    `;

    if (heroChip) {
        heroChip.textContent = featuredPost.category || "Featured On Desk";
    }

    if (heroLivePill) {
        heroLivePill.textContent = featuredPost.featured ? "Featured On Desk" : "Latest Update";
    }

    heroTitle.textContent = featuredPost.title;
    heroSummary.textContent = featuredPost.summary;

    if (heroMetaItems[0]) {
        heroMetaItems[0].textContent = featuredPost.region === "Ghana" ? "Ghana desk coverage" : "Global desk coverage";
    }

    if (heroMetaItems[1]) {
        heroMetaItems[1].textContent = featuredPost.location;
    }

    if (heroTimestamp) {
        heroTimestamp.textContent = `Updated ${formatRelativeTime(featuredPost.publishedAt)}`;
    }

    if (heroPrimaryLink) {
        heroPrimaryLink.textContent = "Read Featured Story";
        heroPrimaryLink.href = getStoryUrl(featuredPost);
    }

    if (heroSecondaryLink) {
        heroSecondaryLink.textContent = featuredPost.region === "Ghana" ? "View More Ghana Updates" : "View More Global Updates";
        heroSecondaryLink.href = featuredPost.region === "Ghana" ? "#ghana-updates" : "#global-updates";
    }
}

function renderMainFeed(posts) {
    if (!feedContainer) {
        return;
    }

    if (!posts.length) {
        feedContainer.innerHTML = `
            <div class="stack-item feed-empty-state">
                <span class="article-tag">No Results</span>
                <h4>No stories matched your search.</h4>
                <p>Try another keyword such as Ghana, politics, world, technology, or business.</p>
            </div>
        `;
        return;
    }

    feedContainer.innerHTML = posts.slice(0, 8).map(createArticleCard).join("");
}

function renderRegionalFeeds(posts) {
    if (globalFeed) {
        globalFeed.innerHTML = posts
            .filter((post) => post.region === "World")
            .slice(0, 4)
            .map(createUpdateCard)
            .join("");
    }

    if (ghanaFeed) {
        ghanaFeed.innerHTML = posts
            .filter((post) => post.region === "Ghana")
            .slice(0, 4)
            .map(createUpdateCard)
            .join("");
    }
}

function renderSidebarLists() {
    if (trendingList) {
        const trendingPosts = allPublishedPosts.filter((post) => post.trending).slice(0, 4);
        trendingList.innerHTML = trendingPosts.map(createStackItem).join("");
    }

    if (latestUpdatesList) {
        latestUpdatesList.innerHTML = allPublishedPosts.slice(0, 5).map(createStackItem).join("");
    }
}

function renderArchiveFeed() {
    if (!archiveGrid || typeof getArchivedPosts !== "function") {
        return;
    }

    const archivedPosts = getArchivedPosts();

    archiveGrid.innerHTML = archivedPosts.length
        ? archivedPosts.map(createUpdateCard).join("")
        : `
            <article class="update-card">
                <div class="article-topline">
                    <span class="article-tag">Archive</span>
                    <span class="article-time">No posts yet</span>
                </div>
                <h3>Your archived stories will appear here.</h3>
                <p>Use the admin page to archive older stories so the homepage stays focused on current updates.</p>
            </article>
        `;
}

function renderAll() {
    allPublishedPosts = typeof getPublishedPosts === "function" ? getPublishedPosts() : [];
    visiblePosts = [...allPublishedPosts];
    renderHeroPost();
    renderMainFeed(visiblePosts);
    renderRegionalFeeds(visiblePosts);
    renderSidebarLists();
    renderArchiveFeed();
}

function setSidebarOpen(isOpen) {
    if (!sidebarNav || !hamburgerButton || !navOverlay) {
        return;
    }

    sidebarNav.classList.toggle("is-open", isOpen);
    hamburgerButton.classList.toggle("is-active", isOpen);
    hamburgerButton.setAttribute("aria-expanded", String(isOpen));
    sidebarNav.setAttribute("aria-hidden", String(!isOpen));
    navOverlay.hidden = !isOpen;
    document.body.classList.toggle("nav-open", isOpen);
}

function closeSidebar() {
    setSidebarOpen(false);
}

function setActiveNavLink(activeId) {
    hashNavLinks.forEach((link) => {
        const isMatch = link.getAttribute("href") === `#${activeId}`;
        link.classList.toggle("is-active", isMatch);
    });
}

function setupSectionObserver() {
    if (!("IntersectionObserver" in window) || !observedSections.length) {
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            const visibleEntry = entries
                .filter((entry) => entry.isIntersecting)
                .sort((entryA, entryB) => entryB.intersectionRatio - entryA.intersectionRatio)[0];

            if (visibleEntry?.target?.id) {
                setActiveNavLink(visibleEntry.target.id);
            }
        },
        {
            rootMargin: "-18% 0px -58% 0px",
            threshold: [0.2, 0.45, 0.7]
        }
    );

    observedSections.forEach((section) => observer.observe(section));
}

function findPostById(postId) {
    return typeof getPostById === "function" ? getPostById(postId) : null;
}

async function sharePost(postId) {
    const post = findPostById(postId);

    if (!post) {
        return;
    }

    updateInteractionState(postId, (state) => ({
        ...state,
        shares: state.shares + 1
    }));
    renderAll();

    if (navigator.share) {
        try {
            await navigator.share({
                title: post.title,
                text: post.summary,
                url: getStoryUrl(post)
            });
            return;
        } catch (error) {
            renderAll();
        }
    }

    if (navigator.clipboard?.writeText) {
        try {
            const shareUrl = new URL(getStoryUrl(post), window.location.href).href;
            await navigator.clipboard.writeText(shareUrl);
            alert("Story link copied for sharing.");
            return;
        } catch (error) {
            // Fall back to alert below.
        }
    }

    alert(`Share this story: ${post.title}`);
}

function handleEngagementClick(event) {
    const button = event.target.closest(".engagement-button");

    if (!button) {
        return;
    }

    const postId = Number(button.dataset.postId);
    const state = ensureInteractionState(postId);

    if (!state) {
        return;
    }

    if (button.classList.contains("comment-toggle")) {
        updateInteractionState(postId, (current) => ({
            ...current,
            commentsOpen: !current.commentsOpen
        }));
        renderAll();
        return;
    }

    if (button.classList.contains("like-button")) {
        updateInteractionState(postId, (current) => ({
            ...current,
            liked: !current.liked,
            likes: current.likes + (current.liked ? -1 : 1)
        }));
        renderAll();
        return;
    }

    if (button.classList.contains("share-button")) {
        sharePost(postId);
    }
}

function handleCommentSubmit(event) {
    const form = event.target.closest(".comment-form");

    if (!form) {
        return;
    }

    event.preventDefault();

    const postId = Number(form.dataset.postId);
    const formData = new FormData(form);
    const name = formData.get("name")?.toString().trim();
    const comment = formData.get("comment")?.toString().trim();

    if (!name || !comment) {
        return;
    }

    updateInteractionState(postId, (state) => ({
        ...state,
        commentsOpen: true,
        comments: [{ name, text: comment }, ...state.comments]
    }));

    renderAll();
}

function applySearch(query) {
    const normalized = query.trim().toLowerCase();

    allPublishedPosts = typeof getPublishedPosts === "function" ? getPublishedPosts() : [];

    if (!normalized) {
        visiblePosts = [...allPublishedPosts];
        renderAll();
        return;
    }

    visiblePosts = allPublishedPosts.filter((post) =>
        [post.title, post.summary, post.category, post.region, post.location, post.content].join(" ").toLowerCase().includes(normalized)
    );

    renderAll();
}

if (searchForm && searchInput) {
    searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        applySearch(searchInput.value);
    });

    searchInput.addEventListener("input", () => {
        applySearch(searchInput.value);
    });
}

[feedContainer, globalFeed, ghanaFeed, archiveGrid].filter(Boolean).forEach((container) => {
    container.addEventListener("click", handleEngagementClick);
    container.addEventListener("submit", handleCommentSubmit);
});

if (hamburgerButton && sidebarNav && sidebarCloseButton && navOverlay) {
    hamburgerButton.addEventListener("click", () => {
        const isOpen = sidebarNav.classList.contains("is-open");
        setSidebarOpen(!isOpen);
    });

    sidebarCloseButton.addEventListener("click", closeSidebar);
    navOverlay.addEventListener("click", closeSidebar);

    navLinks.forEach((link) => {
        link.addEventListener("click", () => {
            const href = link.getAttribute("href") || "";

            if (href.startsWith("#")) {
                setActiveNavLink(href.replace("#", ""));
            }

            closeSidebar();
        });
    });

    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeSidebar();
        }
    });
}

if (currentDate) {
    currentDate.textContent = new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    }).format(new Date());
}

if (typeof trackVisit === "function") {
    trackVisit(document.body.classList.contains("archive-page") ? "archive" : "home");
}

window.addEventListener("storage", (event) => {
    if (event.key === "daily-affairs.posts.v1") {
        renderAll();
    }
});

window.addEventListener("focus", () => {
    renderAll();
});

renderAll();
setupSectionObserver();
