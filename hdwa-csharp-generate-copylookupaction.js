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
        'using Dapper;',
        options.useMicrosoftDataSqlClient === true
            ? 'using Microsoft.Data.SqlClient;'
            : 'using System.Data.SqlClient;',
        'using SQLTool.Shared.Data.Extensions;',
        `using ${options.modelClassNamespace};`,
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
        `public class ${options.className} : ICopyLookupTableAction`,
        '{',
        ...[
            'public SqlConnection? SourceClient { get; set; }',
            'public SqlConnection? TargetClient { get; set; }',
            'public event EventHandler<CopyLookupTableProgressMessageEventArgs>? ProgressMessage;',
            `public string Name => typeof(${options.modelClassName}).GetTableName(true)!;`,
            'public IReadOnlyList<Type> DependsOn => new List<Type>();',
            '',
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
        indentWidth: parseInt(indentWidthElement.value)
    };
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
    deleteButton.classList.add('btn', 'btn-danger', 'btn-sm');
    deleteButton.innerText = '-';

    rootElem.appendChild(deleteButton);
    rootElem.appendChild(spanElement);

    const parentElement = document.getElementById('modelPropertyFilter');
    parentElement.appendChild(rootElem);
    contentElement.value = '';

    deleteButton.addEventListener('click', function () {
        parentElement.removeChild(rootElem);
    });
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
        modelPropertyFilter: ['Id']
    });
});