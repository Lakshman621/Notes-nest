
// Get HTML elements
const notesContainer = document.getElementById("notesContainer");
const noteModal = document.getElementById("noteModal");
const noteForm = document.getElementById("noteForm");
const searchInput = document.getElementById("searchInput");
const toast = document.getElementById("toast");

let notes = JSON.parse(localStorage.getItem("notes")) || [];
let currentFilter = "all";

// Save notes to LocalStorage
function saveNotes() {
    localStorage.setItem("notes", JSON.stringify(notes));
    renderNotes();
}

// Show notification
function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

// Open modal
document.getElementById("addNoteBtn").onclick = () => {
    noteForm.reset();
    document.getElementById("noteId").value = "";
    document.getElementById("modalTitle").textContent = "Create New Note";
    noteModal.style.display = "flex";
};

// Close modal
function closeModal() {
    noteModal.style.display = "none";
}

document.getElementById("closeModal").onclick = closeModal;
document.getElementById("cancelBtn").onclick = closeModal;

noteModal.addEventListener("click", (e) => {
    if (e.target === noteModal) closeModal();
});

// Add or update note
noteForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const id = document.getElementById("noteId").value;
    const title = document.getElementById("noteTitle").value.trim();
    const category = document.getElementById("noteCategory").value;
    const content = document.getElementById("noteContent").value.trim();

    if (!title || !content) return;

    if (id) {
        const note = notes.find(n => n.id === id);

        if (note) {
            note.title = title;
            note.category = category;
            note.content = content;
            note.updatedAt = new Date().toLocaleDateString();
        }

        showToast("Note updated successfully!");
    } else {
        notes.unshift({
            id: crypto.randomUUID(),
            title,
            category,
            content,
            favorite: false,
            shared: false,
            date: new Date().toLocaleDateString(),
            updatedAt: ""
        });

        showToast("Note saved successfully!");
    }

    saveNotes();
    closeModal();
});

// Render notes
function renderNotes() {
    notesContainer.innerHTML = "";

    let filteredNotes = [...notes];

    // Category filter
    if (currentFilter === "favorite") {
        filteredNotes = filteredNotes.filter(n => n.favorite);
    } else if (currentFilter === "shared") {
        filteredNotes = filteredNotes.filter(n => n.shared);
    } else if (currentFilter !== "all") {
        filteredNotes = filteredNotes.filter(
            n => n.category === currentFilter
        );
    }

    // Search
    const search = searchInput.value.toLowerCase();

    filteredNotes = filteredNotes.filter(n =>
        n.title.toLowerCase().includes(search) ||
        n.content.toLowerCase().includes(search)
    );

    // Sort
    const sort = document.getElementById("sortNotes").value;

    if (sort === "newest") {
        filteredNotes.sort((a, b) => b.id.localeCompare(a.id));
    } else if (sort === "oldest") {
        filteredNotes.sort((a, b) => a.id.localeCompare(b.id));
    } else {
        filteredNotes.sort((a, b) =>
            a.title.localeCompare(b.title)
        );
    }

    // Update statistics
    document.getElementById("totalNotes").textContent = notes.length;

    document.getElementById("favoriteNotes").textContent =
        notes.filter(n => n.favorite).length;

    document.getElementById("sharedNotes").textContent =
        notes.filter(n => n.shared).length;

    // Empty state
    if (filteredNotes.length === 0) {
        notesContainer.innerHTML = `
            <div class="empty-state">
                <h2>📭 No Notes Found</h2>
                <p>Create a new note or try another search.</p>
            </div>
        `;
        return;
    }

    // Display cards
    filteredNotes.forEach(note => {
        const card = document.createElement("article");
        card.className = "note-card";

        const category = document.createElement("span");
        category.className = "note-category";
        category.textContent = note.category;

        const favorite = document.createElement("button");
        favorite.className = "favorite";
        favorite.textContent = note.favorite ? "⭐" : "☆";
        favorite.title = "Toggle favorite";
        favorite.onclick = () => toggleFavorite(note.id);

        const title = document.createElement("h3");
        title.textContent = note.title;

        const content = document.createElement("p");
        content.textContent = note.content.length > 130
            ? note.content.substring(0, 130) + "..."
            : note.content;

        const date = document.createElement("div");
        date.className = "note-date";
        date.textContent = "📅 " + (note.updatedAt
            ? "Updated " + note.updatedAt
            : note.date);

        const actions = document.createElement("div");
        actions.className = "note-actions";

        const editBtn = document.createElement("button");
        editBtn.textContent = "✏️ Edit";
        editBtn.onclick = () => editNote(note.id);

        const shareBtn = document.createElement("button");
        shareBtn.textContent = "🔗 Share";
        shareBtn.onclick = () => shareNote(note.id);

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "🗑️ Delete";
        deleteBtn.onclick = () => deleteNote(note.id);

        actions.append(editBtn, shareBtn, deleteBtn);
        card.append(category, favorite, title, content, date, actions);

        notesContainer.appendChild(card);
    });
}

// Edit note
function editNote(id) {
    const note = notes.find(n => n.id === id);

    if (!note) return;

    document.getElementById("noteId").value = note.id;
    document.getElementById("noteTitle").value = note.title;
    document.getElementById("noteCategory").value = note.category;
    document.getElementById("noteContent").value = note.content;

    document.getElementById("modalTitle").textContent = "Edit Note";

    noteModal.style.display = "flex";
}

// Delete note
function deleteNote(id) {
    if (!confirm("Are you sure you want to delete this note?")) {
        return;
    }

    notes = notes.filter(n => n.id !== id);
    saveNotes();
    showToast("Note deleted!");
}

// Toggle favorite
function toggleFavorite(id) {
    const note = notes.find(n => n.id === id);

    if (note) {
        note.favorite = !note.favorite;
        saveNotes();
        showToast("Favorite updated!");
    }
}

// Share note
async function shareNote(id) {
    const note = notes.find(n => n.id === id);

    if (!note) return;

    const shareText = `${note.title}\n\n${note.content}`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: note.title,
                text: shareText
            });

            note.shared = true;
            saveNotes();
        } catch (error) {
            if (error.name !== "AbortError") {
                showToast("Unable to share note.");
            }
        }
    } else {
        try {
            await navigator.clipboard.writeText(shareText);
            note.shared = true;
            saveNotes();
            showToast("Note copied to clipboard!");
        } catch {
            showToast("Clipboard access unavailable.");
        }
    }
}

// Sidebar filters
document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".nav-btn.active")
            ?.classList.remove("active");

        btn.classList.add("active");

        currentFilter = btn.dataset.filter;

        const titles = {
            all: "All Notes",
            favorite: "Favorite Notes",
            shared: "Shared Notes",
            Study: "Study Notes",
            Personal: "Personal Notes",
            Work: "Work Notes",
            Projects: "Project Notes"
        };

        document.getElementById("sectionTitle").textContent =
            titles[currentFilter];

        renderNotes();
    });
});

// Search functionality
searchInput.addEventListener("input", renderNotes);

// Sorting functionality
document.getElementById("sortNotes")
    .addEventListener("change", renderNotes);

// Initial render
renderNotes();
