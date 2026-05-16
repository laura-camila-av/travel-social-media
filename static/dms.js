const drafts = {};
  const userList = document.getElementById("userList");
  const chatHeader = document.getElementById("chatHeader");
  const messagesDiv = document.getElementById("messages");
  const messageForm = document.getElementById("messageForm");
  const messageInput = document.getElementById("messageInput");
  const sendButton = document.getElementById("sendButton");
  const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
  let selectedUserId = null;
  let replyToMessageId = null;
  let replyToMessageText = null;

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
        // save current draft
        if (selectedUserId){
          drafts[selectedUserId] = messageInput.value;
        }
        selectedUserId = user.id;

        document.querySelectorAll(".user").forEach(el => {
          el.classList.remove("active-user");
        });
        userEl.classList.add("active-user");

        chatHeader.innerHTML = `Chat with <a href="/user/${user.id}" class="chat-profile-link">${user.username || user.email}</a>`;
        messageInput.value = ""; // clears unsent message when switching chat
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.placeholder = "Type a message...";
        messageInput.value = drafts[user.id] || ""; // restore draft for this user
        messageInput.focus();

        await loadMessages(true);
      });

      userList.appendChild(userEl);
    });
  }

  async function loadMessages(forceScrollBottom = false) {
    if (!selectedUserId) return;

    const response = await fetch(`/api/messages/${selectedUserId}`);
    const messages = await response.json();
    const wasNearBottom = messagesDiv.scrollHeight - messagesDiv.scrollTop - messagesDiv.clientHeight < 100;
    messagesDiv.innerHTML = "";

    if (messages.length === 0) {
      messagesDiv.innerHTML = '<div class="dms-empty">No messages yet.</div>';
      return;
    }

    let lastDate = null;
    messages.forEach((msg) => {
      const messageDate = new Date(msg.created_at);
      const dateLabel = messageDate.toLocaleDateString([], {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      if (lastDate !== dateLabel) {
        const separator = document.createElement("div");
        separator.className = "date-separator";
        separator.textContent = dateLabel;
        messagesDiv.appendChild(separator);
        lastDate = dateLabel;
      }

      const wrapper = document.createElement("div");
      wrapper.className = "dms-message-wrapper " + (msg.is_mine ? "mine-wrapper" : "theirs-wrapper");
      const msgEl = document.createElement("div");
      msgEl.className = "dms-message " + (msg.is_mine ? "dms-mine" : "dms-theirs");

      // REPLY PREVIEW
      if (msg.reply_to_text) {
        const replyBox = document.createElement("div");
        replyBox.className = "reply-box";
        replyBox.textContent = msg.reply_to_text;
        msgEl.appendChild(replyBox);
      }

      const textEl = document.createElement("div");
      textEl.textContent = msg.text;
      msgEl.appendChild(textEl);

      // TIMESTAMP
      const timeEl = document.createElement("div");
      timeEl.className = "message-time";
      timeEl.textContent = messageDate.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit'
      });
      msgEl.appendChild(timeEl);

      // REACTION
      if (msg.reaction) {
        const reactionEl = document.createElement("span");
        reactionEl.className = "message-reaction";
        reactionEl.textContent = msg.reaction;
        msgEl.appendChild(reactionEl);
      }
      // REACTION BAR
      if (!msg.is_mine) {
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
        wrapper.appendChild(reactionBar);
      }

      // REPLIES
      const replyBtn = document.createElement("button");
      replyBtn.type = "button";
      replyBtn.className = "reply-btn";
      replyBtn.textContent = "Reply";

      replyBtn.addEventListener("click", () => {
        replyToMessageId = msg.id;
        replyToMessageText = msg.text;
        document.getElementById("replyPreviewText").textContent = "Replying to: " + msg.text;
        document.getElementById("replyPreview").classList.remove("hidden");
        messageInput.focus();
      });

      wrapper.appendChild(replyBtn);
      wrapper.appendChild(msgEl);
      messagesDiv.appendChild(wrapper);

    });
    if (forceScrollBottom || wasNearBottom) {
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
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
        text: text,
        reply_to_id: replyToMessageId
      })
    });

    if (response.ok) {
      messageInput.value = "";
      replyToMessageId = null;
      replyToMessageText = null;
      document.getElementById("replyPreview").classList.add("hidden");
      document.getElementById("replyPreviewText").textContent = "";
      await loadMessages(true);
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

  function cancelReply() {
    replyToMessageId = null;
    replyToMessageText = null;
    document.getElementById("replyPreview").classList.add("hidden");
    document.getElementById("replyPreviewText").textContent = "";
  }