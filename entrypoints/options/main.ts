import { STORAGE_PREFIX } from '@/src/utils/settings';

// biome-ignore lint/style/noNonNullAssertion: element exists in index.html
const app = document.getElementById('app')!;

function getEntries(): { key: string; shortKey: string; value: string }[] {
    const entries: { key: string; shortKey: string; value: string }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_PREFIX)) {
            entries.push({
                key,
                shortKey: key.slice(STORAGE_PREFIX.length),
                value: localStorage.getItem(key) ?? '',
            });
        }
    }
    entries.sort((a, b) => a.shortKey.localeCompare(b.shortKey));
    return entries;
}

function formatValue(raw: string): string {
    try {
        return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
        return raw;
    }
}

function isValidJson(str: string): boolean {
    try {
        JSON.parse(str);
        return true;
    } catch {
        return false;
    }
}

function render(): void {
    const entries = getEntries();

    let html = `<div class="toolbar">
        <button id="btn-refresh">Refresh</button>
        <button id="btn-add">Add Key</button>
        <button id="btn-clear" class="danger">Clear All Settings</button>
    </div>`;

    html += '<div id="add-form-container"></div>';

    if (entries.length === 0) {
        html += `<div class="empty">No settings found with prefix "${STORAGE_PREFIX}"</div>`;
    } else {
        for (const entry of entries) {
            const formatted = formatValue(entry.value);
            const rows = Math.min(Math.max(formatted.split('\n').length, 1), 15);
            html += `<div class="entry" data-key="${entry.key}">
                <div class="entry-header">
                    <span class="entry-key">${entry.shortKey}</span>
                </div>
                <textarea rows="${rows}" data-key="${entry.key}">${escapeHtml(formatted)}</textarea>
                <div class="entry-actions">
                    <button class="save btn-save" data-key="${entry.key}">Save</button>
                    <button class="danger btn-delete" data-key="${entry.key}">Delete</button>
                </div>
            </div>`;
        }
    }

    app.innerHTML = html;
    bindEvents();
}

function escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function bindEvents(): void {
    document.getElementById('btn-refresh')?.addEventListener('click', render);

    document.getElementById('btn-clear')?.addEventListener('click', () => {
        const entries = getEntries();
        if (entries.length === 0) return;
        if (!confirm(`Delete all ${entries.length} settings? This cannot be undone.`)) return;
        for (const entry of entries) {
            localStorage.removeItem(entry.key);
        }
        render();
    });

    document.getElementById('btn-add')?.addEventListener('click', () => {
        const container = document.getElementById('add-form-container')!;
        if (container.children.length > 0) {
            container.innerHTML = '';
            return;
        }
        container.innerHTML = `<div class="add-form">
            <input type="text" id="add-key" placeholder="Key name (without prefix)">
            <textarea id="add-value" rows="3" placeholder="Value (JSON or plain text)"></textarea>
            <div class="entry-actions">
                <button class="save" id="btn-add-save">Add</button>
            </div>
        </div>`;
        document.getElementById('btn-add-save')?.addEventListener('click', () => {
            const keyInput = document.getElementById('add-key') as HTMLInputElement;
            const valueInput = document.getElementById('add-value') as HTMLTextAreaElement;
            const key = keyInput.value.trim();
            if (!key) return;
            localStorage.setItem(STORAGE_PREFIX + key, valueInput.value);
            render();
        });
    });

    for (const btn of document.querySelectorAll<HTMLButtonElement>('.btn-save')) {
        btn.addEventListener('click', () => {
            const key = btn.dataset.key!;
            // biome-ignore lint/style/noNonNullAssertion: textarea rendered above
            const textarea = document.querySelector<HTMLTextAreaElement>(`textarea[data-key="${key}"]`)!;
            const value = textarea.value;
            if (!isValidJson(value)) {
                const existing = textarea.parentElement?.querySelector('.warning');
                if (!existing) {
                    const warn = document.createElement('div');
                    warn.className = 'warning';
                    warn.textContent = 'Warning: value is not valid JSON. Saved anyway.';
                    textarea.after(warn);
                }
            }
            localStorage.setItem(key, value);
            textarea.classList.remove('invalid');
        });
    }

    for (const btn of document.querySelectorAll<HTMLButtonElement>('.btn-delete')) {
        btn.addEventListener('click', () => {
            const key = btn.dataset.key!;
            if (!confirm(`Delete "${key}"?`)) return;
            localStorage.removeItem(key);
            render();
        });
    }

    for (const textarea of document.querySelectorAll<HTMLTextAreaElement>('textarea[data-key]')) {
        textarea.addEventListener('input', () => {
            if (isValidJson(textarea.value)) {
                textarea.classList.remove('invalid');
            } else {
                textarea.classList.add('invalid');
            }
        });
    }
}

render();
