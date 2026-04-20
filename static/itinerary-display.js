const activities = [
    { name: "Hiking at Mount Fuji", desc: "A full day hike up to the 5th station. Bring warm layers even in summer." },
    { name: "Visit Senso-ji Temple", desc: "Tokyo's oldest temple in Asakusa. Go early to avoid crowds." },
    { name: "Shibuya Crossing", desc: "Walk the world's busiest pedestrian crossing. Best at rush hour." },
    { name: "TeamLab Planets", desc: "Immersive digital art museum. Book tickets in advance online." }
];

let currentActivity = 0;
let expanded = false;

$('#activities-box').click(function() {
    if (!expanded) {
        expanded = true;
        showActivity(0);
        $('.activities-collapsed').hide();
        $('.activities-expanded').show();
    }
});

$('#prev-activity').click(function(e) {
    e.stopPropagation(); // stops the box click firing too
    currentActivity = (currentActivity - 1 + activities.length) % activities.length;
    showActivity(currentActivity);
});

$('#next-activity').click(function(e) {
    e.stopPropagation();
    currentActivity = (currentActivity + 1) % activities.length;
    showActivity(currentActivity);
});

function showActivity(index) {
    $('.activity-name').text(activities[index].name);
    $('.activity-desc').text(activities[index].desc);
}

const dining = [
    { name: "Ichiran Ramen", desc: "Solo dining ramen chain. Get the tonkotsu — queue early as it fills up fast." },
    { name: "Tsukiji Outer Market", desc: "Fresh sushi and street food. Go for breakfast, most stalls close by midday." },
    { name: "Shibuya Stream Bar", desc: "Rooftop bar with views of the crossing. Cocktails are pricey but worth it." },
    { name: "Conveyor Belt Sushi", desc: "Cheap and fun. Look for Sushiro or Kura Sushi chains for best value." }
];

let currentDining = 0;
let diningExpanded = false;

$('#dining-box').click(function() {
    if (!diningExpanded) {
        diningExpanded = true;
        showDining(0);
        $('.dining-collapsed').hide();
        $('.dining-expanded').show();
    }
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

function showDining(index) {
    $('.dining-name').text(dining[index].name);
    $('.dining-desc').text(dining[index].desc);
}

const transport = [
    { name: "Train", desc: "Get a Suica card from any airport machine — tap on and off at every gate. Covers trains, subway and even some convenience stores." },
    { name: "Uber", desc: "Works just like home but can be pricier than trains. Best for late nights or when carrying heavy luggage between areas." }
];

let currentTransport = 0;
let transportExpanded = false;

$('#transport-box').click(function() {
    if (!transportExpanded) {
        transportExpanded = true;
        showTransport(0);
        $('.transport-collapsed').hide();
        $('.transport-expanded').show();
    }
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

function showTransport(index) {
    $('.transport-name').text(transport[index].name);
    $('.transport-desc').text(transport[index].desc);
}