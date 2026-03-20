const articleHamburger = document.getElementById("articleHamburger");
const articleSidebar = document.getElementById("articleSidebar");
const articleSidebarClose = document.getElementById("articleSidebarClose");
const articleOverlay = document.getElementById("articleOverlay");
const articleNavLinks = Array.from(document.querySelectorAll("[data-article-nav]"));
const interactionConfigs = [
    {
        likeButton: document.getElementById("storyLikeButton"),
        likeCount: document.getElementById("storyLikeCount"),
        commentToggle: document.getElementById("storyCommentToggle"),
        commentCount: document.getElementById("storyCommentCount"),
        commentPanel: document.getElementById("storyCommentPanel"),
        commentList: document.getElementById("storyCommentList"),
        commentForm: document.getElementById("storyCommentForm"),
        state: {
            likes: 24,
            liked: false,
            comments: [
                {
                    name: "Reader",
                    text: "This report is clear and easy to follow."
                }
            ]
        }
    },
    {
        likeButton: document.getElementById("moreNewsLikeButton"),
        likeCount: document.getElementById("moreNewsLikeCount"),
        commentToggle: document.getElementById("moreNewsCommentToggle"),
        commentCount: document.getElementById("moreNewsCommentCount"),
        commentPanel: document.getElementById("moreNewsCommentPanel"),
        commentList: document.getElementById("moreNewsCommentList"),
        commentForm: document.getElementById("moreNewsCommentForm"),
        state: {
            likes: 11,
            liked: false,
            comments: [
                {
                    name: "Reader",
                    text: "This extra section adds useful background to the report."
                }
            ]
        }
    }
];

function setArticleMenuOpen(isOpen) {
    if (!articleHamburger || !articleSidebar || !articleOverlay) {
        return;
    }

    articleSidebar.classList.toggle("is-open", isOpen);
    articleHamburger.setAttribute("aria-expanded", String(isOpen));
    articleSidebar.setAttribute("aria-hidden", String(!isOpen));
    articleOverlay.hidden = !isOpen;
    document.body.classList.toggle("menu-open", isOpen);
}

function closeArticleMenu() {
    setArticleMenuOpen(false);
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

function renderInteraction(config) {
    const { likeButton, likeCount, commentCount, commentList, state } = config;

    if (!likeCount || !likeButton || !commentCount || !commentList) {
        return;
    }

    likeCount.textContent = String(state.likes);
    commentCount.textContent = String(state.comments.length);
    likeButton.classList.toggle("is-active", state.liked);

    commentList.innerHTML = state.comments
        .map(
            (comment) => `
                <article class="story-comment-item">
                    <strong>${escapeHtml(comment.name)}</strong>
                    <p>${escapeHtml(comment.text)}</p>
                </article>
            `
        )
        .join("");
}

if (articleHamburger && articleSidebar && articleSidebarClose && articleOverlay) {
    articleHamburger.addEventListener("click", () => {
        const isOpen = articleSidebar.classList.contains("is-open");
        setArticleMenuOpen(!isOpen);
    });

    articleSidebarClose.addEventListener("click", closeArticleMenu);
    articleOverlay.addEventListener("click", closeArticleMenu);

    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeArticleMenu();
        }
    });

    articleNavLinks.forEach((link) => {
        link.addEventListener("click", () => {
            articleNavLinks.forEach((item) => item.classList.remove("is-active"));
            link.classList.add("is-active");
            closeArticleMenu();
        });
    });
}

interactionConfigs.forEach((config) => {
    const { likeButton, commentToggle, commentPanel, commentForm, state } = config;

    if (likeButton) {
        likeButton.addEventListener("click", () => {
            state.liked = !state.liked;
            state.likes += state.liked ? 1 : -1;
            renderInteraction(config);
        });
    }

    if (commentToggle && commentPanel) {
        commentToggle.addEventListener("click", () => {
            commentPanel.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }

    if (commentForm) {
        commentForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const formData = new FormData(commentForm);
            const comment = formData.get("comment")?.toString().trim();

            if (!comment) {
                return;
            }

            state.comments.unshift({ name: "Reader", text: comment });
            commentForm.reset();
            renderInteraction(config);
        });
    }

    renderInteraction(config);
});
