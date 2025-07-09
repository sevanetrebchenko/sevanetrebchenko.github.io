
Throughout this series, we've focused on annotating the *targets* of AST nodes — types, functions, member variables, and so on.
However, many of these nodes also contain *qualifiers*, such as namespaces or class names, that appear on type names, static member references, and function calls.

Consider the following example, taken from a previous post in this series:
```text
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
That's because our `TypeLoc` visitor handles annotating the type portion of the expression.
However, namespace qualifiers like `math::` or `std::` are not being annotated yet.

In this post, we'll implement a generic way to add annotations to namespace, class, and enum qualifiers on types, functions, and other declarations.

## Annotating qualifiers

To retrieve qualifier information, we'll introduce a new `extract_qualifiers` helper function.
This function walks up the declaration hierarchy of a given AST node, recording any enclosing namespaces, classes, and enums it encounters along the way.
As before, we'll access this hierarchy through the `DeclContext` chain of a given node:
```cpp title:{visitor.cpp} line-numbers:{enabled}
[[class-name,QualifierList]] [[function,extract_qualifiers]]([[keyword,const]] [[namespace-name,clang]]::[[class-name,DeclContext]]* context) {
    [[class-name,QualifierList]] [[plain,qualifiers]] { };
    
    [[keyword,while]] (context) {
        [[keyword,if]] ([[keyword,const]] [[namespace-name,clang]]::[[class-name,NamespaceDecl]]* n = [[namespace-name,clang]]::[[function,dyn_cast]]<[[namespace-name,clang]]::[[class-name,NamespaceDecl]]>(context)) {
            qualifiers.[[function,add_namespace]](n->[[function,getNameAsString]]());
        }
        [[keyword,else]] [[keyword,if]] ([[keyword,const]] [[namespace-name,clang]]::[[class-name,CXXRecordDecl]]* r = [[namespace-name,clang]]::[[function,dyn_cast]]<[[namespace-name,clang]]::[[class-name,CXXRecordDecl]]>(context)) {
            qualifiers.[[function,add_record]](r->[[function,getNameAsString]]());
        }
        [[keyword,else]] [[keyword,if]] ([[keyword,const]] [[namespace-name,clang]]::[[class-name,EnumDecl]]* e = [[namespace-name,clang]]::[[function,dyn_cast]]<[[namespace-name,clang]]::[[class-name,EnumDecl]]>(context)) {
            qualifiers.[[function,add_enum]](e->[[function,getNameAsString]]());
        }
        
        context [[binary-operator,=]] context->[[function,getParent]]();
    }
    
    [[keyword,return]] qualifiers;
}
```
The function achieves this by repeatedly calling `getParent()`, which takes one step outward in the declaration hierarchy.
This continues until the root translation unit, whose parent is null.
Qualifiers get collected into a `QualifierList`, a lightweight utility class for tracking both the annotation used for each qualifier.
```cpp line-numbers:{enabled} title:{visitor.cpp}
[[keyword,class]] [[class-name,QualifierList]] {
    [[keyword,public]]:
        [[function,QualifierList]]();
        [[function,~QualifierList]]() = [[keyword,default]];
        
        [[keyword,void]] [[function,add_namespace]]([[keyword,const]] [[namespace-name,std]]::[[class-name,string]]& name);
        [[keyword,void]] [[function,add_record]]([[keyword,const]] [[namespace-name,std]]::[[class-name,string]]& name);
        [[keyword,void]] [[function,add_enum]]([[keyword,const]] [[namespace-name,std]]::[[class-name,string]]& name);
        
        [[nodiscard]] [[keyword,bool]] [[function,contains]]([[keyword,const]] [[namespace-name,std]]::[[class-name,string]]& name) [[keyword,const]];
        [[nodiscard]] [[keyword,const]] [[keyword,char]]* [[function,get_annotation]]([[keyword,const]] [[namespace-name,std]]::[[class-name,string]]& name) [[keyword,const]];
        
    [[keyword,private]]:
        [[namespace-name,std]]::[[class-name,unordered_map]]<[[namespace-name,std]]::[[class-name,string]], [[keyword,const]] [[keyword,char]]*> [[member-variable,m_qualifiers]];
};
```
The `QualifierList` also provides simple lookup functions for determining if a given token is a known qualifier, and retrieving the annotation.
Its implementation is straightforward, as it just registers the proper annotation for each qualifier encountered:
```cpp line-numbers:{enabled} title:{visitor.cpp}
[[keyword,void]] [[class-name,QualifierList]]::[[function,add_namespace]]([[keyword,const]] [[namespace-name,std]]::[[class-name,string]]& name) {
    [[member-variable,m_qualifiers]][[operator,[]]name[[operator,]]] [[binary-operator,=]] "namespace-name";
}

[[keyword,void]] [[class-name,QualifierList]]::[[function,add_record]]([[keyword,const]] [[namespace-name,std]]::[[class-name,string]]& name) {
    [[member-variable,m_qualifiers]][[operator,[]]name[[operator,]]] [[binary-operator,=]] "class-name";
}

[[keyword,void]] [[class-name,QualifierList]]::[[function,add_enum]]([[keyword,const]] [[namespace-name,std]]::[[class-name,string]]& name) {
    [[member-variable,m_qualifiers]][[operator,[]]name[[operator,]]] [[binary-operator,=]] "enum-name";
}
```

Once we have the `DeclContext` of a node, we can easily retrieve its qualifiers and apply annotations using the same tokenization pattern we've used in earlier posts.
To simplify its usage, we'll wrap this logic in a `visit_qualifiers()` helper function:
```cpp line-numbers:{enabled} title:{visitor.cpp}
[[keyword,void]] [[class-name,Visitor]]::[[function,visit_qualifiers]]([[keyword,const]] [[namespace-name,clang]]::[[class-name,DeclContext]]* context, [[namespace-name,clang]]::[[class-name,SourceRange]] range) {
    [[class-name,QualifierList]] qualifiers = [[function,extract_qualifiers]](context);
    [[keyword,for]] ([[keyword,const]] Token& token : m_tokenizer->get_tokens(range)) {
        [[keyword,if]] (qualifiers.contains(token.spelling)) {
            [[keyword,const]] [[keyword,char]]* annotation = qualifiers.get_annotation(token.spelling);
            m_annotator->insert_annotation(annotation, token.line, token.column, token.spelling.length());
        }
    }
}
```
We check each token to see if it matches a known qualifier using the `contains()` function.
If it does, we use `get_qualifier_type()` to determine the correct annotation - `namespace-name` for namespaces, `class-name` for classes, or `enum-name` for enums.
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
```cpp title:{visitor.cpp} line-numbers:{enabled} added:{13}
[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitDeclRefExpr]]([[namespace-name,clang]]::[[class-name,DeclRefExpr]]* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...

    [[keyword,const]] [[namespace-name,clang]]::[[class-name,SourceLocation]]& location = node->[[function,getLocation]]();
    [[keyword,unsigned]] line = source_manager.[[function,getSpellingLineNumber]](location);
    [[keyword,unsigned]] column = source_manager.[[function,getSpellingColumnNumber]](location);

    [[keyword,if]] ([[namespace-name,clang]]::[[class-name,ValueDecl]]* decl = node->[[function,getDecl]]()) {
        // ...
    }

    [[function,visit_qualifiers]](decl->[[function,getDeclContext]](), node->[[function,getSourceRange]]());
    [[keyword,return]] [[keyword,true]];
}

```
Note that `visit_qualifiers()` is called unconditionally, as `VisitDeclRefExpr` handles more than just enum constants.
This way, other nodes (such as references to static class member variables) also get their qualifiers annotated.
```text added:{12}
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
```cpp title:{visitor.cpp} line-numbers:{enabled} added:{9}
[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitNamespaceAliasDecl]]([[namespace-name,clang]]::[[class-name,NamespaceAliasDecl]]* node) {
    // Annotate namespace alias
    // ...
    
    // Annotate aliased namespace(s)
    [[keyword,const]] [[namespace-name,clang]]::[[class-name,NamedDecl]]* aliased = node->[[function,getAliasedNamespace]]();
    // ...
    
    [[function,visit_qualifiers]](aliased->[[function,getDeclContext]](), node->[[function,getSourceRange]]());
    [[keyword,return]] [[keyword,true]];
}
```
Here, we annotate using the `DeclContext` of the namespace being aliased to properly capture the entire namespace chain.

For `using namespace` directives, we annotate any qualifiers on the nominated namespace:
```cpp title:{visitor.cpp} line-numbers:{enabled} added:{6}
[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitUsingDirectiveDecl]]([[namespace-name,clang]]::[[class-name,UsingDirectiveDecl]]* node) {
    // Annotate the namespace name itself
    [[keyword,const]] [[namespace-name,clang]]::[[class-name,NamespaceDecl]]* n = node->[[function,getNominatedNamespace]]();
    // ...
    
    [[function,visit_qualifiers]](n->[[function,getDeclContext]](), node->[[function,getSourceRange]]());
    [[keyword,return]] [[keyword,true]];
}
```

With both of these visitors updated, qualifiers in namespace directives are now properly handled:
```text added:{8,9}
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
```cpp line-numbers:{enabled} title:{visitor.cpp} added:{5}
[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitFunctionDecl]]([[namespace-name,clang]]::[[class-name,FunctionDecl]]* node) {
    // Annotate function name
    // ...
    
    [[function,visit_qualifiers]](node->[[function,getDeclContext]](), [[namespace-name,clang]]::[[function,SourceRange]](node->[[function,getBeginLoc]](), node->[[function,getTypeSpecEndLoc]]()));
    [[keyword,return]] [[keyword,true]];
}
```
Notice the source range:
```cpp
[[namespace-name,clang]]::[[class-name,SourceRange]](node->[[function,getBeginLoc]](), node->[[function,getTypeSpecEndLoc]]())
```
This range covers all tokens from the start of the declaration (including qualifiers like `Vector3::`) up to the function name (which we don't care about, since we've already annotated it before).
This ensures we annotate all relevant qualifiers consistently, even for constructors, destructors, and overloaded operators.
Using `getTypeSpecStartLoc()` as the start of the range is insufficient in those cases, as constructors and destructors lack a return type.

This approach also properly annotates definitions and forward declarations of namespace-qualified global functions, such as:
```text
namespace math {
    float dot(const Vector3& a, const Vector3& b);
}

float math::dot(const Vector3& a, const Vector3& b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}
```

For explicitly-qualified operator calls, such as `a.Vector3::operator+(b)`, we'll annotate qualifiers in `VisitCXXOperatorCallExpr`:
```cpp line-numbers:{enabled} title:{visitor.cpp} added:{5}
[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitCXXOperatorCallExpr]]([[namespace-name,clang]]::[[class-name,CXXOperatorCallExpr]]* node) {
    // Annotate operator name
    // ...

    [[function,visit_qualifiers]](node->[[function,getDirectCallee]]()->[[function,getDeclContext]](), [[namespace-name,clang]]::[[function,SourceRange]](node->[[function,getBeginLoc]](), node->[[function,getOperatorLoc]]()));
    [[keyword,return]] [[keyword,true]];
}
```
The range:
```cpp
[[namespace-name,clang]]::[[function,SourceRange]](node->[[function,getBeginLoc]](), node->[[function,getOperatorLoc]]())
```
ensures that only the relevant tokens before the operator symbol are parsed for qualifiers (e.g. `Vector3::operator`).

All other function calls, including qualified regular function calls, are handled by `VisitCallExpr`:
```cpp line-numbers:{enabled} title:{visitor.cpp} added:{5-7}
[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitCallExpr]]([[namespace-name,clang]]::[[class-name,CallExpr]]* node) {
    // Annotate UnresolvedLookupExpr, DependentScopeDeclRefExpr, CXXDependentScopeMemberExpr, and other calls
    // ...
    
    [[keyword,if]] ([[keyword,const]] [[namespace-name,clang]]::[[class-name,Decl]]* decl = node->[[function,getCalleeDecl]]()) {
        [[function,visit_qualifiers]](decl->[[function,getDeclContext]](), node->[[function,getSourceRange]]());
    }

    [[keyword,return]] [[keyword,true]];
}
```

With these visitors updated, qualifiers for function declarations and calls are properly annotated:
```text added:{16,18,20,22,23,26,34}
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
namespace math {
    struct Vector3 {
        static const Vector3 zero;
        
        float x;
        float y;
        float z;
    };
}

const math::Vector3 math::Vector3::zero = math::Vector3();
```

Static class member definitions are handled by the `VisitVarDecl` visitor:
```cpp line-numbers:{enabled} title:{visitor.cpp} added:{8-10}
[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitVarDecl]]([[namespace-name,clang]]::[[class-name,VarDecl]]* node) {
    // ...

    [[keyword,if]] (node->[[function,isStaticDataMember]]()) {
        // Annotate member variable
        // ...
        
        [[namespace-name,std]]::[[class-name,string]] type = node->[[function,getType]]().[[function,getUnqualifiedType]]().[[function,getAsString]]();
        [[namespace-name,clang]]::[[class-name,SourceLocation]] start = node->[[function,getTypeSpecStartLoc]]().[[function,getLocWithOffset]](type.[[function,length]]());
        [[function,visit_qualifiers]](node->[[function,getDeclContext]](), [[namespace-name,clang]]::[[class-name,SourceRange]](start, location));
    }

    [[keyword,return]] [[keyword,true]];
}
```
Unfortunately, there is no direct way to retrieve the source range of *just* the qualified member name.
The best candidate, `node->getTypeSpecStartLoc()`, points to the start of the type, not the member itself:
```text
const math::Vector3 math::Vector3::zero = math::Vector3();
      ^             ^       
      |             what we want
start of type spec
```
To annotate only the qualifiers on the member name, we'll offset the range by the length of the fully-qualified typename, obtained via `node->getType().getUnqualifiedType().getAsString()`.
The `getUnqualifiedType()` call ensures that qualifiers like `const`, `volatile`, or references / pointers are stripped away, leaving only the name of the type.

With this approach, we can annotate just the qualifiers on the member:
```text added:{11}
namespace math {
    struct Vector3 {
        static const Vector3 zero;
        
        float x;
        float y;
        float z;
    };
}

const math::Vector3 [[namespace-name,math]]::[[class-name,Vector3]]::zero = math::Vector3();
```
Annotations for references to the static member itself are already handled by the qualifier logic added to `VisitDeclRefExpr` earlier.

Similarly, we'll update the `VisitCXXTemporaryObjectExpr` visitor to annotate qualifiers for temporary object constructors themselves (such as the initialization of static class member `Vector3::zero` to `math::Vector3()`).
This is a simple addition to the visitor:
```cpp line-numbers:{enabled} title:{visitor.cpp} added:{8}
[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitCXXTemporaryObjectExpr]]([[namespace-name,clang]]::[[class-name,CXXTemporaryObjectExpr]]* node) {
    // ...
    
    [[keyword,if]] ([[namespace-name,clang]]::[[class-name,CXXConstructorDecl]]* constructor = node->[[function,getConstructor]]()) {
        // Annotate constructor call
        // ...
        
        [[function,visit_qualifiers]](constructor->[[function,getDeclContext]](), node->[[function,getSourceRange]]());
    }
    
    [[keyword,return]] [[keyword,true]];
}
```
This change ensures that annotations are consistent for any namespace or class qualifiers that appear before a temporary constructor call.
Now, **all** constructor calls (whether for temporary objects or otherwise) have uniform qualifier annotations.
```text added:{10}
namespace math {
    struct Vector3 {
        static const Vector3 zero;
        
        float x;
        float y;
        float z;
    };
}

const math::Vector3 math::Vector3::zero = [[namespace-name,math]]::Vector3();
```

Finally, we'll extend `VisitMemberExpr` to account for explicit qualifiers on class member variables, such as accessing a member from a base class:
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
We'll modify `VisitMemberExpr` to annotate the qualifier when present:
```cpp line-numbers:{enabled} titler:{visitor.cpp} added:{5-7}
[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitMemberExpr]]([[namespace-name,clang]]::[[class-name,MemberExpr]]* node) {
    // Annotate member variable
    // ...

    [[keyword,if]] (node->[[function,hasQualifier]]()) {
        [[function,visit_qualifiers]](member->[[function,getDeclContext]](), node->[[function,getSourceRange]]());
    }
    [[keyword,return]] [[keyword,true]];
}
```
The `hasQualifier()` check ensures we only process nodes that explicitly include a qualifier.
This avoids unnecessary work for standard member accesses without qualifiers.

With the visitor updated, qualifiers on member accesses are properly annotated:
```text added:{7}
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
With our current visitor setup, we can add qualifier annotations for these types with only a few small tweaks.
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

We can employ the use of the iterator functions from the `Tokenizer` to implement this incremental traversal logic in a new `visit_qualifiers` helper:
```cpp title:{visitor.cpp} line-numbers:{enabled}
[[keyword,void]] [[class-name,Visitor]]::[[function,visit_qualifiers]]([[keyword,const]] [[namespace-name,clang]]::[[class-name,DeclContext]]* context, [[namespace-name,clang]]::[[class-name,SourceLocation]] location, [[keyword,bool]] forward) {
    [[class-name,QualifierList]] qualifiers = [[function,extract_qualifiers]](context);
    [[keyword,auto]] start = [[member-variable,m_tokenizer]]->[[member-variable,at]](location);
    [[keyword,for]] ([[keyword,auto]] it [[binary-operator,=]] start; it [[binary-operator,!=]] [[member-variable,m_tokenizer]]->[[member-variable,begin]](); forward [[unary-operator,?]] [[unary-operator,++]]it [[unary-operator,:]] [[unary-operator,--]]it) {
        // First token is the type name itself
        [[keyword,if]] (it [[binary-operator,==]] start) {
            [[keyword,continue]];
        }
        
        [[keyword,const]] [[class-name,Token]]& token = [[function,*]]it;
        
        [[keyword,if]] (qualifiers.[[function,contains]](token.[[member-variable,spelling]])) {
            [[member-variable,m_annotator]]->[[function,insert_annotation]](qualifiers.[[function,get_annotation]](token.[[member-variable,spelling]]), token.[[member-variable,line]], token.[[member-variable,column]], token.[[member-variable,spelling]].[[function,length]]());
        }
        [[keyword,else]] [[keyword,if]] (token.[[member-variable,spelling]] [[binary-operator,!=]] "::") {
            [[keyword,break]];
        }
    }
}
```
While the current token is a known qualifier or a `::` separator, we know we are still annotating part of the qualified type.
As soon as this condition is no longer true, we know we've reached the end.

Annotating qualifiers on `TypeLoc` nodes is now trivial:
```cpp title:{visitor.cpp} line-numbers:{enabled} added:{7-9}
[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitTypeLoc]]([[namespace-name,clang]]::[[class-name,TypeLoc]] node) {
    [[keyword,const]] [[namespace,clang]]::[[class-name,DeclContext]]* context = [[keyword,nullptr]];
    [[namespace-namen,clang]]::[[class-name,SourceLocation]] location;
    
    // Annotate type name
    // ...
    
    [[keyword,if]] (context) {
        [[function,visit_qualifiers]](context, location, [[keyword,false]]);
    }
    
    [[keyword,return]] [[keyword,true]];
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
```cpp line-numbers:{enabled} title:{visitor.cpp} added:{7}
[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitConceptSpecializationExpr]]([[namespace-name,clang]]::[[class-name,ConceptSpecializationExpr]]* node) {
    [[namespace-name,clang]]::[[class-name,NamedDecl]]* decl = node->[[function,getFoundDecl]]();
    
    // Annotate concept name
    // ...
    
    [[function,visit_qualifiers]](decl->[[function,getDeclContext]](), node->[[function,getSourceRange]]());
    [[keyword,return]] [[keyword,true]];
}
```

The `VisitRequiresExpr` visitor is responsible for annotating trailing type constraints within requires expressions, such as:
```cpp
[[namespace-name,std]]::[[concept,same_as]]<[[keyword,decltype]]([[namespace-name,std]]::[[function,end]](container))>;
```
Similarly, we'll update this visitor to also annotate qualifiers in addition to the concept name:
```cpp line-numbers:{enabled} title:{visitor.cpp} added:{12-15}
[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitRequiresExpr]]([[namespace-name,clang]]::[[class-name,RequiresExpr]]* node) {
    [[keyword,for]] ([[keyword,const]] [[namespace-name,clang]]::[[namespace-name,concepts]]::[[class-name,Requirement]]* r : node->[[function,getRequirements]]()) {
        [[keyword,if]] ([[keyword,const]] [[namespace-name,clang]]::[[namespace-name,concepts]]::[[class-name,ExprRequirement]]* er = clang::dyn_cast<[[namespace-name,clang]]::[[namespace-name,concepts]]::[[class-name,ExprRequirement]]>(r)) {
            [[keyword,const]] [[namespace-name,clang]]::[[namespace-name,concepts]]::[[class-name,ExprRequirement]]::[[class-name,ReturnTypeRequirement]]& rtr = er->[[function,getReturnTypeRequirement]]();
            [[keyword,if]] (rtr.[[function,isTypeConstraint]]()) {
                [[keyword,const]] [[namespace-name,clang]]::[[class-name,TypeConstraint]]* constraint = rtr.[[function,getTypeConstraint]]();
                [[namespace-name,clang]]::[[class-name,SourceLocation]] location = constraint->[[function,getConceptNameLoc]]();
                
                // Annotate constraint name
                // ...
                
                [[keyword,if]] ([[keyword,const]] [[namespace-name,clang]]::[[class-name,Expr]]* expr = er->[[function,getExpr]]()) {
                    [[namespace-name,clang]]::[[class-name,DeclContext]]* context = constraint->[[function,getFoundDecl]]()->[[function,getDeclContext]]();
                    [[function,visit_qualifiers]](context, location, [[keyword,false]]);
                }
            }
        }
    }

    [[keyword,return]] [[keyword,true]];
}
```
This uses the `visit_qualifiers()` overload we implemented in the previous section.
Alternatively, a range-based approach works just as well:
```cpp
[[function,visit_qualifiers]](context, [[namespace-name,clang]]::[[function,SourceRange]](expr->[[function,getEndLoc]](), location));
```
This annotates tokens from the end of the requires expression to type name of the constraint:
```text
{ std::begin(container) } -> std::same_as<decltype(std::end(container))>;
                        ^         ^
                      start      end
```
The standard guarantees that only one type constraint may appear in a trailing requirement, so this approach is equally viable.

For constraints on template parameters, we'll update `VisitTemplateTypeParmDecl`:
```cpp line-numbers:{enabled} title:{visitor.cpp} added:{11,12}
[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitTemplateTypeParmDecl]]([[namespace-name,clang]]::[[class-name,TemplateTypeParmDecl]]* node) {
    // Annotate template parameter
    // ...
    
    [[keyword,if]] ([[keyword,const]] [[namespace-name,clang]]::[[class-name,TypeConstraint]]* constraint = node->[[function,getTypeConstraint]]()) {
        [[keyword,const]] [[namespace-name,clang]]::[[class-name,NamedDecl]]* decl = constraint->[[function,getNamedConcept]]();
        [[keyword,if]] (decl) {
            // Annotate concept name
            // ...
            
            [[namespace-name,clang]]::[[class-name,SourceLocation]] location = constraint->[[function,getConceptNameLoc]]();
            [[function,visit_qualifiers]](decl->[[function,getDeclContext]](), location, [[keyword,false]]);
        }
    }
    
    [[keyword,return]] [[keyword,true]];
}
```
Clang doesn't expose the full source range for the constraint, only allowing the location of the type name itself.
However, since type constraints on template parameters function structurally identical to types, we can employ the reverse-tokenization approach for this case as well.

With these visitors updated, qualifiers in concept contexts are now properly annotated:
```text added:{10,12,18,26}
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

In this post, we implemented a generic way to annotate keywords across a variety of different contexts.
Note that this was not intended to provide exhaustive handling for all AST nodes that may contain qualifiers.
Many of these cases were discovered incrementally while working through real-world examples, so it's likely that additional nodes or edge cases exist that aren't covered here.
Fortunately, the `visit_qualifiers()` functions are designed to be reusable and easy to integrate into new visitors as new and unhandled cases arise.

In the next post, we'll hook into the Clang preprocessor to annotate preprocessor directives such as file includes, macro definitions, and conditional compilation directives.
Thanks for reading!
