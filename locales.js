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
        toast_theme_loaded: 'Theme CSS loaded into editor'.,
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
    },
    
    zh: {
        settings_show: '显示浮动CSS编辑器',
        settings_autosync: '主题更改时自动加载CSS',
        settings_autosync_hint: '自动将新主题CSS加载到编辑器中',
        
        header_title: 'CSS编辑器',
        header_refresh: '从主题刷新',
        header_collapse: '折叠',
        header_expand: '展开',
        header_close: '关闭',
        
        info_lines: '行',
        
        placeholder: '在此粘贴您的CSS代码...',
        
        btn_apply: '应用',
        btn_clear: '清除',
        
        fab_title: '打开CSS编辑器',
        
        toast_loaded: '主题CSS已加载',
        toast_applied: 'CSS已应用',
        toast_cleared: 'CSS已清除',
        toast_theme_changed: '主题已更改',
        toast_theme_loaded: '主题CSS已加载到编辑器'
    }
};

function getLocale() {
    const userLang = navigator.language || navigator.userLanguage;
    const lang = userLang.split('-')[0];
    return locales[lang] || locales.en;
}

const t = getLocale();
