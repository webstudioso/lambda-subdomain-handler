const getTemplateFromUri = (path='') => {
    const components = path.split('/');
    if (!path.includes('/')) return null;
    if (path.startsWith('/static')) return null;
    if (components.length === 2 && path.includes('.')) return null;
    // e.g /mytemplate -> ['', 'mytemplate']
    return components[1].length > 0 ? components[1] : null;
}

exports.getTemplateFromUri = getTemplateFromUri;