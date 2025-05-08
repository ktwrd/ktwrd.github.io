/**
 * @param {string|string[]} content 
 */
function setOutputContent(content) {
    let joined = typeof content === 'string' ? content : '';
    if (typeof content === 'object' && Array.isArray(content)) {
        joined = content.join('\n');
    }
    const htmlContent = hljs.highlight(joined, { language: 'sql' }).value;
    document.getElementById("output").innerHTML = htmlContent;
}
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
 * @typedef {Object} GenerateOptions
 * @property {string} table
 * @property {string} schema
 * @property {boolean} clustered
 * @property {boolean} unique
 * @property {string[]} colIndex
 * @property {string[]} colInclude
 */

/**
 * @description
 * Generate SQL Query to drop and create an index with the options provided.
 * @param {GenerateOptions} options 
 */
function generate(options) {
    const indexName = 'IX_' + options.table + '_' + options.colIndex.join('') + (
        options.colInclude.length > 0
        ? '_' + options.colInclude.join('')
        : '');
    
    const objName = `[${options.schema}].[${options.table}]`;

    const checkQuery = [
        `IF EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'${objName}') AND name = N'${indexName}')`,
        `DROP INDEX [${indexName}] ON ${objName} WITH (ONLINE = OFF)`,
    ];

    const clusteredKeyword = options.clustered ? 'CLUSTERED' : 'NONCLUSTERED';

    const withData = {
        PAD_INDEX: 'OFF',
        STATISTICS_NORECOMPUTE: 'OFF',
        SORT_IN_TEMPDB: 'OFF',
        DROP_EXISTING: 'OFF',
        ONLINE: 'OFF',
        ALLOW_ROW_LOCKS: 'ON',
        ALLOW_PAGE_LOCKS: 'ON',
        OPTIMIZE_FOR_SEQUENTIAL_KEY: 'OFF'
    };

    const withDataComputed = Object.entries(withData).map(e => {
        return e[0] + ' = ' + e[1]
    }).join(', ');

    const includeComputed = options.colInclude.length > 0
        ? 'INCLUDE(' + options.colInclude.map(e => `[${e}]`).join(', ') + ') '
        : '';

    const createQuery = [
        `CREATE ${clusteredKeyword} INDEX [${indexName}] ON ${objName}`,
        `(`,
        ...options.colIndex.map((e, i) => {
            const s = `\t[${e}] ASC` + (i < options.colIndex.length - 2 ? ',' : '')
            return s;
        }),
        `) ${includeComputed}WITH (${withDataComputed}) ON [PRIMARY]`
    ];

    const lines = [
        "PRINT 'START'",
        '',
        ...checkQuery,
        'GO',
        '',
        ...createQuery,
        'GO',
        '',
        "PRINT 'FINISH'"
    ].map(e => e.replaceAll('\t', indent(4)));

    setOutputContent(lines);
}

document.getElementById('generate').addEventListener('click', function() {
    const tableElem = document.getElementById('name');
    const schemaElem = document.getElementById('schema');
    const clusteredElem = document.getElementById('clustered');
    // const uniqueElem = document.getElementById('unique');
    const indexElem = document.getElementById('indexColumns');
    const includeElem = document.getElementById('includedColumns');

    const options = {
        table: tableElem.value,
        schema: schemaElem.value,
        clustered: clusteredElem.checked,
        unique: false,
        colIndex: indexElem.value.split(',').map(e => e.trim()).filter(e => e.length > 0),
        colInclude: includeElem.value.split(',').map(e => e.trim()).filter(e => e.length > 0)
    };
    generate(options);
});
document.getElementById("copy-output").addEventListener('click', () => {
    const elem = document.getElementById('output');
    navigator.clipboard.writeText(elem.innerText);
    alert('Copied output to clipboard');
});