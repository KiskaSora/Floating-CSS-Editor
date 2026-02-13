const locales = {
    en: {
        settings_show: 'Show floating CSS editor',
        settings_autosync: 'Auto-load CSS when theme changes',
        settings_autosync_hint: 'Automatically loads new theme CSS into the editor',
        
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
        toast_theme_changed: 'Theme Changed',
        toast_theme_loaded: 'Theme CSS loaded into editor',
        search_placeholder: 'Find...',
        search_prev: 'Prev',
        search_next: 'Next',
        search_clear: 'Clear',
        search_count_empty: '0/0'
    },
    
    ru: {
        settings_show: 'Показывать плавающий CSS редактор',
        settings_autosync: 'Автоматически подгружать CSS при смене темы',
        settings_autosync_hint: 'При включении - CSS новой темы автоматически загружается в редактор',
        
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
        toast_theme_changed: 'Тема изменена',
        toast_theme_loaded: 'CSS темы загружен в редактор',
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
