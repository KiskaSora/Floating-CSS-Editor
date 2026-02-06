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
        toast_changed_msg: 'Theme CSS loaded into editor'
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
        toast_changed_msg: 'CSS темы загружен в редактор'
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
                <textarea id="floating-customCSS" class="text_pole monospace" rows="15" placeholder="${t.placeholder}"></textarea>
                <div class="button-row">
                    <button id="apply-css" class="menu_button">${t.btn_apply}</button>
                    <button id="clear-css" class="menu_button">${t.btn_clear}</button>
                </div>
            </div>
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
    
    syncWithOriginalCSS();
    
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
