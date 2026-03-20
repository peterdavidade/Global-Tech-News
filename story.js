const { getPostBySlug, getPublishedPosts, trackVisit, formatDisplayDate } = window.NewsroomStore || {};

const storyPanel = document.getElementById("storyPanel");
const relatedStories = document.getElementById("relatedStories");
const query = new URLSearchParams(window.location.search);
const storySlug = query.get("slug");

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

function renderMissingStory() {
    document.title = "Story Not Found | The Daily Affairs";
    storyPanel.innerHTML = `
        <p class="story-empty">That story could not be found. It may have been archived, renamed, or removed.</p>
    `;
}

function renderStory(post) {
    document.title = `${post.title} | The Daily Affairs`;
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
            <span class="story-chip">${escapeHtml(post.category)}</span>
            <span class="story-chip">${escapeHtml(post.region)}</span>
        </div>
        <h1>${escapeHtml(post.title)}</h1>
        <div class="story-meta">
            <span>${escapeHtml(post.location)}</span>
            <span>${escapeHtml(formatDisplayDate(post.publishedAt))}</span>
        </div>
        <div class="story-gallery ${galleryImages.length > 1 ? "is-multi" : ""}">${galleryMarkup}</div>
        <div class="story-body">${paragraphs}</div>
    `;
}

function renderRelated(currentPost) {
    if (!relatedStories || typeof getPublishedPosts !== "function") {
        return;
    }

    const relatedPosts = getPublishedPosts()
        .filter((post) => post.slug !== currentPost.slug)
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
