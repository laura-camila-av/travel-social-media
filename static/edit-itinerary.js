// Set by the inline <script> in edit-itinerary.html before this file loads
// const ITINERARY_DATA = { ... };

let currentDay = 1;
let totalDays = 0;
let selectedPhotosByDay = {};
let photoDataTransferByDay = {};

// ── Day section generation ────────────────────────────────────────────────────

function generateDays() {
    const startDateInput = document.getElementById("start-date").value;
    const endDateInput = document.getElementById("end-date").value;
    const daysContainer = document.getElementById("days-container");

    daysContainer.innerHTML = "";

    if (!startDateInput || !endDateInput) {
        alert("Please enter both a start date and an end date.");
        return;
    }

    const startDate = new Date(startDateInput);
    const endDate = new Date(endDateInput);

    if (endDate < startDate) {
        alert("End date cannot be earlier than start date.");
        return;
    }

    const dayCount = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    // Edit mode: keep trip-details-section visible (unlike create mode)

    for (let i = 1; i <= dayCount; i++) {
        const daySection = document.createElement("section");
        daySection.classList.add("day-section");
        daySection.innerHTML = `
            <div class="field-grid" id="field-grid-day${i}">
                <div class="itinerary-detail-box" id="tile-activities-day${i}" onclick="expandField('activities', ${i})">
                    <div class="detail-icon-panel"><i class="fa-solid fa-camera"></i></div>
                    <div class="detail-content">
                        <h3 class="tile-title">Activities</h3>
                        <p class="tile-hint" id="hint-activities-day${i}">Add places and things you did</p>
                        <div class="tile-preview" id="preview-activities-day${i}"></div>
                    </div>
                </div>
                <div class="itinerary-detail-box" id="tile-dining-day${i}" onclick="expandField('dining', ${i})">
                    <div class="detail-icon-panel"><i class="fa-solid fa-utensils"></i></div>
                    <div class="detail-content">
                        <h3 class="tile-title">Dining</h3>
                        <p class="tile-hint" id="hint-dining-day${i}">Add restaurants, cafes, or meals</p>
                        <div class="tile-preview" id="preview-dining-day${i}"></div>
                    </div>
                </div>
                <div class="itinerary-detail-box" id="tile-transport-day${i}" onclick="expandField('transport', ${i})">
                    <div class="detail-icon-panel"><i class="fa-solid fa-car"></i></div>
                    <div class="detail-content">
                        <h3 class="tile-title">Transport</h3>
                        <p class="tile-hint" id="hint-transport-day${i}">Type how you travelled</p>
                        <div class="tile-preview" id="preview-transport-day${i}"></div>
                    </div>
                </div>
                <div class="itinerary-detail-box" id="tile-accommodation-day${i}" onclick="expandField('accommodation', ${i})">
                    <div class="detail-icon-panel"><i class="fa-solid fa-bed"></i></div>
                    <div class="detail-content">
                        <h3 class="tile-title">Accommodation</h3>
                        <p class="tile-hint" id="hint-accommodation-day${i}">Add hotel or stay details</p>
                        <div class="tile-preview" id="preview-accommodation-day${i}"></div>
                    </div>
                </div>
                <div class="itinerary-detail-box" id="tile-cost-day${i}" onclick="expandField('cost', ${i})">
                    <div class="detail-icon-panel"><i class="fa-solid fa-dollar-sign"></i></div>
                    <div class="detail-content">
                        <h3 class="tile-title">Cost</h3>
                        <p class="tile-hint" id="hint-cost-day${i}">Enter total spent for this day</p>
                        <div class="tile-preview" id="preview-cost-day${i}"></div>
                    </div>
                </div>
                <div class="itinerary-detail-box" id="tile-rented-day${i}" onclick="expandField('rented', ${i})">
                    <div class="detail-icon-panel"><i class="fa-solid fa-person-skiing"></i></div>
                    <div class="detail-content">
                        <h3 class="tile-title">Rented Items</h3>
                        <p class="tile-hint" id="hint-rented-day${i}">List anything you hired or rented</p>
                        <div class="tile-preview" id="preview-rented-day${i}"></div>
                    </div>
                </div>
                <div class="itinerary-detail-box" id="tile-photo-day${i}" onclick="expandField('photo', ${i})">
                    <div class="detail-icon-panel"><i class="fa-solid fa-image"></i></div>
                    <div class="detail-content">
                        <h3 class="tile-title">Photo</h3>
                        <p class="tile-hint" id="hint-photo-day${i}">Upload an image and caption</p>
                        <div class="tile-preview" id="preview-photo-day${i}"></div>
                    </div>
                </div>
            </div>

            <div class="field-expanded hidden" id="expanded-day${i}">
                <div class="field-expanded-header">
                    <button type="button" class="exit-field-btn" onclick="exitField(${i})">Exit field</button>
                </div>
                <div class="expanded-content" id="expanded-content-day${i}"></div>
            </div>

            <div class="field-forms hidden" id="forms-day${i}">
                <div id="form-activities-day${i}">
                    <div class="activity-input-area" id="activity-input-area-day${i}">
                        <ul class="activity-list" id="activity-list-day${i}"></ul>
                        <input type="text" class="activity-input" id="activity-input-day${i}" placeholder="Type an activity and press Enter">
                    </div>
                    <div class="activity-details-grid" id="activity-details-day${i}"></div>
                </div>
                <div id="form-dining-day${i}">
                    <div class="activity-input-area" id="dining-input-area-day${i}">
                        <ul class="activity-list" id="dining-list-day${i}"></ul>
                        <input type="text" class="activity-input" id="dining-input-day${i}" placeholder="Type a restaurant and press Enter">
                    </div>
                    <div class="activity-details-grid" id="dining-details-day${i}"></div>
                </div>
                <div id="form-transport-day${i}">
                    <div class="activity-input-area" id="transport-input-area-day${i}">
                        <ul class="activity-list" id="transport-list-day${i}"></ul>
                        <input type="text" class="activity-input" id="transport-input-day${i}" placeholder="Type a transport and press Enter">
                    </div>
                    <div class="activity-details-grid" id="transport-details-day${i}"></div>
                </div>
                <div id="form-accommodation-day${i}">
                    <input type="text" id="accommodation-day${i}" name="accommodation-day${i}" placeholder="Enter accommodation name and address">
                </div>
                <div id="form-cost-day${i}">
                    <input type="number" id="cost-day${i}" name="cost-day${i}" min="0" step="0.01" placeholder="Enter total cost for the day">
                </div>
                <div id="form-rented-day${i}">
                    <div class="activity-input-area" id="rented-input-area-day${i}">
                        <ul class="activity-list" id="rented-list-day${i}"></ul>
                        <input type="text" class="activity-input" id="rented-input-day${i}" placeholder="Type a rented item and press Enter">
                    </div>
                    <div class="activity-details-grid" id="rented-details-day${i}"></div>
                </div>
                <div id="form-photo-day${i}">
                    <div id="existing-photos-day${i}"></div>
                    <label for="photos-day${i}" class="btn btn-itinerary-form">Add New Photos</label>
                    <input type="file" id="photos-day${i}" name="photos-day${i}" accept="image/*" class="file-input" multiple>
                    <div id="file-list-day${i}" class="file-list">
                        <p class="file-placeholder">No new files chosen</p>
                    </div><br>
                    <textarea id="caption-day${i}" name="caption-day${i}" rows="3" placeholder="Enter a caption for your photos"></textarea>
                </div>
                <input type="hidden" id="activity-json-day${i}" name="activity-json-day${i}">
                <input type="hidden" id="dining-json-day${i}" name="dining-json-day${i}">
                <input type="hidden" id="transport-json-day${i}" name="transport-json-day${i}">
                <input type="hidden" id="rented-json-day${i}" name="rented-json-day${i}">
            </div>
        `;

        daysContainer.appendChild(daySection);

        selectedPhotosByDay[i] = [];
        photoDataTransferByDay[i] = new DataTransfer();

        const fileInput = daySection.querySelector(`#photos-day${i}`);
        fileInput.addEventListener("change", function () {
            Array.from(this.files).forEach(file => {
                if (!selectedPhotosByDay[i].some(f => f.name === file.name)) {
                    selectedPhotosByDay[i].push(file);
                    photoDataTransferByDay[i].items.add(file);
                }
            });
            fileInput.files = photoDataTransferByDay[i].files;
            renderNewPhotoList(i);
        });

        setupActivityInput(i);
        setupDiningInput(i);
        setupListInput(i, "transport");
        setupListInput(i, "rented");
    }

    totalDays = dayCount;

    const navBar = document.createElement("div");
    navBar.classList.add("day-nav-bar");
    navBar.id = "day-nav-bar";
    for (let j = 1; j <= dayCount; j++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.classList.add("day-nav-btn");
        btn.textContent = j;
        btn.onclick = () => showDay(j);
        navBar.appendChild(btn);
    }
    daysContainer.insertBefore(navBar, daysContainer.firstChild);

    setupBudgetListeners();
    showDay(1);
}

// ── Edit-specific: load existing data into the generated day sections ─────────

function initEditForm() {
    document.getElementById("trip-title").value = ITINERARY_DATA.title;
    document.getElementById("destination").value = ITINERARY_DATA.destination;
    document.getElementById("travel-style").value = ITINERARY_DATA.travel_style;
    document.getElementById("trip-budget").value = ITINERARY_DATA.budget !== null ? ITINERARY_DATA.budget : "";
    document.getElementById("start-date").value = ITINERARY_DATA.start_date;
    document.getElementById("end-date").value = ITINERARY_DATA.end_date;

    generateDays();

    ITINERARY_DATA.days.forEach(day => {
        const n = day.day_number;

        const get = id => document.getElementById(id);
        if (get(`accommodation-day${n}`))   get(`accommodation-day${n}`).value   = day.accommodation || "";
        if (get(`caption-day${n}`))         get(`caption-day${n}`).value         = day.caption || "";
        if (get(`cost-day${n}`))            get(`cost-day${n}`).value            = day.total_cost !== null ? day.total_cost : "";

        restoreDynamicList(n, "activity",  day.activity_details || []);
        restoreDynamicList(n, "dining",    day.dining_details   || []);
        restoreDynamicList(n, "transport", day.transport        || []);
        restoreDynamicList(n, "rented",    day.rented_items     || []);
        renderExistingPhotos(n, day.photos || []);

        ["activities","dining","transport","accommodation","cost","rented","photo"].forEach(field => {
            updateTilePreview(field, n);
        });
    });

    updateBudgetSummary();
}

function renderExistingPhotos(dayNum, photos) {
    const container = document.getElementById(`existing-photos-day${dayNum}`);
    if (!container || photos.length === 0) return;

    const heading = document.createElement("p");
    heading.textContent = "Existing photos:";
    heading.style.fontWeight = "bold";
    container.appendChild(heading);

    photos.forEach(photo => {
        const row = document.createElement("div");
        row.className = "file-row";
        row.id = `existing-photo-row-${photo.id}`;
        row.innerHTML = `
            <span>${photo.filename}</span>
            <button type="button" class="remove-photo-btn" onclick="markPhotoForDeletion(${photo.id}, ${dayNum})">✕</button>
        `;
        container.appendChild(row);
    });
}

function markPhotoForDeletion(photoId, dayNum) {
    const form = document.getElementById("itinerary-form");
    if (!form.querySelector(`input[name="delete_photo_ids"][value="${photoId}"]`)) {
        const hidden = document.createElement("input");
        hidden.type  = "hidden";
        hidden.name  = "delete_photo_ids";
        hidden.value = photoId;
        form.appendChild(hidden);
    }
    const row = document.getElementById(`existing-photo-row-${photoId}`);
    if (row) row.remove();
    updateTilePreview("photo", dayNum);
}

// ── Shared helpers (same logic as create-itinerary.js) ───────────────────────

function setupActivityInput(dayNum) {
    const input = document.getElementById(`activity-input-day${dayNum}`);
    const list  = document.getElementById(`activity-list-day${dayNum}`);
    const grid  = document.getElementById(`activity-details-day${dayNum}`);
    if (!input) return;
    let count = 0;
    input.addEventListener("keydown", function(e) {
        if (e.key !== "Enter") return;
        e.preventDefault();
        const value = this.value.trim();
        if (!value) return;
        count++;
        const id = `detail-day${dayNum}-act${count}`;
        const li = document.createElement("li");
        li.innerHTML = `${value} <span class="remove-activity" onclick="removeActivity('${id}', this);">✕</span>`;
        list.appendChild(li);
        const box = document.createElement("div");
        box.classList.add("activity-detail-box");
        box.id = id;
        box.innerHTML = `<p class="activity-detail-title">${value}</p><textarea id="${id}-textarea" placeholder="Enter details for ${value}..." rows="3"></textarea>`;
        grid.appendChild(box);
        this.value = "";
    });
}

function setupDiningInput(dayNum) {
    const input = document.getElementById(`dining-input-day${dayNum}`);
    const list  = document.getElementById(`dining-list-day${dayNum}`);
    const grid  = document.getElementById(`dining-details-day${dayNum}`);
    if (!input) return;
    let count = 0;
    input.addEventListener("keydown", function(e) {
        if (e.key !== "Enter") return;
        e.preventDefault();
        const value = this.value.trim();
        if (!value) return;
        count++;
        const id = `dining-detail-day${dayNum}-item${count}`;
        const li = document.createElement("li");
        li.innerHTML = `${value} <span class="remove-activity" onclick="removeActivity('${id}', this);">✕</span>`;
        list.appendChild(li);
        const box = document.createElement("div");
        box.classList.add("activity-detail-box");
        box.id = id;
        box.innerHTML = `<p class="activity-detail-title">${value}</p><textarea id="${id}-textarea" placeholder="Enter details for ${value}..." rows="3"></textarea>`;
        grid.appendChild(box);
        this.value = "";
    });
}

function setupListInput(dayNum, type) {
    const input = document.getElementById(`${type}-input-day${dayNum}`);
    const list  = document.getElementById(`${type}-list-day${dayNum}`);
    const grid  = document.getElementById(`${type}-details-day${dayNum}`);
    if (!input) return;
    let count = list.children.length;

    input.addEventListener("keydown", function(e) {
        if (e.key !== "Enter") return;
        e.preventDefault();
        const value = this.value.trim();
        if (!value) return;
        count++;
        const id = `${type}-detail-day${dayNum}-item${count}`;
        const li = document.createElement("li");
        li.innerHTML = `${value} <span class="remove-activity" onclick="removeActivity('${id}', this);">✕</span>`;
        list.appendChild(li);
        const box = document.createElement("div");
        box.classList.add("activity-detail-box");
        box.id = id;
        box.innerHTML = `<p class="activity-detail-title">${value}</p><textarea id="${id}-textarea" placeholder="Enter details for ${value}..." rows="3"></textarea>`;
        grid.appendChild(box);
        this.value = "";
    });
}

function removeActivity(boxId, span) {
    const box = document.getElementById(boxId);
    if (box) box.remove();
    if (span && span.parentElement) span.parentElement.remove();
}

function restoreDynamicList(dayNum, type, items) {
    const list = document.getElementById(`${type}-list-day${dayNum}`);
    const grid = document.getElementById(`${type}-details-day${dayNum}`);
    if (!list || !grid) return;
    list.innerHTML = "";
    grid.innerHTML = "";
    items.forEach((item, index) => {
        const id = `${type}-detail-day${dayNum}-item${index + 1}`;
        const li = document.createElement("li");
        li.innerHTML = `${item.title} <span class="remove-activity" onclick="removeActivity('${id}', this);">✕</span>`;
        list.appendChild(li);
        const box = document.createElement("div");
        box.classList.add("activity-detail-box");
        box.id = id;
        box.innerHTML = `<p class="activity-detail-title">${item.title}</p><textarea rows="3">${item.text || ""}</textarea>`;
        grid.appendChild(box);
    });
}

function expandField(field, dayNum) {
    const titles = { activities:"Activities", dining:"Dining", transport:"Transport", accommodation:"Accommodation", cost:"Total Cost", rented:"Rented Items", photo:"Photo and Caption" };
    const hints  = { activities:"Type an activity and press Enter, then add notes.", dining:"Type a restaurant and press Enter, then add notes.", transport:"Type the transport used on this day.", accommodation:"Enter where you stayed.", cost:"Enter the total spent for this day.", rented:"List any items you rented or hired.", photo:"Upload a photo and add a caption." };
    const grid   = document.getElementById(`field-grid-day${dayNum}`);
    const expanded = document.getElementById(`expanded-day${dayNum}`);
    const content  = document.getElementById(`expanded-content-day${dayNum}`);
    const formContent = document.getElementById(`form-${field}-day${dayNum}`);
    grid.classList.add("hidden");
    expanded.classList.remove("hidden");
    content.innerHTML = `<div class="expanded-field-intro"><h3>${titles[field]}</h3><p>${hints[field]}</p></div>`;
    content.appendChild(formContent);
    expanded.dataset.currentField = field;
}

function exitField(dayNum) {
    const expanded = document.getElementById(`expanded-day${dayNum}`);
    const field    = expanded.dataset.currentField;
    const content  = document.getElementById(`expanded-content-day${dayNum}`);
    const formsDay = document.getElementById(`forms-day${dayNum}`);
    const formContent = content.lastElementChild;
    if (formContent && formContent.id && formContent.id.startsWith("form-")) {
        formsDay.appendChild(formContent);
    }
    updateTilePreview(field, dayNum);
    document.getElementById(`field-grid-day${dayNum}`).classList.remove("hidden");
    expanded.classList.add("hidden");
    content.innerHTML = "";
}

function updateTilePreview(field, dayNum) {
    const preview = document.getElementById(`preview-${field}-day${dayNum}`);
    const hint    = document.getElementById(`hint-${field}-day${dayNum}`);
    if (!preview) return;
    preview.innerHTML = "";

    if (field === "activities") {
        document.querySelectorAll(`#activity-list-day${dayNum} li`).forEach(item => {
            const p = document.createElement("p");
            p.textContent = item.textContent.replace("✕","").trim();
            preview.appendChild(p);
        });
    } else if (field === "dining") {
        document.querySelectorAll(`#dining-list-day${dayNum} li`).forEach(item => {
            const p = document.createElement("p");
            p.textContent = item.textContent.replace("✕","").trim();
            preview.appendChild(p);
        });
    } else if (field === "transport") {
        document.querySelectorAll(`#transport-list-day${dayNum} li`).forEach(item => {
            const p = document.createElement("p");
            p.textContent = item.textContent.replace("✕", "").trim();
            preview.appendChild(p);
        });
    } else if (field === "accommodation") {
        const val = document.getElementById(`accommodation-day${dayNum}`)?.value.trim();
        if (val) preview.innerHTML = `<p>${val}</p>`;
    } else if (field === "cost") {
        const val = document.getElementById(`cost-day${dayNum}`)?.value.trim();
        if (val) preview.innerHTML = `<p>$${val}</p>`;
    } else if (field === "rented") {
        document.querySelectorAll(`#rented-list-day${dayNum} li`).forEach(item => {
            const p = document.createElement("p");
            p.textContent = item.textContent.replace("✕", "").trim();
            preview.appendChild(p);
        });
    } else if (field === "photo") {
        const existingRows = document.querySelectorAll(`#existing-photos-day${dayNum} .file-row`).length;
        const newFiles     = (selectedPhotosByDay[dayNum] || []).length;
        const total = existingRows + newFiles;
        if (total > 0) preview.innerHTML = `<p>${total} photo${total !== 1 ? "s" : ""}</p>`;
    }

    if (hint) hint.style.display = preview.innerHTML.trim() !== "" ? "none" : "block";
}

function showDay(dayNum) {
    document.querySelectorAll(".day-section").forEach((section, index) => {
        section.style.display = index + 1 === dayNum ? "block" : "none";
    });
    currentDay = dayNum;
    document.querySelectorAll(".day-nav-btn").forEach((btn, index) => {
        btn.classList.toggle("active", index + 1 === currentDay);
    });
}

function renderNewPhotoList(dayNum) {
    const fileList = document.getElementById(`file-list-day${dayNum}`);
    if (!fileList) return;
    fileList.innerHTML = "";
    const files = selectedPhotosByDay[dayNum] || [];
    if (files.length === 0) {
        fileList.innerHTML = `<p class="file-placeholder">No new files chosen</p>`;
        return;
    }
    files.forEach((file, index) => {
        const row = document.createElement("div");
        row.className = "file-row";
        row.innerHTML = `<span>${file.name}</span><button type="button" class="remove-photo-btn" onclick="removeNewPhoto(${dayNum}, ${index})">✕</button>`;
        fileList.appendChild(row);
    });
}

function removeNewPhoto(dayNum, fileIndex) {
    if (!selectedPhotosByDay[dayNum]) return;
    selectedPhotosByDay[dayNum].splice(fileIndex, 1);
    const newTransfer = new DataTransfer();
    selectedPhotosByDay[dayNum].forEach(file => { if (file instanceof File) newTransfer.items.add(file); });
    photoDataTransferByDay[dayNum] = newTransfer;
    const fileInput = document.getElementById(`photos-day${dayNum}`);
    if (fileInput) fileInput.files = photoDataTransferByDay[dayNum].files;
    renderNewPhotoList(dayNum);
    updateTilePreview("photo", dayNum);
}

function setupBudgetListeners() {
    document.querySelectorAll("#days-container input, #days-container textarea").forEach(field => {
        field.addEventListener("input", updateBudgetSummary);
        field.addEventListener("change", updateBudgetSummary);
    });
}

function updateBudgetSummary() {
    const budgetInput = document.getElementById("trip-budget");
    const summaryBox  = document.getElementById("budget-summary");
    if (!budgetInput || !summaryBox) return;
    const totalBudget = parseFloat(budgetInput.value) || 0;
    let spent = 0;
    document.querySelectorAll('[id^="cost-day"]').forEach(input => { spent += parseFloat(input.value) || 0; });
    const remaining = totalBudget - spent;
    summaryBox.classList.toggle("hidden", totalBudget <= 0);
    document.getElementById("budget-total").textContent     = totalBudget.toFixed(2);
    document.getElementById("budget-spent").textContent     = spent.toFixed(2);
    document.getElementById("budget-remaining").textContent = remaining.toFixed(2);
    document.getElementById("budget-remaining").style.color = remaining < 0 ? "red" : "";
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", function () {
    initEditForm();

    document.getElementById("itinerary-form").addEventListener("keydown", function (e) {
        const isActivityInput = e.target.classList.contains("activity-input");
        const isTextArea      = e.target.tagName.toLowerCase() === "textarea";
        if (e.key === "Enter" && !isActivityInput && !isTextArea) e.preventDefault();
    });
});

document.getElementById("itinerary-form").addEventListener("submit", function () {
    document.querySelectorAll(".day-section").forEach((section, index) => {
        const dayNum = index + 1;
        ["activity", "dining", "transport", "rented"].forEach(type => {
            const items = [];
            document.querySelectorAll(`#${type}-details-day${dayNum} .activity-detail-box`).forEach(box => {
                items.push({
                    title: box.querySelector(".activity-detail-title")?.textContent.trim() || "",
                    text: box.querySelector("textarea")?.value || ""
                });
            });
            document.getElementById(`${type}-json-day${dayNum}`).value = JSON.stringify(items);
        });
    });
});