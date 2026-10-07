'use strict';

/* ===========================================================
   Storage keys
=========================================================== */
const STORAGE_KEYS = {
  TODOS: 'dashboard_todos',
  LINKS: 'dashboard_links',
};

/* ===========================================================
   Greeting + Date/Time
=========================================================== */
function updateGreeting() {
  const now = new Date();
  const hour = now.getHours();

  let greeting;
  if (hour < 5) greeting = 'Good night';
  else if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';
  else if (hour < 21) greeting = 'Good evening';
  else greeting = 'Good night';

  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };

  document.getElementById('greeting-text').textContent = `${greeting}!`;
  document.getElementById('current-datetime').textContent =
    `${now.toLocaleDateString(undefined, dateOptions)} • ${now.toLocaleTimeString(undefined, timeOptions)}`;
}

setInterval(updateGreeting, 1000);
updateGreeting();

/* ===========================================================
   Focus Timer (25 minutes)
=========================================================== */
const TIMER_DURATION = 25 * 60; // seconds

let timerRemaining = TIMER_DURATION;
let timerInterval = null;
let timerRunning = false;

const timerDisplay = document.getElementById('timer-display');
const timerStartBtn = document.getElementById('timer-start');
const timerStopBtn = document.getElementById('timer-stop');
const timerResetBtn = document.getElementById('timer-reset');

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTime(timerRemaining);
}

function startTimer() {
  if (timerRunning) return;
  if (timerRemaining <= 0) timerRemaining = TIMER_DURATION;
  timerRunning = true;
  timerInterval = setInterval(() => {
    timerRemaining -= 1;
    renderTimer();
    if (timerRemaining <= 0) {
      stopTimer();
      timerDisplay.textContent = "Time's up!";
    }
  }, 1000);
}

function stopTimer() {
  timerRunning = false;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function resetTimer() {
  stopTimer();
  timerRemaining = TIMER_DURATION;
  renderTimer();
}

timerStartBtn.addEventListener('click', startTimer);
timerStopBtn.addEventListener('click', stopTimer);
timerResetBtn.addEventListener('click', resetTimer);

renderTimer();

/* ===========================================================
   To-Do List (CRUD + Local Storage)
=========================================================== */
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoListEl = document.getElementById('todo-list');

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TODOS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTodos(todos) {
  localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(todos));
}

let todos = loadTodos();

function renderTodos() {
  todoListEl.innerHTML = '';

  if (todos.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'No tasks yet. Add one above!';
    todoListEl.appendChild(empty);
    return;
  }

  todos.forEach((todo) => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' done' : '');
    li.dataset.id = todo.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.done;
    checkbox.setAttribute('aria-label', 'Mark task done');
    checkbox.addEventListener('change', () => toggleTodo(todo.id));

    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.text;

    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-icon';
    editBtn.title = 'Edit';
    editBtn.textContent = '✏️';
    editBtn.addEventListener('click', () => editTodo(todo.id, text));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-icon';
    deleteBtn.title = 'Delete';
    deleteBtn.textContent = '🗑️';
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(text);
    li.appendChild(actions);
    todoListEl.appendChild(li);
  });
}

function addTodo(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  todos.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2), text: trimmed, done: false });
  saveTodos(todos);
  renderTodos();
}

function toggleTodo(id) {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return;
  todo.done = !todo.done;
  saveTodos(todos);
  renderTodos();
}

function deleteTodo(id) {
  todos = todos.filter((t) => t.id !== id);
  saveTodos(todos);
  renderTodos();
}

function editTodo(id, textEl) {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return;

  textEl.contentEditable = 'true';
  textEl.focus();

  // Select all text for quick replacement
  const range = document.createRange();
  range.selectNodeContents(textEl);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  function finishEdit() {
    textEl.contentEditable = 'false';
    const newText = textEl.textContent.trim();
    todo.text = newText || todo.text;
    saveTodos(todos);
    renderTodos();
  }

  textEl.addEventListener('blur', finishEdit, { once: true });
  textEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      textEl.blur();
    }
    if (e.key === 'Escape') {
      textEl.textContent = todo.text;
      textEl.blur();
    }
  });
}

todoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addTodo(todoInput.value);
  todoInput.value = '';
  todoInput.focus();
});

renderTodos();

/* ===========================================================
   Quick Links (CRUD + Local Storage)
=========================================================== */
const linkForm = document.getElementById('link-form');
const linkNameInput = document.getElementById('link-name');
const linkUrlInput = document.getElementById('link-url');
const linkListEl = document.getElementById('link-list');

function loadLinks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LINKS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLinks(links) {
  localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(links));
}

let links = loadLinks();

function normalizeUrl(url) {
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function renderLinks() {
  linkListEl.innerHTML = '';

  if (links.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No quick links yet. Add one above!';
    linkListEl.appendChild(empty);
    return;
  }

  links.forEach((link) => {
    const item = document.createElement('div');
    item.className = 'link-item';

    const anchor = document.createElement('a');
    anchor.href = link.url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.textContent = link.name;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-icon';
    deleteBtn.title = 'Delete';
    deleteBtn.textContent = '🗑️';
    deleteBtn.addEventListener('click', () => deleteLink(link.id));

    item.appendChild(anchor);
    item.appendChild(deleteBtn);
    linkListEl.appendChild(item);
  });
}

function addLink(name, url) {
  const trimmedName = name.trim();
  const normalizedUrl = normalizeUrl(url);
  if (!trimmedName || !normalizedUrl) return;

  try {
    new URL(normalizedUrl);
  } catch {
    alert('Please enter a valid URL.');
    return;
  }

  links.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2), name: trimmedName, url: normalizedUrl });
  saveLinks(links);
  renderLinks();
}

function deleteLink(id) {
  links = links.filter((l) => l.id !== id);
  saveLinks(links);
  renderLinks();
}

linkForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addLink(linkNameInput.value, linkUrlInput.value);
  linkNameInput.value = '';
  linkUrlInput.value = '';
  linkNameInput.focus();
});

renderLinks();
