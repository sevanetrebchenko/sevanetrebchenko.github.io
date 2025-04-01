#### A more efficient approach

The current annotation approach offers several optimization opportunities.
Since annotations are inserted sequentially, we risk incurring unnecessary overhead due to repeated reallocations, especially for lines with a large number of annotations.
Given that the annotation format is already defined, we can precompute the final length of each line (including all annotations) and pre-allocate the necessary space upfront.
This allows us to copy characters directly into the string while formatting each annotation as it is encountered, reducing memory overhead and improving runtime efficiency.
```cpp line-numbers:{enabled} title:{annotator.cpp}
#include "annotator.hpp"

std::vector<std::string> read(const std::string& filename);
void write(const std::string& filename, const std::vector<std::string>& lines);

void Annotator::annotate() {
    // Read source file contents
    std::vector<std::string> lines = read(m_file);
    
    for (auto& [line, annotations] : m_annotations) {
        // Sort annotations in reverse order so that inserting an annotation does not affect the positions of subsequent annotations
        std::sort(annotations.begin(), annotations.end(), [](const Annotation& a, const Annotation& b) -> bool {
            return a.start < b.start;
        });
        
        const std::string& src = lines[line];
        
        // Precompute the final length of the string
        std::size_t length = src.length();
        for (const Annotation& annotation : annotations) {
            // Annotation format: [[{AnnotationType},{Tokens}]]
            // '[[' + {AnnotationType} + ',' + {Tokens} + ']]'
            length += 2 + strlen(annotation.name) + 1 + annotation.length + 2;
        }

        // Preallocate result string
        std::string result;
        result.reserve(length);
        
        std::size_t position = 0;
        for (const Annotation& annotation : annotations) {
            // Copy the part before the annotation
            result.append(src, position, annotation.start - position);
            
            // Insert annotation
            result.append("[[");
            result.append(annotation.name);
            result.append(",");
            result.append(src, annotation.start, annotation.length);
            result.append("]]");
    
            // Move offset past annotation
            position = annotation.start + annotation.length;
        }
    
        // Copy any trailing characters after the last annotation
        result.append(src, position, src.length() - position);
        
        lines[line] = result;
    }

    // Write modified output file contents
    write("result.txt", lines);
}
```
The `read` function loads the file’s contents into memory as individual lines, while `write` saves the modified contents back to disk.
The implementation of these functions is straightforward and omitted from the code snippet for brevity.

But why stop there?
If we can precompute the final length of each line, we can just as easily determine the final length of the entire file.
By doing so, we only need to allocate memory once, further reducing memory overhead and allowing us to write the entire file in a single operation rather than line by line.

Additionally, we can optimize how annotations are stored to improve memory usage and cache efficiency.
Instead of sorting the annotations in each line individually, we sort the entire `m_annotations` structure at once - reducing the number of calls to `std::sort` from one per line to just one for the entire file.

To achieve this, we need to change the way annotations are represented.
Instead of using a `std::unordered_map`, we'll use an `std::vector` to store annotations contiguously in memory.
While this change removes the ability to do direct line-based lookups, this was only useful for knowing which line an annotation belongs to.
Rather than tracking annotations by line and column, we can compute and store each annotation’s offset within the file directly.

Below is the new interface for our `Annotator`:
```cpp line-numbers:{enabled} added:{23,24,27} modified:{6,10,28} removed:{2} title:{annotator.hpp}
#include <string> // std::string
#include <unordered_map> // std::unordered_map
#include <vector> // std::vector

struct Annotation {
    Annotation(const char* name, unsigned offset, unsigned length);
    ~Annotation();
    
    const char* name;
    unsigned offset;
    unsigned length;
};

class Annotator {
    public:
        explicit Annotator(std::string file);
        ~Annotator();
        
        void insert_annotation(const char* name, unsigned line, unsigned column, unsigned length, bool overwrite = false);
        void annotate();
        
    private:
        void compute_line_lengths();
        [[nodiscard]] std::size_t compute_offset(unsigned line, unsigned column) const;
    
        std::string m_file;
        std::vector<unsigned> m_line_lengths;
        std::vector<Annotation> m_annotations;
};
```
To compute the offset given a line and column number, we need to keep track of the lengths of each line.
This is achieved by iterating through the file and calculating the length of each line:
```cpp line-numbers:{enabled} title:{annotator.cpp}
#include "annotator.hpp"

// Returns a string containing the contents of the file
std::string read(const std::string& filename);

Annotator::Annotator(const std::string& file) {
    // Read source file contents
    m_file = read(file);
    compute_line_lengths();
}

void Annotator::compute_line_lengths() {
    std::size_t start = 0;

    // Traverse through the string and count lengths of lines separated by newlines
    for (std::size_t i = 0; i < m_file.size(); ++i) {
        if (m_file[i] == '\n') {
            // Include newline character in line length calculation
            // Note: automatically accounts for the carriage return (\r) character on Windows
            m_line_lengths.push_back(i - start + 1);
            start = i + 1;
        }
    }

    // Add any trailing characters (if the file does not end in a newline)
    if (start < m_file.size()) {
        m_line_lengths.push_back(m_file.size() - start);
    }
}
```
Once we have this information, we can determine the offset of an annotation by summing the lengths of all preceding lines and adding the column index within the target line.
```cpp line-numbers:{enabled} title:{annotator.cpp}
#include "annotator.hpp"

std::size_t Annotator::compute_offset(unsigned line, unsigned column) {
    std::size_t offset = 0;
    for (std::size_t i = 0; i < line; ++i) {
        // m_line_lengths[i] stores the length of line i (newline included)
        offset += m_line_lengths[i];
    }
    return offset + column;
}
```

The `insert_annotation` implementation is updated to compute the offset instead of relying on the annotation's line and column directly:
```cpp line-numbers:{enabled} added:{4} modified:{7-8,18} title:{annotator.cpp}
#include "annotator.hpp"

void Annotator::insert_annotation(const char* name, unsigned line, unsigned column, unsigned length, bool overwrite) {
    std::size_t offset = compute_offset(line, column);
    
    // Do not add duplicate annotations of the same name at the same location
    for (Annotation& annotation : m_annotations) {
        if (annotation.offset == offset) {
            if (overwrite) {
                annotation.name = name;
                annotation.length = length;
            }
            
            return;
        }
    }
    
    m_annotations.emplace_back(name, offset, length);
}
```

Finally, we integrate all these optimizations into the `annotate` function:
```cpp line-numbers:{enabled} title:{annotator.cpp}
#include "annotator.hpp"

std::string read(const std::string& filename);
void write(const std::string& filename, const std::string& contents);

void Annotator::annotate() {
    // Read source file contents
    std::string src = read(m_file);
    
    // Sort annotations in reverse order so that inserting an annotation does not affect the positions of subsequent annotations
    std::sort(m_annotations.begin(), m_annotations.end(), [](const Annotation& a, const Annotation& b) -> bool {
        return a.offset < b.offset;
    });
    
    // Precompute the final length of the file
    std::size_t length = src.length();
    for (const Annotation& annotation : m_annotations) {
        // Annotation format: [[{AnnotationType},{Tokens}]]
        // '[[' + {AnnotationType} + ',' + {Tokens} + ']]'
        length += 2 + strlen(annotation.name) + 1 + annotation.length + 2;
    }
    
    // Preallocate string
    std::string result;
    result.reserve(length);
        
    std::size_t position = 0;
    for (const Annotation& annotation : m_annotations) {
        // Copy the part before the annotation
        result.append(src, position, annotation.offset - position);
        
        // Insert annotation
        result.append("[[");
        result.append(annotation.name);
        result.append(",");
        result.append(src, annotation.offset, annotation.length);
        result.append("]]");

        // Move offset into 'src'
        position = annotation.offset + annotation.length;
    }

    // Copy the remaining part of the line
    result.append(src, position, src.length() - position);

    // Write modified output file contents
    write("result.txt", result);
}
```
Note that the `read` and `write` functions have been updated to operate directly on the file's contents, rather than handling it as a collection of individual lines.

Below is a comparison of the performance of the initial implementation against the optimized version, evaluating the effectiveness of the optimizations made in this section.
This test was run on the code snippet at the beginning of this post, which contains approximately 300 annotations.

Without optimizations:  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`annotate`: ~1.113 milliseconds  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;tool: ~1,224 milliseconds

With optimizations:  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`annotate`: ~0.475 milliseconds  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;tool: ~1.146 seconds

Performance measurements were collected using a simple timestamping approach with `std::chrono::high_resolution_clock`.
This method was chosen because many Windows profilers require debug information in PDB files, which are not generated when building with Clang/MSYS2/MinGW.
Even with the `-g` compilation flag specified, profilers output raw memory addresses instead of function names, making it difficult to associate symbols with their corresponding functions.
While this is not the most precise method, it effectively illustrates the differences in performance for this section.

With optimizations included, the runtime of `annotate` has been reduced by approximately 57.4%, leading to an overall tool runtime reduction of 6.4%.
As expected, the overall runtime of the tool did not decrease significantly as most of the remaining time being spent in visitor functions and AST traversal.

With all of these prerequisite components implemented, let's (finally) take a look at some visitor function implementations. 