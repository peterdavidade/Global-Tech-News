const {
    getPosts,
    getPublishedPosts,
    getArchivedPosts,
    getPostById,
    trackVisit,
    formatDisplayDate,
    getMinutesAgo,
    getLiveDeskSettings,
    getLiveTickerItems,
    getArchiveTickerItems
} = window.NewsroomStore || {};

const feedContainer = document.getElementById("mainFeed");
const globalFeed = document.getElementById("globalFeed");
const ghanaFeed = document.getElementById("ghanaFeed");
const trendingList = document.getElementById("trendingList");
const latestUpdatesList = document.getElementById("latestUpdatesList");
const searchInput = document.getElementById("searchInput");
const searchForm = document.getElementById("searchForm");
const currentDate = document.getElementById("currentDate");
const liveDeskLabel = document.getElementById("liveDeskLabel");
const tickerTrack = document.getElementById("tickerTrack");
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
const archiveFeed = document.getElementById("archiveFeed");
const archiveLead = document.getElementById("archiveLead");
const archiveSummaryTitle = document.getElementById("archiveSummaryTitle");
const archiveSummaryCopy = document.getElementById("archiveSummaryCopy");
const archiveStoryCount = document.getElementById("archiveStoryCount");
const archiveTabButtons = Array.from(document.querySelectorAll("[data-archive-tab-button]"));
const archiveTabLinks = Array.from(document.querySelectorAll("[data-archive-tab]"));
const shareModal = createShareModal();

const interactionStorageKey = "daily-affairs.interactions.v1";
const instagramShareMessage = "Instagram does not support direct web link sharing. The story link has been copied so you can paste it into a post, bio, story, or DM.";

let allPublishedPosts = typeof getPublishedPosts === "function" ? getPublishedPosts() : [];
let visiblePosts = [...allPublishedPosts];
let activeSharePostId = null;
let activeArchiveTab = "world";
let activeContentFilter = getInitialContentFilter();
let activeSearchQuery = "";

function normalizeFilterValue(value) {
    return String(value || "").trim().toLowerCase();
}

function getInitialContentFilter() {
    const params = new URLSearchParams(window.location.search);
    const kind = params.get("filter");
    const value = params.get("value");

    if (!kind || !value) {
        return null;
    }

    if (kind !== "category" && kind !== "region") {
        return null;
    }

    return { kind, value };
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

function renderLiveTicker() {
    if (!tickerTrack || !document.body.classList.contains("home-page") || typeof getLiveTickerItems !== "function") {
        return;
    }

    const items = getLiveTickerItems();

    if (!items.length) {
        return;
    }

    const repeated = [...items, ...items];

    tickerTrack.innerHTML = repeated
        .map(
            (text) => `
                <span class="ticker-item"><strong>Live:</strong> ${escapeHtml(text)}</span>
            `
        )
        .join("");
}

function renderArchiveTicker() {
    if (!tickerTrack || !document.body.classList.contains("archive-page") || typeof getArchiveTickerItems !== "function") {
        return;
    }

    const items = getArchiveTickerItems();

    if (!items.length) {
        return;
    }

    const repeated = [...items, ...items];

    tickerTrack.innerHTML = repeated
        .map(
            (text) => `
                <span class="ticker-item"><strong>Browse:</strong> ${escapeHtml(text)}</span>
            `
        )
        .join("");
}

function getStoryUrl(post) {
    return `story.html?slug=${encodeURIComponent(post.slug)}`;
}

function getFilterUrl(kind, value) {
    return `index.html?filter=${encodeURIComponent(kind)}&value=${encodeURIComponent(value)}#mainFeed`;
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
                    <a href="${getFilterUrl("category", post.category)}" class="article-tag article-tag-link">${escapeHtml(post.category)}</a>
                    <span class="article-location">${escapeHtml(post.location)}</span>
                    <span class="article-time">${formatRelativeTime(post.publishedAt)}</span>
                </div>
                <h3 class="article-title">${escapeHtml(post.title)}</h3>
                <p class="article-summary">${escapeHtml(post.summary)}</p>
                <div class="article-footer">
                    <span class="article-time">${escapeHtml(formatDisplayDate(post.publishedAt))}</span>
                    <a href="${getStoryUrl(post)}" class="read-more">Read More</a>
                </div>
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
                <a href="${getFilterUrl("category", post.category)}" class="article-tag article-tag-link">${escapeHtml(post.category)}</a>
                <span class="article-time">${formatRelativeTime(post.publishedAt)}</span>
            </div>
            <h3>${escapeHtml(post.title)}</h3>
            <p>${escapeHtml(post.summary)}</p>
            <a href="${getStoryUrl(post)}" class="read-more">Read More</a>
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
    const sourcePosts = visiblePosts.length ? visiblePosts : allPublishedPosts;
    const featuredPost = sourcePosts.find((post) => post.featured);
    return featuredPost || sourcePosts[0] || null;
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

    feedContainer.innerHTML = posts.slice(0, 4).map(createArticleCard).join("");
}

function postMatchesFilter(post, filter) {
    if (!filter) {
        return true;
    }

    if (filter.kind === "region") {
        return normalizeFilterValue(post.region) === normalizeFilterValue(filter.value);
    }

    if (filter.kind === "category") {
        return normalizeFilterValue(post.category) === normalizeFilterValue(filter.value);
    }

    return true;
}

function updateFilterNavState() {
    const filterLinks = Array.from(document.querySelectorAll("[data-filter-kind][data-filter-value]"));

    filterLinks.forEach((link) => {
        const isActive =
            activeContentFilter &&
            link.dataset.filterKind === activeContentFilter.kind &&
            normalizeFilterValue(link.dataset.filterValue) === normalizeFilterValue(activeContentFilter.value);

        link.classList.toggle("is-active", Boolean(isActive));
    });
}

function syncFilterUrl() {
    if (!document.body.classList.contains("home-page")) {
        return;
    }

    const nextUrl = new URL(window.location.href);

    if (activeContentFilter) {
        nextUrl.searchParams.set("filter", activeContentFilter.kind);
        nextUrl.searchParams.set("value", activeContentFilter.value);
    } else {
        nextUrl.searchParams.delete("filter");
        nextUrl.searchParams.delete("value");
    }

    history.replaceState({}, "", `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
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
        latestUpdatesList.innerHTML = allPublishedPosts.slice(0, 4).map(createStackItem).join("");
    }
}

function renderArchiveFeed() {
    if (!archiveGrid || typeof getArchivedPosts !== "function") {
        return;
    }

    if (document.body.classList.contains("archive-page")) {
        renderArchiveHub();
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

function getArchiveCollections() {
    const allPosts = typeof getPosts === "function" ? getPosts() : [];
    const archivedPosts = typeof getArchivedPosts === "function" ? getArchivedPosts() : [];

    const world = archivedPosts.filter((post) => post.region === "World");
    const ghana = archivedPosts.filter(
        (post) =>
            post.region === "Ghana" ||
            /ghana|politics|parliament|government|president/i.test(
                [post.category, post.title, post.summary, post.content].join(" ")
            )
    );
    const context = allPosts
        .filter(
            (post) =>
                /business|education|technology|policy|research|innovation/i.test(
                    [post.category, post.title, post.summary, post.content].join(" ")
                ) &&
                !world.some((item) => item.id === post.id) &&
                !ghana.some((item) => item.id === post.id)
        )
        .slice(0, 6);

    return {
        world: {
            title: "World & International Archive",
            copy: "Archived global and international stories collected for background, follow-up reading, and wider perspective.",
            posts: world
        },
        ghana: {
            title: "Ghana & Politics Archive",
            copy: "Archived Ghana coverage, policy stories, and political developments grouped together for easy access.",
            posts: ghana
        },
        context: {
            title: "Context Stories",
            copy: "Background stories, business shifts, education coverage, and slower-moving developments worth revisiting.",
            posts: context
        }
    };
}

function createArchiveLeadCard(post, tabKey) {
    if (!post) {
        return "";
    }

    const laneLabel = {
        world: "World Archive",
        ghana: "Ghana Archive",
        context: "Context Story"
    }[tabKey] || "Archive Story";

    return `
        <article class="archive-lead-card">
            <div class="archive-lead-media">
                <img src="${escapeHtml(post.imageSrc)}" alt="${escapeHtml(post.imageAlt)}">
            </div>
            <div class="archive-lead-body">
                <div class="article-topline">
                    <span class="article-tag">${laneLabel}</span>
                    <span class="article-time">${escapeHtml(formatDisplayDate(post.publishedAt))}</span>
                </div>
                <h3>${escapeHtml(post.title)}</h3>
                <p>${escapeHtml(post.summary)}</p>
                <div class="archive-lead-meta">
                    <span>${escapeHtml(post.location)}</span>
                    <span>${escapeHtml(post.category)}</span>
                </div>
                <a href="${getStoryUrl(post)}" class="primary-button">Read Archive Story</a>
            </div>
        </article>
    `;
}

function renderArchiveHub() {
    if (!archiveFeed || !archiveLead || !archiveSummaryTitle || !archiveSummaryCopy || !archiveStoryCount) {
        return;
    }

    const collections = getArchiveCollections();
    const activeCollection = collections[activeArchiveTab] || collections.world;
    const posts = activeCollection.posts;
    const leadPost = posts[0] || null;
    const supportingPosts = leadPost ? posts.slice(1) : posts;

    archiveTabButtons.forEach((button) => {
        button.classList.toggle("is-active", button.dataset.archiveTabButton === activeArchiveTab);
    });

    archiveTabLinks.forEach((link) => {
        link.classList.toggle("is-active", link.dataset.archiveTab === activeArchiveTab);
    });

    archiveSummaryTitle.textContent = activeCollection.title;
    archiveSummaryCopy.textContent = activeCollection.copy;
    archiveStoryCount.textContent = String(posts.length);
    archiveLead.innerHTML = leadPost ? createArchiveLeadCard(leadPost, activeArchiveTab) : "";

    archiveFeed.innerHTML = supportingPosts.length ? supportingPosts.map(createUpdateCard).join("") : "";
}

function renderAll() {
    allPublishedPosts = typeof getPublishedPosts === "function" ? getPublishedPosts() : [];
    visiblePosts = allPublishedPosts.filter((post) => postMatchesFilter(post, activeContentFilter));

    if (activeSearchQuery) {
        visiblePosts = visiblePosts.filter((post) =>
            [post.title, post.summary, post.category, post.region, post.location, post.content]
                .join(" ")
                .toLowerCase()
                .includes(activeSearchQuery)
        );
    }

    renderHeroPost();
    renderMainFeed(visiblePosts);
    renderRegionalFeeds(visiblePosts);
    renderSidebarLists();
    renderArchiveFeed();
    updateFilterNavState();
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

function getShareDetails(post) {
    const shareUrl = new URL(getStoryUrl(post), window.location.href).href;
    const shareText = `${post.title} - ${post.summary}`;

    return { shareUrl, shareText };
}

function incrementShareCount(postId) {
    updateInteractionState(postId, (state) => ({
        ...state,
        shares: state.shares + 1
    }));
    renderAll();
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
    activeSharePostId = null;
}

function openShareWindow(url) {
    window.open(url, "_blank", "noopener,noreferrer,width=680,height=720");
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

    const modal = {
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
    modal.closeButton.addEventListener("click", closeShareModal);
    dialog.addEventListener("click", handleShareModalClick);

    return modal;
}

function openShareModal(postId) {
    if (!shareModal) {
        return;
    }

    const post = findPostById(postId);

    if (!post) {
        return;
    }

    activeSharePostId = postId;
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

async function sharePostToNetwork(action, postId) {
    const post = findPostById(postId);

    if (!post) {
        return;
    }

    const { shareUrl, shareText } = getShareDetails(post);

    if (action === "copy") {
        try {
            await copyTextToClipboard(shareUrl);
            incrementShareCount(postId);
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
                title: post.title,
                text: post.summary,
                url: shareUrl
            });
            incrementShareCount(postId);
            updateShareStatus("Share sheet opened.");
        } catch (error) {
            updateShareStatus("Share was cancelled or could not be opened.", false);
        }
        return;
    }

    if (action === "instagram") {
        try {
            await copyTextToClipboard(shareUrl);
            incrementShareCount(postId);
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

    const networkUrl = networkUrls[action];

    if (!networkUrl) {
        return;
    }

    incrementShareCount(postId);
    updateShareStatus(`Opening ${action === "x" ? "X" : action.charAt(0).toUpperCase() + action.slice(1)} share window...`);
    openShareWindow(networkUrl);
}

function handleShareModalClick(event) {
    const actionButton = event.target.closest("[data-share-action]");

    if (!actionButton || activeSharePostId === null) {
        return;
    }

    sharePostToNetwork(actionButton.dataset.shareAction, activeSharePostId);
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
        openShareModal(postId);
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
    activeSearchQuery = query.trim().toLowerCase();
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
});

archiveTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
        activeArchiveTab = button.dataset.archiveTabButton || "world";
        renderArchiveHub();
    });
});

archiveTabLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
        event.preventDefault();
        activeArchiveTab = link.dataset.archiveTab || "world";
        renderArchiveHub();
        document.querySelector("#archive-hub")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
});

Array.from(document.querySelectorAll("[data-filter-kind][data-filter-value]")).forEach((link) => {
    link.addEventListener("click", (event) => {
        event.preventDefault();
        activeContentFilter = {
            kind: link.dataset.filterKind || "category",
            value: link.dataset.filterValue || ""
        };
        syncFilterUrl();
        renderAll();
        document.querySelector("#mainFeed")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
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

window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeSharePostId !== null) {
        closeShareModal();
    }
});

if (currentDate) {
    const liveDesk = typeof getLiveDeskSettings === "function" ? getLiveDeskSettings() : null;

    if (liveDeskLabel) {
        liveDeskLabel.textContent = liveDesk?.label || "Live Desk";
    }

    currentDate.textContent =
        liveDesk?.value ||
        new Intl.DateTimeFormat("en-US", {
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

    if (event.key === "daily-affairs.live-desk.v1" && currentDate) {
        const liveDesk = typeof getLiveDeskSettings === "function" ? getLiveDeskSettings() : null;

        if (liveDeskLabel) {
            liveDeskLabel.textContent = liveDesk?.label || "Live Desk";
        }

        currentDate.textContent =
            liveDesk?.value ||
            new Intl.DateTimeFormat("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric"
            }).format(new Date());
    }

    if (event.key === "daily-affairs.live-ticker.v1") {
        renderLiveTicker();
    }

    if (event.key === "daily-affairs.archive-ticker.v1") {
        renderArchiveTicker();
    }
});

window.addEventListener("focus", () => {
    renderAll();
});

renderAll();
setupSectionObserver();
renderLiveTicker();
renderArchiveTicker();
