
## Enums
Enums are a great starting point as their declaration is simple and usage is straightforward.
Consider the following example:
```cpp line-numbers:{enabled}
enum class Level {
    Debug = 0,
    Info,
    Warning,
    Error,
    Fatal = Error,
};

void log_message(Level level, const char* message);

int main() {
    log_message(Level::Error, "something bad happened");
    // ...
}
```
The AST for this code snippet looks as follows:
```text
|-EnumDecl 0x1b640a490d8 <.\example.cpp:1:1, line:7:1> line:1:12 referenced class Level 'int'
| |-EnumConstantDecl 0x1b640a491f8 <line:2:5, col:13> col:5 Debug 'Level'
| | `-ConstantExpr 0x1b640a491d0 <col:13> 'int'
| |   |-value: Int 0
| |   `-IntegerLiteral 0x1b640a491b0 <col:13> 'int' 0
| |-EnumConstantDecl 0x1b642245648 <line:3:5> col:5 Info 'Level'
| |-EnumConstantDecl 0x1b6422456a8 <line:4:5> col:5 Warning 'Level'
| |-EnumConstantDecl 0x1b642245708 <line:5:5> col:5 referenced Error 'Level'
| `-EnumConstantDecl 0x1b6422457a8 <line:6:5, col:13> col:5 Fatal 'Level'
|   `-ConstantExpr 0x1b642245780 <col:13> 'int'
|     |-value: Int 3
|     `-DeclRefExpr 0x1b642245760 <col:13> 'int' EnumConstant 0x1b642245708 'Error' 'Level'
|-FunctionDecl 0x1b642245a28 <line:9:1, col:50> col:6 used log_message 'void (Level, const char *)'
| |-ParmVarDecl 0x1b642245848 <col:18, col:24> col:24 level 'Level'
| `-ParmVarDecl 0x1b6422458d0 <col:31, col:43> col:43 message 'const char *'
`-FunctionDecl 0x1b642245bb0 <line:11:1, line:14:1> line:11:5 main 'int ()'
  `-CompoundStmt 0x1b642245ee0 <col:12, line:14:1>
    `-CallExpr 0x1b642245e98 <line:12:5, col:55> 'void'
      |-ImplicitCastExpr 0x1b642245e80 <col:5> 'void (*)(Level, const char *)' <FunctionToPointerDecay>
      | `-DeclRefExpr 0x1b642245e00 <col:5> 'void (Level, const char *)' lvalue Function 0x1b642245a28 'log_message' 'void (Level, const char *)'
      |-DeclRefExpr 0x1b642245d40 <col:17, col:24> 'Level' EnumConstant 0x1b642245708 'Error' 'Level'
      | `-NestedNameSpecifier TypeSpec 'Level'
      `-ImplicitCastExpr 0x1b642245ec8 <col:31> 'const char *' <ArrayToPointerDecay>
        `-StringLiteral 0x1b642245dd0 <col:31> 'const char[23]' lvalue "something bad happened"
```

### Enum Declarations

Enums are represented by two node types: `EnumDecl`, which corresponds to the enum declaration, and `EnumConstantDecl`, which represents the enum values.
From the `EnumDecl` node, we can infer that the `Level` enum is declared as an enum class, and that the underlying type is defaulted to an int.
If we had explicitly specified the underlying type, such as a `unsigned char` or `std::uint8_t` for a more compact representation, this would have also been reflected in the AST.

Let's set up visitor functions to inspect `EnumDecl` and `EnumConstantDecl` nodes:
```cpp line-numbers:{enabled} title:{visitor.hpp} added:{9-10}
class Visitor final : public clang::RecursiveASTVisitor<Visitor> {
    public:
        explicit Visitor(clang::ASTContext* context, Annotator* annotator, Tokenizer* tokenizer);
        ~Visitor();
        
        // ...
        
        // For visiting enum declarations
        bool VisitEnumDecl(clang::EnumDecl* node);
        bool VisitEnumConstantDecl(clang::EnumConstantDecl* node);
        
        // ...
};
```

The implementation of these functions is relatively straightforward.
```cpp line-numbers:{enabled} title:{visitor.cpp}
#include "visitor.hpp"

bool Visitor::VisitEnumDecl(clang::EnumDecl* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    const clang::SourceLocation& location = node->getLocation();
    
    // Skip any enum definitions that do not come from the main file
    if (source_manager.isInMainFile(location)) {
        const std::string& name = node->getNameAsString();
        unsigned line = source_manager.getSpellingLineNumber(location);
        unsigned column = source_manager.getSpellingColumnNumber(location);
        
        m_annotator->insert_annotation("enum-name", line, column, name.length());
    }

    return true;
}
```
An `enum-name` annotation is inserted for every `enum` declaration.

The return value of a visitor function indicates whether we want AST traversal to continue.
Since we are interested in traversing all the nodes of the AST, this will always be `true`.

As mentioned earlier, the `SourceManager` class maps AST nodes back to their source locations within the translation unit.
The `source_manager.isInMainFile(location)` check ensures that the node originates from the "main" file we are annotating - the one provided to `runToolOnCodeWithArgs`.
This prevents annotations from being applied to external headers, and is a recurring pattern in every visitor function.

The implementation of `VisitEnumConstantDecl` is nearly identical, except that it inserts an `enum-value` annotation instead of `enum-name`.
```cpp line-numbers:{enabled} title:{visitor.cpp}
#include "visitor.hpp"

bool Visitor::VisitEnumConstantDecl(clang::EnumConstantDecl* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    const clang::SourceLocation& location = node->getLocation();
    
    // Skip any enum constant definitions that do not come from the main file
    if (source_manager.isInMainFile(location)) {
        const std::string& name = node->getNameAsString();
        unsigned line = source_manager.getSpellingLineNumber(location);
        unsigned column = source_manager.getSpellingColumnNumber(location);
        
        m_annotator->insert_annotation("enum-value", line, column, name.length());
    }
    
    return true;
}
```

With these two functions implemented, the tool produces the following output:
```text line-numbers:{enabled}
enum class [[enum-name,Level]] {
    [[enum-value,Debug]] = 0,
    [[enum-value,Info]],
    [[enum-value,Warning]],
    [[enum-value,Error]],
    [[enum-value,Fatal]] = Error,
};

void log_message(Level level, const char* message);

int main() {
    log_message(Level::Error, "something bad happened");
    // ...
}
```
This is not yet complete.
We will handle references to user-defined types, such as `Level` on lines 9 and 12, in a separate visitor function.
The reference to `Error` on line 12, however, is still missing an `enum-value` annotation.
As this is not a declaration, handling this will require a new visitor function.

### Enum References

References to enum values are captured by a [`DeclRefExpr` node](https://clang.llvm.org/doxygen/classclang_1_1DeclRefExpr.html#details).
These nodes capture expressions that refer to previously declared variables, functions, and types.

We can see this in following line from the AST above, which references the `DeclRefExpr` node on columns 17-24 of line 12 and corresponds to the `Error` enum constant within the call to `log_message`:
```json
// log_message(...)
CallExpr 0x1b642245e98 <line:12:5, col:55> 'void'
    // Level::Error
    DeclRefExpr 0x1b642245d40 <col:17, col:24> 'Level' EnumConstant 0x1b642245708 'Error' 'Level'
    // ...
```

For capturing nodes of this type, we need to set up a new visitor function:
```cpp line-numbers:{enabled} title:{visitor.hpp} added:{13}
class Visitor final : public clang::RecursiveASTVisitor<Visitor> {
    public:
        explicit Visitor(clang::ASTContext* context, Annotator* annotator, Tokenizer* tokenizer);
        ~Visitor();
        
        // ...
        
        // For visiting enum declarations
        bool VisitEnumDecl(clang::EnumDecl* node);
        bool VisitEnumConstantDecl(clang::EnumConstantDecl* node);
        
        // For visiting references to enum constants
        bool VisitDeclRefExpr(clang::DeclRefExpr* node);
        
        // ...
};
```
The implementation of `VisitDeclRefExpr` is very similar to the `VisitEnumDecl` and `VisitEnumConstantDecl` visitor functions from earlier:
```cpp
#include "visitor.hpp"

bool Visitor::VisitDeclRefExpr(clang::DeclRefExpr* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    const clang::SourceLocation& location = node->getLocation();
    
    // Skip any DeclRefExpr nodes that do not come from the main file
    if (!source_manager.isInMainFile(location)) {
        return true;
    }

    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    
    if (clang::ValueDecl* decl = node->getDecl()) {
        const std::string& name = decl->getNameAsString();

        if (const clang::EnumConstantDecl* ec = clang::dyn_cast<clang::EnumConstantDecl>(decl)) {
            // Found a reference to an enum constant
            m_annotator->insert_annotation("enum-value", line, column, name.length());
        }
    }
    
    return true;
}
```
Most of the information we need is retrieved from the *declaration* of the underlying symbol, as it contains details about the type, value, and other attributes of the expression.
Other information, such as the source location in the file, is retrieved directly from the `DeclRefExpr` node, as our focus now is to annotate references rather and not declarations (which have already been handled above).
This is a common pattern that will be applied across several visitor function implementations.
If the declaration we are inspecting refers to a `EnumConstantDecl` node, we have found a reference to an enum constant and insert the `enum-value` annotation.

`DeclRefExpr` nodes reference more than just enum constants, and we will revisit this visitor function later to handle additional cases.

With the `VisitDeclRefExpr` visitor function implemented, the tool now properly annotates references to enum constants, in addition to enum declarations.
```text line-numbers:{enabled} added:{6,12}
enum class [[enum-name,Level]] {
    [[enum-value,Debug]] = 0,
    [[enum-value,Info]],
    [[enum-value,Warning]],
    [[enum-value,Error]],
    [[enum-value,Fatal]] = [[enum-value,Error]],
};

void log_message(Level level, const char* message);

int main() {
    log_message(Level::[[enum-value,Error]], "something bad happened");
    // ...
}
```
The final step is to add definitions for the `enum-name` and `enum-value` CSS styles:
```css
.language-cpp .enum-name {
    color: rgb(181, 182, 227);
}
.language-cpp .enum-value {
    color: rgb(199, 125, 187);
}
```
```cpp
enum class [[enum-name,Level]] {
    [[enum-value,Debug]] = 0,
    [[enum-value,Info]],
    [[enum-value,Warning]],
    [[enum-value,Error]],
    [[enum-value,Fatal]] = [[enum-value,Error]],
};

void log_message(Level level, const char* message);

int main() {
    log_message(Level::[[enum-value,Error]], "something bad happened");
    // ...
}
```