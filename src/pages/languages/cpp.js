
// cpp-specific processing
export default function processLanguageCpp(tokens) {
    const parsed = [];
    let i = 0;

    // Manually remove the 'operator' type from all tokens
    for (let i = 0; i < tokens.length; ++i) {
        tokens[i].types = tokens[i].types.filter(type => type !== "operator");
    }

    while (i < tokens.length) {
        if (tokens[i].content === "[" && tokens[i + 1]?.content === "[") {
            // Found start of annotation block '[['
            let annotation = "";

            let j = i;
            while (true) {
                if (!tokens[j] || !tokens[j].content) {
                    break;
                }

                annotation += tokens[j].content;

                if (tokens[j].content === "]" && tokens[j + 1].content !== "]") {
                    break;
                }

                ++j;
            }

            // Strip leading and trailing braces
            annotation = annotation.slice(2, annotation.length - 2);

            const components = annotation.split(",");
            const types = components[0].split(".");

            const validAnnotationTypes = [
                "class-name",
                "namespace-name",
                "member-variable",
                "macro", "macro-name", "macro-argument",
                "enum-name",
                "enum-value",
                "function",
                "plain", "punctuation",
                "number", "string",
                "keyword",
                "operator", "unary-operator", "binary-operator", "function-operator",
                "concept",
            ];

            if (!types.every(type => validAnnotationTypes.includes(type))) {
                // C++ attributes follow the same pattern (for example, [[nodiscard]] or [[noreturn]]
                // Instead of throwing an error for unknown annotation, assume this is not an annotation and leave the tokens unmodified

                // Push all tokens until after the end of the attribute ']]' is reached
                while (i !== j) {
                    parsed.push(tokens[i]);
                    ++i;
                }

                continue;
            }

            const value = components[1];

            // Leave only the 'value' token, annotated with 'type' as the type
            parsed.push({
                content: value,
                types: types
            });
            i = j;  // Adjust indexing to the end of the annotation block for subsequent tokens
        }
        else {
            parsed.push(tokens[i]);
        }

        ++i;
    }

    return parsed;
}