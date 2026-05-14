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


    const likeButton = document.getElementById("likeButton");
    const likeIcon = document.getElementById("likeIcon");
    const likeCount = document.getElementById("likeCount");
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

    likeButton.addEventListener("click", async function () {
        const itineraryId = likeButton.dataset.itineraryId;

        const response = await fetch(`/api/like/${itineraryId}`, {
            method: "POST",
            headers: {
                "X-CSRFToken": csrfToken
            }
        });

        if (response.status === 401) {
            window.location.href = "/login";
            return;
        }

        const data = await response.json();

        if (data.liked) {
            likeButton.classList.add("liked");
            likeIcon.classList.remove("fa-regular");
            likeIcon.classList.add("fa-solid");
        } else {
            likeButton.classList.remove("liked");
            likeIcon.classList.remove("fa-solid");
            likeIcon.classList.add("fa-regular");
        }

        likeCount.textContent = data.like_count === 1
            ? "1 like"
            : data.like_count + " likes";
    });

    const saveButton = document.getElementById("saveButton");
    const saveIcon = document.getElementById("saveIcon");

    if (saveButton) {
        saveButton.addEventListener("click", async function () {
            const itineraryId = saveButton.dataset.itineraryId;

            const response = await fetch(`/api/save/${itineraryId}`, {
                method: "POST",
                headers: {
                    "X-CSRFToken": csrfToken
                }
            });

            if (response.status === 401) {
                window.location.href = "/login";
                return;
            }

            const data = await response.json();

            if (data.saved) {
                saveButton.classList.add("saved");
                saveIcon.classList.remove("fa-regular");
                saveIcon.classList.add("fa-solid");
            } else {
                saveButton.classList.remove("saved");
                saveIcon.classList.remove("fa-solid");
                saveIcon.classList.add("fa-regular");
            }
        });
    }
 

 
    const sharecsrfToken = document.querySelector('meta[name="csrf-token"]').content;
    const shareButton = document.getElementById("shareButton");
    const shareModal = document.getElementById("shareModal");
    const shareUserSelect = document.getElementById("shareUserSelect");
    const shareMessage = document.getElementById("shareMessage");
    const shareSendBtn = document.getElementById("shareSendBtn");
    const shareCancelBtn = document.getElementById("shareCancelBtn");
    const shareItineraryTitle = document.getElementById("shareItineraryTitle");
    console.log("shareButton:", shareButton);
    console.log("shareSendBtn:", shareSendBtn);

    // open modal and load users
    shareButton.addEventListener("click", async function() {
        const itineraryId = shareButton.dataset.itineraryId;
        const itineraryTitle = shareButton.dataset.itineraryTitle;

        shareItineraryTitle.textContent = itineraryTitle;
        shareModal.classList.remove("hidden");

        // load followed users into dropdown
        const response = await fetch("/api/followed-users");
        const users = await response.json();

        shareUserSelect.innerHTML = '<option value="">Select a user...</option>';
        users.forEach(user => {
            const option = document.createElement("option");
            option.value = user.id;
            option.textContent = user.username;
            shareUserSelect.appendChild(option);
        });
    });

    // close modal
    shareCancelBtn.addEventListener("click", function() {
        shareModal.classList.add("hidden");
        shareMessage.value = "";
        shareUserSelect.value = "";
    });

    // send the itinerary
    shareSendBtn.addEventListener("click", async function() {
        console.log("send clicked");
        const receiverId = shareUserSelect.value;
        const message = shareMessage.value.trim();
        const itineraryId = shareButton.dataset.itineraryId;
        const itineraryTitle = shareButton.dataset.itineraryTitle;

        console.log("receiverId:", receiverId);
        console.log("itineraryId:", itineraryId);

        if (!receiverId) {
            alert("Please select a user to send to.");
            return;
        }

        const formattedText = `[ITINERARY:${itineraryId}:${itineraryTitle}]${message ? '\n' + message : ''}`;
        console.log("formattedText:", formattedText);
        console.log("about to fetch");

        const response = await fetch("/api/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": sharecsrfToken
            },
        body: JSON.stringify({
            receiver_id: parseInt(receiverId),
            text: formattedText
        })
        });

        if (response.ok) {
            shareModal.classList.add("hidden");
            shareMessage.value = "";
            shareUserSelect.value = "";
            window.location.href = `/messages`;
        } else {
            alert("Failed to send. Please try again.");
        }
    });
 