
Throughout this series, we've focused on annotating the *targets* of AST nodes — types, functions, member variables, and so on.
However, many of these nodes also contain *qualifiers*, such as namespaces or class names, that appear on type names, static member references, and function calls.

Consider the following example, taken from a previous post in this series:
```cpp
#include <cmath> // std::sqrt

namespace math {
    namespace detail {
        // ... 
    }

    struct Vector3 {
        static const Vector3 zero;
        
        Vector3() : x(0.0f), y(0.0f), z(0.0f) { }
        Vector3(float x, float y, float z) : x(x), y(y), z(z) { }
        ~Vector3() { }
        
        [[nodiscard]] float length() const {
            return std::sqrt(x * x + y * y + z * z);
        }
        
        float x;
        float y;
        float z;
    };
    
    const Vector3 Vector3::zero = Vector3();
}

int main() {
    using namespace math::detail;

    typedef math::Vector3 Color; // Typedef for RGB color support
    Color c = { 255.0f, 165.0f, 0.0f };
    
    using Position = math::Vector3;
    Position origin = math::Vector3::zero;
}
```
With all of our existing visitors enabled, the output looks like this:
```text
#include <cmath> // std::sqrt

namespace [[namespace-name,math]] {
    namespace [[namespace-name,detail]] {
        // ... 
    }

    struct [[class-name,Vector3]] {
        static const [[class-name,Vector3]] [[member-variable,zero]];

        [[function,Vector3]]() : [[member-variable,x]](0.0f), [[member-variable,y]](0.0f), [[member-variable,z]](0.0f) { }
        [[function,Vector3]](float x, float y, float z) : [[member-variable,x]](x), [[member-variable,y]](y), [[member-variable,z]](z) { }
        [[function,~Vector3]]() { }

        [[nodiscard]] float [[function,length]]() const {
            return std::[[function,sqrt]]([[member-variable,x]] [[binary-operator,*]] [[member-variable,x]] [[binary-operator,+]] [[member-variable,y]] [[binary-operator,*]] [[member-variable,y]] [[binary-operator,+]] [[member-variable,z]] [[binary-operator,*]] [[member-variable,z]]);
        }

        float [[member-variable,x]];
        float [[member-variable,y]];
        float [[member-variable,z]];
    };

    const [[class-name,Vector3]] [[class-name,Vector3]]::[[member-variable,zero]] = Vector3();
}

int [[function,main]]() {
    using namespace math::[[namespace-name,detail]];

    typedef math::[[class-name,Vector3]] [[class-name,Color]]; // Typedef for RGB color support
    [[class-name,Color]] c = { 255.0f, 165.0f, 0.0f };
    
    using [[class-name,Position]] = math::[[class-name,Vector3]];
    [[class-name,Position]] origin = math::[[class-name,Vector3]]::[[member-variable,zero]];
}
```
While the type names and member variables are properly annotated, notice how the namespace and class qualifiers in expressions like:
- `std::[[function,sqrt]]`,
- `using namespace math::[[namespace-name,detail]]`,
- `math::[[class-name,Vector3]]` in type aliases, and
- `math::[[class-name,Vector3]]::[[member-variable,zero]]` in static member references

remain partially unannotated.

In the case of `math::[[class-name,Vector3]]`, you'll notice the qualifying class name is already highlighted.
That's because our `TypeLoc` visitor handles annotating the referenced type.
However, namespace qualifiers like `math::` or `std::` aren't being annotated yet.

In this post, we'll implement a way to add annotations to namespace, class, and enum qualifiers.

## Annotating qualifiers

To retrieve qualifier information, we'll introduce a new `extract_qualifiers` helper function.
This function walks up the declaration hierarchy of a given AST node, recording any enclosing namespaces, classes, and enums it encounters along the way.
We can access this hierarchy through a node's `DeclContext` chain:
```cpp
QualifierList extract_qualifiers(const clang::DeclContext* context) {
    QualifierList qualifiers { };
    
    while (context) {
        if (const clang::NamespaceDecl* n = clang::dyn_cast<clang::NamespaceDecl>(context)) {
            qualifiers.add_namespace(n->getNameAsString());
        }
        else if (const clang::CXXRecordDecl* r = clang::dyn_cast<clang::CXXRecordDecl>(context)) {
            qualifiers.add_record(r->getNameAsString());
        }
        else if (const clang::EnumDecl* e = clang::dyn_cast<clang::EnumDecl>(context)) {
            qualifiers.add_enum(e->getNameAsString());
        }
        
        context = context->getParent();
    }
    
    return qualifiers;
}
```
The function achieves this by repeatedly calling `getParent()`, which takes one step outward in the declaration hierarchy.
This continues until the root translation unit, whose parent is null.
Qualifiers get collected into a `QualifierList`, a lightweight utility class for tracking both the annotation used for each qualifier.
```cpp
class QualifierList {
    public:
        QualifierList();
        ~QualifierList() = default;
        
        void add_namespace(const std::string& name);
        void add_record(const std::string& name);
        void add_enum(const std::string& name);
        
        [[nodiscard]] bool contains(const std::string& name) const;
        [[nodiscard]] const char* get_annotation(const std::string& name) const;
        
    private:
        std::unordered_map<std::string, const char*> m_qualifiers;
};
```
The `QualifierList` also provides simple lookup functions for determining if a given token is a known qualifier, and retrieving the annotation.
Its implementation is straightforward, as it just registers the proper annotation for each qualifier encountered:
```cpp
void QualifierList::add_namespace(const std::string& name) {
    m_qualifiers[name] = "namespace-name";
}

void QualifierList::add_record(const std::string& name) {
    m_qualifiers[name] = "class-name";
}

void QualifierList::add_enum(const std::string& name) {
    m_qualifiers[name] = "enum-name";
}
```

Once we have the `DeclContext` of a node, we can easily retrieve its qualifiers and apply annotations using the same tokenization pattern we've used in earlier posts:
```cpp
QualifierList qualifiers = extract_qualifiers(node->getDeclContext());
for (const Token& token : m_tokenizer->get_tokens(node->getSourceRange())) {
    if (qualifiers.contains(token.spelling)) {
        const char* annotation = qualifiers.get_annotation(token.spelling);
        m_annotator->insert_annotation(annotation, token.line, token.column, token.spelling.length());
    }
}
```
We check each token to see if it matches a known qualifier using the `contains()` function.
If it does, we use `get_qualifier_type()` to determine the correct annotation - `namespace-name` for namespaces, `class-name` for classes, or `enum-name` for enums.

To simplify its usage, we'll wrap this logic in a `visit_qualifiers()` helper function:
```cpp
void Visitor::visit_qualifiers(const clang::DeclContext* context, clang::SourceRange range);
```
All that's left is to add calls to this function in visitors for nodes that may contain qualifiers.

## Adding qualifiers

### Enums
When an enum is declared as an `enum class`, references to its constants must include the enum name as a qualifier:
```text
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

To handle this, we'll update the `VisitDeclRefExpr` visitor to annotate qualifiers in addition to the referenced enum constant:
```cpp
if (clang::ValueDecl* decl = node->getDecl()) {
    const std::string& name = decl->getNameAsString();
    
    // ...
    
    if (const clang::EnumConstantDecl* ec = clang::dyn_cast<clang::EnumConstantDecl>(decl)) {
        m_annotator->insert_annotation("enum-value", line, column, name.length());
    }
    
    visit_qualifiers(decl->getDeclContext(), node->getSourceRange());
}
```
Note that `visit_qualifiers()` is called unconditionally, as `VisitDeclRefExpr` handles more than just enum constants.
This way, other nodes (such as references to static class member variables) also get their qualifiers annotated.
```text
enum class Level {
    Debug = 0,
    Info,
    Warning,
    Error,
    Fatal = Error,
};

void log_message(Level level, const char* message);

int main() {
    log_message([[enum-name,Level]]::Error, "something bad happened");
    // ...
}
```

### Namespaces
Namespace aliases and `using namespace` directives are another common place where qualifiers appear:
```text
namespace math {
    namespace utility {
        // ...
    }
}

int main() {
    using namespace math::utility;
    namespace utils = math::utility;
    // ...
}
```
The existing `VisitNamespaceAliasDecl` and `VisitUsingDirectiveDecl` visitors only annotated the final `utility` namespace in the chain and left qualifiers like `math` unannotated.
Adding a `visit_qualifiers()` call to both visitors ensures that nested namespace qualifiers are annotated correctly.

For namespace aliases:
```cpp
bool Visitor::VisitNamespaceAliasDecl(clang::NamespaceAliasDecl* node) {
    // Annotate namespace alias
    // ...
    
    // Annotate aliased namespace(s)
    const clang::NamedDecl* aliased = node->getAliasedNamespace();
    // ...
    
    visit_qualifiers(aliased->getDeclContext(), node->getSourceRange());
    return true;
}
```
Here, we annotate using the `DeclContext` of the namespace being aliased to properly capture the entire namespace chain.

For `using namespace` directives:
```cpp
bool Visitor::VisitUsingDirectiveDecl(clang::UsingDirectiveDecl* node) {
    // Annotate the namespace name itself
    const clang::NamespaceDecl* n = node->getNominatedNamespace();
    // ...
    
    visit_qualifiers(n->getDeclContext(), node->getSourceRange());
    return true;
}
```
Here, we annotate any qualifiers of the nominated namespace.

With both of these visitors updated, qualifiers in namespace directives are now properly handled:
```text
namespace math {
    namespace utility {
        // ...
    }
}

int main() {
    using namespace [[namespace-name,math]]::utility;
    namespace utils = [[namespace-name,math]]::utility;
    // ...
}
```

### Functions

To annotate qualifiers on both function declarations and calls, we need to update a few existing visitor implementations.
Consider the following example:
```text
#include <cmath> // std::sqrt

struct Vector3 {
    Vector3();
    Vector3(float x, float y, float z);
    ~Vector3();
    
    [[nodiscard]] float length() const;
    Vector3 operator+(const Vector3& other) const;
    
    float x;
    float y;
    float z;
};

Vector3::Vector3() : x(0.0f), y(0.0f), z(0.0f) { }

Vector3::Vector3(float x, float y, float z) : x(x), y(y), z(z) { }

Vector3::~Vector3() { }

float Vector3::length() const {
    return std::sqrt(x * x + y * y + z * z);
}

Vector3 Vector3::operator+(const Vector3& other) const {
    return { x + other.x, y + other.y, z + other.z };
}

int main() {
    Vector3 a { };
    Vector3 b { };
    
    Vector3 c = a.Vector3::operator+(b);  // Explicitly-qualified operator call
    
    // ...
}
```
For annotating qualifiers on function declarations, such as out-of-line class member functions, we'll update the `VisitFunctionDecl` visitor:
```cpp
bool Visitor::VisitFunctionDecl(clang::FunctionDecl* node) {
    // Annotate function name
    // ...
    
    visit_qualifiers(node->getDeclContext(), clang::SourceRange(node->getBeginLoc(), node->getTypeSpecEndLoc()));
    return true;
}
```
Notice the source range:
```cpp
clang::SourceRange(node->getBeginLoc(), node->getTypeSpecEndLoc())
```
This range covers all tokens from the start of the declaration (including qualifiers like `Vector3::`) up to the function name (which we don't care about, since we've already annotated it before).
This ensures we annotate all relevant qualifiers consistently, even for constructors, destructors, and overloaded operators.
Using `getTypeSpecStartLoc()` as the start of the range is insufficient in those cases, as constructors and destructors lack a return type.

This approach also properly annotates definitions and forward declarations of namespace-qualified global functions, such as:
```cpp
namespace math {
    float dot(const Vector3& a, const Vector3& b);
}

float math::dot(const Vector3& a, const Vector3& b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}
```

For explicitly-qualified operator calls, such as `a.Vector3::operator+(b)`, we'll annotate qualifiers in `VisitCXXOperatorCallExpr`:
```cpp
bool Visitor::VisitCXXOperatorCallExpr(clang::CXXOperatorCallExpr* node) {
    // Annotate operator name
    // ...

    visit_qualifiers(node->getDirectCallee()->getDeclContext(), clang::SourceRange(node->getBeginLoc(), node->getOperatorLoc()));
    return true;
}
```
The range:
```cpp
clang::SourceRange(node->getBeginLoc(), node->getOperatorLoc()))
```
ensures that only the relevant tokens before the operator symbol are parsed for qualifiers (e.g. `Vector3::operator`).

All other function calls, including qualified regular function calls, are handled by `VisitCallExpr`:
```cpp
bool Visitor::VisitCallExpr(clang::CallExpr* node) {
    // Annotate UnresolvedLookupExpr, DependentScopeDeclRefExpr, CXXDependentScopeMemberExpr, and other calls
    // ...
    
    if (const clang::Decl* decl = node->getCalleeDecl()) {
        visit_qualifiers(decl->getDeclContext(), node->getSourceRange());
    }

    return true;
}
```

With these visitors updated, qualifiers for function declarations and calls are properly annotated:
```text
#include <cmath> // std::sqrt

struct Vector3 {
    Vector3();
    Vector3(float x, float y, float z);
    ~Vector3();
    
    [[nodiscard]] float length() const;
    Vector3 operator+(const Vector3& other) const;
    
    float x;
    float y;
    float z;
};

[[class-name,Vector3]]::Vector3() : x(0.0f), y(0.0f), z(0.0f) { }

[[class-name,Vector3]]::Vector3(float x, float y, float z) : x(x), y(y), z(z) { }

[[class-name,Vector3]]::~Vector3() { }

float [[class-name,Vector3]]::length() const {
    return [[namespace-name,std]]::sqrt(x * x + y * y + z * z);
}

Vector3 [[class-name,Vector3]]::operator+(const Vector3& other) const {
    return { x + other.x, y + other.y, z + other.z };
}

int main() {
    Vector3 a { };
    Vector3 b { };
    
    Vector3 c = a.[[class-name,Vector3]]::operator+(b);  // Qualified operator call
    
    // ...
}
```

### Classes

Most qualifier annotations pertaining to classes are already handled by the updates made earlier, but static class member definitions still require attention.
Consider the following example:
```text
struct Vector3 {
    static const Vector3 zero;
    
    float x;
    float y;
    float z;
};

const Vector3 Vector3::zero = Vector3();
```

Static class member definitions are handled by the `VisitVarDecl` visitor:
```cpp
bool Visitor::VisitVarDecl(clang::VarDecl* node) {
    if (node->isStaticDataMember()) {
        // Annotate member variable
        // ...
        
        std::string type = node->getType().getUnqualifiedType().getAsString();
        clang::SourceLocation start = node->getTypeSpecStartLoc().getLocWithOffset(type.length());
        visit_qualifiers(node->getDeclContext(), clang::SourceRange(start, location));
    }

    return true;
}
```
Unfortunately, there is no direct way to retrieve the source range of *just* the qualified member name.
The best candidate, `node->getTypeSpecStartLoc()`, points to the start of the type, not the member itself:
```text
const Vector3 Vector3::zero = Vector3();
      ^       ^       
      |       what we want
   start of type
```
To annotate only the qualifiers on the member name, we'll offset the range by the length of the fully-qualified typename, obtained via `node->getType().getUnqualifiedType().getAsString()`.
The `getUnqualifiedType()` call ensures that qualifiers like `const`, `volatile`, or references / pointers are stripped away, leaving only the name of the type.

With this approach, we can annotate just the qualifiers on the member:
```text
struct Vector3 {
    static const Vector3 zero;
    
    float x;
    float y;
    float z;
};

const Vector3 [[class-name,Vector3]]::zero = Vector3();
```
Annotations for references to the static member itself, such as `Vector3::zero`, are already handled by the qualifier logic added to `VisitDeclRefExpr` earlier.

We also need to extend `VisitMemberExpr` to account for explicit qualifiers on class member variables, such as accessing a member from a base class:
```text
struct Base {
    float value;
};

struct Derived : public Base {
    void foo() {
        Base::value = 42;
    }
};
```
We can modify `VisitMemberExpr` to annotate the qualifier when present:
```cpp
bool Visitor::VisitMemberExpr(clang::MemberExpr* node) {
    // Annotate member variable
    // ...

    if (node->hasQualifier()) {
        visit_qualifiers(member->getDeclContext(), node->getSourceRange());
    }
    return true;
}
```
The `hasQualifier()` check ensures we only process nodes that explicitly include a qualifier.
This avoids unnecessary work for standard member accesses without qualifiers.

With the visitor updated, qualifiers on member accesses are properly annotated:
```text
struct Base {
    float value;
};

struct Derived : public Base {
    void foo() {
        [[class-name,Base]]::value = 42;
    }
};
```

### Types

`TypeLoc` nodes represent type references in variable declarations, function parameters and return values, template arguments, and more.
With our current visitor setup, adding qualifier annotations for these types requires only a few small tweaks.
Take the `RecordTypeLoc` case as an example:
```cpp
clang::SourceLocation location;
std::string name;
clang::DeclContext* context;

if (clang::RecordTypeLoc r = node.getAs<clang::RecordTypeLoc>()) {
    location = node.getBeginLoc();
    
    // ...

    const clang::RecordDecl* decl = r.getDecl();
    if (decl) {
        name = decl->getNameAsString();
        context = decl->getDeclContext();
    }
}
```
If we update the implementation to also extract the declaration context in addition to the type name, giving us everything we need to annotate the type and its qualifiers.

The challenge is that for most `TypeLoc` nodes, the location provided by `getBeginLoc()` refers only to the type name itself, and not any preceding namespace or class qualifiers.
Manually querying the parent AST node for ranges is possible, but inefficient.
For example, the parent AST node of a function parameter is a `FunctionDecl` node, but retrieving its range means tokenizing the entire function signature and body.
While this is a viable strategy, it is completely overkill.
Instead, we can tokenize *backwards* from the type name, annotating qualifiers while walking to the beginning of the qualified type expression.
This avoids any unnecessary work and isolates exactly what we need.

To achieve this, we extend the `Tokenizer` with iterators:
```cpp
[[nodiscard]] std::vector<Token>::const_iterator begin() const;
[[nodiscard]] std::vector<Token>::const_iterator end() const;
[[nodiscard]] std::vector<Token>::const_iterator at(clang::SourceLocation location) const;
```
`at()` retrieves an iterator to the token at a given `SourceLocation`, using the same logic as `get_tokens()` to retrieve the first token of the range.

With this, we can implement this incremental traversal logic in a new `visit_qualifiers` helper:
```cpp
void Visitor::visit_qualifiers(const clang::DeclContext* context, clang::SourceLocation location, bool forward) {
    QualifierList qualifiers = extract_qualifiers(context);
    auto start = m_tokenizer->at(location);
    for (auto it = start; it != m_tokenizer->begin(); forward ? forward ? ++it : --it) {
        // First token is the type name itself
        if (it == start) {
            continue;
        }
        
        const Token& token = *it;
        
        if (qualifiers.contains(token.spelling)) {
            m_annotator->insert_annotation(qualifiers.get_annotation(token.spelling), token.line, token.column, token.spelling.length());
        }
        else if (token.spelling != "::") {
            break;
        }
    }
}
```
While the current token is a known qualifier or a `::` separator, we know we are still annotating part of the qualified type.
As soon as this condition is no longer true, we know we've reached the end.

Annotating qualifiers on `TypeLoc` nodes is now trivial:
```cpp
bool Visitor::VisitTypeLoc(clang::TypeLoc node) {
    // Annotate type name
    // ...
    
    if (context) {
        visit_qualifiers(context, location, false);
    }
    
    return true;
}
```

### Concepts

Certain nodes in concept contexts are not processed by the `VisitTypeLoc` visitor, despite appearing and functioning as types.
For example:
```text
#include <concepts> // std::same_as
#include <iterator> // std::begin, std::end

namespace concepts {
    
    namespace detail {
        
        template <typename T>
        concept Iterable = requires(T container) {
            { std::begin(container) } -> std::same_as<decltype(std::end(container))>;
            { *std::begin(container) };
            { ++std::begin(container) } -> std::same_as<decltype(std::begin(container))&>;
        };
        
    }
    
    template <typename T>
    concept Container = detail::Iterable<T> && requires(T container, std::size_t index) {
        { container.size() };
        { container.capacity() };
        typename T::value_type;
    };
    
}

template <concepts::Container T>
void print(const T& container) {
    // ...
}
```
Qualifiers are not annotated on type constraints in trailing requirements such as `std::same_as` as well as concept specializations like `detail::Iterable<T>` and on template parameters.
To support this, we'll extend the `VisitConceptSpecializationExpr`, `VisitRequiresExpr`, and `VisitTemplateTypeParmDecl` visitors to annotate qualifiers explicitly.

The `VisitConceptSpecializationExpr` visitor already handles annotating the concept name itself.
We'll extend this function to also annotate any namespace or class qualifiers as well:
```cpp
bool Visitor::VisitConceptSpecializationExpr(clang::ConceptSpecializationExpr* node) {
    // Annotate concept name
    // ...
        
    visit_qualifiers(decl->getDeclContext(), node->getSourceRange());
    return true;
}
```

The `VisitRequiresExpr` visitor is responsible for annotating trailing type constraints within requires expressions, such as:
```cpp
std::same_as<decltype(std::end(container))>;
```
Similarly, we'll update this visitor to also annotate qualifiers in addition to the concept name:
```cpp
bool Visitor::VisitRequiresExpr(clang::RequiresExpr* node) {
    clang::SourceLocation location = node->getLocation();
    
    for (const clang::concepts::Requirement* r : node->getRequirements()) {
        if (const clang::concepts::ExprRequirement* er = clang::dyn_cast<clang::concepts::ExprRequirement>(r)) {
            // Annotate constraint name
            // ...
            
            clang::SourceLocation location = constraint->getConceptNameLoc();
            
            clang::DeclContext* context = constraint->getFoundDecl()->getDeclContext();
            const clang::Expr* expr = er->getExpr();
            if (expr) {
                visit_qualifiers(context, location, false);
            }
        }
    }

    return true;
}
```
This uses the `visit_qualifiers()` overload we implemented in the previous section.
Alternatively, a range-based approach works just as well:
```cpp
visit_qualifiers(context, clang::SourceRange(expr->getEndLoc(), location));
```
This annotates tokens from the end of the requires expression to type name of the constraint:
```text
{ std::begin(container) } -> std::same_as<decltype(std::end(container))>;
                        ^         ^
                      start      end
```
The standard guarantees that only one type constraint may appear in a trailing requirement, so this approach is equally viable.

For constraints on template parameters, we'll update `VisitTemplateTypeParmDecl`:
```cpp
bool Visitor::VisitTemplateTypeParmDecl(clang::TemplateTypeParmDecl* node) {
    // Annotate template parameter
    // ...
    
    if (const clang::TypeConstraint* constraint = node->getTypeConstraint()) {
        const clang::NamedDecl* decl = constraint->getNamedConcept();
        if (decl) {
            // Annotate concept name
            // ...
            
            clang::SourceLocation location = constraint->getConceptNameLoc();
            visit_qualifiers(decl->getDeclContext(), location, false);
        }
    }
    
    return true;
}
```
Clang doesn't expose the full source range for the constraint, only allowing the location of the type name itself.
However, since type constraints on template parameters function structurally identical to types, we can employ the reverse-tokenization approach for this case as well.

With these visitors updated, qualifiers in concept contexts are now properly annotated:
```text
#include <concepts> // std::same_as
#include <iterator> // std::begin, std::end

namespace concepts {
    
    namespace detail {
        
        template <typename T>
        concept Iterable = requires(T container) {
            { std::begin(container) } -> [[namespace-name,std]]::same_as<decltype(std::end(container))>;
            { *std::begin(container) };
            { ++std::begin(container) } -> [[namespace-name,std]]::same_as<decltype(std::begin(container))&>;
        };
        
    }
    
    template <typename T>
    concept Container = [[namespace-name,detail]]::Iterable<T> && requires(T container, std::size_t index) {
        { container.size() };
        { container.capacity() };
        typename T::value_type;
    };
    
}

template <[[namespace-name,concepts]]::Container T>
void print(const T& container) {
    // ...
}
```
Due to their dependence on an ambiguous type `T`, it is not currently possible to annotate qualifiers on `UnresolvedLookupExpr` expressions like `std::begin()` or `std::end()`.
For now, such cases will require manual annotation.

---

This post does not provide an exhaustive implementation for all AST nodes that may contain qualifiers.
Many of these cases were discovered incrementally while working through real-world examples, so it's likely that additional nodes or edge cases exist that aren't covered here.
Fortunately, the `visit_qualifiers()` functions are designed to be reusable and easy to integrate into new visitors as new and unhandled cases arise.
