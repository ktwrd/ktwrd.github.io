/**
 * @typedef {Object} GenerateOptions
 * @property {string} className
 * @property {string} namespace
 * @property {string} modelClassName
 * @property {string} modelClassNamespace
 * @property {boolean} useMicrosoftDataSqlClient
 * @property {string[]} modelPropertyFilter
 * @property {boolean} indentWithSpaces
 * @property {int} [indentWidth]
 * @property {AdvancedOptions} [advanced]
 */
/**
 * @typedef {Object} AdvancedOptions
 * @property {string} dapperNamespace
 * @property {string} dapperHelperNamespace
 * @property {string} dapperExtensionsNamespace
 * @property {bool} ackCancellationToken
 */

/** @type {AdvancedOptions} */
const defaultAdvancedOptions = {
    dapperNamespace: 'Dapper',
    dapperHelperNamespace: 'SQLTool.Shared.Data.Helpers',
    dapperExtensionsNamespace: 'SQLTool.Shared.Data.Extensions'
};

/**
 * @param {GenerateOptions} opts 
 * @returns {string[]}
 */
function buildNamespace(opts) {
    function buildAdvOpts() {
        let adv = {...defaultAdvancedOptions};
        if (opts.advanced) {
            for (let x of Object.entries(opts.advanced))
            {
                if (typeof x[1] !== 'undefined') {
                    adv[x[0]] = x[1];
                }
            }
        }
        return Object.entries(adv)
            .filter(e => e[1] != null)
            .map(e => e[1]);
    }
    let res = [
        ...buildAdvOpts()
    ];
    if (!stringIsNullOrEmpty(opts.modelClassNamespace))
        res.push(opts.modelClassNamespace);
    if (opts.useMicrosoftDataSqlClient == true)
        res.push('Microsoft.Data.SqlClient');
    else
        res.push('System.Data.SqlClient');

    return res.sort().map(e => `using ${e};`);
}

/**
 * @param {string|null} [value] 
 * @returns {boolean}
 */
function stringIsNullOrEmpty(value) {
    if (!value || typeof value !== 'string')
        return true;
    
    return value.trim().length == 0
        ? true
        : false;
}

/**
 * @returns {AdvancedOptions}
 */
function getAdvancedOptions() {
    function valueOrNullWhenEmpty(element) {
        if (!element || typeof element !== 'object')
            return null;
        if (stringIsNullOrEmpty(element.value))
            return null;
        else
            return element.value;
    }
    
    var ns = document.getElementById('advDapperNamespace');
    var hns = document.getElementById('advDapperHelperNamespace');
    var ens = document.getElementById('advDapperExtensionsNamespace');

    var data = Object.fromEntries(Object.entries(defaultAdvancedOptions).map(e => [e[0], null]));

    data.dapperNamespace = valueOrNullWhenEmpty(ns);
    data.dapperHelperNamespace = valueOrNullWhenEmpty(hns);
    data.dapperExtensionsNamespace = valueOrNullWhenEmpty(ens);

    return data;
}

/**
 * @param {AdvancedOptions} opts 
 */
function setAdvancedOptions(adv) {
    if (!adv) adv = defaultAdvancedOptions;

    document.getElementById('advDapperNamespace').value = adv.dapperNamespace;
    document.getElementById('advDapperHelperNamespace').value = adv.dapperHelperNamespace;
    document.getElementById('advDapperExtensionsNamespace').value = adv.dapperExtensionsNamespace;
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

const defaultIndentWidth = 4;

/**
 * @param {GenerateOptions} options 
 */
function generate(options) {
    const header = [
        ...buildNamespace(options),
        '',
        'namespace ' + options.namespace + ';',
        '',
    ];

    const loopContent = [
        'var item = data[i];',
        'if (ct.IsCancellationRequested) return;',
        '',
        'var countQuery = item.GetRecordCountQuery(',
        ...options.modelPropertyFilter.map((e, i) => {
            return `\tnameof(item.${e})` + (
                i < options.modelPropertyFilter.length - 2
                ? ','
                : ');'
            )
        }),
        '',
        'if (ct.IsCancellationRequested) return;',
        '',
        'var count = await TargetClient.ExecuteScalarAsync<int>(',
        '\tcountQuery,',
        '\titem);',
        '',
        'if (ct.IsCancellationRequested) return;',
        'if (count < 1)',
        '{',
        '\tProgressMessage?.Invoke(this, new([' + options.modelPropertyFilter.map(e => `item.${e}?.ToString()` ).join(', ') + '], i + 1, data.Count));',
        '\tawait TargetClient.ExecuteAsync(',
        `\t\t${options.modelClassName}.InsertQuery,`,
        '\t\titem);',
        '}'
    ];

    const functionContent = [
        'if (SourceClient == null || TargetClient == null)',
        '{',
        '\tthrow new InvalidDataException("Source or Target client is null.");',
        '}',
        '',
        `var data = (await SourceClient.QueryAsync<${options.modelClassName}>("SELECT * FROM " + Name)).ToList();`,
        'for (int i = 0; i < data.Count; i++)',
        '{',
        ...loopContent.map(e => '\t' + e),
        '}'
    ];

    const classContent = [
        '/// <remarks>',
        '/// Generated with',
        '/// <see href="https://ktwrd.github.io/hdwa-csharp-copylookuptableaction.html"/>',
        '/// </remarks>',
        `public class ${options.className} : ICopyLookupTableAction`,
        '{',
        ...[
            '/// <inheritdoc/>',
            'public SqlConnection? SourceClient { get; set; }',
            '/// <inheritdoc/>',
            'public SqlConnection? TargetClient { get; set; }',
            '/// <inheritdoc/>',
            'public event EventHandler<CopyLookupTableProgressMessageEventArgs>? ProgressMessage;',
            '/// <inheritdoc/>',
            `public string Name => typeof(${options.modelClassName}).GetTableName(true)!;`,
            '/// <inheritdoc/>',
            'public IReadOnlyList<Type> DependsOn => new List<Type>();',
            '',
            '/// <inheritdoc/>',
            'public async Task Run(CancellationToken ct = default)',
            '{',
            ...functionContent.map(e => '\t' + e),
            '}'
        ].map(e => '\t' + e),
        '}'
    ];

    var indentWidth = options.indentWidth && typeof options.indentWidth === 'number'
        ? options.indentWidth < 1 ? 0 : options.indentWidth
        : defaultIndentWidth;

    const indentString = indent(indentWidth);

    const outputContent = [
        ...header,
        ...classContent
    ].map(e => {
        if (options.indentWithSpaces === true) {
            return e.replaceAll('\t', indentString)
        }
        return e;
    });

    setOutputContent(outputContent);
}


document.getElementById('generate').addEventListener('click', function () {
    const classNameElement = document.getElementById('className');
    const classNamespaceElement = document.getElementById('classNamespace');
    const modelClassName = document.getElementById('modelClassName');
    const modelClassNamespace = document.getElementById('modelClassNamespace');
    const useMicrosoftDataSqlClientElement = document.getElementById('useMicrosoftDataSqlClient');
    const indentWithSpacesElement = document.getElementById('indentWithSpaces');
    const indentWidthElement = document.getElementById('indentWidth');
    var propertyFilterNames = getModelPropertyFilter();
    if (propertyFilterNames.length < 1)
    {
        alert('Add at least one item to Model Property Filter');
        return;
    }
    /** @type {GenerateOptions} */
    var options = {
        className: classNameElement.value,
        namespace: classNamespaceElement.value,
        modelClassName: modelClassName.value,
        modelClassNamespace: modelClassNamespace.value,
        useMicrosoftDataSqlClient: useMicrosoftDataSqlClientElement.checked,
        modelPropertyFilter: propertyFilterNames,
        indentWithSpaces: indentWithSpacesElement.checked,
        indentWidth: parseInt(indentWidthElement.value),
        advanced: getAdvancedOptions(),
    };
    console.log('[generate] created options', options);
    generate(options);
});

/**
 * @returns {string[]}
 */
function getModelPropertyFilter() {
    const propertyFilterNames = [];
    for (let elem of document.querySelectorAll('#modelPropertyFilter [data-label=value]')) {
        propertyFilterNames.push(elem.innerText);
    }
    return propertyFilterNames;
}

document.getElementById('modelPropertyFilter_addBtn').addEventListener('click', function () {
    const contentElement = document.getElementById('modelPropertyFilter_addText');
    if (contentElement.value.trim() < 1)
        return;
    var existing = getModelPropertyFilter();
    const value = contentElement.value.trim();
    if (existing.includes(value))
    {
        console.warn('Value already exists in list', value);
        return;
    }

    const rootElem = document.createElement('li');
    rootElem.className = 'list-group-item';
    rootElem.style.width = '100%';

    const spanElement = document.createElement('span');
    spanElement.setAttribute('data-label', 'value');
    spanElement.innerText = value;
    spanElement.style.fontFamily = 'monospace';

    const deleteButton = document.createElement('button');
    deleteButton.setAttribute('type', 'button');
    deleteButton.classList.add('btn', 'btn-danger', 'btn-sm', 'mr-2');
    // deleteButton.innerText = '-';
    deleteButton.appendChild(getIconElement('trash'));

    rootElem.appendChild(deleteButton);
    rootElem.appendChild(spanElement);

    const parentElement = document.getElementById('modelPropertyFilter');
    parentElement.appendChild(rootElem);
    contentElement.value = '';

    deleteButton.addEventListener('click', function () {
        parentElement.removeChild(rootElem);
    });
});
function getIconElement(name) {
    const element = document.createElement('i');
    element.className = `bi bi-${name}`;
    return element;
}
document.getElementById("copy-output").addEventListener('click', () => {
    const elem = document.getElementById('output');
    navigator.clipboard.writeText(elem.innerText);
    alert('Copied output to clipboard');
});

document.addEventListener('DOMContentLoaded', function() {
    generate({
        className: 'CopyExampleLookupTable',
        namespace: 'SQLTool.Shared.Example.Services.CopyLookupTableActions',
        modelClassName: 'ExampleModel',
        modelClassNamespace: 'SQLTool.Shared.Example.Models',
        useMicrosoftDataSqlClient: document.getElementById('useMicrosoftDataSqlClient').checked,
        indentWithSpaces: document.getElementById('indentWithSpaces').checked,
        indentWidth: null,
        modelPropertyFilter: ['Id'],
    });
    setAdvancedOptions(null);
});