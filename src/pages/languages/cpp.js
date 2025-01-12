
// cpp-specific processing
export default function processLanguageCpp(tokens) {
    const parsed = [];
    let i = 0;

    while (i < tokens.length) {
        if (tokens[i].content === "[" && tokens[i + 1]?.content === "[") {
            // Found start of annotation block '[['
            let annotation = "";

            let j = i + 2;
            while (tokens[j].content !== "]") {
                annotation += tokens[j].content;
                ++j;
            }
            ++j; // Skip to the end of the annotation block ']]'

            const components = annotation.split(",");
            const type = components[0];

            const validAnnotationTypes = [
                "class-name",
                "namespace-name",
                "member-variable",
                "function-operator",
                "define",
                "enum-name",
                "enum-value",
            ];

            if (!validAnnotationTypes.includes(type)) {
                // C++ attributes follow the same pattern (for example, [[nodiscard]] or [[noreturn]]
                // Instead of throwing an error for unknown annotation, assume this is not an annotation and leave the tokens unmodified

                // Push all tokens until after the end of the attribute ']]' is reached
                while (i !== j) {
                    parsed.push(tokens[i]);
                    ++i;
                }

                continue
            }

            const value = components[1];

            // Leave only the 'value' token, annotated with 'type' as the type
            parsed.push({
                content: value,
                types: [ type ]
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