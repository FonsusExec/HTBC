const donationItems = [
    {
        id: "outreach-charity",
        title: "Outreach & Charity Programs",
        desc: "Support our mission to feed the hungry, care for the sick, and assist vulnerable families in our local community.",
        detail:
            "Our Outreach & Charity Programs are a reflection of Christ's compassion in action. We are devoted to extending practical help and spiritual hope through food drives, medical aid, clothing donations, and community support initiatives. Every contribution helps bring love, dignity, and restoration to those who need it most.",
        img: require("../../assets/img/htbc-donate1.png"),
    },
    {
        id: "parish-maintenance",
        title: "Parish Maintenance & Upkeep",
        desc: "Help us maintain a welcoming, prayerful space by supporting ongoing repairs, utilities, and beautification of the church grounds.",
        detail:
            "Your gift helps keep the parish safe, beautiful, and ready for worship. Donations support repairs, utilities, cleaning, grounds care, and the small daily needs that make our church a welcoming home for prayer, celebration, and community life.",
        img: require("../../assets/img/htbc-donate2.png"),
    },
    {
        id: "youth-faith-formation",
        title: "Youth & Faith Formation",
        desc: "Invest in the future of the Church by funding youth programs, catechism classes, retreats, and spiritual education.",
        detail:
            "Support young people and families as they grow in faith. Contributions help provide catechism materials, retreats, youth ministry events, formation classes, and spiritual education resources that nurture the next generation of Catholic disciples.",
        img: require("../../assets/img/htbc-donate3.png"),
    },
    {
        id: "parish-announcements",
        title: "Parish Announcements",
        desc: "Help us communicate important parish updates, schedules, and community notices clearly and consistently.",
        detail:
            "This fund supports the practical tools that keep parishioners informed, including printed materials, digital communication, bulletin support, and outreach for major parish events and announcements.",
        img: require("../../assets/img/htbc-news2.png"),
    },
    {
        id: "faith-in-action",
        title: "Faith in Action",
        desc: "Support parish-led service projects that turn prayer into practical help for neighbors in need.",
        detail:
            "Faith in Action supports hands-on ministry projects, volunteer coordination, community assistance, and special service efforts that allow parishioners to live the Gospel through concrete works of mercy.",
        img: require("../../assets/img/htbc-news3.png"),
    },
    {
        id: "community-ministry",
        title: "Community Ministry",
        desc: "Strengthen fellowship, pastoral care, and parish gatherings that help our community grow together.",
        detail:
            "Your donation helps create moments of belonging through parish gatherings, pastoral programs, ministry support, and community-building activities that welcome people into deeper fellowship.",
        img: require("../../assets/img/blog-htbc4.png"),
    },
];

export const findDonationItemById = (id) => donationItems.find((item) => item.id === id);

export const getDonationItemById = (id) => findDonationItemById(id) || donationItems[0];

export default donationItems;
