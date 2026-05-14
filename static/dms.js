  const userList = document.getElementById("userList");
  const chatHeader = document.getElementById("chatHeader");
  const messagesDiv = document.getElementById("messages");
  const messageForm = document.getElementById("messageForm");
  const messageInput = document.getElementById("messageInput");
  const sendButton = document.getElementById("sendButton");
  const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
  let selectedUserId = null;

  async function loadUsers() {
    const response = await fetch("/api/users");
    const users = await response.json();

    userList.innerHTML = "";

    if (users.length === 0) {
      userList.innerHTML = '<div class="dms-empty">No other users found.</div>';
      return;
    }

    users.forEach((user) => {
      const userEl = document.createElement("div");
      userEl.className = "user";
      const nameSpan = document.createElement("span");
      nameSpan.textContent = user.username || user.email || "Unnamed user";

      userEl.appendChild(nameSpan);

      if (user.unread_count > 0) {
        const dot = document.createElement("span");
        dot.className = "unread-dot";
        userEl.appendChild(dot);
      }

      userEl.addEventListener("click", async () => {
        selectedUserId = user.id;

        document.querySelectorAll(".user").forEach(el => {
          el.classList.remove("active-user");
        });
        userEl.classList.add("active-user");

        chatHeader.textContent = "Chat with " + (user.username || user.email);

        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.placeholder = "Type a message...";
        messageInput.focus();

        await loadMessages();
      });

      userList.appendChild(userEl);
    });
  }

  async function loadMessages() {
    if (!selectedUserId) return;

    const response = await fetch(`/api/messages/${selectedUserId}`);
    const messages = await response.json();

    messagesDiv.innerHTML = "";

    if (messages.length === 0) {
      messagesDiv.innerHTML = '<div class="dms-empty">No messages yet.</div>';
      return;
    }

    messages.forEach((msg) => {
      const wrapper = document.createElement("div");
      wrapper.className = "dms-message-wrapper " + (msg.is_mine ? "mine-wrapper" : "theirs-wrapper");

      const msgEl = document.createElement("div");
      msgEl.className = "dms-message " + (msg.is_mine ? "dms-mine" : "dms-theirs");

      const itineraryPattern = /^\[ITINERARY:(\d+):(.+?)\]([\s\S]*)?$/;
    const match = msg.text.match(itineraryPattern);

    if (match) {
        const itineraryId = match[1];
        const itineraryTitle = match[2];
        const extraMessage = match[3] ? match[3].trim() : "";

        const itineraryLink = document.createElement("a");
        itineraryLink.href = `/itinerary/${itineraryId}`;
        itineraryLink.style.fontWeight = "bold";
        itineraryLink.style.display = "block";
        itineraryLink.style.marginBottom = extraMessage ? "6px" : "0";
        itineraryLink.textContent = `✈️ ${itineraryTitle}`;
        msgEl.appendChild(itineraryLink);

    if (extraMessage) {
        const extraEl = document.createElement("span");
        extraEl.textContent = extraMessage;
        msgEl.appendChild(extraEl);
    }
    } else {
        const textEl = document.createElement("span");
        textEl.textContent = msg.text;
        msgEl.appendChild(textEl);
    }

      if (msg.reaction) {
        const reactionEl = document.createElement("span");
        reactionEl.className = "message-reaction";
        reactionEl.textContent = msg.reaction;
        msgEl.appendChild(reactionEl);
      }

      const reactionBar = document.createElement("div");
      reactionBar.className = "reaction-bar";

      ["❤️", "😂", "😮", "😢", "👍"].forEach((emoji) => {
        const reactionBtn = document.createElement("button");
        reactionBtn.type = "button";
        reactionBtn.className = "reaction-btn";
        reactionBtn.textContent = emoji;

        reactionBtn.addEventListener("click", async () => {
          await reactToMessage(msg.id, emoji);
        });

        reactionBar.appendChild(reactionBtn);
      });

      wrapper.appendChild(msgEl);
      wrapper.appendChild(reactionBar);
      messagesDiv.appendChild(wrapper);
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  messageForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const text = messageInput.value.trim();

    if (!selectedUserId) {
      alert("Please select a user first.");
      return;
    }

    if (!text) {
      return;
    }

    const response = await fetch("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken
      },
      body: JSON.stringify({
        receiver_id: selectedUserId,
        text: text
      })
    });

    if (response.ok) {
      messageInput.value = "";
      await loadMessages();
    } else {
      alert("Message failed to send.");
    }
  });

  loadUsers();

  setInterval(() => {
    if (selectedUserId) {
      loadMessages();
    }
  }, 3000);

  async function reactToMessage(messageId, reaction) {
    const response = await fetch(`/api/messages/${messageId}/react`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken
      },
      body: JSON.stringify({
        reaction: reaction
      })
    });

    if (response.ok) {
      await loadMessages();
    }
  }
