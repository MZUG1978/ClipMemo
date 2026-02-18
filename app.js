// State
let snippets = [];
let editingId = null;

// DOM Elements
const memoList = document.getElementById('memo-list');
const emptyState = document.getElementById('empty-state');
const addBtn = document.getElementById('add-btn');
const modal = document.getElementById('snippet-modal');
const modalTitle = document.getElementById('modal-title');
const snippetForm = document.getElementById('snippet-form');
const labelInput = document.getElementById('snippet-label');
const textInput = document.getElementById('snippet-text');
const cancelBtn = document.getElementById('cancel-btn');
const saveBtn = document.getElementById('save-btn');
const deleteContainer = document.getElementById('delete-container');
const deleteBtn = document.getElementById('delete-btn');
const toast = document.getElementById('toast');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadSnippets();
    renderList();

    // Sortable Initialization
    new Sortable(memoList, {
        handle: '.drag-handle', // Drag handle selector within list items
        animation: 150,
        onEnd: function (evt) {
            // Update snippets state based on new DOM order
            const item = snippets.splice(evt.oldIndex, 1)[0];
            snippets.splice(evt.newIndex, 0, item);
            saveData();
        },
    });

    // Event Listeners
    addBtn.addEventListener('click', openAddModal);
    cancelBtn.addEventListener('click', closeModal);
    saveBtn.addEventListener('click', saveSnippet);
    deleteBtn.addEventListener('click', deleteSnippet);

    // Close modal on outside click (optional, mostly for desktop debug)
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
});

// Logic
function loadSnippets() {
    const data = localStorage.getItem('clipmemo_snippets');
    if (data) {
        snippets = JSON.parse(data);
    } else {
        // Initial sample data if empty
        snippets = [
            { id: Date.now(), label: '自宅住所', content: '〒100-0000 東京都千代田区...' },
            { id: Date.now() + 1, label: 'メールアドレス', content: 'user@example.com' }
        ];
        saveData();
    }
}

function saveData() {
    localStorage.setItem('clipmemo_snippets', JSON.stringify(snippets));
}

function renderList() {
    memoList.innerHTML = '';

    if (snippets.length === 0) {
        emptyState.classList.remove('hidden');
        memoList.classList.add('hidden');
    } else {
        emptyState.classList.add('hidden');
        memoList.classList.remove('hidden');

        snippets.forEach(snippet => {
            const li = document.createElement('li');
            li.className = 'list-item';
            li.innerHTML = `
                <div class="drag-handle">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 8h16M4 16h16" stroke="#c7c7cc" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </div>
                <div class="item-text-container">
                    <div class="item-label">${escapeHtml(snippet.label)}</div>
                    <div class="item-content">${escapeHtml(snippet.content)}</div>
                </div>
                <div class="item-actions">
                    <button class="action-btn edit-btn">編集</button>
                    <button class="action-btn delete-btn">削除</button>
                </div>
            `;

            // Text area click -> Copy
            const textContainer = li.querySelector('.item-text-container');
            textContainer.addEventListener('click', () => {
                copyToClipboard(snippet.content);
            });

            // Edit Button
            const editBtn = li.querySelector('.edit-btn');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openEditModal(snippet);
            });

            // Delete Button
            const deleteBtn = li.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('本当に削除しますか？')) {
                    deleteSnippetById(snippet.id);
                }
            });

            memoList.appendChild(li);
        });
    }
}

function openAddModal() {
    editingId = null;
    modalTitle.textContent = '新規メモ';
    labelInput.value = '';
    textInput.value = '';
    deleteContainer.classList.add('hidden');
    modal.classList.remove('hidden');
    labelInput.focus();
}

function openEditModal(snippet) {
    editingId = snippet.id;
    modalTitle.textContent = 'メモを編集';
    labelInput.value = snippet.label;
    textInput.value = snippet.content;
    deleteContainer.classList.remove('hidden');
    modal.classList.remove('hidden');
}

function closeModal() {
    modal.classList.add('hidden');
    // Dismiss keyboard
    labelInput.blur();
    textInput.blur();
}

function saveSnippet() {
    const label = labelInput.value.trim();
    const content = textInput.value.trim();

    if (!label || !content) {
        alert('タイトルと内容を入力してください');
        return;
    }

    if (editingId) {
        // Update existing
        const index = snippets.findIndex(s => s.id === editingId);
        if (index !== -1) {
            snippets[index] = { ...snippets[index], label, content };
        }
    } else {
        // Create new
        const newSnippet = {
            id: Date.now(),
            label,
            content
        };
        snippets.unshift(newSnippet); // Add to top
    }

    saveData();
    renderList();
    closeModal();
}

function deleteSnippet() {
    if (editingId && confirm('本当に削除しますか？')) {
        deleteSnippetById(editingId);
        closeModal();
    }
}

function deleteSnippetById(id) {
    snippets = snippets.filter(s => s.id !== id);
    saveData();
    renderList();
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast();
    } catch (err) {
        console.error('Failed to copy: ', err);
        alert('コピーに失敗しました: ' + err);
    }
}

function showToast() {
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 2000);
}

// Utility
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function (m) { return map[m]; });
}
