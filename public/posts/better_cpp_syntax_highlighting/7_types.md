
In this post, we're finally tackling annotating type references.
So far, our visitors have only handled type declarations - classes, structs, enums, templates, etc.
But what about the places where those types are actually used?

In the Clang AST, `TypeLoc` nodes represent the location where a type appears in the source code.
By handling `TypeLoc` nodes, we can annotate type references in variable declarations, function parameters and return values, template arguments, and more.
In some cases, such as base class inheritance chains, `TypeLoc` nodes allow for a much more elegant way of inserting semantic highlighting annotations.

Unlike other AST nodes, `TypeLoc` nodes don't explicitly appear in the AST.
Rather, they act as meta-nodes — lightweight wrappers that store source location and type information for other AST nodes.
We can, however, still set up a `VisitTypeLoc` visitor and process `TypeLoc` nodes as we would any other AST node:
```cpp
bool VisitTypeLoc(clang::TypeLoc node);
```
`TypeLoc` nodes are passed by value, not by pointer - one of the rare exceptions in Clang's LibTooling API.

Consider the following example, taken from one of our earlier posts:
```cpp
namespace logging {
    
    struct Message {
        enum class Level {
            DEBUG,
            INFO,
            WARNING,
            ERROR
        };
        
        // ...
    };
    
}

int main() {
    logging::Message::Level level = logging::Message::Level::INFO;
    // ...
}
```
We've already handled annotations for namespace, struct, and enum declarations.
But type references like `logging::Message::Level` remain unannotated.

The goal is to apply annotations to every part of the type expression:
```text
[[namespace-name,logging]]::[[class-name,Message]]::[[enum-name,Level]] level = [[namespace-name,logging]]::[[class-name,Message]]::[[enum-name,Level]]::[[enum-value,Error]];
```

To implement this, we need to process two `TypeLoc` nodes: one for the type declaration of `level`, and the other for the value it is being initialized to.
In general, annotating a type consists of two steps:
1. Annotating the reference to the type itself.
2. Annotating any type *qualifiers*, such as namespace and class chains.

This post focuses on the first step - annotating the type reference.
The main challenge here is determining exactly what type is being referenced so we can apply the correct annotation.
For the example above, that means identifying and tagging the `Level` type with an `enum-name` tag.

Annotating qualifiers like the `logging::` namespace and `Message::` class, which will be covered in the next post.

## The `TypeLoc` visitor

We'll build up our `TypeLoc` visitor incrementally, adding support for different types as we go.
Here's the initial skeleton:
```cpp
bool Visitor::VisitTypeLoc(clang::TypeLoc node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();

    clang::SourceLocation location = node.getBeginLoc();
    if (!source_manager.isInMainFile(location)) {
        return true;
    }

    unsigned line = source_manager.getSpellingLineNumber(location);
    
    const clang::Type* type = node.getTypePtr();
    const clang::QualType qualified = node.getType();

    utils::logging::debug("TypeLoc: {} ({}) on line {}", type->getTypeClassName(), qualified.getAsString(), line);

    std::string name;
    const char* annotation = "class-name";

    // Process derivative TypeLoc classes here
    // ...

    if (name.empty()) {
        return true;
    }

    unsigned column = source_manager.getSpellingColumnNumber(location);
    m_annotator->insert_annotation(annotation, line, column, name.length());

    return true;
}
```
This prints out the name of the derivative `TypeLoc` class and the fully-qualified name of the referenced type.
Using this, we can start building a picture of what types are referenced by which kinds of `TypeLoc` nodes.
```text
[DEBUG] TypeLoc: Elaborated (logging::struct Message::Level) on line 13
[DEBUG] TypeLoc: Record (struct logging::Message) on line 13
[DEBUG] TypeLoc: Enum (enum logging::Message::Level) on line 13
```
Any `TypeLoc` nodes not explicitly handled will be skipped - we'll evaluate if we need to add annotations for these on a case-by-case basis.

Notice how `TypeLoc` nodes nest to form a hierarchy.
The `Enum` type (`enum logging::Message::Level`) used by the `level` variable is nested within a `Record` type (`struct logging::Message`), which is wrapped by the outermost `Elaborated` type (`logging::struct Message::Level`).
This mirrors the structure of the fully-qualified `logging::Message::Level` expression.
We’ll need to handle each of these nodes separately to insert the proper annotations for the whole statement.

The nice thing about this approach is its simplicity.
As the logic for annotating type references is nearly identical across most `TypeLoc` nodes, all we really need is the type's name, its source location, and the correct annotation to use.
By default, we'll use `class-name` for types, but override this for special cases (like enums, which use the `enum-name` annotation).
This keeps the visitor concise and avoids boilerplate from writing separate functions for each new `TypeLoc` node.
It also makes it easy to extend in the future as we encounter more `TypeLoc` types.

We've identified several nodes types in the output above, so let's start extending our visitor function to support these.

## `Elaborated` nodes
An `ElaboratedTypeLoc` type wraps a keyword (e.g., `struct`, `enum`, etc.), an optional qualifier (e.g., `A::B::`), and the actual type being referred to (known as the "desugared" type).
```cpp
struct MyStruct {
    // ...
};  

MyStruct a;
struct MyStruct b;  // Elaborated type reference

template <typename C>
void print(const C& container) {
    typename C::const_iterator it = container.begin();  // Elaborated type reference
    // ...
}
```
Why does this exist?
Clang models this explicitly to preserve how the type was written in the source code, which is useful for a number of reasons:
- Distinguishing user intent (e.g. disambiguating dependent type names in templates)
- Conforming to language rules that depend on explicit use of keywords
- Supporting tools like pretty-printers or refactoring engines that reconstruct the original source

We *could* annotate the `Elaborated` type by parsing out the keyword and qualifier, it's actually easier to ignore it completely.
Visiting an `Elaborated` node would simply defer to the visitor for its underlying (desugared) type, which will happen anyway as part of the normal traversal.
As a result, we only need to handle concrete `TypeLoc` nodes, such as those referencing classes, enums, templates, and so on.

## Enum types

The first concrete `TypeLoc` node we will handle is `EnumTypeLoc`, which represents references to enum types.
```cpp
if (clang::EnumTypeLoc e = node.getAs<clang::EnumTypeLoc>()) {
    location = e.getNameLoc();
    annotation = "enum-name";

    const clang::EnumDecl* decl = e.getDecl();
    name = decl->getNameAsString();
}
```
The `getAs()` function works similarly to dynamic casting - it safely checks if the `TypeLoc` node is of the requested type and returns null otherwise.

Enums are annotated with the `enum-name` tag, consistent with the pattern we've established in earlier posts.
We retrieve the name of the enum from its declaration and the source location of the typename from the `EnumTypeLoc` node itself.
```text
namespace logging {
    
    struct Message {
        enum class Level {
            DEBUG,
            INFO,
            WARNING,
            ERROR
        };
        
        // ...
    };
    
}

int main() {
    logging::Message::[[enum-name,Level]] level = logging::Message::[[enum-name,Level]]::INFO;
    // ...
}
```

## `Record` nodes

Next, we’ll handle references to classes, structs, and unions, all of which under `RecordTypeLoc` nodes.
```cpp
if (clang::RecordTypeLoc r = node.getAs<clang::RecordTypeLoc>()) {
    location = node.getBeginLoc();
    
    const clang::RecordDecl* decl = r.getDecl();
    name = decl->getNameAsString();
}
```
There are considered types, so we'll continue using the default `class-name` annotation.
However, if run on the following example:
```text
struct Vector {
    static const Vector zero;
    // ...
};

const Vector Vector::zero = Vector(...);

int main() {
    Vector v = Vector { };
    // ...
}
```
The visitor inserts the following annotations:
```text
struct Vector {
    static const [[class-name,Vector]] zero;
    // ...
};

const [[class-name,Vector]] [[class-name,Vector]]::zero = [[class-name,Vector]]();

int main() {
    [[class-name,Vector]] v = [[class-name,Vector]] { };
    // ...
}
```
There is a subtle problem here: constructor calls like `Vector()` are incorrectly annotated as types.

This is not an issue with Clang, nor with the `TypeLoc` visitor itself - in the AST, constructor calls appear as `CXXConstructExpr` nodes that wrap a `RecordTypeLoc`.
Semantically, however, constructor calls should be annotated as function calls, not types.
Ideally, we would skip annotating a `RecordTypeLoc` node if it appears within a constructor call.

The difficulty is that `TypeLoc` nodes are entirely separate from the AST and don't retain references to their parent node.
There is also no direct API to retrieve a `TypeLoc`'s parent during traversal.

To work around this, we need to hook into how Clang traverses the AST.

When visiting nodes, Clang manually traverses into associated `TypeLoc` nodes by calling `TraverseTypeLoc` within the relevant `TraverseDecl` or `TraverseStmt` functions.
Each function is responsible for explicitly traversing the types it is associated with.
This guarantees that the visitor for the enclosing AST node is invoked first, followed by the underlying `TypeLoc` nodes.

We can take advantage of this ordering and track the current parent node ourselves by overriding these traversal functions and maintaining a stack of parent nodes:
```cpp
bool TraverseDecl(clang::Decl* decl) {
    if (!decl) {
        return true;
    }

    m_parents.emplace_back(clang::DynTypedNode::create(*decl));
    bool result = RecursiveASTVisitor::TraverseDecl(decl);
    m_parents.pop_back();

    return result;
}

bool TraverseStmt(clang::Stmt* statement) {
    if (!statement) {
        return true;
    }
    
    m_parents.emplace_back(clang::DynTypedNode::create(*statement));
    bool result = RecursiveASTVisitor::TraverseStmt(statement);
    m_parents.pop_back();

    return result;
}
```
`Expr` is a subclass of `Stmt`, so there is no separate traversal function.
This requires a simple addition to our visitor:
```cpp
std::vector<clang::DynTypedNode> m_parents;
```
The `DynTypedNode` class from Clang allows for storing arbitrary AST nodes in a type-safe, unified way.
This avoids the need to track different node types separately, and allows for writing code that works with different kinds of AST nodes despite the fact that they don't share a common base class.

With this in place, we can safely check the current immediate parent of our `RecordTypeLoc` and avoid adding unwanted annotations for constructor calls:
```cpp
if (clang::RecordTypeLoc r = node.getAs<clang::RecordTypeLoc>()) {
    location = node.getBeginLoc();

    const clang::RecordDecl* decl = r.getDecl();
    name = decl->getNameAsString();

    // Skip 'class-name' annotations if the immediate parent is a constructor call
    const clang::DynTypedNode& parent = m_parents.back();
    if (const clang::CXXConstructExpr* constructor = parent.get<clang::CXXConstructExpr>()) {
        if (!constructor->isListInitialization()) {
            return true;
        }
    }
}
```
Similar to how we check the type of the `TypeLoc` node, a `DynTypedNode` provides the `get()` function for checking if it is of a certain type.
The `isListInitialization()` check of the `CXXConstructorExpr` allows us to continue adding annotations for constructor calls that use brace-initialization (like `Vector { }`), which syntactically refers to the type itself.
```text
struct Vector {
    static const [[class-name,Vector]] zero;
    // ...
};

const [[class-name,Vector]] [[class-name,Vector]]::zero = Vector();

int main() {
    [[class-name,Vector]] v = [[class-name,Vector]] { };
    // ...
}
```

## Type aliases

Next, we'll handle type aliases.
Both `typedef` declarations and modern `using` aliases are referenced by the `TypedefTypeLoc` node.
We'll handle both of these types using the same structure as before:
```cpp
if (clang::TypedefTypeLoc t = node.getAs<clang::TypedefTypeLoc>()) {
    location = node.getBeginLoc();
    
    const clang::TypedefNameDecl* decl = t.getTypedefNameDecl();
    name = decl->getNameAsString();
}
```
We retrieve the source location from the `TypeLoc` node and the name of the alias from its declaration.
The example below shows this change in action:
```text
struct Vector3 {
    static const Vector3 zero;

    Vector3(float x, float y, float z);
    
    // ...
};

const Vector3 Vector3::zero = Vector3(0.0f, 0.0f, 0.0f);

int main() {
    typedef Vector3 Color; // Typedef for RGB color support
    [[class-name,Color]] c = { 255.0f, 165.0f, 0.0f };
    
    // ...
    
    using Position = Vector3;
    [[class-name,Position]] origin = Vector3::zero;
    
    // ...
}
```
The underlying type for an alias can be anything, but the alias itself is annotated as a `class-name` to maintain consistency with how other type references are treated.

## Templates

Template contexts introduce several new `TypeLoc` nodes that we’ll need to handle.
These appear when referencing template parameters, specializations, and concept-constrained types.
Specifically, we'll cover:
- `TemplateTypeParmTypeLoc` nodes - references to template parameters,
- `TemplateSpecializationTypeLoc` nodes - references to explicit template specializations,
- `DeducedTemplateSpecializationTypeLoc` nodes - deduced template specializations with inferred arguments, and
- `DependentNameTypeLoc` nodes - unresolved, dependent type names in template contexts.

For this section, we'll use a slightly expanded example building on our earlier post about templates:
```cpp
#include <concepts> // std::same_as
#include <iterator> // std::begin, std::end
#include <vector> // std::vector

template <typename T>
concept Container = requires(T container, std::size_t index) {
    { std::begin(container) } -> std::same_as<decltype(std::end(container))>;
    { *std::begin(container) };
    { ++std::begin(container) } -> std::same_as<decltype(std::begin(container))>;
    { container.size() };
    { container.capacity() };
    typename T::value_type;
};

template <Container T>
void print(const T& container);

int main() {
    std::vector<int> v1;
    print(v1);
    
    std::vector v2 = { 1, 2, 3 };
    print(v2);
}
```

### Template parameters

The `TemplateTypeParmTypeLoc` node references template parameters.
Earlier, we added visitors for `ConceptDecl` and `ConceptSpecializationExpr` nodes to handle annotating concept declarations and constrained expressions like the `Container` concept used with `print()`.
By visiting `TemplateTypeParmTypeLoc` nodes, we can also annotate references to the type parameter `T`, as well as the type itself - both in the unconstrained `template <typename T>` declaration and the constrained `template <Container T>` form.

The visitor itself follows the same structure we're used to:
```cpp
if (clang::TemplateTypeParmTypeLoc ttp = node.getAs<clang::TemplateTypeParmTypeLoc>()) {
    location = ttp.getNameLoc();

    if (const clang::TemplateTypeParmDecl* decl = ttp.getDecl()) {
        name = decl->getNameAsString();
    }
}
```
The name of the template parameter is retrieved from its underlying `TemplateTypeParmDecl` using the `getDecl()` function.
As with other type references, the template parameter is annotated as a `class-name`.
```text
#include <concepts> // std::same_as
#include <iterator> // std::begin, std::end
#include <vector> // std::vector

template <typename T>
concept Container = requires([[class-name,T]] container, std::[[class-name,size_t]] index) {
    { std::begin(container) } -> std::same_as<decltype(std::end(container))>;
    { *std::begin(container) };
    { ++std::begin(container) } -> std::same_as<decltype(std::begin(container))>;
    { container.size() };
    { container.capacity() };
    typename [[class-name,T]]::value_type;
};

template <Container T>
void print(const [[class-name,T]]& container);

int main() {
    std::vector<int> v1;
    print(v1);
    
    std::vector v2 = { 1, 2, 3 };
    print(v2);
}
```

### Template specializations
When working with template specializations, Clang exposes two `TypeLoc` nodes:
- `TemplateSpecializationTypeLoc` for explicit template specializations
- `DeducedTemplateSpecializationTypeLoc` for template specializations deduced by class template argument deduction (CTAD)

Only cases where the template arguments are fully deduced by the compiler, such as in `std::vector v2 = { 1, 2, 3 };` in the example from earlier, use `DeducedTemplateSpecializationTypeLoc`.
When at least one template argument is explicitly specified, like in `std::vector<int>`, Clang generates a `TemplateSpecializationTypeLoc`.
```cpp
if (clang::TemplateSpecializationTypeLoc ts = node.getAs<clang::TemplateSpecializationTypeLoc>()) {
    location = ts.getTemplateNameLoc();
    const clang::TemplateDecl* decl = ts.getTypePtr()->getTemplateName().getAsTemplateDecl();
    if (decl) {
        name = decl->getNameAsString();
    }
}
if (clang::DeducedTemplateSpecializationTypeLoc dts = node.getAs<clang::DeducedTemplateSpecializationTypeLoc>()) {
    location = dts.getTemplateNameLoc();
    const clang::TemplateDecl* decl = dts.getTypePtr()->getTemplateName().getAsTemplateDecl();
    if (decl) {
        name = decl->getNameAsString();
    }
}
```
For both visitors, the template class name is retrieved from the underlying `TemplateDecl` using the `getTypePtr()` function.
Both cases are annotated with `class-name`.
```text
#include <concepts> // std::same_as
#include <iterator> // std::begin, std::end
#include <vector> // std::vector

template <typename T>
concept Container = requires(T container, std::[[class-name,size_t]] index) {
    { std::begin(container) } -> std::same_as<decltype(std::end(container))>;
    { *std::begin(container) };
    { ++std::begin(container) } -> std::same_as<decltype(std::begin(container))>;
    { container.size() };
    { container.capacity() };
    typename T::value_type;
};

template <Container T>
void print(const T& container);

int main() {
    std::[[class-name,vector]]<int> v1;
    print(v1);
    
    std::[[class-name,vector]] v2 = { 1, 2, 3 };
    print(v2);
}
```

### Dependent type names

The final node we’ll cover is `DependentNameTypeLoc`, which represents type names that cannot be fully resolved at parse time due to their dependency on an unknown type parameter.
These nodes are typically encountered in template or concept contexts.
A good example of this comes from the `Container` concept in our earlier snippet, specifically this requirement:
```cpp
typename T::value_type;
```
In this case, `T::value_type` cannot be resolved until the concept is instantiated with a concrete type, so Clang models it as a `DependentNameTypeLoc`.
This extends into template contexts as well.

The annotation of `DependentNameTypeLoc` nodes follows the same structure as before:
```cpp
if (clang::DependentNameTypeLoc dn = node.getAs<clang::DependentNameTypeLoc>()) {
    location = dn.getNameLoc();
    name = dn.getTypePtr()->getIdentifier()->getName().str();
}
```
The name of the type is retrieved from the underlying `DependentNameType` via `getTypePtr()`.

In our earlier post on concepts, we purposefully left this case unhandled.
The `T::value_type` expression was also picked up by the `DependentScopeDeclRefExpr` visitor, but within that context, it was ambiguous what the reference actually referred to - it could have been a type, a member, or something else.
Here, we know with certainty that the node references a type (despite not knowing what the actual type is), and we can safely annotate it as a `class-name`.
```text
#include <concepts> // std::same_as
#include <iterator> // std::begin, std::end
#include <vector> // std::vector

template <typename T>
concept Container = requires(T container, std::[[class-name,size_t]] index) {
    { std::begin(container) } -> std::same_as<decltype(std::end(container))>;
    { *std::begin(container) };
    { ++std::begin(container) } -> std::same_as<decltype(std::begin(container))>;
    { container.size() };
    { container.capacity() };
    typename T::[[class-name,value_type]];
};

template <Container T>
void print(const T& container);

int main() {
    std::vector<int> v1;
    print(v1);
    
    std::vector v2 = { 1, 2, 3 };
    print(v2);
}
```