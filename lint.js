var markdownlint = require("markdownlint");
var glob = require("glob");
var fs = require("fs");

var inputFiles = glob.sync("**/*.md", { ignore: "node_modules/**/*" });
var options = {
  files: inputFiles,
  config: {
    MD001: false, // Header levels should only increment by one level at a time
    MD002: false, // First header should be a h1 header
    MD003: "atx", // Header style
    MD004: { style: "asterisk" }, // Unordered list style
    MD005: true, // Inconsistent indentation for list items at the same level
    MD006: true, // Consider starting bulleted lists at the beginning of the line
    MD007: { indent: 2 }, // Unordered list indentation
    MD009: true, // Trailing spaces
    MD010: true, // Hard tabs
    MD011: true, // Reversed link syntax
    MD012: true, // Multiple consecutive blank lines
    MD013: false, // Line length
    MD014: false, // Dollar signs used before commands without showing output
    MD018: true, // No space after hash on atx style header
    MD019: true, // Multiple spaces after hash on atx style header
    MD020: false, // No space inside hashes on closed atx style header
    MD021: false, // Multiple spaces inside hashes on closed atx style header
    MD022: true, // Headers should be surrounded by blank lines
    MD023: true, // Headers must start at the beginning of the line
    MD024: false, // Multiple headers with the same content
    MD025: false, // Multiple top level headers in the same document
    MD026: { punctuation: ".,;:!" }, // Trailing punctuation in header
    MD027: true, // Multiple spaces after blockquote symbol
    MD028: true, // Blank line inside blockquote
    MD029: { style: "ordered" }, // Ordered list item prefix
    MD030: true, // Spaces after list markers
    MD031: true, // Fenced code blocks should be surrounded by blank lines
    MD032: true, // Lists should be surrounded by blank lines
    MD033: false, // Inline HTML
    MD034: true, // Bare URL used
    MD035: "---", // Horizontal rule style
    MD036: false, // Emphasis used instead of a header
    MD037: true, // Spaces inside emphasis markers
    MD038: false, // Spaces inside code span elements
    MD039: true, // Spaces inside link text
    MD040: true, // Fenced code blocks should have a language specified
    MD041: false, // First line in file should be a top level header
  }
};

var result = markdownlint.sync(options);
console.log(result.toString());

var exitCode = 0;
Object.keys(result).forEach(function (file) {
    var fileResults = result[file];
    Object.keys(fileResults).forEach(function (rule) {
        var ruleResults = fileResults[rule];
        exitCode += ruleResults.length;
    });
});

inputFiles.forEach(function(fileName) {
    var text = fs.readFileSync(fileName, "utf8")
    exitCode += checkForImproperlyIndentedFencedCodeBlocks(fileName, text);
});

process.exit(exitCode);

/**
 * @param {string} fileName
 * @param {string} text
 */
function checkForImproperlyIndentedFencedCodeBlocks(fileName, text) {
    var lines = text.split(/\r?\n/g);
    var numErrors = 0;

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var codeBlockMatch = line.match(/^(\s*)```\S+/);

        if (codeBlockMatch) {
            var startingColumn = codeBlockMatch[1].length;
            if (startingColumn === 0 || startingColumn === getCorrectStartingColumnForLine(lines, i)) {
                continue;
            }

            numErrors++;
            console.log(fileName + ": " +
                        i + 1 + ": A fenced code block following a list item must be indented to the first non-whitespace character of the list item.")
        }
    }

    return numErrors;
}

/**
 * @param {string[]} line
 * @param {number} lineIndex
 */
function getCorrectStartingColumnForLine(lines, lineIndex) {
    for (var i = lineIndex - 1; i >= 0; i--) {
        var line = lines[i];

        if (line.length === 0) {
            continue;
        }

        var m;
        if (m = line.match(/^\s*([\*\-]|(\d+\.))\s*/)) {
            return m[0].length;
        }
        if (m = line.match(/^(\s*)/)) {
            return m[0].length;
        }
    }

    return 0;
}