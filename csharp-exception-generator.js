/**
 * @param {number} width 
 * @returns {string}
 */
const indent = function(width) {
    var r = '';

    if (width === undefined || width === null) return r;
    if (typeof width !== 'number') return r;
    if (width < 1) return r;

    for (let i = 0; i < width; i++)
        r += ' ';
    return r;
};
const generateDefaultCtor = function(className, nullable, inheritdoc)
{
    let str = nullable ? 'string?' : 'string'
    let exc = nullable ? 'Exception?' : 'Exception';
    const ihd = ['/// <inheritdoc/>'];
    const r = [
        ...(inheritdoc ? ihd : []),
        `public ${className}() : base()`,
        '{}',
        '',
        ...(inheritdoc ? ihd : []),
        `public ${className}(${str} message) : base(message)`,
        '{}',
        '',
        ...(inheritdoc ? ihd : []),
        `public ${className}(${str} message, ${exc} innerException) : base(message, innerException)`,
        '{}'
    ];
    return r;
}
function generateContent(className) {
    let defCtor_elem = document.getElementById("includeDefaultCtor")
    let nullable_elem = document.getElementById("nullable")
    let inheritdoc_elem = document.getElementById("inheritdoc")
    let summary_elem = document.getElementById("summary")

    let nullable = nullable_elem.checked
    let inheritdoc = inheritdoc_elem.checked
    let summary = summary_elem.value
    let defCtor = defCtor_elem.checked
    let defCtorContent = generateDefaultCtor(className, nullable, inheritdoc)
    console.log(defCtorContent)
    const constructorContent = defCtor ? [
        '#region Constructors',
        ...defCtorContent.map(e => '\t' + e),
        '#endregion',
        '',
    ] : [];

    const summaryLines = summary.trim().length < 1 ? []
        : [
            '/// <summary>',
            ...summary.split('\n').map(e => '/// ' + e),
            '/// </summary>'
        ];

    const lines = [
        ...summaryLines,
        '/// <remarks>',
        '/// Generated with',
        '/// <see href="https://ktwrd.github.io/csharp-exception-generator.html"/>',
        '/// </remarks>',
        `public class ${className} : Exception`,
        '{',
        ...constructorContent,
        '\t/// <inheritdoc/>',
        '\tpublic override string ToString()',
        '\t{',
        '\t\treturn base.ToString();',
        '\t}',
        '}'
    ];
    let content = lines.join('\n').replaceAll('\t', indent(4));
    const htmlContent = hljs.highlight(content, { language: 'csharp' }).value;
    document.getElementById("output").innerHTML = htmlContent;
}
document.getElementById("generate").addEventListener('click', () =>
{
    let className_elem = document.getElementById("className");
    let className = className_elem.value;
    generateContent(className);
});
document.getElementById("copy-output").addEventListener('click', () => {
    const elem = document.getElementById('output');
    navigator.clipboard.writeText(elem.innerText);
    alert('Copied output to clipboard');
});

document.addEventListener('DOMContentLoaded', function() {
    generateContent('ExampleException');
});