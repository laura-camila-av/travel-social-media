const activities = [
    { name: "Hiking at Mount Fuji", desc: "A full day hike up to the 5th station. Bring warm layers even in summer." },
    { name: "Visit Senso-ji Temple", desc: "Tokyo's oldest temple in Asakusa. Go early to avoid crowds." },
    { name: "Shibuya Crossing", desc: "Walk the world's busiest pedestrian crossing. Best at rush hour." },
    { name: "TeamLab Planets", desc: "Immersive digital art museum. Book tickets in advance online." }
];

const dining = [
    { name: "Ichiran Ramen", desc: "Solo dining ramen chain. Get the tonkotsu — queue early as it fills up fast." },
    { name: "Tsukiji Outer Market", desc: "Fresh sushi and street food. Go for breakfast, most stalls close by midday." },
    { name: "Shibuya Stream Bar", desc: "Rooftop bar with views of the crossing. Cocktails are pricey but worth it." },
    { name: "Conveyor Belt Sushi", desc: "Cheap and fun. Look for Sushiro or Kura Sushi chains for best value." }
];

const transport = [
    { name: "Train", desc: "Get a Suica card from any airport machine — tap on and off at every gate. Covers trains, subway and even some convenience stores." },
    { name: "Uber", desc: "Works just like home but can be pricier than trains. Best for late nights or when carrying heavy luggage between areas." }
];

let currentActivity = 0;
let currentDining = 0;
let currentTransport = 0;

let activityExpanded = false;
let diningExpanded = false;
let transportExpanded = false;

function collapseAll() {
    activityExpanded = false;
    $('.activities-collapsed').show();
    $('.activities-expanded').hide();

    diningExpanded = false;
    $('.dining-collapsed').show();
    $('.dining-expanded').hide();

    transportExpanded = false;
    $('.transport-collapsed').show();
    $('.transport-expanded').hide();
}

$('#activities-box').click(function() {
    if (!activityExpanded) {
        collapseAll();
        activityExpanded = true;
        showActivity(currentActivity);
        $('.activities-collapsed').hide();
        $('.activities-expanded').show();
    }
});

$('#dining-box').click(function() {
    if (!diningExpanded) {
        collapseAll();
        diningExpanded = true;
        showDining(currentDining);
        $('.dining-collapsed').hide();
        $('.dining-expanded').show();
    }
});

$('#transport-box').click(function() {
    if (!transportExpanded) {
        collapseAll();
        transportExpanded = true;
        showTransport(currentTransport);
        $('.transport-collapsed').hide();
        $('.transport-expanded').show();
    }
});

$('#prev-activity').click(function(e) {
    e.stopPropagation();
    currentActivity = (currentActivity - 1 + activities.length) % activities.length;
    showActivity(currentActivity);
});

$('#next-activity').click(function(e) {
    e.stopPropagation();
    currentActivity = (currentActivity + 1) % activities.length;
    showActivity(currentActivity);
});

$('#prev-dining').click(function(e) {
    e.stopPropagation();
    currentDining = (currentDining - 1 + dining.length) % dining.length;
    showDining(currentDining);
});

$('#next-dining').click(function(e) {
    e.stopPropagation();
    currentDining = (currentDining + 1) % dining.length;
    showDining(currentDining);
});

$('#prev-transport').click(function(e) {
    e.stopPropagation();
    currentTransport = (currentTransport - 1 + transport.length) % transport.length;
    showTransport(currentTransport);
});

$('#next-transport').click(function(e) {
    e.stopPropagation();
    currentTransport = (currentTransport + 1) % transport.length;
    showTransport(currentTransport);
});

function showActivity(index) {
    $('.activity-name').text(activities[index].name);
    $('.activity-desc').text(activities[index].desc);
    updateDots('#activity-dots', activities.length, index);
}

function showDining(index) {
    $('.dining-name').text(dining[index].name);
    $('.dining-desc').text(dining[index].desc);
    updateDots('#dining-dots', dining.length, index);
}

function showTransport(index) {
    $('.transport-name').text(transport[index].name);
    $('.transport-desc').text(transport[index].desc);
    updateDots('#transport-dots', transport.length, index);
}

function updateDots(containerId, total, activeIndex) {
    const container = $(containerId);
    container.empty();
    for (let i = 0; i < total; i++) {
        const dot = $('<div class="dot"></div>');
        if (i === activeIndex) dot.addClass('active');
        container.append(dot);
    }
}