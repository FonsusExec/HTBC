const shopImages = [
    require("../assets/img/htbc-shop1.png"),
    require("../assets/img/htbc-shop2.png"),
    require("../assets/img/htbc-shop3.png"),
    require("../assets/img/htbc-shop4.png"),
];

const blogImages = [
    require("../assets/img/blog-htbc1.png"),
    require("../assets/img/blog-htbc2.png"),
    require("../assets/img/blog-htbc3.png"),
    require("../assets/img/blog-htbc4.png"),
];

const newsImages = [
    require("../assets/img/htbc-new1.png"),
    require("../assets/img/htbc-news2.png"),
    require("../assets/img/htbc-news3.png"),
    require("../assets/img/htbc-news4.png"),
];

const donateImages = [
    require("../assets/img/htbc-donate1.png"),
    require("../assets/img/htbc-donate2.png"),
    require("../assets/img/htbc-donate3.png"),
];

const teamImages = [
    require("../assets/img/blog-htbc1.png"),
    require("../assets/img/htbc-new1.png"),
    require("../assets/img/blog-htbc2.png"),
];

export const demoProducts = [
    {
        _id: "demo-product-necklace",
        htbc: "demo-st-anthony-necklace",
        title: "Sterling Silver St Anthony Necklace",
        price: 70,
        stock: 12,
        category: {name: "Devotional"},
        image: shopImages[0],
        images: [shopImages[0]],
        description: "A meaningful devotional necklace selected for everyday prayer and encouragement.",
        createdAt: "2026-06-01T10:00:00.000Z",
    },
    {
        _id: "demo-product-rosary",
        htbc: "demo-rosary",
        title: "Rosary (Strong Greater Strength)",
        price: 20,
        stock: 18,
        category: {name: "Prayer"},
        image: shopImages[1],
        images: [shopImages[1]],
        description: "A classic rosary for quiet prayer, reflection, and daily devotion.",
        createdAt: "2026-05-28T10:00:00.000Z",
    },
    {
        _id: "demo-product-bible",
        htbc: "demo-catholic-study-bible",
        title: "Holy Bible (The New Version 2.0)",
        price: 65,
        stock: 7,
        category: {name: "Books"},
        image: shopImages[2],
        images: [shopImages[2]],
        description: "A Catholic study Bible with notes and guidance for deeper scripture reading.",
        createdAt: "2026-05-20T10:00:00.000Z",
    },
    {
        _id: "demo-product-book",
        htbc: "demo-prayer-book",
        title: "Catholic Prayer Companion",
        price: 32,
        stock: 9,
        category: {name: "Books"},
        image: shopImages[3],
        images: [shopImages[3]],
        description: "A compact companion for personal prayer, family devotion, and parish life.",
        createdAt: "2026-05-12T10:00:00.000Z",
    },
];

export const demoBlogs = [
    {
        _id: "demo-blog-faith",
        title: "Faith Reflections for Ordinary Days",
        category: "Reflection",
        imageUrl: blogImages[0],
        excerpt: "A simple reflection on finding Christ in daily routines, quiet moments, and small acts of love.",
        content: "<p>Faith often grows in ordinary places: a patient word, a prayer whispered before work, or a moment of mercy when it would be easier to turn away.</p><p>This demo reflection shows how the blog detail page will read once live posts are available.</p>",
        createdAt: "2026-06-06T09:00:00.000Z",
        metaDescription: "A demo reflection for previewing the blog page.",
        keywords: ["faith", "reflection", "prayer"],
    },
    {
        _id: "demo-blog-prayer",
        title: "Building a Prayer Rhythm",
        category: "Formation",
        imageUrl: blogImages[1],
        excerpt: "Small, steady prayer habits can shape the heart over time.",
        content: "<p>A prayer rhythm does not need to be complicated. Begin with a time, a place, and a sincere desire to meet God.</p>",
        createdAt: "2026-05-30T09:00:00.000Z",
    },
    {
        _id: "demo-blog-community",
        title: "The Grace of Parish Community",
        category: "Community",
        imageUrl: blogImages[2],
        excerpt: "Parish life teaches us that faith is not meant to be lived alone.",
        content: "<p>Community gives faith a home. It surrounds us with people who pray, serve, encourage, and keep walking with us.</p>",
        createdAt: "2026-05-22T09:00:00.000Z",
    },
];

export const demoNews = [
    {
        _id: "demo-news-retreat",
        title: "Parish Retreat Weekend Announced",
        source: "How To Be Catholic",
        imageUrl: newsImages[0],
        description: "Registration is open for a weekend of prayer, teaching, and fellowship.",
        content: "The parish retreat weekend will include Mass, guided prayer, talks, and time for community. This demo article previews the news detail layout.",
        pubDate: "2026-06-08T08:00:00.000Z",
        createdAt: "2026-06-08T08:00:00.000Z",
    },
    {
        _id: "demo-news-outreach",
        title: "Outreach Team Prepares Summer Service Drive",
        source: "How To Be Catholic",
        imageUrl: newsImages[1],
        description: "Volunteers are gathering supplies and planning visits for families in need.",
        content: "The summer service drive brings parishioners together to support neighbors through practical help and prayer.",
        pubDate: "2026-06-03T08:00:00.000Z",
        createdAt: "2026-06-03T08:00:00.000Z",
    },
    {
        _id: "demo-news-youth",
        title: "Youth Formation Night Returns",
        source: "How To Be Catholic",
        imageUrl: newsImages[2],
        description: "Young people are invited for worship, discussion, and community.",
        content: "Youth formation nights help young Catholics grow in friendship, faith, and confidence.",
        pubDate: "2026-05-27T08:00:00.000Z",
        createdAt: "2026-05-27T08:00:00.000Z",
    },
];

export const demoResources = [
    {_id: "demo-resource-prayer", title: "Prayer Guidance", link: "https://example.com/prayer-guide", createdAt: "2026-06-07T10:00:00.000Z"},
    {_id: "demo-resource-family", title: "Family Faith Guide", link: "https://example.com/family-faith", createdAt: "2026-05-31T10:00:00.000Z"},
    {_id: "demo-resource-study", title: "Scripture Study Notes", link: "https://example.com/scripture-notes", createdAt: "2026-05-24T10:00:00.000Z"},
    {_id: "demo-resource-liturgy", title: "Liturgy Companion", link: "https://example.com/liturgy", createdAt: "2026-05-17T10:00:00.000Z"},
];

export const demoImpactStories = [
    {
        _id: "demo-impact-give",
        title: "Give and you shall receive",
        imageUrl: donateImages[0],
        description: "Support parish outreach that brings food, prayer, and practical care to families who need encouragement.",
        createdAt: "2026-06-05T10:00:00.000Z",
    },
    {
        _id: "demo-impact-faith",
        title: "Testimony and Faith",
        imageUrl: donateImages[1],
        description: "Help create formation moments where people can encounter Christ through teaching, worship, and community.",
        createdAt: "2026-05-29T10:00:00.000Z",
    },
    {
        _id: "demo-impact-youth",
        title: "Youth Formation Support",
        imageUrl: donateImages[2],
        description: "Your gift helps young people attend retreats, receive materials, and grow in the Catholic faith.",
        createdAt: "2026-05-21T10:00:00.000Z",
    },
];

export const demoAbout = {
    page: {
        heroTitle: "About Us",
        heroImageUrl: require("../assets/img/htba-background.jpg"),
        missionText:
            "Our mission is to bring the light of Christ into every heart, home, and community we serve. Rooted in the Catholic faith, we are dedicated to sharing the Gospel with love, humility, and courage.",
    },
    teamMembers: [
        {id: "demo-team-1", name: "Fr. Paul Austin", role: "Pastor", bio: "Guiding the parish through prayer, teaching, and pastoral care.", imageUrl: teamImages[0]},
        {id: "demo-team-2", name: "Maria Johnson", role: "Community Lead", bio: "Helping parishioners connect, serve, and grow together.", imageUrl: teamImages[1]},
        {id: "demo-team-3", name: "Daniel Okafor", role: "Formation Coordinator", bio: "Supporting faith formation through classes, resources, and events.", imageUrl: teamImages[2]},
    ],
    testimonials: [
        {
            id: "demo-testimonial-1",
            name: "Peter Autibell",
            role: "Parish Member",
            quote: "The community has helped me pray more deeply and feel truly at home in the Church.",
            imageUrl: newsImages[3],
        },
    ],
};

export const demoEvents = [
    {
        _id: "demo-event-retreat",
        title: "Parish Prayer Retreat",
        description: "A morning of Mass, reflection, and quiet prayer for the whole community.",
        startDate: "2026-07-11T10:00:00.000Z",
        location: "Main Parish Hall",
        isOnline: false,
        capacity: 80,
        rsvpCount: 24,
    },
    {
        _id: "demo-event-webinar",
        title: "Catholic Living Webinar",
        description: "A practical online discussion about living the faith at home and work.",
        startDate: "2026-07-18T18:30:00.000Z",
        location: "",
        isOnline: true,
        capacity: 120,
        rsvpCount: 42,
    },
];

export const demoComments = {
    "blog:demo-blog-faith": [
        {
            _id: "demo-comment-blog-1",
            name: "Angela",
            body: "This reflection is a helpful reminder to notice grace in ordinary moments.",
            likes: 3,
            dislikes: 0,
            createdAt: "2026-06-09T10:00:00.000Z",
            replies: [],
        },
    ],
    "news:demo-news-retreat": [
        {
            _id: "demo-comment-news-1",
            name: "Michael",
            body: "Looking forward to the retreat weekend.",
            likes: 2,
            dislikes: 0,
            createdAt: "2026-06-09T12:00:00.000Z",
            replies: [],
        },
    ],
};

export const getDemoProductByRouteId = (id) => demoProducts.find((product) => product._id === id || product.htbc === id || product.id === id);
export const getDemoBlogById = (id) => demoBlogs.find((post) => post._id === id);
export const getDemoNewsById = (id) => demoNews.find((article) => article._id === id);
export const getDemoImpactStoryById = (id) => demoImpactStories.find((story) => story._id === id);
export const getDemoComments = (contentType, contentId) => demoComments[`${contentType}:${contentId}`] || [];
