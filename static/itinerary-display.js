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