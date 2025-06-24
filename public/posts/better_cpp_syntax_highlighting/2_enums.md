
Enums are a great starting point as their declarations are simple and their usage easy to follow.
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
The AST for this snippet looks like this:
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

Enums are represented by two node types in the AST: `EnumDecl` for the declaration itself, and `EnumConstantDecl` for each enumerator value.
From the `EnumDecl` node above, we can infer that `Level` is declared as an enum class, and that it's underlying type is an int.
If we had explicitly set this to a type like `unsigned char` or `std::uint8_t`, this would be also reflected in the AST.

We'll set up visitors for both `EnumDecl` and `EnumConstantDecl` nodes:
```cpp line-numbers:{enabled} title:{visitor.hpp}
bool VisitEnumDecl(clang::EnumDecl* node);
bool VisitEnumConstantDecl(clang::EnumConstantDecl* node);
```
The implementation of `VisitEnumDecl` looks like this:
```cpp line-numbers:{enabled} title:{visitor.cpp}
bool Visitor::VisitEnumDecl(clang::EnumDecl* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    const clang::SourceLocation& location = node->getLocation();
    
    // Skip any enum definitions that do not come from the main file
    if (!source_manager.isInMainFile(location)) {
        return true;
    }
    
    const std::string& name = node->getNameAsString();
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    
    m_annotator->insert_annotation("enum-name", line, column, name.length());
    return true;
}
```
This inserts an `enum-name` annotation for every enum declaration.

The return value of a visitor function indicates whether we want AST traversal to continue.
Since we are interested in traversing all the nodes of the AST, this will always be `true`.

As mentioned in the previous post in this series, the `SourceManager` class maps AST nodes back to their source locations within the translation unit.
The `SourceManager::isInMainFile` check ensures that the node originates from the "main" file we are annotating - the one provided to `runToolOnCodeWithArgs`.
This prevents annotations from being applied to external headers, and is a recurring pattern in every visitor we will implement.

The visitor for `EnumConstantDecl` nodes is nearly identical, except that it inserts an `enum-value` annotation instead of `enum-name`:
```cpp line-numbers:{enabled} title:{visitor.cpp}
bool Visitor::VisitEnumConstantDecl(clang::EnumConstantDecl* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    
    const std::string& name = node->getNameAsString();
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    
    m_annotator->insert_annotation("enum-value", line, column, name.length());
    return true;
}
```

With both visitors implemented, our annotations look like this:
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
This is a good start, but not yet complete.
The reference to `Error` on line 6 and the use of `Level::Error` in `main` are not declarations, so we'll need a new visitor to handle them.

### Enum References

References to enum values are captured by [`DeclRefExpr` nodes](https://clang.llvm.org/doxygen/classclang_1_1DeclRefExpr.html#details), which represent expressions that refer to previously declared variables, functions, and types.

Line 21 from the AST captures the reference to `Level::Error` inside the `main` function from the example above.
```text
DeclRefExpr 0x1b642245d40 <col:17, col:24> 'Level' EnumConstant 0x1b642245708 'Error' 'Level'
```

We'll add a new visitor for `DeclRefExpr` nodes.
```cpp
bool VisitDeclRefExpr(clang::DeclRefExpr* node);
```

The implementation of `VisitDeclRefExpr` is very similar to the `VisitEnumDecl` and `VisitEnumConstantDecl` visitor functions:
```cpp
bool Visitor::VisitDeclRefExpr(clang::DeclRefExpr* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    
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
We use `DeclRefExpr::getDecl` to retrieve information about the underlying declaration being referenced.
If it's an `EnumConstantDecl`, we insert an `enum-value` annotation.

With this visitor implemented, we can now properly annotate both enum declarations and usages:
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

## Styling
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