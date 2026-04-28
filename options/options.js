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

// ─── DOM ───

const $ = (id) => document.getElementById(id);

const els = {
  workspacesList: $('workspaces-list'),
  newName: $('new-name'),
  newSlug: $('new-slug'),
  newPrefixes: $('new-prefixes'),
  btnAdd: $('btn-add'),
  addError: $('add-error'),
  openNewTab: $('open-new-tab'),
  langSelect: $('language-select'),
  saveFeedback: $('save-feedback'),
};

let workspaces = [];

// ─── i18n apply ───

function applyI18n() {
  $('tab-btn-workspaces').textContent = t('workspacesSection');
  $('tab-btn-settings').textContent = t('settingsTab');
  $('lbl-workspaces-hint').textContent = t('workspacesHint');
  $('lbl-add-title').textContent = t('addWorkspaceTitle');
  $('lbl-name').textContent = t('nameLabel');
  $('lbl-slug').textContent = t('slugLabel');
  $('lbl-prefixes').textContent = t('prefixesLabel') + ' ';
  $('lbl-prefixes-hint').textContent = `(${t('prefixesHint')})`;
  $('lbl-language-title').textContent = t('languageTitle');
  $('lbl-behavior-title').textContent = t('behaviorSection');
  $('lbl-open-new-tab').textContent = t('openNewTabLabel');
  $('lbl-shortcuts-title').textContent = t('shortcutsTitle');
  $('lbl-shortcuts-hint').textContent = t('shortcutsHint');
  $('btn-manage-shortcuts').textContent = t('manageShortcuts');
  $('opt-auto').textContent = t('langAuto');
  els.btnAdd.textContent = t('addBtn');
  els.newName.placeholder = t('namePlaceholder');
  els.newSlug.placeholder = t('slugPlaceholder');
  els.newPrefixes.placeholder = t('prefixesPlaceholder');
  els.saveFeedback.textContent = t('savedMsg');
}

// ─── Tabs ────

function initTabs() {
  document.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document
        .querySelectorAll('.tab')
        .forEach((b) => b.classList.remove('active'));
      document
        .querySelectorAll('.tab-content')
        .forEach((c) => c.classList.add('hidden'));
      btn.classList.add('active');
      $(`tab-${btn.dataset.tab}`).classList.remove('hidden');
    });
  });
}

// ─── Storage helpers ───

function showFeedback() {
  els.saveFeedback.classList.remove('hidden');
  setTimeout(() => els.saveFeedback.classList.add('hidden'), 2000);
}

function save(callback) {
  chrome.storage.sync.set({ workspaces }, () => {
    showFeedback();
    if (callback) callback();
  });
}

// ─── Validation ───

function validateWorkspace(name, slug, currentId = null) {
  if (!name) return t('errorNameRequired');
  if (!slug) return t('errorSlugRequired');
  if (!/^[a-z0-9-]+$/.test(slug)) return t('errorSlugInvalid');
  if (workspaces.some((w) => w.slug === slug && w.id !== currentId))
    return t('errorSlugDuplicate');
  return null;
}

function parsePrefixes(raw) {
  return raw
    .split(',')
    .map((p) => p.trim().toUpperCase())
    .filter((p) => /^[A-Z]+$/.test(p));
}

// ─── Workspaces render ───

function renderWorkspaces() {
  els.workspacesList.innerHTML = '';

  if (!workspaces.length) {
    els.workspacesList.innerHTML = `<p class="no-items">${t('noWorkspacesYet')}</p>`;
    return;
  }

  workspaces.forEach((w, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'workspace-wrapper';
    wrapper.dataset.id = w.id;
    wrapper.innerHTML = buildWorkspaceItemHTML(w, index);
    bindWorkspaceItemEvents(wrapper, w, index);
    els.workspacesList.appendChild(wrapper);
  });
}

function buildWorkspaceItemHTML(w, index) {
  const badges = w.prefixes
    .map((p) => `<span class="prefix-badge">${p}</span>`)
    .join('');
  return `
    <div class="workspace-item" data-view="display">
      <div class="workspace-info">
        <span class="workspace-name">${w.name}</span>
        <span class="workspace-slug">${w.slug}.atlassian.net</span>
        <div class="workspace-prefixes">${badges}</div>
      </div>
      <div class="workspace-actions">
        <button class="btn ghost btn-edit" data-index="${index}">${t('editBtn')}</button>
        <button class="btn danger btn-remove" data-index="${index}">${t('removeBtn')}</button>
      </div>
    </div>
    <div class="workspace-edit-form card hidden" data-view="edit">
      <h3>${t('editWorkspaceTitle')}</h3>
      <div class="form-row">
        <label>${t('nameLabel')}</label>
        <input class="edit-name" type="text" value="${w.name}" placeholder="${t('namePlaceholder')}" />
      </div>
      <div class="form-row">
        <label>${t('slugLabel')}</label>
        <input class="edit-slug" type="text" value="${w.slug}" placeholder="${t('slugPlaceholder')}" />
      </div>
      <div class="form-row">
        <label>${t('prefixesLabel')} <span class="hint-inline">(${t('prefixesHint')})</span></label>
        <input class="edit-prefixes" type="text" value="${w.prefixes.join(', ')}" placeholder="${t('prefixesPlaceholder')}" />
      </div>
      <div class="edit-actions">
        <button class="btn primary btn-save-edit">${t('saveBtn')}</button>
        <button class="btn ghost btn-cancel-edit">${t('cancelBtn')}</button>
      </div>
      <div class="edit-error error hidden"></div>
    </div>
  `;
}

function bindWorkspaceItemEvents(wrapper, w, index) {
  const displayView = wrapper.querySelector('[data-view="display"]');
  const editView = wrapper.querySelector('[data-view="edit"]');
  const errorEl = wrapper.querySelector('.edit-error');

  wrapper.querySelector('.btn-edit').addEventListener('click', () => {
    displayView.classList.add('hidden');
    editView.classList.remove('hidden');
    wrapper.querySelector('.edit-name').focus();
  });

  wrapper.querySelector('.btn-cancel-edit').addEventListener('click', () => {
    editView.classList.add('hidden');
    displayView.classList.remove('hidden');
  });

  wrapper.querySelector('.btn-save-edit').addEventListener('click', () => {
    const name = wrapper.querySelector('.edit-name').value.trim();
    const slug = wrapper
      .querySelector('.edit-slug')
      .value.trim()
      .toLowerCase()
      .replace(/\s+/g, '-');
    const prefixes = parsePrefixes(
      wrapper.querySelector('.edit-prefixes').value
    );
    const error = validateWorkspace(name, slug, w.id);

    if (error) {
      errorEl.textContent = error;
      errorEl.classList.remove('hidden');
      return;
    }

    workspaces[index] = { ...workspaces[index], name, slug, prefixes };
    save(renderWorkspaces);
  });

  wrapper.querySelector('.btn-remove').addEventListener('click', () => {
    workspaces.splice(index, 1);
    save(renderWorkspaces);
  });
}

// ─── Add workspace ───

function addWorkspace() {
  els.addError.classList.add('hidden');

  const name = els.newName.value.trim();
  const slug = els.newSlug.value.trim().toLowerCase().replace(/\s+/g, '-');
  const prefixes = parsePrefixes(els.newPrefixes.value);
  const error = validateWorkspace(name, slug);

  if (error) {
    els.addError.textContent = error;
    els.addError.classList.remove('hidden');
    return;
  }

  workspaces.push({ id: crypto.randomUUID(), name, slug, prefixes });
  save(renderWorkspaces);

  els.newName.value = els.newSlug.value = els.newPrefixes.value = '';
  els.newName.focus();
}

// ─── Shortcuts ────

const COMMAND_LABELS = {
  _execute_action: 'shortcutOpenPopup',
};

const isMac = navigator.platform.toUpperCase().includes('MAC');

function buildShortcutRow(label, key, isInternal = false) {
  const row = document.createElement('div');
  row.className = 'shortcut-row';
  row.innerHTML = `
    <span class="shortcut-label">${label}</span>
    <div class="shortcut-right">
      ${isInternal ? `<span class="shortcut-badge">${t('shortcutInPopup')}</span>` : ''}
      <kbd class="shortcut-key">${key}</kbd>
    </div>
  `;
  return row;
}

async function renderShortcuts() {
  const commands = await chrome.commands.getAll();
  const list = $('shortcuts-list');
  list.innerHTML = '';

  commands.forEach((cmd) => {
    const labelKey = COMMAND_LABELS[cmd.name];
    if (!labelKey) return;
    list.appendChild(
      buildShortcutRow(t(labelKey), cmd.shortcut || t('shortcutNotSet'))
    );
  });

  const copyKey = isMac ? '⌘↵' : 'Ctrl+Enter';
  list.appendChild(buildShortcutRow(t('shortcutCopyLink'), copyKey, true));
}

// ─── Init ────

async function init() {
  const data = await new Promise((resolve) =>
    chrome.storage.sync.get(['workspaces', 'openInNewTab', 'language'], resolve)
  );

  workspaces = data.workspaces || [];

  await i18n.init(data.language || 'auto');
  applyI18n();
  initTabs();
  renderWorkspaces();
  await renderShortcuts();

  els.openNewTab.checked = data.openInNewTab !== false;
  els.langSelect.value = data.language || 'auto';

  els.btnAdd.addEventListener('click', addWorkspace);
  [els.newName, els.newSlug, els.newPrefixes].forEach((input) =>
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addWorkspace();
    })
  );

  els.openNewTab.addEventListener('change', () => {
    chrome.storage.sync.set(
      { openInNewTab: els.openNewTab.checked },
      showFeedback
    );
  });

  els.langSelect.addEventListener('change', () => {
    chrome.storage.sync.set({ language: els.langSelect.value }, async () => {
      await i18n.init(els.langSelect.value);
      applyI18n();
      renderWorkspaces();
      await renderShortcuts();
      showFeedback();
    });
  });

  $('btn-manage-shortcuts').addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
  });
}

init();
