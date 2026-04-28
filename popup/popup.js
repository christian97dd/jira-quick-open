// ─── i18n ───

const i18n = {
  messages: {},

  detectLang() {
    const ui = chrome.i18n.getUILanguage();
    if (ui.startsWith('es')) return 'es';
    if (ui.startsWith('pt')) return 'pt_BR';
    return 'en';
  },

  async init(stored = 'auto') {
    const lang = stored === 'auto' ? this.detectLang() : stored;
    try {
      const res = await fetch(
        chrome.runtime.getURL(`_locales/${lang}/messages.json`)
      );
      this.messages = await res.json();
    } catch {
      const res = await fetch(
        chrome.runtime.getURL('_locales/en/messages.json')
      );
      this.messages = await res.json();
    }
  },

  t(key) {
    return this.messages[key]?.message || key;
  },
};

const t = (key) => i18n.t(key);
const MAX_HISTORY = 10;
const $ = (id) => document.getElementById(id);

const els = {
  noWorkspaces: $('no-workspaces'),
  noWorkspacesMsg: $('no-workspaces-msg'),
  goToOptions: $('go-to-options'),
  main: $('main'),
  workspaceSelect: $('workspace-select'),
  ticketInput: $('ticket-input'),
  btnOpen: $('btn-open'),
  btnCopy: $('btn-copy'),
  copyFeedback: $('copy-feedback'),
  historySection: $('history-section'),
  historyHeader: $('history-header'),
  historyList: $('history-list'),
  optionsLink: $('options-link'),
};

let state = {
  workspaces: [],
  lastWorkspaceId: null,
  recentTickets: [],
  openInNewTab: true,
};

function applyI18n() {
  els.noWorkspacesMsg.textContent = t('noWorkspacesMsg');
  els.goToOptions.textContent = t('noWorkspacesLink');
  els.ticketInput.placeholder = t('ticketPlaceholder');
  els.copyFeedback.textContent = t('linkCopied');
  els.historyHeader.textContent = t('recentHeader');

  els.btnOpen.innerHTML = `${t('openBtn')} <kbd>↵</kbd>`;
  els.btnCopy.innerHTML = `${t('copyBtn')} <kbd>⌃↵</kbd>`;
}

async function loadState() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      [
        'workspaces',
        'lastWorkspaceId',
        'openInNewTab',
        'recentTickets',
        'language',
      ],
      (data) => {
        state.workspaces = data.workspaces || [];
        state.lastWorkspaceId = data.lastWorkspaceId || null;
        state.openInNewTab = data.openInNewTab !== false;
        state.recentTickets = data.recentTickets || [];
        state.language = data.language || 'auto';
        resolve();
      }
    );
  });
}

function getActiveWorkspace() {
  return (
    state.workspaces.find((w) => w.id === els.workspaceSelect.value) || null
  );
}

function normalizeTicket(raw, workspace) {
  const value = raw.trim().toUpperCase().replace(/\s+/g, '-');
  if (/^[A-Z]+-\d+$/.test(value)) return value;
  if (/^\d+$/.test(value) && workspace?.prefixes?.length === 1) {
    return `${workspace.prefixes[0]}-${value}`;
  }
  return value;
}

function buildUrl(ticket, workspace) {
  return `https://${workspace.slug}.atlassian.net/browse/${ticket}`;
}

function getInputTicket() {
  return normalizeTicket(els.ticketInput.value, getActiveWorkspace());
}

function isValidTicket(ticket) {
  return /^[A-Z]+-\d+$/.test(ticket);
}

function setButtonsState(ticket) {
  const valid = isValidTicket(ticket);
  els.btnOpen.disabled = !valid;
  els.btnCopy.disabled = !valid;
}

async function saveToHistory(ticket, workspaceId) {
  const entry = { ticket, workspaceId, openedAt: Date.now() };
  const filtered = state.recentTickets.filter(
    (r) => !(r.ticket === ticket && r.workspaceId === workspaceId)
  );
  const updated = [entry, ...filtered].slice(0, MAX_HISTORY);
  state.recentTickets = updated;
  await new Promise((resolve) =>
    chrome.storage.sync.set(
      { recentTickets: updated, lastWorkspaceId: workspaceId },
      resolve
    )
  );
}

function openTicket() {
  const workspace = getActiveWorkspace();
  if (!workspace) return;
  const ticket = getInputTicket();
  if (!isValidTicket(ticket)) return;

  const url = buildUrl(ticket, workspace);
  if (state.openInNewTab) {
    chrome.tabs.create({ url });
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) chrome.tabs.update(tabs[0].id, { url });
    });
  }
  saveToHistory(ticket, workspace.id);
  window.close();
}

async function copyTicketLink() {
  const workspace = getActiveWorkspace();
  if (!workspace) return;
  const ticket = getInputTicket();
  if (!isValidTicket(ticket)) return;

  await navigator.clipboard.writeText(buildUrl(ticket, workspace));
  saveToHistory(ticket, workspace.id);
  showCopyFeedback();
}

function showCopyFeedback() {
  els.copyFeedback.classList.remove('hidden');
  setTimeout(() => els.copyFeedback.classList.add('hidden'), 1800);
}

function renderWorkspaces() {
  els.workspaceSelect.innerHTML = '';
  state.workspaces.forEach((w) => {
    const opt = document.createElement('option');
    opt.value = w.id;
    opt.textContent = w.name;
    if (w.id === state.lastWorkspaceId) opt.selected = true;
    els.workspaceSelect.appendChild(opt);
  });
}

function renderHistory() {
  if (!state.recentTickets.length) {
    els.historySection.classList.add('hidden');
    return;
  }
  els.historySection.classList.remove('hidden');
  els.historyList.innerHTML = '';

  state.recentTickets.forEach(({ ticket, workspaceId }) => {
    const workspace = state.workspaces.find((w) => w.id === workspaceId);
    if (!workspace) return;

    const li = document.createElement('li');
    li.innerHTML = `
      <span class="history-ticket">${ticket}</span>
      <span class="history-workspace">${workspace.name}</span>
    `;
    li.addEventListener('click', () => {
      els.workspaceSelect.value = workspaceId;
      els.ticketInput.value = ticket;
      els.ticketInput.focus();
      setButtonsState(ticket);
    });
    els.historyList.appendChild(li);
  });
}

function initUI() {
  if (!state.workspaces.length) {
    els.noWorkspaces.classList.remove('hidden');
    return;
  }
  els.main.classList.remove('hidden');
  renderWorkspaces();
  renderHistory();
  els.ticketInput.focus();
}

function bindEvents() {
  els.ticketInput.addEventListener('input', () => {
    setButtonsState(
      normalizeTicket(els.ticketInput.value, getActiveWorkspace())
    );
  });

  els.ticketInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      openTicket();
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      copyTicketLink();
    }
  });

  els.btnOpen.addEventListener('click', openTicket);
  els.btnCopy.addEventListener('click', copyTicketLink);

  els.optionsLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  els.goToOptions?.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
}

async function init() {
  await loadState();
  await i18n.init(state.language);
  applyI18n();
  initUI();
  bindEvents();
  setButtonsState('');
}

init();
