/**
 * @typedef {Object} EtoVmOptions
 * @property {string} className
 * @property {string} classNamespace
 * @property {boolean} indentWithSpaces
 * @property {number} indentWidth
 * @property {string} accessModifier
 * @property {boolean} classPartial
 * @property {EtoVmProperty[]} properties
 */

/**
 * @typedef {Object} EtoVmProperty
 * @property {string} name
 * @property {string} type
 * @property {string} default
 */

/**
 * @returns {EtoVmOptions}
 */
function getOptions() {
    const classNameElement = document.getElementById('className');
    const classNamespaceElement = document.getElementById('classNamespace');
    const indentWithSpacesElement = document.getElementById('indentWithSpaces');
    const indentWidthElement = document.getElementById('indentWidth');
    const selectedAccessModifierElement = document.querySelector('select#accessModifier');
    const classPartialElement = document.querySelector('input[type=checkbox]#classPartial');

    /** @type {EtoVmOptions} */
    const result = {
        className: classNameElement.value,
        classNamespace: classNamespaceElement.value,
        indentWithSpaces: indentWithSpacesElement.checked,
        indentWidth: parseInt(indentWidthElement.value),
        accessModifier: selectedAccessModifierElement.value,
        classPartial: classPartialElement.checked,
        properties: []
    };
    console.log('options: ', result);

    for (const rowElement of document.querySelectorAll('table#modelProps tbody tr')) {
        const typeElement = rowElement.querySelector('td[data-prop=type]');
        const nameElement = rowElement.querySelector('td[data-prop=name]');
        const defaultElement = rowElement.querySelector('td[data-prop=default]');

        const item = {
            type: typeElement.getAttribute('data-value'),
            name: nameElement.getAttribute('data-value'),
            default: defaultElement.getAttribute('data-value'),
        };
        result.properties.push(item);
    }

    return result;
}

function createCodeElement(value) {
    const elem = document.createElement('code');
    elem.innerText = value;
    return elem;
}
function getIconElement(name) {
    const element = document.createElement('i');
    element.className = `bi bi-${name}`;
    return element;
}

/**
 * @param {EtoVmOptions} options 
 */
function setOptions(options) {
    const classNameElement = document.getElementById('className');
    const classNamespaceElement = document.getElementById('classNamespace');
    const indentWithSpacesElement = document.getElementById('indentWithSpaces');
    const indentWidthElement = document.getElementById('indentWidth');
    const accessModifierElement = document.querySelector('select#accessModifier');
    const classPartialElement = document.querySelector('input[type=checkbox]#classPartial');

    classNameElement.value = options.className;
    classNamespaceElement.value = options.classNamespace;
    indentWithSpacesElement.checked = options.indentWithSpaces === true;
    indentWidthElement.value = parseInt(options.indentWidth);
    accessModifierElement.value = options.accessModifier ? options.accessModifier : 'public';
    classPartialElement.checked = options.classPartial === true;

    const propParentElement = document.querySelector('table#modelProps tbody');
    propParentElement.innerHTML = '';

    for (const prop of options.properties) {
        const rowElement = document.createElement('tr');
        
        const typeElement = document.createElement('td');
        typeElement.setAttribute('data-prop', 'type');
        typeElement.setAttribute('data-value', prop.type);
        typeElement.appendChild(createCodeElement(prop.type));

        const nameElement = document.createElement('td');
        nameElement.setAttribute('data-prop', 'name');
        nameElement.setAttribute('data-value', prop.name);
        nameElement.appendChild(createCodeElement(prop.name));

        const defaultElement = document.createElement('td');
        defaultElement.setAttribute('data-prop', 'default');
        defaultElement.setAttribute('data-value', prop.default);
        defaultElement.appendChild(createCodeElement(prop.default));

        const deleteBtnElement = document.createElement('button');
        deleteBtnElement.classList.add('btn', 'btn-sm', 'btn-danger');
        deleteBtnElement.appendChild(getIconElement('trash'));
        deleteBtnElement.addEventListener('click', () => {
            propParentElement.removeChild(rowElement);
        });

        const actElement = document.createElement('td');
        actElement.appendChild(deleteBtnElement);

        rowElement.appendChild(typeElement);
        rowElement.appendChild(nameElement);
        rowElement.appendChild(defaultElement);
        rowElement.appendChild(actElement);
        propParentElement.appendChild(rowElement);
    }
}

function isNullOrEmpty(value) {
    if (!value)
        return true;
    else if (typeof value !== 'string')
        return false;
    else
        return value.trim().length == 0;
}

function getPrivatePropName(name) {
    var result = name.toLowerCase().substring(0, 1) + name.substring(1);
    result = '_' + result;
    return result;
}

/**
 * 
 * @param {Number} width 
 * @returns {boolean}
 */
function indent(width) {
    if (!width || typeof width !== 'number')
        return '';
    if (width < 1)
        return '';
    let s = '';
    for (let i = 0; i < width; i++)
        s += ' ';
    return s;
}

/**
 * @param {string|string[]} content 
 */
function setOutputContent(content) {
    let joined = typeof content === 'string' ? content : '';
    if (typeof content === 'object' && Array.isArray(content)) {
        joined = content.join('\n');
    }
    const htmlContent = hljs.highlight(joined, { language: 'csharp' }).value;
    document.getElementById("output").innerHTML = htmlContent;
}

/**
 * @param {EtoVmOptions} options 
 */
function generate(options) {
    const p = options.classPartial ? ' partial' : '';
    const content = [
        `using HDWA.Common.EtoForms;`,
        `using System.Collections.ObjectModel;`,
        ``,
        `namespace ${options.classNamespace};`,
        ``,
        `${options.accessModifier}${p} class ${options.className} : ViewModelBase`,
        `{`,
        ...options.properties.map(e => {
            return `\tprivate ${e.type} ${getPrivatePropName(e.name)} = ${e.default};`;
        }),
        '',
        ...options.properties.map(e => {
            return [
                `public ${e.type} ${e.name}`,
                `{`,
                `\tget => ${getPrivatePropName(e.name)};`,
                `\tset`,
                `\t{`,
                `\t\t${getPrivatePropName(e.name)} = value;`,
                `\t\tRaisePropertyChanged(nameof(${e.name}));`,
                `\t}`,
                `}`
            ];
        }).map(e => e.map(x => '\t' + x)).flat(),
        `}`,
    ];
    
    var indentWidth = options.indentWidth && typeof options.indentWidth === 'number'
        ? options.indentWidth < 1 ? 0 : options.indentWidth
        : defaultIndentWidth;

    const indentString = indent(indentWidth);

    const output = [
        ...content
    ].map(e => {
        if (options.indentWithSpaces === true) {
            return e.replaceAll('\t', indentString)
        }
        return e;
    });
    
    setOutputContent(output);
}

document.querySelector('button#modelProps_add').addEventListener('click', function() {
    const typeElement = document.getElementById('modelProps_add_type');
    const nameElement = document.getElementById('modelProps_add_name');
    const defaultElement = document.getElementById('modelProps_add_default');

    if (isNullOrEmpty(typeElement.value) || isNullOrEmpty(nameElement.value) || isNullOrEmpty(defaultElement.value))
        return;

    const item = {
        name: nameElement.value.trim(),
        type: typeElement.value.trim(),
        default: defaultElement.value.trim()
    };

    const opts = getOptions();
    opts.properties.push(item);
    setOptions(opts);
    console.log(getOptions());
});
document.getElementById('generate').addEventListener('click', function() {
    const opts = getOptions();
    generate(opts);
});
document.getElementById('export').addEventListener('click', function() {
    const elem = document.createElement('a');
    const opts = getOptions();
    const file = new Blob([JSON.stringify(opts, null, '    ')], {type: 'application/json'});
    elem.setAttribute('href', URL.createObjectURL(file));
    elem.setAttribute('download', 'etoviewmodel-' + opts.className + '.json');
    elem.style.display = 'none';
    document.querySelector('body').appendChild(elem);
    elem.click();
    document.querySelector('body').removeChild(elem);
});
document.getElementById('import').addEventListener('click', function() {
    document.querySelector('input#importFile').click();
});
document.querySelector('input#importFile').addEventListener('change', function(ev) {
    if (ev.target.files.length < 1)
        return;
    var targetFile = ev.target.files[0];
    targetFile.text().then(function (text) {
        var data = JSON.parse(text);
        setOptions(data);
        generate(data);
    });
})