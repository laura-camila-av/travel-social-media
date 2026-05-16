   let currentDay = 1;
        let totalDays = 0;
        const STORAGE_KEY = "itineraryDraft";
        let selectedPhotosByDay = {};
        let photoDataTransferByDay = {};

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

            const timeDifference = endDate - startDate;
            const dayCount = Math.floor(timeDifference / (1000 * 60 * 60 * 24)) + 1;

            document.getElementById("trip-details-section").style.display = "none";

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
                            <div>
                                <button type="button" class="btn btn-itinerary-form" onclick="manualSaveDraft()">Save Progress</button>
                                <button type="button" class="btn btn-itinerary-form" onclick="clearDraft()">Clear Draft</button>
                            </div>
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
                            <input type="text" id="transport-day${i}" name="transport-day${i}" placeholder="Enter transport used, e.g. Train, Taxi, Bus">
                        </div>

                        <div id="form-accommodation-day${i}">
                            <input type="text" id="accommodation-day${i}" name="accommodation-day${i}" placeholder="Enter accommodation name and address">
                        </div>

                        <div id="form-cost-day${i}">
                            <input type="number" id="cost-day${i}" name="cost-day${i}" min="0" step="0.01" placeholder="Enter total cost for the day">
                        </div>

                        <div id="form-rented-day${i}">
                            <input type="text" id="rented-items-day${i}" name="rented-items-day${i}" placeholder="Enter any rented items">
                        </div>

                        <div id="form-photo-day${i}">
                            <label for="photos-day${i}" class="btn btn-itinerary-form">Choose Photos</label>
                            <input type="file" id="photos-day${i}" name="photos-day${i}" accept="image/*" class="file-input" multiple>
                            <div id="file-list-day${i}" class="file-list">
                                <p class="file-placeholder">No files chosen</p>
                            </div><br>
                            <textarea id="caption-day${i}" name="caption-day${i}" rows="3" placeholder="Enter a caption for your photos"></textarea>
                        </div>

                        <input type="hidden" id="activity-json-day${i}" name="activity-json-day${i}">
                        <input type="hidden" id="dining-json-day${i}" name="dining-json-day${i}">
                    </div>
                `;

                daysContainer.appendChild(daySection);

                const fileInput = daySection.querySelector(`#photos-day${i}`);
                const fileList = daySection.querySelector(`#file-list-day${i}`);

                selectedPhotosByDay[i] = selectedPhotosByDay[i] || [];
                photoDataTransferByDay[i] = photoDataTransferByDay[i] || new DataTransfer();

                fileInput.addEventListener("change", function () {
                    if (this.files.length > 0) {
                        Array.from(this.files).forEach(file => {
                            const alreadyExists = selectedPhotosByDay[i].some(existing => existing.name === file.name);
                            if (!alreadyExists) {
                                selectedPhotosByDay[i].push(file);
                                photoDataTransferByDay[i].items.add(file);
                            }
                        });
                    }

                    fileInput.files = photoDataTransferByDay[i].files;
                    renderPhotoList(i);
                    saveDraft();
                });

                setupActivityInput(i);
                setupDiningInput(i);
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

            setupAutoSaveForGeneratedFields();
            showDay(1);
        }

        function setupActivityInput(dayNum) {
            const input = document.getElementById(`activity-input-day${dayNum}`);
            const list = document.getElementById(`activity-list-day${dayNum}`);
            const grid = document.getElementById(`activity-details-day${dayNum}`);
            let activityCount = list.children.length;

            if (!input) return;

            input.addEventListener("keydown", function(e) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    const value = this.value.trim();
                    if (value === "") return;

                    activityCount++;
                    const id = `detail-day${dayNum}-act${activityCount}`;

                    const li = document.createElement("li");
                    li.innerHTML = `${value} <span class="remove-activity" onclick="removeActivity('${id}', this); saveDraft();">✕</span>`;
                    list.appendChild(li);

                    const box = document.createElement("div");
                    box.classList.add("activity-detail-box");
                    box.id = id;
                    box.innerHTML = `
                        <p class="activity-detail-title">${value}</p>
                        <textarea id="${id}-textarea" placeholder="Enter details for ${value}..." rows="3"></textarea>
                    `;
                    grid.appendChild(box);

                    box.querySelector("textarea").addEventListener("input", saveDraft);

                    this.value = "";
                    saveDraft();
                }
            });
        }

        function setupDiningInput(dayNum) {
            const input = document.getElementById(`dining-input-day${dayNum}`);
            const list = document.getElementById(`dining-list-day${dayNum}`);
            const grid = document.getElementById(`dining-details-day${dayNum}`);
            let diningCount = list.children.length;

            if (!input) return;

            input.addEventListener("keydown", function(e) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    const value = this.value.trim();
                    if (value === "") return;

                    diningCount++;
                    const id = `dining-detail-day${dayNum}-item${diningCount}`;

                    const li = document.createElement("li");
                    li.innerHTML = `${value} <span class="remove-activity" onclick="removeActivity('${id}', this); saveDraft();">✕</span>`;
                    list.appendChild(li);

                    const box = document.createElement("div");
                    box.classList.add("activity-detail-box");
                    box.id = id;
                    box.innerHTML = `
                        <p class="activity-detail-title">${value}</p>
                        <textarea id="${id}-textarea" placeholder="Enter details for ${value}..." rows="3"></textarea>
                    `;
                    grid.appendChild(box);

                    box.querySelector("textarea").addEventListener("input", saveDraft);

                    this.value = "";
                    saveDraft();
                }
            });
        }

        function removeActivity(boxId, span) {
            const box = document.getElementById(boxId);
            if (box) box.remove();
            if (span && span.parentElement) span.parentElement.remove();
        }

        function expandField(field, dayNum) {
            const grid = document.getElementById(`field-grid-day${dayNum}`);
            const expanded = document.getElementById(`expanded-day${dayNum}`);
            const content = document.getElementById(`expanded-content-day${dayNum}`);
            const formContent = document.getElementById(`form-${field}-day${dayNum}`);

            const titles = {
                activities: "Activities",
                dining: "Dining",
                transport: "Transport",
                accommodation: "Accommodation",
                cost: "Total Cost",
                rented: "Rented Items",
                photo: "Photo and Caption"
            };

            const hints = {
                activities: "Type an activity and press Enter, then add notes for each activity.",
                dining: "Type a restaurant or meal and press Enter, then add any extra notes.",
                transport: "Type the transport you used on this day, for example Train, Taxi, or Bus.",
                accommodation: "Enter where you stayed for this day.",
                cost: "Enter the total amount spent for this day.",
                rented: "List any items you rented or hired.",
                photo: "Upload a photo and add a caption."
            };

            grid.classList.add("hidden");
            expanded.classList.remove("hidden");

            content.innerHTML = `
                <div class="expanded-field-intro">
                    <h3>${titles[field]}</h3>
                    <p>${hints[field]}</p>
                </div>
            `;

            content.appendChild(formContent);
            expanded.dataset.currentField = field;
        }

        function exitField(dayNum) {
            const grid = document.getElementById(`field-grid-day${dayNum}`);
            const expanded = document.getElementById(`expanded-day${dayNum}`);
            const field = expanded.dataset.currentField;
            const content = document.getElementById(`expanded-content-day${dayNum}`);
            const formsDay = document.getElementById(`forms-day${dayNum}`);
            const formContent = content.lastElementChild;

            if (formContent && formContent.id && formContent.id.startsWith("form-")) {
                formsDay.appendChild(formContent);
            }

            updateTilePreview(field, dayNum);

            grid.classList.remove("hidden");
            expanded.classList.add("hidden");
            content.innerHTML = "";
            saveDraft();
        }

        function updateTilePreview(field, dayNum) {
    const preview = document.getElementById(`preview-${field}-day${dayNum}`);
    const hint = document.getElementById(`hint-${field}-day${dayNum}`);

    preview.innerHTML = "";

    if (field === "activities") {
        document.querySelectorAll(`#activity-list-day${dayNum} li`).forEach(item => {
            const p = document.createElement("p");
            p.textContent = item.textContent.replace("✕", "").trim();
            preview.appendChild(p);
        });
    } else if (field === "dining") {
        document.querySelectorAll(`#dining-list-day${dayNum} li`).forEach(item => {
            const p = document.createElement("p");
            p.textContent = item.textContent.replace("✕", "").trim();
            preview.appendChild(p);
        });
    } else if (field === "transport") {
        const val = document.getElementById(`transport-day${dayNum}`)?.value.trim();
        if (val) preview.innerHTML = `<p>${val}</p>`;
    } else if (field === "accommodation") {
        const val = document.getElementById(`accommodation-day${dayNum}`)?.value.trim();
        if (val) preview.innerHTML = `<p>${val}</p>`;
    } else if (field === "cost") {
        const val = document.getElementById(`cost-day${dayNum}`)?.value.trim();
        if (val) preview.innerHTML = `<p>$${val}</p>`;
    } else if (field === "rented") {
        const val = document.getElementById(`rented-items-day${dayNum}`)?.value.trim();
        if (val) preview.innerHTML = `<p>${val}</p>`;
    } else if (field === "photo") {
        const files = selectedPhotosByDay[dayNum] || [];
        files.forEach(file => {
            const p = document.createElement("p");
            p.textContent = file.name;
            preview.appendChild(p);
        });
    }
    if (hint) {
        hint.style.display = preview.innerHTML.trim() !== "" ? "none" : "block";
    }
}

        document.addEventListener("DOMContentLoaded", function () {
            setupGuideModal();
            restoreDraft();
            setupAutoSaveForTripDetails();

            document.getElementById("itinerary-form").addEventListener("keydown", function (e) {
                const tag = e.target.tagName.toLowerCase();
                const isActivityInput = e.target.classList.contains("activity-input");
                const isTextArea = tag === "textarea";

                if (e.key === "Enter" && !isActivityInput && !isTextArea) {
                    e.preventDefault();
                }
            });
        });

        function setupGuideModal() {
            const closeBtn = document.getElementById("close-guide-btn");
            const modal = document.getElementById("guide-modal");

            closeBtn.addEventListener("click", function () {
                modal.classList.add("hidden");
            });

            modal.addEventListener("click", function (e) {
                if (e.target === modal) {
                    modal.classList.add("hidden");
                }
            });
        }

        function setupAutoSaveForTripDetails() {
            const tripFieldIds = [
                "trip-title",
                "destination",
                "travel-style",
                "trip-budget",
                "start-date",
                "end-date"
            ];

            tripFieldIds.forEach(id => {
                const field = document.getElementById(id);
                if (field) {
                    field.addEventListener("input", function () {
                        saveDraft();
                        updateBudgetSummary();
                    });
                    field.addEventListener("change", function () {
                        saveDraft();
                        updateBudgetSummary();
                    });
                }
            });
        }

        function collectDraftData() {
            const draft = {
                tripTitle: document.getElementById("trip-title").value,
                destination: document.getElementById("destination").value,
                travelStyle: document.getElementById("travel-style").value,
                tripBudget: document.getElementById("trip-budget").value,
                startDate: document.getElementById("start-date").value,
                endDate: document.getElementById("end-date").value,
                tripDetailsHidden: document.getElementById("trip-details-section").style.display === "none",
                submitVisible: document.getElementById("submit-btn").style.display === "block",
                days: []
            };

            document.querySelectorAll(".day-section").forEach((section, index) => {
                const dayNum = index + 1;

                const activityDetails = [];
                document.querySelectorAll(`#activity-details-day${dayNum} .activity-detail-box`).forEach(box => {
                    const title = box.querySelector(".activity-detail-title")?.textContent.trim() || "";
                    const textarea = box.querySelector("textarea");
                    activityDetails.push({ title, text: textarea ? textarea.value : "" });
                });

                const diningDetails = [];
                document.querySelectorAll(`#dining-details-day${dayNum} .activity-detail-box`).forEach(box => {
                    const title = box.querySelector(".activity-detail-title")?.textContent.trim() || "";
                    const textarea = box.querySelector("textarea");
                    diningDetails.push({ title, text: textarea ? textarea.value : "" });
                });

                draft.days.push({
                    cost: document.getElementById(`cost-day${dayNum}`)?.value || "",
                    rentedItems: document.getElementById(`rented-items-day${dayNum}`)?.value || "",
                    accommodation: document.getElementById(`accommodation-day${dayNum}`)?.value || "",
                    caption: document.getElementById(`caption-day${dayNum}`)?.value || "",
                    fileNames: (selectedPhotosByDay[dayNum] || []).map(file => file.name),
                    transport: document.getElementById(`transport-day${dayNum}`)?.value || "",
                    activityDetails,
                    diningDetails
                });
            });

            return draft;
        }

        function saveDraft() {
            const draft = collectDraftData();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
        }

        let saveMessageTimeout;

        function manualSaveDraft() {
            saveDraft();
            showSaveConfirmation();
        }

        function showSaveConfirmation() {
            const confirmation = document.getElementById("save-confirmation");
            if (!confirmation) return;

            confirmation.classList.remove("hidden");

            clearTimeout(saveMessageTimeout);
            saveMessageTimeout = setTimeout(() => {
                confirmation.classList.add("hidden");
            }, 1500);
        }

        function clearDraft() {
            localStorage.removeItem(STORAGE_KEY);

            const form = document.getElementById("itinerary-form");
            if (form) form.reset();

            const daysContainer = document.getElementById("days-container");
            if (daysContainer) daysContainer.innerHTML = "";

            const tripDetailsSection = document.getElementById("trip-details-section");
            if (tripDetailsSection) tripDetailsSection.style.display = "block";

            const submitBtn = document.getElementById("submit-btn");
            if (submitBtn) submitBtn.style.display = "none";

            const budgetSummary = document.getElementById("budget-summary");
            if (budgetSummary) budgetSummary.classList.add("hidden");

            currentDay = 1;
            totalDays = 0;

            alert("Draft cleared.");
        }

        function restoreDraft() {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return;

            const draft = JSON.parse(saved);

            document.getElementById("trip-title").value = draft.tripTitle || "";
            document.getElementById("destination").value = draft.destination || "";
            document.getElementById("travel-style").value = draft.travelStyle || "";
            document.getElementById("trip-budget").value = draft.tripBudget || "";
            document.getElementById("start-date").value = draft.startDate || "";
            document.getElementById("end-date").value = draft.endDate || "";

            if (draft.startDate && draft.endDate && draft.days && draft.days.length > 0) {
                generateDays();

                if (draft.tripDetailsHidden) {
                    document.getElementById("trip-details-section").style.display = "none";
                }

                draft.days.forEach((day, index) => {
                    const dayNum = index + 1;

                    const costField = document.getElementById(`cost-day${dayNum}`);
                    const rentedField = document.getElementById(`rented-items-day${dayNum}`);
                    const accommodationField = document.getElementById(`accommodation-day${dayNum}`);
                    const captionField = document.getElementById(`caption-day${dayNum}`);
                    const transportField = document.getElementById(`transport-day${dayNum}`);

                    if (costField) costField.value = day.cost || "";
                    if (rentedField) rentedField.value = day.rentedItems || "";
                    if (accommodationField) accommodationField.value = day.accommodation || "";
                    if (captionField) captionField.value = day.caption || "";
                    if (transportField) transportField.value = day.transport || "";
                    selectedPhotosByDay[dayNum] = [];

                    if (day.fileNames && day.fileNames.length > 0) {
                        day.fileNames.forEach(name => {
                            selectedPhotosByDay[dayNum].push({ name: name });
                        });
                    }

                    renderPhotoList(dayNum);

                    restoreDynamicList(dayNum, "activity", day.activityDetails || []);
                    restoreDynamicList(dayNum, "dining", day.diningDetails || []);

                    updateTilePreview("activities", dayNum);
                    updateTilePreview("dining", dayNum);
                    updateTilePreview("transport", dayNum);
                    updateTilePreview("accommodation", dayNum);
                    updateTilePreview("cost", dayNum);
                    updateTilePreview("rented", dayNum);
                    updateTilePreview("photo", dayNum);
                });

                setupAutoSaveForGeneratedFields();
                updateBudgetSummary();
            }
        }

        function restoreDynamicList(dayNum, type, items) {
            const list = document.getElementById(`${type}-list-day${dayNum}`);
            const grid = document.getElementById(`${type}-details-day${dayNum}`);
            if (!list || !grid) return;

            grid.innerHTML = "";
            list.innerHTML = "";

            items.forEach((item, index) => {
                const id = `${type}-detail-day${dayNum}-restored${index + 1}`;

                const li = document.createElement("li");
                li.innerHTML = `${item.title} <span class="remove-activity" onclick="removeActivity('${id}', this); saveDraft();">✕</span>`;
                list.appendChild(li);

                const box = document.createElement("div");
                box.classList.add("activity-detail-box");
                box.id = id;
                box.innerHTML = `
                    <p class="activity-detail-title">${item.title}</p>
                    <textarea rows="3">${item.text || ""}</textarea>
                `;
                grid.appendChild(box);

                box.querySelector("textarea").addEventListener("input", saveDraft);
            });
        }

        function setupAutoSaveForGeneratedFields() {
            document.querySelectorAll("#days-container input, #days-container textarea, #days-container select").forEach(field => {
                field.addEventListener("input", function () {
                    saveDraft();
                    updateBudgetSummary();
                });
                field.addEventListener("change", function () {
                    saveDraft();
                    updateBudgetSummary();
                });
            });
        }

        function updateBudgetSummary() {
            const budgetInput = document.getElementById("trip-budget");
            const summaryBox = document.getElementById("budget-summary");
            const totalEl = document.getElementById("budget-total");
            const spentEl = document.getElementById("budget-spent");
            const remainingEl = document.getElementById("budget-remaining");

            if (!budgetInput || !summaryBox) return;

            const totalBudget = parseFloat(budgetInput.value) || 0;
            let spent = 0;

            document.querySelectorAll('[id^="cost-day"]').forEach(input => {
                spent += parseFloat(input.value) || 0;
            });

            const remaining = totalBudget - spent;

            if (totalBudget > 0) {
                summaryBox.classList.remove("hidden");
            } else {
                summaryBox.classList.add("hidden");
            }

            totalEl.textContent = totalBudget.toFixed(2);
            spentEl.textContent = spent.toFixed(2);
            remainingEl.textContent = remaining.toFixed(2);
            remainingEl.style.color = remaining < 0 ? "red" : "";
        }

        function showDay(dayNum) {
            document.querySelectorAll(".day-section").forEach((section, index) => {
                section.style.display = index + 1 === dayNum ? "block" : "none";
            });

            currentDay = dayNum;
            updateDayNav();

            const submitBtn = document.getElementById("submit-btn");
            if (submitBtn) {
                submitBtn.style.display = dayNum === totalDays ? "block" : "none";
            }
        }

        function updateDayNav() {
            document.querySelectorAll(".day-nav-btn").forEach((btn, index) => {
                btn.classList.toggle("active", index + 1 === currentDay);
            });
        }

        function renderPhotoList(dayNum) {
            const fileList = document.getElementById(`file-list-day${dayNum}`);
            if (!fileList) return;

            fileList.innerHTML = "";

            const files = selectedPhotosByDay[dayNum] || [];

            if (files.length === 0) {
                fileList.innerHTML = `<p class="file-placeholder">No files chosen</p>`;
                return;
            }

            files.forEach((file, index) => {
                const row = document.createElement("div");
                row.className = "file-row";
                row.innerHTML = `
                    <span>${file.name}</span>
                    <button type="button" class="remove-photo-btn" onclick="removePhoto(${dayNum}, ${index})">✕</button>
                `;
                fileList.appendChild(row);
            });
        }

        function removePhoto(dayNum, fileIndex) {
            if (!selectedPhotosByDay[dayNum]) return;

            selectedPhotosByDay[dayNum].splice(fileIndex, 1);

            const newTransfer = new DataTransfer();
            selectedPhotosByDay[dayNum].forEach(file => {
                if (file instanceof File) {
                    newTransfer.items.add(file);
                }
            });

            photoDataTransferByDay[dayNum] = newTransfer;

            const fileInput = document.getElementById(`photos-day${dayNum}`);
            if (fileInput) {
                fileInput.files = photoDataTransferByDay[dayNum].files;
            }

            renderPhotoList(dayNum);
            updateTilePreview("photo", dayNum);
            saveDraft();
        }

        document.getElementById("itinerary-form").addEventListener("submit", function () {
            document.querySelectorAll(".day-section").forEach((section, index) => {
                const dayNum = index + 1;

                const activityDetails = [];
                document.querySelectorAll(`#activity-details-day${dayNum} .activity-detail-box`).forEach(box => {
                    activityDetails.push({
                        title: box.querySelector(".activity-detail-title")?.textContent.trim() || "",
                        text: box.querySelector("textarea")?.value || ""
                    });
                });

                const diningDetails = [];
                document.querySelectorAll(`#dining-details-day${dayNum} .activity-detail-box`).forEach(box => {
                    diningDetails.push({
                        title: box.querySelector(".activity-detail-title")?.textContent.trim() || "",
                        text: box.querySelector("textarea")?.value || ""
                    });
                });

                document.getElementById(`activity-json-day${dayNum}`).value = JSON.stringify(activityDetails);
                document.getElementById(`dining-json-day${dayNum}`).value = JSON.stringify(diningDetails);
            });
            localStorage.removeItem(STORAGE_KEY);
        });