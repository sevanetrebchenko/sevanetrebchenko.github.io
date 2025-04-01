
## Templates

Another big portion of the C++ language are templates.
This includes template declarations, definitions, and specializations (both partial and explicit).
```cpp
#include <concepts> // std::same_as
#include <string> // std::string, std::string_view
#include <type_traits> // std::true_type, std::false_type

template <typename T>
struct is_string_type : std::false_type {
};

// Partial specializations
// References to string types should resolve to true
template <typename T>
struct is_string_type<T&> : is_string_type<T> {
};

template <typename T>
struct is_string_type<const T&> : is_string_type<T> {
};

// Explicit specializations
// const char*
template <>
struct is_string_type<const char*> : std::true_type {
};

// std::string
template <>
struct is_string_type<std::string> : std::true_type {
};

// std::string_view
template <>
struct is_string_type<std::string_view> : std::true_type {
};
```

```text
|-ClassTemplateDecl 0x1bc2d2842a8 <example.cpp:4:1, line:6:1> line:5:8 is_string_type
| |-TemplateTypeParmDecl 0x1bc2d284148 <line:4:11, col:20> col:20 typename depth 0 index 0 T
| |-CXXRecordDecl 0x1bc2d2841f8 <line:5:1, line:6:1> line:5:8 struct is_string_type definition
| | |-DefinitionData empty aggregate standard_layout trivially_copyable trivial literal has_constexpr_non_copy_move_ctor can_const_default_init
| | | |-DefaultConstructor exists trivial constexpr needs_implicit defaulted_is_constexpr
| | | |-CopyConstructor simple trivial has_const_param needs_implicit implicit_has_const_param
| | | |-MoveConstructor exists simple trivial needs_implicit
| | | |-CopyAssignment simple trivial has_const_param needs_implicit implicit_has_const_param
| | | |-MoveAssignment exists simple trivial needs_implicit
| | | `-Destructor simple irrelevant trivial constexpr needs_implicit
| | |-public 'std::false_type':'std::integral_constant<bool, false>'
| | `-CXXRecordDecl 0x1bc2d284610 <col:1, col:8> col:8 implicit struct is_string_type
| |-ClassTemplateSpecialization 0x1bc2d285150 'is_string_type'
| |-ClassTemplateSpecialization 0x1bc2d285540 'is_string_type'
| `-ClassTemplateSpecialization 0x1bc2d285900 'is_string_type'
|-ClassTemplatePartialSpecializationDecl 0x1bc2d284860 <line:10:1, line:12:1> line:11:8 struct is_string_type definition explicit_specialization
| |-DefinitionData empty aggregate standard_layout trivially_copyable trivial literal has_constexpr_non_copy_move_ctor can_const_default_init
| | |-DefaultConstructor exists trivial constexpr needs_implicit defaulted_is_constexpr
| | |-CopyConstructor simple trivial has_const_param needs_implicit implicit_has_const_param
| | |-MoveConstructor exists simple trivial needs_implicit
| | |-CopyAssignment simple trivial has_const_param needs_implicit implicit_has_const_param
| | |-MoveAssignment exists simple trivial needs_implicit
| | `-Destructor simple irrelevant trivial constexpr needs_implicit
| |-public 'is_string_type<T>'
| |-TemplateArgument type 'type-parameter-0-0 &'
| | `-LValueReferenceType 0x1bc2bf68960 'type-parameter-0-0 &' dependent
| |   `-TemplateTypeParmType 0x1bc2bd6b340 'type-parameter-0-0' dependent depth 0 index 0
| |-TemplateTypeParmDecl 0x1bc2d2846d8 <line:10:11, col:20> col:20 referenced typename depth 0 index 0 T
| `-CXXRecordDecl 0x1bc2d284b38 <line:11:1, col:8> col:8 implicit struct is_string_type
|-ClassTemplatePartialSpecializationDecl 0x1bc2d284d80 <line:14:1, line:16:1> line:15:8 struct is_string_type definition explicit_specialization
| |-DefinitionData empty aggregate standard_layout trivially_copyable trivial literal has_constexpr_non_copy_move_ctor can_const_default_init
| | |-DefaultConstructor exists trivial constexpr needs_implicit defaulted_is_constexpr
| | |-CopyConstructor simple trivial has_const_param needs_implicit implicit_has_const_param
| | |-MoveConstructor exists simple trivial needs_implicit
| | |-CopyAssignment simple trivial has_const_param needs_implicit implicit_has_const_param
| | |-MoveAssignment exists simple trivial needs_implicit
| | `-Destructor simple irrelevant trivial constexpr needs_implicit
| |-public 'is_string_type<T>'
| |-TemplateArgument type 'const type-parameter-0-0 &'
| | `-LValueReferenceType 0x1bc2c021df0 'const type-parameter-0-0 &' dependent
| |   `-QualType 0x1bc2bd6b341 'const type-parameter-0-0' const
| |     `-TemplateTypeParmType 0x1bc2bd6b340 'type-parameter-0-0' dependent depth 0 index 0
| |-TemplateTypeParmDecl 0x1bc2d284c00 <line:14:11, col:20> col:20 referenced typename depth 0 index 0 T
| `-CXXRecordDecl 0x1bc2d285058 <line:15:1, col:8> col:8 implicit struct is_string_type
|-ClassTemplateSpecializationDecl 0x1bc2d285150 <line:20:1, line:22:1> line:21:8 struct is_string_type definition explicit_specialization
| |-DefinitionData pass_in_registers empty aggregate standard_layout trivially_copyable trivial literal has_constexpr_non_copy_move_ctor can_const_default_init
| | |-DefaultConstructor exists trivial constexpr needs_implicit defaulted_is_constexpr
| | |-CopyConstructor simple trivial has_const_param needs_implicit implicit_has_const_param
| | |-MoveConstructor exists simple trivial needs_implicit
| | |-CopyAssignment simple trivial has_const_param needs_implicit implicit_has_const_param
| | |-MoveAssignment exists simple trivial needs_implicit
| | `-Destructor simple irrelevant trivial constexpr needs_implicit
| |-public 'std::true_type':'std::integral_constant<bool, true>'
| |-TemplateArgument type 'const char *'
| | `-PointerType 0x1bc2a5077e0 'const char *'
| |   `-QualType 0x1bc2a506c21 'const char' const
| |     `-BuiltinType 0x1bc2a506c20 'char'
| `-CXXRecordDecl 0x1bc2d2853e0 <col:1, col:8> col:8 implicit struct is_string_type
|-ClassTemplateSpecializationDecl 0x1bc2d285540 <line:25:1, line:27:1> line:26:8 struct is_string_type definition explicit_specialization
| |-DefinitionData pass_in_registers empty aggregate standard_layout trivially_copyable trivial literal has_constexpr_non_copy_move_ctor can_const_default_init
| | |-DefaultConstructor exists trivial constexpr needs_implicit defaulted_is_constexpr
| | |-CopyConstructor simple trivial has_const_param needs_implicit implicit_has_const_param
| | |-MoveConstructor exists simple trivial needs_implicit
| | |-CopyAssignment simple trivial has_const_param needs_implicit implicit_has_const_param
| | |-MoveAssignment exists simple trivial needs_implicit
| | `-Destructor simple irrelevant trivial constexpr needs_implicit
| |-public 'std::true_type':'std::integral_constant<bool, true>'
| |-TemplateArgument type 'std::basic_string<char>'
| | `-RecordType 0x1bc2bd7db50 'std::basic_string<char>'
| |   `-ClassTemplateSpecialization 0x1bc2bd7da28 'basic_string'
| `-CXXRecordDecl 0x1bc2d2857a0 <col:1, col:8> col:8 implicit struct is_string_type
`-ClassTemplateSpecializationDecl 0x1bc2d285900 <line:30:1, line:32:1> line:31:8 struct is_string_type definition explicit_specialization
  |-DefinitionData pass_in_registers empty aggregate standard_layout trivially_copyable trivial literal has_constexpr_non_copy_move_ctor can_const_default_init
  | |-DefaultConstructor exists trivial constexpr needs_implicit defaulted_is_constexpr
  | |-CopyConstructor simple trivial has_const_param needs_implicit implicit_has_const_param
  | |-MoveConstructor exists simple trivial needs_implicit
  | |-CopyAssignment simple trivial has_const_param needs_implicit implicit_has_const_param
  | |-MoveAssignment exists simple trivial needs_implicit
  | `-Destructor simple irrelevant trivial constexpr needs_implicit
  |-public 'std::true_type':'std::integral_constant<bool, true>'
  |-TemplateArgument type 'std::basic_string_view<char>'
  | `-RecordType 0x1bc2c934460 'std::basic_string_view<char>'
  |   `-ClassTemplateSpecialization 0x1bc2c934348 'basic_string_view'
  `-CXXRecordDecl 0x1bc2d285b60 <col:1, col:8> col:8 implicit struct is_string_type
```
If we wanted to visit templates, we would need to set up additional visitors for a few new node types:
- `ClassTemplateDecl` nodes, which represent template class definitions
- `ClassTemplatePartialSpecializationDecl` nodes, which represent definitions of partial template specializations,
- `ClassTemplateSpecializationDecl` nodes, which represent definitions of explicit (full) template specializations, and
- `TemplateTypeParmDecl` nodes, which represent template parameters in template class definitions

However, we don't actually need any of the template class visitors, as each node contains a nested `CXXRecordDecl` representing the class itself.
This means that the `VisitCXXRecordDecl` is already set up to annotate the names of template classes.
We will, however, still require a visitor for `TemplateTypeParmDecl` nodes:

```cpp title:{visitor.hpp} added:{8,9}
class Visitor final : public clang::RecursiveASTVisitor<Visitor> {
    public:
        explicit Visitor(clang::ASTContext* context, Annotator* annotator, Tokenizer* tokenizer);
        ~Visitor();
        
        // ...
        
        // For visiting template parameters
        bool TemplateTypeParmDecl(clang::TemplateTypeParmDecl* node);
        
        // ...
};
```

### Template parameters

Template parameters are captured by `TemplateTypeParmDecl` nodes:
```cpp title:{visitor.cpp}
#include "visitor.hpp"

bool Visitor::VisitTemplateTypeParmDecl(clang::TemplateTypeParmDecl* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    const clang::SourceLocation& location = node->getLocation();
    
    // Skip template parameter declarations that do not come from the main file
    if (!source_manager.isInMainFile(location)) {
        return true;
    }
    
    const std::string& name = node->getNameAsString();
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    
    m_annotator->insert_annotation("class-name", line, column, name.length());
    
    return true;
}
```
The implementation of the `VisitTemplateTypeParmDecl` is very similar to visitors we have already seen.
This visitor works for both template functions and classes alike:
```cpp
template <typename T>
void print(const T& value);

template <typename ...Ts>
void print(const Ts&... values);

template <typename T>
struct Foo {
    // ...
};

template <typename ...Ts>
struct Bar {
    // ...
};
```

```cpp
template <typename [[class-name,T]]>
void print(const [[class-name,T]]& value);

template <typename ...[[class-name,Ts]]>
void print(const [[class-name,Ts]]&... values);

template <typename [[class-name,T]]>
struct Foo {
    // ...
};

template <typename ...[[class-name,Ts]]>
struct Bar {
    // ...
};
```