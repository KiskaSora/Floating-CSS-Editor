const MODULE_NAME = 'floating-css-editor';

const context = SillyTavern.getContext();
const { extensionSettings, saveSettingsDebounced, eventSource, event_types } = context;

let _updateCounterTimeout = null;

const locales = {
    en: {
        settings_show: 'Show floating CSS editor',
        settings_autosync: 'Auto-load CSS when theme changes',
        settings_hint: 'Automatically loads new theme CSS into the editor',
        header_title: 'CSS Editor',
        header_refresh: 'Refresh from theme',
        header_collapse: 'Collapse',
        header_expand: 'Expand',
        header_close: 'Close',
        info_lines: 'lines',
        placeholder: 'Paste your CSS code here...',
        btn_apply: 'Apply',
        btn_clear: 'Clear',
        fab_title: 'Open CSS Editor',
        toast_loaded: 'Theme CSS loaded',
        toast_applied: 'CSS applied',
        toast_cleared: 'CSS cleared',
        toast_changed_title: 'Theme Changed',
        toast_changed_msg: 'Theme CSS loaded into editor',
        search_placeholder: 'Find...',
        search_prev: 'Prev',
        search_next: 'Next',
        search_clear: 'Clear',
        search_count_empty: '0/0'
    },
    ru: {
        settings_show: 'Показывать плавающий CSS редактор',
        settings_autosync: 'Автоматически подгружать CSS при смене темы',
        settings_hint: 'При включении - CSS новой темы автоматически загружается в редактор',
        header_title: 'CSS Редактор',
        header_refresh: 'Обновить из темы',
        header_collapse: 'Свернуть',
        header_expand: 'Развернуть',
        header_close: 'Закрыть',
        info_lines: 'строк',
        placeholder: 'Вставьте ваш CSS код...',
        btn_apply: 'Применить',
        btn_clear: 'Очистить',
        fab_title: 'Открыть CSS редактор',
        toast_loaded: 'CSS темы загружен',
        toast_applied: 'CSS применен',
        toast_cleared: 'CSS очищен',
        toast_changed_title: 'Тема изменена',
        toast_changed_msg: 'CSS темы загружен в редактор',
        search_placeholder: 'Поиск...',
        search_prev: 'Назад',
        search_next: 'Вперёд',
        search_clear: 'Очистить',
        search_count_empty: '0/0'
    }
};

function getLocale() {
    const userLang = navigator.language || navigator.userLanguage;
    const lang = userLang.split('-')[0];
    return locales[lang] || locales.en;
}

const t = getLocale();

const defaultSettings = {
    enabled: true,
    position: { top: 100, left: null },
    size: { width: 420, height: null },
    isCollapsed: false,
    autoSync: true
};

function loadSettings() {
    if (!extensionSettings[MODULE_NAME]) {
        extensionSettings[MODULE_NAME] = structuredClone(defaultSettings);
    }
    return extensionSettings[MODULE_NAME];
}

function createSettingsUI() {
    const settingsHTML = `
        <div class="floating-css-settings">
            <label class="checkbox_label">
                <input id="floating-css-toggle" type="checkbox" />
                <span>${t.settings_show}</span>
            </label>
            <label class="checkbox_label" style="margin-top: 8px;">
                <input id="floating-css-autosync" type="checkbox" />
                <span>${t.settings_autosync}</span>
            </label>
            <small style="display: block; margin-top: 8px; opacity: 0.7;">
                ${t.settings_hint}
            </small>
        </div>
    `;
    
    $('#extensions_settings2').append(settingsHTML);
    
    const settings = loadSettings();
    $('#floating-css-toggle').prop('checked', settings.enabled);
    $('#floating-css-autosync').prop('checked', settings.autoSync);
    
    $('#floating-css-toggle').on('change', function() {
        settings.enabled = $(this).prop('checked');
        saveSettingsDebounced();
        toggleEditorVisibility(settings.enabled);
    });
    
    $('#floating-css-autosync').on('change', function() {
        settings.autoSync = $(this).prop('checked');
        saveSettingsDebounced();
    });
}

function createFloatingEditor() {
    const settings = loadSettings();
    
    if (settings.position.left === null) {
        settings.position.left = window.innerWidth - 440;
    }
    
    const editorHTML = `
        <div id="floating-css-editor" class="floating-window">
            <div id="css-header" class="floating-header">
                <span class="header-title">${t.header_title}</span>
                <div class="header-controls">
                    <button id="refresh-css-btn" class="header-btn" title="${t.header_refresh}">
                        <i class="fa-solid fa-arrows-rotate"></i>
                    </button>
                    <button id="collapse-btn" class="header-btn" title="${t.header_collapse}">_</button>
                    <button id="close-btn" class="header-btn" title="${t.header_close}">×</button>
                </div>
            </div>
            <div id="css-content" class="floating-content">
                <div class="css-info">
                    <span id="css-char-count">0 KB</span>
                    <span id="css-lines-count">0 ${t.info_lines}</span>
                </div>
            <div class="css-searchbar">
              <input id="css-search-input" class="text_pole" type="search"
                     placeholder="${t.search_placeholder}" autocomplete="off" />
              <button id="css-search-prev" class="menu_button" type="button"
                      title="${t.search_prev}">${t.search_prev}</button>
              <button id="css-search-next" class="menu_button" type="button"
                      title="${t.search_next}">${t.search_next}</button>
              <span id="css-search-count">${t.search_count_empty}</span>
              <button id="css-search-clear" class="menu_button" type="button"
                      title="${t.search_clear}">${t.search_clear}</button>
                 </div>
                <textarea id="floating-customCSS" class="text_pole monospace" rows="15" placeholder="${t.placeholder}"></textarea>
                <div class="button-row">
                    <button id="apply-css" class="menu_button">${t.btn_apply}</button>
                    <button id="clear-css" class="menu_button">${t.btn_clear}</button>
                </div>
            </div>
            <div id="resize-handle" class="resize-handle"></div>
        </div>
        
        <button id="show-editor-fab" class="editor-fab" title="${t.fab_title}">
            <i class="fa-solid fa-code"></i>
        </button>
    `;
    
    $('body').append(editorHTML);
    
    const $editor = $('#floating-css-editor');
    const $fab = $('#show-editor-fab');
    
    $editor.css({
        top: settings.position.top + 'px',
        left: settings.position.left + 'px'
    });
    
    if (settings.size) {
        if (settings.size.width) {
            $editor.css('width', settings.size.width + 'px');
        }
        if (settings.size.height) {
            $editor.css('height', settings.size.height + 'px');
        }
    }
    
    syncWithOriginalCSS();
    initSearchUI();

    if (settings.isCollapsed) {
        $editor.addClass('collapsed');
    }
    
    if (!settings.enabled) {
        $editor.hide();
        $fab.hide();
    } else {
        $fab.hide();
    }
    
    makeDraggable();
    makeResizable();
    setupEventHandlers();
    startThemeWatcher();
}

function syncWithOriginalCSS() {
    const $originalCSS = $('#customCSS');
    const $floatingCSS = $('#floating-customCSS');
    
    let isSyncing = false;
    
    if ($originalCSS.length) {
        $floatingCSS.val($originalCSS.val());
        updateLineCount();
        
        $floatingCSS.on('input', function() {
            if (isSyncing) return;
            isSyncing = true;
            
            $originalCSS.val($(this).val());
            $originalCSS.trigger('input');
            updateLineCount();
            if ((searchState.query || '').trim()) queueRebuild();
            setTimeout(() => isSyncing = false, 50);
        });
        
        $originalCSS.on('input change', function() {
            if (isSyncing) return;
            const settings = loadSettings();
            if (settings.autoSync && $floatingCSS.val() !== $(this).val()) {
                isSyncing = true;
                
                $floatingCSS.val($(this).val());
                updateLineCount();
                highlightRefreshButton();
                if ((searchState.query || '').trim()) queueRebuild();
                setTimeout(() => isSyncing = false, 50);
            }
        });
    }
}

function startThemeWatcher() {
    const $originalCSS = $('#customCSS');
    
    if ($originalCSS.length) {
        const observer = new MutationObserver(() => {
            const settings = loadSettings();
            if (settings.autoSync) {
                const $floatingCSS = $('#floating-customCSS');
                if ($floatingCSS.val() !== $originalCSS.val()) {
                    $floatingCSS.val($originalCSS.val());
                    updateLineCount();
                    showThemeChangeNotification();
                }
            }
        });
        
        observer.observe($originalCSS[0], {
            attributes: false,
            childList: false,
            characterData: false,
            subtree: false
        });
    }
}

function updateLineCount() {
    if (_updateCounterTimeout) {
        clearTimeout(_updateCounterTimeout);
    }
    
    _updateCounterTimeout = setTimeout(() => {
        const $floatingCSS = $('#floating-customCSS');
        const text = $floatingCSS.val();
        const lines = text ? text.split('\n').length : 1;
        const sizeKB = (new Blob([text]).size / 1024).toFixed(2);
        
        $('#css-lines-count').text(`${lines} ${t.info_lines}`);
        $('#css-char-count').text(`${sizeKB} KB`);
    }, 300);
}
const searchState = {
    query: '',
    matches: [],
    current: -1,
    timer: null,
};

function setSearchCount(current, total) {
    if (!total) {
        $('#css-search-count').text(t.search_count_empty);
        return;
    }
    $('#css-search-count').text(`${current + 1}/${total}`);
}

function getLineHeightPx(el) {
    const cs = getComputedStyle(el);
    const lh = parseFloat(cs.lineHeight);
    if (Number.isFinite(lh)) return lh;
    const fs = parseFloat(cs.fontSize) || 13;
    return Math.round(fs * 1.6);
}

function scrollToIndex(ta, index) {

    // Создаём временный "клон" textarea
    const div = document.createElement('div');

    const style = getComputedStyle(ta);

    // Копируем важные стили
    [
        'fontFamily',
        'fontSize',
        'lineHeight',
        'padding',
        'border',
        'boxSizing',
        'whiteSpace',
        'wordWrap',
        'width'
    ].forEach(p => {
        div.style[p] = style[p];
    });

    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';

    // Текст ДО совпадения
    div.textContent = ta.value.slice(0, index);

    // Маркер позиции
    const span = document.createElement('span');
    span.textContent = '.';
    div.appendChild(span);

    document.body.appendChild(div);

    // Получаем реальную Y-позицию
    const y = span.offsetTop;

    document.body.removeChild(div);

    // Центрируем
    const target =
        y - ta.clientHeight / 2 + parseInt(style.lineHeight);

    ta.scrollTop = Math.max(0, target);
}

function selectSearchMatch(i) {
    const ta = document.getElementById('floating-customCSS');
    if (!ta) return;

    const q = (searchState.query || '').trim();
    const total = searchState.matches.length;
    if (!q || !total) {
        setSearchCount(0, 0);
        return;
    }

    const start = searchState.matches[i];
    const end = start + q.length;

    ta.focus();
    ta.setSelectionRange(start, end);
    scrollToIndex(ta, start);

    searchState.current = i;
    setSearchCount(i, total);
}

function rebuildSearchMatches() {
    const ta = document.getElementById('floating-customCSS');
    if (!ta) return;

    const q = (searchState.query || '').trim();
    const text = ta.value || '';

    searchState.matches = [];
    searchState.current = -1;

    if (!q) {
        setSearchCount(0, 0);
        return;
    }

    const hay = text.toLowerCase();
    const needle = q.toLowerCase();

    let idx = 0;
    while (true) {
        idx = hay.indexOf(needle, idx);
        if (idx === -1) break;
        searchState.matches.push(idx);
        idx += Math.max(1, needle.length);
    }

    if (searchState.matches.length) {
        searchState.current = -1;
        setSearchCount(0, searchState.matches.length);
    } else {
        setSearchCount(0, 0);
    }
}

function queueRebuild() {
    if (searchState.timer) clearTimeout(searchState.timer);
    searchState.timer = setTimeout(rebuildSearchMatches, 200);
}

function searchNext(dir = 1) {
    const total = searchState.matches.length;
    if (!total) return;

    let i = searchState.current;
    if (i < 0) i = 0;

    i = (i + dir) % total;
    if (i < 0) i = total - 1;

    selectSearchMatch(i);
}

function initSearchUI() {
    const $inp = $('#css-search-input');
    const $ta = $('#floating-customCSS');

    $inp.on('input', function () {
        searchState.query = $(this).val() || '';
        queueRebuild();
    });

    $('#css-search-next').on('click', () => searchNext(1));
    $('#css-search-prev').on('click', () => searchNext(-1));

    $('#css-search-clear').on('click', () => {
        $('#css-search-input').val('');
        searchState.query = '';
        searchState.matches = [];
        searchState.current = -1;
        setSearchCount(0, 0);
        $ta.trigger('focus');
    });

    $inp.on('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchNext(e.shiftKey ? -1 : 1);
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            $('#css-search-clear').trigger('click');
        }
    });

    $ta.on('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
            e.preventDefault();
            $inp.trigger('focus');
            $inp[0].select?.();
        }
    });

    setSearchCount(0, 0);
}

function highlightRefreshButton() {
    const $btn = $('#refresh-css-btn');
    $btn.addClass('highlight-pulse');
    setTimeout(() => $btn.removeClass('highlight-pulse'), 2000);
}

function showThemeChangeNotification() {
    toastr.info(t.toast_changed_msg, t.toast_changed_title);
}

function makeDraggable() {
    const $editor = $('#floating-css-editor');
    const $header = $('#css-header');
    
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    
    $header.on('mousedown', function(e) {
        if ($(e.target).closest('.header-btn').length || $(e.target).is('i')) return;
        
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = $editor.offset().left;
        initialTop = $editor.offset().top;
        
        $editor.addClass('dragging');
        
        $(document).on('mousemove.drag', function(e) {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            $editor.css({
                left: (initialLeft + deltaX) + 'px',
                top: (initialTop + deltaY) + 'px'
            });
        });
        
        $(document).on('mouseup.drag', function() {
            if (isDragging) {
                isDragging = false;
                $editor.removeClass('dragging');
                $(document).off('.drag');
                
                const settings = loadSettings();
                settings.position = {
                    top: parseInt($editor.css('top')),
                    left: parseInt($editor.css('left'))
                };
                saveSettingsDebounced();
            }
        });
        
        e.preventDefault();
    });
}

function makeResizable() {
    const $editor = $('#floating-css-editor');
    const $resizeHandle = $('#resize-handle');
    
    let isResizing = false;
    let startX, startY, startWidth, startHeight;
    let animationFrame = null;
    
    $resizeHandle.on('mousedown', function(e) {
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = $editor.width();
        startHeight = $editor.height();
        
        $editor.addClass('resizing');
        
        $(document).on('mousemove.resize', function(e) {
            if (!isResizing) return;
            
            // Используем requestAnimationFrame для плавности
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }
            
            animationFrame = requestAnimationFrame(() => {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                
                const newWidth = Math.max(300, startWidth + deltaX);
                const newHeight = Math.max(200, startHeight + deltaY);
                
                $editor.css({
                    width: newWidth + 'px',
                    height: newHeight + 'px'
                });
            });
        });
        
        $(document).on('mouseup.resize', function() {
            if (isResizing) {
                isResizing = false;
                $editor.removeClass('resizing');
                $(document).off('.resize');
                
                if (animationFrame) {
                    cancelAnimationFrame(animationFrame);
                }
                
                const settings = loadSettings();
                settings.size = {
                    width: $editor.width(),
                    height: $editor.height()
                };
                saveSettingsDebounced();
            }
        });
        
        e.preventDefault();
        e.stopPropagation();
    });
}

function setupEventHandlers() {
    const $editor = $('#floating-css-editor');
    const $fab = $('#show-editor-fab');
    const $floatingCSS = $('#floating-customCSS');
    const $originalCSS = $('#customCSS');
    const settings = loadSettings();
    
    $('#refresh-css-btn').on('click', function() {
        if ($originalCSS.length) {
            $floatingCSS.val($originalCSS.val());
            updateLineCount();
            toastr.success(t.toast_loaded);
        }
    });
    
    $('#collapse-btn').on('click', function() {
        const isCollapsed = $editor.hasClass('collapsed');
        
        if (isCollapsed) {
            $editor.removeClass('collapsed');
            $(this).text('_').attr('title', t.header_collapse);
            settings.isCollapsed = false;
        } else {
            $editor.addClass('collapsed');
            $(this).text('□').attr('title', t.header_expand);
            settings.isCollapsed = true;
        }
        
        saveSettingsDebounced();
    });
    
    $('#close-btn').on('click', function() {
        $editor.hide();
        $fab.fadeIn(200);
    });
    
    $fab.on('click', function() {
        $fab.fadeOut(200);
        $editor.show();
    });
    
    $('#apply-css').on('click', function() {
        if ($originalCSS.length) {
            $originalCSS.val($floatingCSS.val());
            $originalCSS.trigger('input');
            toastr.success(t.toast_applied);
        }
    });
    
    $('#clear-css').on('click', function() {
        $floatingCSS.val('');
        if ($originalCSS.length) {
            $originalCSS.val('');
            $originalCSS.trigger('input');
        }
        updateLineCount();
        toastr.info(t.toast_cleared);
    });
}

function toggleEditorVisibility(enabled) {
    const $editor = $('#floating-css-editor');
    const $fab = $('#show-editor-fab');
    
    if (enabled) {
        $editor.show();
        $fab.hide();
    } else {
        $editor.hide();
        $fab.hide();
    }
}

jQuery(async () => {
    loadSettings();
    
    eventSource.on(event_types.APP_READY, () => {
        createSettingsUI();
        createFloatingEditor();
        console.log('[Floating CSS Editor] Loaded');
    });
});
