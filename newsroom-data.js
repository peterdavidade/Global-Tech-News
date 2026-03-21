(function () {
    const POSTS_STORAGE_KEY = "daily-affairs.posts.v1";
    const ANALYTICS_STORAGE_KEY = "daily-affairs.analytics.v1";
    const VISITOR_STORAGE_KEY = "daily-affairs.visitor-id.v1";
    const ADMIN_CONFIG_STORAGE_KEY = "daily-affairs.admin-config.v1";
    const ADMIN_SESSION_KEY = "daily-affairs.admin-session.v1";
    const LIVE_DESK_STORAGE_KEY = "daily-affairs.live-desk.v1";
    const LIVE_TICKER_STORAGE_KEY = "daily-affairs.live-ticker.v1";
    const ARCHIVE_TICKER_STORAGE_KEY = "daily-affairs.archive-ticker.v1";
    const LIVE_POST_LIMIT = 4;
    const LIVE_POST_WINDOW_MINUTES = 24 * 60;

    const MEDIA_DB_NAME = "daily-affairs.media.v1";
    const MEDIA_DB_VERSION = 1;
    const MEDIA_STORE_NAME = "media";

    const DEFAULT_ADMIN_CONFIG = {
        passcode: "DailyAffairs-Desk-2026"
    };

    const DEFAULT_POSTS = [
        {
            id: 1,
            slug: "ghana-education-planners-review-digital-learning-rollout",
            title: "Ghana education planners review digital learning rollout across regional schools",
            summary: "Officials and education leaders are assessing infrastructure, teacher readiness, and device access as schools expand digital learning initiatives.",
            content:
                "Education officials are reviewing how quickly schools can scale digital learning in urban and regional communities.\n\nThe latest consultations focus on teacher preparedness, classroom connectivity, and whether device access is expanding at the same pace as curriculum goals.\n\nAnalysts say the rollout could shape broader conversations around infrastructure, student outcomes, and long-term investment in public education.",
            category: "Education",
            region: "Ghana",
            location: "Accra",
            featured: true,
            trending: true,
            imageAlt: "Students and teachers in a classroom using digital learning tools",
            imageSrc: "./images/Ghana flag.jpg",
            galleryImages: ["./images/Ghana flag.jpg"],
            status: "published",
            publishedAt: "2026-03-19T13:25:00.000Z",
            updatedAt: "2026-03-19T13:25:00.000Z"
        },
        {
            id: 2,
            slug: "world-leaders-push-for-fresh-diplomacy",
            title: "World leaders push for fresh diplomacy after new regional security tensions",
            summary: "International capitals are balancing calls for restraint, emergency consultations, and economic contingency planning amid a fast-moving security story.",
            content:
                "Diplomatic teams are pushing for new channels of communication as governments respond to escalating regional tensions.\n\nOfficials are weighing travel advisories, economic contingency plans, and multilateral engagement while trying to avoid broader instability.\n\nObservers say the next round of talks could influence trade, security planning, and public messaging in several capitals.",
            category: "World News",
            region: "World",
            location: "Brussels",
            trending: true,
            imageAlt: "World leaders meeting during an international diplomatic session",
            imageSrc: "./images/Senegal.jpg",
            galleryImages: ["./images/Senegal.jpg"],
            status: "published",
            publishedAt: "2026-03-19T13:02:00.000Z",
            updatedAt: "2026-03-19T13:02:00.000Z"
        },
        {
            id: 3,
            slug: "parliament-debate-sharpens-policy-priorities",
            title: "Parliament debate sharpens focus on policy priorities and public spending in Ghana",
            summary: "Political debate is centering on social investment, infrastructure delivery, and the balance between near-term pressure and long-term reforms.",
            content:
                "Legislators are sharpening debate around spending priorities, public accountability, and the pace of reform.\n\nThe discussion includes infrastructure delivery, social investment, and how government should balance immediate pressures with medium-term planning.\n\nPolitical observers say the tone of the current debate could influence legislative momentum in the coming weeks.",
            category: "Politics",
            region: "Ghana",
            location: "Parliament House",
            trending: true,
            imageAlt: "Political leaders in a parliamentary session",
            imageSrc: "./images/Sam george.jpg",
            galleryImages: ["./images/Sam george.jpg"],
            status: "published",
            publishedAt: "2026-03-19T12:30:00.000Z",
            updatedAt: "2026-03-19T12:30:00.000Z"
        },
        {
            id: 4,
            slug: "global-markets-react-to-inflation-and-tech-earnings",
            title: "Global markets react to fresh inflation data and technology sector earnings guidance",
            summary: "Investors are weighing company performance, central-bank expectations, and changing demand signals across major sectors.",
            content:
                "Global markets are reacting to new inflation indicators and guidance from major technology companies.\n\nInvestors are monitoring what the latest numbers could mean for interest-rate expectations, consumer demand, and sector rotation.\n\nAnalysts say the combined inflation and earnings picture may continue to shape market sentiment over the coming sessions.",
            category: "Business",
            region: "World",
            location: "New York",
            imageAlt: "Market data displayed on trading screens",
            imageSrc: "./images/888.jpg",
            galleryImages: ["./images/888.jpg"],
            status: "published",
            publishedAt: "2026-03-19T11:50:00.000Z",
            updatedAt: "2026-03-19T11:50:00.000Z"
        },
        {
            id: 5,
            slug: "technology-regulators-examine-new-platform-rules",
            title: "Technology regulators examine new platform rules around privacy and AI-generated content",
            summary: "The debate includes transparency requirements, consumer protections, and the responsibilities of large digital platforms.",
            content:
                "Regulators are revisiting platform rules as privacy concerns and AI-generated content move higher on the policy agenda.\n\nOfficials say the discussion now includes transparency requirements, consumer protection standards, and enforcement expectations for large digital platforms.\n\nThe outcome could shape compliance burdens and product decisions across several markets.",
            category: "Technology",
            region: "World",
            location: "London",
            imageAlt: "A technology interface representing AI and digital regulation",
            imageSrc: "./images/telegram.png",
            galleryImages: ["./images/telegram.png"],
            status: "archived",
            publishedAt: "2026-03-18T21:05:00.000Z",
            updatedAt: "2026-03-18T21:05:00.000Z"
        },
        {
            id: 6,
            slug: "emergency-responders-coordinate-after-severe-weather",
            title: "Breaking: emergency responders coordinate after severe weather disrupts transport links",
            summary: "Authorities are issuing travel guidance, monitoring infrastructure stress, and preparing recovery plans as conditions evolve.",
            content:
                "Emergency teams are coordinating transport guidance and recovery planning after severe weather disrupted key routes.\n\nAuthorities say infrastructure stress, travel safety, and response readiness remain the main near-term priorities.\n\nFurther advisories are expected as conditions continue to change.",
            category: "Breaking News",
            region: "World",
            location: "Nairobi",
            trending: true,
            imageAlt: "Emergency responders working during severe weather disruption",
            imageSrc: "./images/Read More Icon.png",
            galleryImages: ["./images/Read More Icon.png"],
            status: "published",
            publishedAt: "2026-03-19T13:48:00.000Z",
            updatedAt: "2026-03-19T13:48:00.000Z"
        },
        {
            id: 7,
            slug: "businesses-in-accra-adjust-hiring-and-investment-plans",
            title: "Businesses in Accra adjust hiring and investment plans as consumer demand shifts",
            summary: "Company leaders are focusing on cost discipline, expansion strategy, and digital operations as market conditions evolve.",
            content:
                "Businesses in Accra are reassessing hiring, investment timing, and digital operations as demand conditions shift.\n\nCompany leaders say cost discipline remains important, but many are still exploring selective expansion in growth areas.\n\nThe trend is becoming a key signal for confidence across the local business landscape.",
            category: "Business",
            region: "Ghana",
            location: "Accra",
            imageAlt: "Business owners discussing market trends in Accra",
            imageSrc: "./images/Tomato Seller.jpg",
            galleryImages: ["./images/Tomato Seller.jpg"],
            status: "published",
            publishedAt: "2026-03-19T10:30:00.000Z",
            updatedAt: "2026-03-19T10:30:00.000Z"
        },
        {
            id: 8,
            slug: "universities-expand-research-partnerships",
            title: "Universities expand research partnerships as innovation funding grows in West Africa",
            summary: "Education and technology institutions are forming new collaborations aimed at skills development and applied research.",
            content:
                "Universities across West Africa are expanding partnerships tied to innovation funding and applied research goals.\n\nThe collaborations are focused on skills development, research capacity, and stronger links between academia and industry.\n\nSupporters say the momentum could improve both talent pipelines and local problem-solving capacity.",
            category: "Education",
            region: "Ghana",
            location: "Kumasi",
            imageAlt: "University researchers collaborating in a laboratory or campus setting",
            imageSrc: "./images/Gyakie.jpg",
            galleryImages: ["./images/Gyakie.jpg"],
            status: "archived",
            publishedAt: "2026-03-18T18:40:00.000Z",
            updatedAt: "2026-03-18T18:40:00.000Z"
        },
        {
            id: 9,
            slug: "governments-review-border-trade-and-migration-coordination",
            title: "Governments review border, trade, and migration coordination after new international talks",
            summary: "Officials say the latest talks could influence regional commerce, security planning, and diplomatic engagement in the weeks ahead.",
            content:
                "Governments are reviewing the implications of new talks on border policy, trade flows, and migration coordination.\n\nOfficials say the discussions could influence both regional commerce and longer-term diplomatic planning.\n\nPolicy teams are now assessing how quickly the latest commitments may translate into operational changes.",
            category: "World News",
            region: "World",
            location: "Addis Ababa",
            imageAlt: "Officials meeting over border, trade, and migration coordination",
            imageSrc: "./images/Presidential Get.jpg",
            galleryImages: ["./images/Presidential Get.jpg"],
            status: "published",
            publishedAt: "2026-03-19T08:40:00.000Z",
            updatedAt: "2026-03-19T08:40:00.000Z"
        },
        {
            id: 10,
            slug: "president-mahama-vows-to-intensify-fight-against-galamsey",
            title: "President Mahama admits some NDC members are involved in galamsey, vows to intensify the fight",
            summary: "President John Dramani Mahama says some NDC members are involved in illegal mining and insists the government will strengthen the response.",
            content:
                "President John Dramani Mahama says some NDC members are involved in illegal mining and has pledged to intensify the fight against galamsey.\n\nThe remarks add political weight to the government response as public pressure continues around enforcement and environmental impact.\n\nObservers say the issue is likely to remain central to the national conversation in the days ahead.",
            category: "Politics",
            region: "Ghana",
            location: "Accra",
            trending: true,
            imageAlt: "President John Mahama speaking during a national address",
            imageSrc: "./images/President Mahama.jpg",
            galleryImages: ["./images/President Mahama.jpg"],
            status: "published",
            publishedAt: "2026-03-19T13:48:00.000Z",
            updatedAt: "2026-03-19T13:48:00.000Z"
        }
    ];

    function safeParse(value, fallback) {
        if (!value) {
            return fallback;
        }

        try {
            return JSON.parse(value);
        } catch (error) {
            return fallback;
        }
    }

    function slugify(value) {
        return String(value || "")
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 80);
    }

    function formatIsoDate(date) {
        return new Date(date).toISOString();
    }

    function getNowIso() {
        return new Date().toISOString();
    }

    function ensurePostsSeeded() {
        const stored = safeParse(localStorage.getItem(POSTS_STORAGE_KEY), null);

        if (Array.isArray(stored) && stored.length) {
            return;
        }

        localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(DEFAULT_POSTS));
    }

    function normalizePost(post) {
        const nowIso = getNowIso();
        const title = String(post.title || "").trim();
        const publishedAt = post.publishedAt ? formatIsoDate(post.publishedAt) : nowIso;
        const fallbackImage = String(post.imageSrc || "./images/Read More Icon.png").trim();
        const galleryImages = Array.isArray(post.galleryImages)
            ? post.galleryImages.map((image) => String(image || "").trim()).filter(Boolean).slice(0, 3)
            : [];
        const finalGalleryImages = galleryImages.length ? galleryImages : [fallbackImage];
        const videoIds = Array.isArray(post.videoIds)
            ? post.videoIds.map((id) => String(id || "").trim()).filter(Boolean).slice(0, 3)
            : [];

        return {
            id: Number(post.id),
            slug: slugify(post.slug || title || `story-${post.id}`),
            title,
            summary: String(post.summary || "").trim(),
            content: String(post.content || "").trim(),
            category: String(post.category || "General").trim(),
            region: String(post.region || "World").trim(),
            location: String(post.location || "News Desk").trim(),
            featured: Boolean(post.featured),
            trending: Boolean(post.trending),
            imageAlt: String(post.imageAlt || title || "News story image").trim(),
            imageSrc: fallbackImage,
            galleryImages: finalGalleryImages,
            videoIds,
            status: post.status === "archived" ? "archived" : "published",
            publishedAt,
            updatedAt: post.updatedAt ? formatIsoDate(post.updatedAt) : publishedAt
        };
    }

    function getLiveDeskSettings() {
        const stored = safeParse(localStorage.getItem(LIVE_DESK_STORAGE_KEY), null);

        if (!stored || typeof stored !== "object") {
            return null;
        }

        return {
            label: String(stored.label || "").trim(),
            value: String(stored.value || "").trim()
        };
    }

    function setLiveDeskSettings(settings) {
        const normalized = {
            label: String(settings?.label || "").trim(),
            value: String(settings?.value || "").trim()
        };

        localStorage.setItem(LIVE_DESK_STORAGE_KEY, JSON.stringify(normalized));
        return normalized;
    }

    function clearLiveDeskSettings() {
        localStorage.removeItem(LIVE_DESK_STORAGE_KEY);
    }

    function getLiveTickerItems() {
        const stored = safeParse(localStorage.getItem(LIVE_TICKER_STORAGE_KEY), null);

        if (!Array.isArray(stored)) {
            return [];
        }

        return stored.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 3);
    }

    function setLiveTickerItems(items) {
        const normalized = Array.isArray(items) ? items.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 3) : [];
        localStorage.setItem(LIVE_TICKER_STORAGE_KEY, JSON.stringify(normalized));
        return normalized;
    }

    function clearLiveTickerItems() {
        localStorage.removeItem(LIVE_TICKER_STORAGE_KEY);
    }

    function getArchiveTickerItems() {
        const stored = safeParse(localStorage.getItem(ARCHIVE_TICKER_STORAGE_KEY), null);

        if (!Array.isArray(stored)) {
            return [];
        }

        return stored.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 3);
    }

    function setArchiveTickerItems(items) {
        const normalized = Array.isArray(items) ? items.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 3) : [];
        localStorage.setItem(ARCHIVE_TICKER_STORAGE_KEY, JSON.stringify(normalized));
        return normalized;
    }

    function clearArchiveTickerItems() {
        localStorage.removeItem(ARCHIVE_TICKER_STORAGE_KEY);
    }

    let mediaDbPromise = null;

    function openMediaDb() {
        if (!("indexedDB" in window)) {
            return Promise.reject(new Error("IndexedDB is unavailable."));
        }

        if (mediaDbPromise) {
            return mediaDbPromise;
        }

        mediaDbPromise = new Promise((resolve, reject) => {
            const request = window.indexedDB.open(MEDIA_DB_NAME, MEDIA_DB_VERSION);

            request.onupgradeneeded = () => {
                const db = request.result;

                if (!db.objectStoreNames.contains(MEDIA_STORE_NAME)) {
                    db.createObjectStore(MEDIA_STORE_NAME, { keyPath: "id" });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error("Unable to open media database."));
        });

        return mediaDbPromise;
    }

    function saveMediaFile(file) {
        if (!file) {
            return Promise.reject(new Error("No media file provided."));
        }

        const id = `media_${Date.now()}_${Math.random().toString(16).slice(2)}`;

        return openMediaDb().then(
            (db) =>
                new Promise((resolve, reject) => {
                    const transaction = db.transaction(MEDIA_STORE_NAME, "readwrite");
                    const store = transaction.objectStore(MEDIA_STORE_NAME);
                    store.put({
                        id,
                        blob: file,
                        name: file.name || "",
                        type: file.type || "",
                        createdAt: getNowIso()
                    });

                    transaction.oncomplete = () => resolve(id);
                    transaction.onerror = () => reject(transaction.error || new Error("Unable to save media."));
                    transaction.onabort = () => reject(transaction.error || new Error("Unable to save media."));
                })
        );
    }

    function getMediaBlob(mediaId) {
        const id = String(mediaId || "").trim();

        if (!id) {
            return Promise.resolve(null);
        }

        return openMediaDb().then(
            (db) =>
                new Promise((resolve, reject) => {
                    const transaction = db.transaction(MEDIA_STORE_NAME, "readonly");
                    const store = transaction.objectStore(MEDIA_STORE_NAME);
                    const request = store.get(id);

                    request.onsuccess = () => {
                        const record = request.result;
                        resolve(record?.blob || null);
                    };

                    request.onerror = () => reject(request.error || new Error("Unable to read media."));
                })
        );
    }

    function getPosts() {
        ensurePostsSeeded();
        const stored = safeParse(localStorage.getItem(POSTS_STORAGE_KEY), []);
        const normalized = enforcePublishingRules(stored);
        localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(normalized));
        return normalized;
    }

    function enforcePublishingRules(posts) {
        const sortedPosts = posts
            .map(normalizePost)
            .sort((postA, postB) => new Date(postB.publishedAt) - new Date(postA.publishedAt));
        const now = Date.now();
        let liveSlotsUsed = 0;

        return sortedPosts.map((post) => {
            if (post.status !== "published") {
                return post;
            }

            const publishedTime = new Date(post.publishedAt).getTime();
            const minutesSincePublish = (now - publishedTime) / 60000;
            const shouldArchiveForAge = Number.isFinite(minutesSincePublish) && minutesSincePublish > LIVE_POST_WINDOW_MINUTES;
            const shouldArchiveForCount = liveSlotsUsed >= LIVE_POST_LIMIT;

            if (shouldArchiveForAge || shouldArchiveForCount) {
                return {
                    ...post,
                    status: "archived",
                    updatedAt: getNowIso()
                };
            }

            liveSlotsUsed += 1;
            return post;
        });
    }

    function savePosts(posts) {
        const normalized = enforcePublishingRules(posts);
        localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(normalized));
        return normalized;
    }

    function getPublishedPosts() {
        return getPosts().filter((post) => post.status === "published");
    }

    function getArchivedPosts() {
        return getPosts().filter((post) => post.status === "archived");
    }

    function getPostById(postId) {
        return getPosts().find((post) => post.id === Number(postId)) || null;
    }

    function getPostBySlug(slug) {
        return getPosts().find((post) => post.slug === slug) || null;
    }

    function getNextPostId(posts) {
        return posts.reduce((maxId, post) => Math.max(maxId, Number(post.id) || 0), 0) + 1;
    }

    function createPost(postInput) {
        let posts = getPosts();
        const nowIso = getNowIso();
        const newPost = normalizePost({
            ...postInput,
            id: getNextPostId(posts),
            publishedAt: postInput.publishedAt || nowIso,
            updatedAt: nowIso
        });

        if (newPost.featured) {
            posts = posts.map((post) => ({
                ...post,
                featured: false
            }));
        }

        posts.unshift(newPost);
        savePosts(posts);
        return newPost;
    }

    function updatePost(postId, postInput) {
        const posts = getPosts();
        const postIndex = posts.findIndex((post) => post.id === Number(postId));

        if (postIndex === -1) {
            return null;
        }

        const existingPost = posts[postIndex];
        const nextStatus = postInput.status ? String(postInput.status) : existingPost.status;
        const shouldRefreshPublishDate = existingPost.status === "archived" && nextStatus === "published";
        const nextPublishedAt = postInput.publishedAt || (shouldRefreshPublishDate ? getNowIso() : existingPost.publishedAt);
        const updatedPost = normalizePost({
            ...existingPost,
            ...postInput,
            id: existingPost.id,
            slug: postInput.slug || slugify(postInput.title || existingPost.title),
            publishedAt: nextPublishedAt,
            updatedAt: getNowIso()
        });

        if (updatedPost.featured) {
            posts.forEach((post, index) => {
                if (post.id !== updatedPost.id) {
                    posts[index] = {
                        ...post,
                        featured: false
                    };
                }
            });
        }

        posts.splice(postIndex, 1, updatedPost);
        savePosts(posts);
        return updatedPost;
    }

    function deletePost(postId) {
        const posts = getPosts().filter((post) => post.id !== Number(postId));
        savePosts(posts);
    }

    function togglePostStatus(postId) {
        const post = getPostById(postId);

        if (!post) {
            return null;
        }

        return updatePost(postId, {
            status: post.status === "published" ? "archived" : "published"
        });
    }

    function setFeaturedPost(postId) {
        const targetId = Number(postId);
        const posts = getPosts().map((post) => ({
            ...post,
            featured: post.id === targetId
        }));
        savePosts(posts);
        return posts.find((post) => post.id === targetId) || null;
    }

    function getAdminConfig() {
        const stored = safeParse(localStorage.getItem(ADMIN_CONFIG_STORAGE_KEY), DEFAULT_ADMIN_CONFIG);
        return {
            ...DEFAULT_ADMIN_CONFIG,
            ...stored
        };
    }

    function setAdminPasscode(passcode) {
        const nextConfig = {
            ...getAdminConfig(),
            passcode: String(passcode || "").trim() || DEFAULT_ADMIN_CONFIG.passcode
        };

        localStorage.setItem(ADMIN_CONFIG_STORAGE_KEY, JSON.stringify(nextConfig));
        return nextConfig;
    }

    function verifyAdminPasscode(passcode) {
        return String(passcode || "") === getAdminConfig().passcode;
    }

    function openAdminSession() {
        sessionStorage.setItem(ADMIN_SESSION_KEY, "open");
    }

    function closeAdminSession() {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }

    function hasAdminSession() {
        return sessionStorage.getItem(ADMIN_SESSION_KEY) === "open";
    }

    function getVisitorId() {
        let visitorId = localStorage.getItem(VISITOR_STORAGE_KEY);

        if (!visitorId) {
            visitorId = `visitor-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
            localStorage.setItem(VISITOR_STORAGE_KEY, visitorId);
        }

        return visitorId;
    }

    function getAnalyticsStore() {
        const stored = safeParse(localStorage.getItem(ANALYTICS_STORAGE_KEY), { visits: [] });
        return {
            visits: Array.isArray(stored.visits) ? stored.visits : []
        };
    }

    function saveAnalyticsStore(store) {
        localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(store));
    }

    function trackVisit(pageName) {
        const sessionKey = `daily-affairs.page-visit.${pageName}`;

        if (sessionStorage.getItem(sessionKey)) {
            return;
        }

        sessionStorage.setItem(sessionKey, "recorded");

        const store = getAnalyticsStore();
        store.visits.push({
            page: String(pageName || "unknown"),
            visitorId: getVisitorId(),
            timestamp: getNowIso()
        });
        saveAnalyticsStore(store);
    }

    function summarizeVisits(referenceDate) {
        const now = referenceDate ? new Date(referenceDate) : new Date();
        const windows = [
            { key: "daily", label: "Daily", days: 1 },
            { key: "weekly", label: "Weekly", days: 7 },
            { key: "monthly", label: "Monthly", days: 30 },
            { key: "quarterly", label: "Quarterly", days: 90 },
            { key: "yearly", label: "Yearly", days: 365 }
        ];
        const visits = getAnalyticsStore().visits.filter((visit) => !Number.isNaN(new Date(visit.timestamp).getTime()));

        return windows.map((windowInfo) => {
            const rangeStart = now.getTime() - windowInfo.days * 24 * 60 * 60 * 1000;
            const matchingVisits = visits.filter((visit) => new Date(visit.timestamp).getTime() >= rangeStart);
            const uniqueVisitors = new Set(matchingVisits.map((visit) => visit.visitorId)).size;

            return {
                ...windowInfo,
                pageViews: matchingVisits.length,
                uniqueVisitors
            };
        });
    }

    function formatDisplayDate(isoString) {
        const date = new Date(isoString);

        return new Intl.DateTimeFormat("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }).format(date);
    }

    function getMinutesAgo(isoString) {
        const difference = Date.now() - new Date(isoString).getTime();
        return Math.max(1, Math.round(difference / 60000));
    }

    window.NewsroomStore = {
        getPosts,
        savePosts,
        getPublishedPosts,
        getArchivedPosts,
        getPostById,
        getPostBySlug,
        createPost,
        updatePost,
        deletePost,
        togglePostStatus,
        setFeaturedPost,
        slugify,
        getAdminConfig,
        setAdminPasscode,
        verifyAdminPasscode,
        openAdminSession,
        closeAdminSession,
        hasAdminSession,
        trackVisit,
        summarizeVisits,
        formatDisplayDate,
        getMinutesAgo,
        getLiveDeskSettings,
        setLiveDeskSettings,
        clearLiveDeskSettings,
        getLiveTickerItems,
        setLiveTickerItems,
        clearLiveTickerItems,
        getArchiveTickerItems,
        setArchiveTickerItems,
        clearArchiveTickerItems,
        saveMediaFile,
        getMediaBlob
    };
})();
