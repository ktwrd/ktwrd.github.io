hljs.configure({
	ignoreUnescapedHTML: true // we want to preserve new lines in it.
});

// from: https://stackoverflow.com/a/60338028/13037015
function format(content) {
    var tab = '\t';
    var result = '';
    var indent = '';
	const rxElem = /^<?\w[^>]*[^\/]$/;
	const rxElemEnd = /^\/\w/;
	const rxSplit = />\s*</;

    content.split(rxSplit).forEach(function(element) {
        if (element.match(rxElemEnd)) {
            indent = indent.substring(tab.length);
        }

		result += `${indent}<${element}>\n`;

        if (element.match(rxElem) && !element.startsWith("input")  ) { 
            indent += tab;              
        }
    });

    return result.substring(1, result.length - 3);
}
document.getElementById("generate").addEventListener('click', () => {
	const inputElem = document.getElementById("input");
	const outputElem = document.getElementById("output");
	let content = inputElem.value
		.replaceAll('&lt;', '<')
		.replaceAll('&gt;', '>')
		.replaceAll('&amp;', '&')
		.replaceAll('&#39;', '\'')
		.replaceAll('\r\n', '\n');
	content = decodeURIComponent(content);
	if (document.getElementById('cbFormat').checked) {
		content = format(content);
	}
	outputElem.innerHTML = content.replaceAll('<', '&lt;').replaceAll('>', '&gt;');
	if (outputElem.hasAttribute('data-highlighted')) {
		outputElem.removeAttribute('data-highlighted');
	}
	hljs.highlightElement(outputElem);
});
document.getElementById("copy-output").addEventListener('click', () => {
    const elem = document.getElementById('output');
    navigator.clipboard.writeText(elem.innerText);
    alert('Copied output to clipboard');
});