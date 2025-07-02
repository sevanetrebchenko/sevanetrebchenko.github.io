
The final piece of the annotation puzzle are language keywords.
While it's possible to detect keywords by adding specific AST visitors, like `VisitIfStmt` for `if` or `VisitWhileStmt` for `while` statements, this approach quickly becomes tedious due to the sheer number of keywords (and subsequently visitors) this would require to implement.
A simpler, more reliable approach is to classify keywords at the tokenization stage.

## Approach 1: Using the `Lexer`
When tokenizing the source file before AST traversal, we can check each token against a list of known C++ keywords and annotate any matches with the `keyword` tag:
```cpp
void Tokenizer::tokenize() {
    // ...    
    static const std::unordered_set<std::string> keywords = {
        "alignas",
        "alignof",
        "and",
        "and_eq",
        "asm",
        "auto",
        // ...
    };
    
    // Tokenize with raw lexer
    clang::Lexer lexer { ... };
    clang::Token token;
    while (true) {
        lexer.LexFromRawLexer(token);
        if (token.is(clang::tok::eof)) {
            break;
        }
        
        clang::SourceLocation location = token.getLocation();
        std::string spelling = clang::Lexer::getSpelling(token, source_manager, options);
        unsigned line = source_manager.getSpellingLineNumber(location);
        unsigned column = source_manager.getSpellingColumnNumber(location);
        bool is_keyword = keywords.contains(spelling);
        
        m_tokens.emplace_back(spelling, line, column, is_keyword);
    }
}
```
After processing the AST, all keyword tokens are annotated:
```cpp
for (auto it = m_tokenizer.begin(); it != m_tokenizer.end(); ++it) {
    const Token& token = *it;
    if (token.is_keyword) {
        m_annotator->insert_annotation("keyword", token.line, token.column, token.spelling.length());
    }
}
```
This method is simple, fast, and extensible: supporting new C++ standards would simply mean adding any missing keywords to this list.

## Approach 2: Using `libclang`

`libclang` is the official C interface to Clang.
Unlike Clang's C++ API, which is more powerful but volatile across versions, `libclang` offers a stable - though simplified - way to interact with the Clang AST.
While it doesn't expose all the richness of Clang's internals, it provides more than enough functionality for tasks like annotating language keywords.

### Initial setup

The setup process with `libclang` mirrors the process of setting up a `ASTFrontendAction`.
First, we create an index, which represents a set of translation units that could be compiled or linked together:
```cpp
CXIndex index = clang_createIndex(0, 0);
```
Next, we load the translation unit for the file we're processing using `clang_createTranslationUnitFromSourceFile`:
```cpp
std::vector<const char*> compilation_flags { ... };
CXTranslationUnit translation_unit = clang_createTranslationUnitFromSourceFile(
    index,
    filepath.c_str(),
    compilation_flags.size(),
    compilation_flags.data(),
    0,
    nullptr);
```
The `CXTranslationUnit` holds the parsed AST.
From here, we are ready to start traversing.

### Traversing the AST

The AST consists of a set of *cursors*, which represent elements in the source code.
Cursors are the `libclang` equivalent of AST nodes in the C++ API.

We start by retrieving the root cursor for the translation unit and recursively visiting its children:
```cpp
std::stack<CXCursor> cursors;
cursors.push(clang_getTranslationUnitCursor(translation_unit));

while (!cursors.empty()) {
    CXCursor cursor = cursors.top();
    cursors.pop();
    
    // Visitor logic goes here
    // ...

    // Visit children
    clang_visitChildren(cursor, [](CXCursor child, CXCursor /* parent */, CXClientData user_data) -> CXChildVisitResult {
        ((std::stack<CXCursor>*) user_data)->push(child);
        return CXChildVisit_Continue;
    }, &cursors);
}
```

The `libclang` API defines various `CXCursorKind` values for identifying different cursor types.
While this list isn’t as exhaustive as the C++ API, it's enough to get a high-level overview of the AST structure.

Before inserting any annotations, we filter for only those cursors that originate from the file we are annotating.
This is equivalent to `isInMainFile()` check from the C++ API:
```cpp
CXSourceLocation location = clang_getCursorLocation(cursor);

CXFile file;
clang_getSpellingLocation(location, &file, nullptr, nullptr, nullptr);

CXString filename = clang_getFileName(file);
const char* file = clang_getCString(filename);

if (strcmp(file, filepath) == 0) {
    // Cursor is part of "main" file
    // ...
}

// Cleanup
clang_disposeString(file);
```

### Annotating keywords

To annotate keywords, we tokenize the source range of each cursor and tag any token of kind `CXToken_Keyword` as a `keyword`:
```cpp
CXSourceRange extent = clang_getCursorExtent(cursor);
unsigned num_tokens;
CXToken* tokens;

clang_tokenize(translation_unit, extent, &tokens, &num_tokens);

for (unsigned i = 0; i < num_tokens; ++i) {
    const CXToken& token = tokens[i];
    CXTokenKind kind = clang_getTokenKind(tokens[i]);

    if (kind == CXToken_Keyword) {
        CXString spelling = clang_getTokenSpelling(translation_unit, token);
        
        CXSourceLocation location = clang_getTokenLocation(translation_unit, token);
        unsigned line, column;
        clang_getSpellingLocation(location, &file, &line, &column, nullptr);
        
        m_annotator->insert_annotation("keyword", line, column, std::strlen(clang_getCString(spelling)));
        
        clang_disposeString(spelling);
    }
}

clang_disposeTokens(translation_unit, tokens, num_tokens);
```

`clang_tokenize` returns all tokens within the cursor's extent.
We retrieve the location at which to annotate keywords using the `CXSourceLocation` of the token.

Note that, as with many C-style APIs, resources like strings and token buffers must be explicitly freed after use.

### Cleanup
Once we've finished annotating, the translation unit and index are also cleaned up.
```cpp
clang_disposeTranslationUnit(translation_unit);
clang_disposeIndex(index);
```

Fun fact: This project originally started using only `libclang`.
At the time, I wasn't aware of how limited its introspection capabilities were compared to Clang's full C++ API.
Once I started running into roadblocks with incomplete and missing AST information (by design), I migrated the project to the C++ API.
That said, `libclang` still works great for lightweight tasks due to its simplicity!

---

Below is the fully-annotated example from the first post in this series:
```text
[[preprocessor-directive,#]][[preprocessor-directive,include]] [[string,<]][[string,stdexcept]][[string,>]] // std::runtime_error, std::out_of_range
[[preprocessor-directive,#]][[preprocessor-directive,include]] [[string,<]][[string,vector]][[string,>]] // std::vector
[[preprocessor-directive,#]][[preprocessor-directive,include]] [[string,<]][[string,string]][[string,>]] // std::string, std::to_string
[[preprocessor-directive,#]][[preprocessor-directive,include]] [[string,<]][[string,ctime]][[string,>]] // std::tm, std::time_t, std::time, std::localtime
[[preprocessor-directive,#]][[preprocessor-directive,include]] [[string,<]][[string,sstream]][[string,>]] // std::stringstream
[[preprocessor-directive,#]][[preprocessor-directive,include]] [[string,<]][[string,iostream]][[string,>]] // std::cout
[[preprocessor-directive,#]][[preprocessor-directive,include]] [[string,<]][[string,cmath]][[string,>]] // std::sqrt
[[preprocessor-directive,#]][[preprocessor-directive,include]] [[string,<]][[string,concepts]][[string,>]] // std::input_or_output_iterator, std::sentinel_for,
                    // std::incrementable, std::same_as, std::convertible_to
[[preprocessor-directive,#]][[preprocessor-directive,include]] [[string,<]][[string,chrono]][[string,>]] // std::chrono::high_resolution_clock

[[preprocessor-directive,#]][[preprocessor-directive,define]] [[macro-name,ASSERT]]([[macro-argument,EXPRESSION]], [[macro-argument,MESSAGE]])        \
    [[keyword,if]] ([[unary-operator,!]]([[macro-argument,EXPRESSION]])) {                   \
        [[keyword,throw]] [[namespace-name,std]]::[[class-name,runtime_error]]([[macro-argument,MESSAGE]]); \
    }

[[keyword,namespace]] [[namespace-name,utility]] {
    
    [[keyword,template]] <[[keyword,typename]] ...[[class-name,Ts]]>
    [[nodiscard]] [[namespace-name,std]]::[[class-name,string]] [[function,concat]]([[keyword,const]] [[class-name,Ts]]&... args) {
        [[namespace-name,std]]::[[class-name,stringstream]] [[plain,ss]];
        (ss << ... << args);
        [[keyword,return]] ss.[[function,str]]();
    }
    
    [[keyword,template]] <[[keyword,typename]] [[class-name,T]]>
    [[keyword,concept]] [[concept,Container]] = [[keyword,requires]]([[class-name,T]] container) {
        // 1. container must have valid begin() / end()
        { std::[[function,begin]](container) } -> [[namespace-name,std]]::[[concept,input_or_output_iterator]];
        { std::[[function,end]](container) } -> [[namespace-name,std]]::[[concept,sentinel_for]]<[[keyword,decltype]](std::[[function,begin]](container))>;
    
        // 2. container iterator must support equality comparison and be incrementable
        { std::[[function,begin]](container) } -> [[namespace-name,std]]::[[concept,incrementable]];
    
        // 3. container iterator must be dereferenceable
        { [[unary-operator,*]]std::[[function,begin]](container) } -> [[namespace-name,std]]::[[concept,same_as]]<[[keyword,typename]] [[class-name,T]]::[[class-name,value_type]]&>;
        
        // Optional checks for other common container properties
        // { container.empty() } -> std::convertible_to<bool>;
        // { container.size() } -> std::convertible_to<std::size_t>;
        // { container.clear() };
    };
    
    [[keyword,template]] <[[concept,Container]] [[class-name,C]]>
    [[nodiscard]] [[namespace-name,std]]::[[class-name,string]] [[function,to_string]]([[keyword,const]] [[class-name,C]]& container) {
        [[namespace-name,std]]::[[class-name,stringstream]] [[plain,ss]];
        ss [[function-operator,<<]] "[ ";
        
        [[keyword,typename]] [[class-name,C]]::[[class-name,const_iterator]] end = std::[[function,end]](container);
        [[keyword,for]] ([[keyword,typename]] [[class-name,C]]::[[class-name,const_iterator]] iter = std::[[function,begin]](container); iter [[binary-operator,!=]] end; [[unary-operator,++]]iter) {
            ss [[binary-operator,<<]] [[unary-operator,*]]iter;
            [[keyword,if]] (iter [[binary-operator,+]] 1 [[binary-operator,!=]] end) {
                ss [[function-operator,<<]] ", ";
            }
        }
        
        ss [[function-operator,<<]] " ]";
        [[keyword,return]] ss.[[function,str]]();
    }
    
    [[keyword,enum]] [[keyword,class]] [[enum-name,Month]] : [[keyword,unsigned]] {
        [[enum-value,January]] = 1,
        [[enum-value,February]],
        [[enum-value,March]],
        [[enum-value,April]],
        [[enum-value,May]],
        [[enum-value,June]],
        [[enum-value,July]],
        [[enum-value,August]],
        [[enum-value,September]],
        [[enum-value,October]],
        [[enum-value,November]],
        [[enum-value,December]]
    };
    
    [[namespace-name,std]]::[[class-name,string]] [[function,to_string]]([[enum-name,Month]] month) {
        [[keyword,static]] [[keyword,const]] [[namespace-name,std]]::[[class-name,string]] names[12] = {
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        };
        
        // Month indices start with 1
        [[keyword,return]] names[[[keyword,static_cast]]<[[namespace-name,std]]::[[class-name,underlying_type]]<[[enum-name,Month]]>::[[class-name,type]]>(month) [[binary-operator,-]] 1];
    }
    
}

[[keyword,namespace]] [[namespace-name,math]] {

    [[keyword,struct]] [[class-name,Vector3]] {
        // Constants
        [[keyword,static]] [[keyword,const]] [[class-name,Vector3]] [[member-variable,zero]];
        [[keyword,static]] [[keyword,const]] [[class-name,Vector3]] [[member-variable,up]];
        [[keyword,static]] [[keyword,const]] [[class-name,Vector3]] [[member-variable,forward]];
    
        [[function,Vector3]]() : x(0.0f), y(0.0f), z(0.0f) {
        }
    
        [[function,Vector3]]([[keyword,float]] value) : x(value), y(value), z(value) {
        }
    
        [[function,Vector3]]([[keyword,float]] x, [[keyword,float]] y, [[keyword,float]] z) : x(x), y(y), z(z) {
        }
        
        [[function,~Vector3]]() = [[keyword,default]];
    
        [[class-name,Vector3]] [[keyword,operator]][[function-operator,+]]([[keyword,const]] [[class-name,Vector3]]& other) [[keyword,const]] {
            [[keyword,return]] { [[member-variable,x]] [[binary-operator,+]] other.[[member-variable,x]], [[member-variable,y]] [[binary-operator,+]] other.[[member-variable,y]], [[member-variable,z]] [[binary-operator,+]] other.[[member-variable,z]] };
        }
    
        [[class-name,Vector3]] [[keyword,operator]][[function-operator,-]]([[keyword,const]] [[class-name,Vector3]]& other) [[keyword,const]] {
            [[keyword,return]] { [[member-variable,x]] [[binary-operator,-]] other.[[member-variable,x]], [[member-variable,y]] [[binary-operator,-]] other.[[member-variable,y]], [[member-variable,z]] [[binary-operator,-]] other.[[member-variable,z]] };
        }
    
        [[class-name,Vector3]] [[keyword,operator]][[function-operator,*]]([[keyword,float]] s) [[keyword,const]] {
            [[keyword,return]] { [[member-variable,x]] [[binary-operator,*]] s, [[member-variable,y]] [[binary-operator,*]] s, [[member-variable,z]] [[binary-operator,*]] s };
        }
    
        [[class-name,Vector3]] [[keyword,operator]][[function-operator,/]]([[keyword,float]] s) [[keyword,const]] {
            [[keyword,return]] { [[member-variable,x]] [[binary-operator,/]] s, [[member-variable,y]] [[binary-operator,/]] s, [[member-variable,z]] [[binary-operator,/]] s };
        }
    
        [[keyword,float]] [[keyword,operator]][[function-operator,[]]]([[namespace-name,std]]::[[class-name,size_t]] index) [[keyword,const]] {
            // Temporarily cast away the const qualifier to avoid duplicating logic
            // Safe as non-const Vector3::operator[] does not modify the value
            [[keyword,return]] [[keyword,const_cast]]<[[class-name,Vector3]]*>([[keyword,this]])->[[keyword,operator]][[operator,[]]](index);
        }
        
        [[keyword,float]]& [[keyword,operator]][[function-operator,[]]]([[namespace-name,std]]::[[class-name,size_t]] index) {
            [[keyword,if]] (index [[binary-operator,==]] 0) {
                [[keyword,return]] [[member-variable,x]];
            }
            [[keyword,else]] [[keyword,if]] (index [[binary-operator,==]] 1) {
                [[keyword,return]] [[member-variable,y]];
            }
            [[keyword,else]] [[keyword,if]] (index [[binary-operator,==]] 2) {
                [[keyword,return]] [[member-variable,z]];
            }
            [[keyword,else]] {
                [[keyword,throw]] [[namespace-name,std]]::[[class-name,out_of_range]]("index provided to Vector3::operator[] is out of bounds");
            }
        }
    
        // Returns the magnitude of the vector
        [[keyword,float]] [[function,length]]() [[keyword,const]] {
            [[keyword,return]] [[namespace-name,std]]::[[function,sqrt]]([[member-variable,x]] [[binary-operator,*]] [[member-variable,x]] [[binary-operator,+]] [[member-variable,y]] [[binary-operator,*]] [[member-variable,y]] [[binary-operator,+]] [[member-variable,z]] [[binary-operator,*]] [[member-variable,z]]);
        }
        
        [[keyword,union]] {
            // For access as coordinates
            [[keyword,struct]] {
                [[keyword,float]] [[member-variable,x]];
                [[keyword,float]] [[member-variable,y]];
                [[keyword,float]] [[member-variable,z]];
            };
            
            // For access as color components
            [[keyword,struct]] {
                [[keyword,float]] [[member-variable,r]];
                [[keyword,float]] [[member-variable,g]];
                [[keyword,float]] [[member-variable,b]];
            };
        };
    };

    // Const class static members must be initialized out of line
    [[keyword,const]] [[class-name,Vector3]] [[class-name,Vector3]]::[[member-variable,zero]] = [[function,Vector3]]();
    
    // Depends on your coordinate system
    [[keyword,const]] [[class-name,Vector3]] [[class-name,Vector3]]::[[member-variable,up]] = [[function,Vector3]](0.0f, 1.0f, 0.0f);
    [[keyword,const]] [[class-name,Vector3]] [[class-name,Vector3]]::[[member-variable,forward]] = [[function,Vector3]](0.0f, 0.0f, [[unary-operator,-]]1.0f);
    
    
    // Stream insertion operator
    [[namespace-name,std]]::[[class-name,ostream]]& [[keyword,operator]][[function-operator,<<]]([[namespace-name,std]]::[[class-name,ostream]]& os, [[keyword,const]] [[class-name,Vector3]]& vec) {
        os [[function-operator,<<]] "(" [[function-operator,<<]] vec.[[member-variable,x]] [[function-operator,<<]] ", " [[function-operator,<<]] vec.[[member-variable,y]] [[function-operator,<<]] ", " [[function-operator,<<]] vec.[[member-variable,z]] [[function-operator,<<]] ")";
        [[keyword,return]] os;
    }

    // Dot product
    [[keyword,float]] [[function,dot]]([[class-name,Vector3]] a, [[class-name,Vector3]] b) {
        [[keyword,return]] a.[[member-variable,x]] [[binary-operator,*]] b.[[member-variable,x]] [[binary-operator,+]] a.[[member-variable,y]] [[binary-operator,*]] b.[[member-variable,y]] [[binary-operator,+]] a.[[member-variable,z]] [[binary-operator,*]] b.[[member-variable,z]];
    }
    
    // Cross product
    [[class-name,Vector3]] [[function,cross]]([[class-name,Vector3]] a, [[class-name,Vector3]] b) {
        [[keyword,return]] {
            a.[[member-variable,y]] [[binary-operator,*]] b.[[member-variable,z]] [[binary-operator,-]] a.[[member-variable,z]] [[binary-operator,*]] b.[[member-variable,y]],
            a.[[member-variable,z]] [[binary-operator,*]] b.[[member-variable,x]] [[binary-operator,-]] a.[[member-variable,x]] [[binary-operator,*]] b.[[member-variable,z]],
            a.[[member-variable,x]] [[binary-operator,*]] b.[[member-variable,y]] [[binary-operator,-]] a.[[member-variable,y]] [[binary-operator,*]] b.[[member-variable,x]]
        };
    }
    
    // Returns a unit vector oriented in the same direction as 'v'
    [[class-name,Vector3]] [[function,normalize]]([[keyword,const]] [[class-name,Vector3]]& v) {
        [[keyword,float]] length = v.[[function,length]]();
        [[macro-name,ASSERT]](length [[binary-operator,>]] 0.0f, "Vector3::normalize() called on vector of zero length");
        [[keyword,return]] v [[function-operator,/]] length;
    }

}

[[keyword,int]] [[function,main]]() {
    [[namespace-name,std]]::[[class-name,string]] [[plain,str]];


    // Prints "Hello, world!"
    str [[function-operator,=]] [[namespace-name,utility]]::[[function,concat]]("Hello", ",", " ", "world", "!");
    [[namespace-name,std]]::[[class-name,cout]] [[function-operator,<<]] str [[function-operator,<<]] '\n';


    // Prints "[ 0, 1, 2, 3, 4, 5 ]"
    [[namespace-name,std]]::[[class-name,vector]]<[[keyword,int]]> vec = { 0, 1, 2, 3, 4, 5 };
    str [[function-operator,=]] [[namespace-name,utility]]::[[function,to_string]](vec);
    [[namespace-name,std]]::[[class-name,cout]] [[function-operator,<<]] str [[function-operator,<<]] '\n';


    [[keyword,using]] [[keyword,namespace]] [[namespace-name,std]]::[[namespace-name,chrono]];
    [[class-name,time_point]] now = [[class-name,system_clock]]::[[function,now]]();
    
    [[class-name,time_t]] time = [[class-name,system_clock]]::[[function,to_time_t]](now);
    [[class-name,tm]] local = [[unary-operator,*]][[function,localtime]]([[unary-operator,&]]time);

    // Extract date
    [[keyword,int]] year = 1900 [[binary-operator,+]] local.[[member-variable,tm_year]];
    [[namespace-name,utility]]::[[enum-name,Month]] month = [[keyword,static_cast]]<[[namespace-name,utility]]::[[enum-name,Month]]>(1 [[binary-operator,+]] local.[[member-variable,tm_mon]]);
    [[keyword,int]] day = local.[[member-variable,tm_mday]];
    
    [[namespace-name,std]]::[[class-name,string]] [[plain,suffix]];
    [[keyword,switch]] (day) {
        [[keyword,case]] 1:
        [[keyword,case]] 21:
        [[keyword,case]] 31:
            suffix [[function-operator,=]] "st";
            [[keyword,break]];
        [[keyword,case]] 2:
        [[keyword,case]] 22:
            suffix [[function-operator,=]] "nd";
            [[keyword,break]];
        [[keyword,case]] 3:
        [[keyword,case]] 23:
            suffix [[function-operator,=]] "rd";
            [[keyword,break]];
        [[keyword,default]]:
            suffix [[function-operator,=]] "th";
            [[keyword,break]];
    }

    // Print date
    str [[function-operator,=]] [[namespace-name,utility]]::[[function,concat]]("Today is ", [[namespace-name,utility]]::[[function,to_string]](month), " ", day, suffix, ", ", year);
    [[namespace-name,std]]::[[class-name,cout]] [[function-operator,<<]] str [[function-operator,<<]] '\n';

    [[class-name,duration]] current_time = now.[[function,time_since_epoch]]();
    [[class-name,hours]] h = [[function,duration_cast]]<[[class-name,hours]]>(current_time) [[function-operator,%]] 24[[number,h]];
    [[class-name,minutes]] m = [[function,duration_cast]]<[[class-name,minutes]]>(current_time) [[function-operator,%]] 60[[number,min]];
    [[class-name,seconds]] s = [[function,duration_cast]]<[[class-name,seconds]]>(current_time) [[function-operator,%]] 60[[number,s]];

    [[keyword,int]] hour = h.[[function,count]]();
    suffix [[function-operator,=]] hour [[binary-operator,>=]] 12 ? "PM" : "AM";
    [[keyword,if]] (hour [[binary-operator,==]] 0) {
        // 12:00AM
        hour [[binary-operator,=]] 12;
    }
    [[keyword,else]] [[keyword,if]] (hour [[binary-operator,>]] 12) {
        hour [[binary-operator,-=]] 12;
    }
    
    [[namespace-name,std]]::[[class-name,cout]] [[function-operator,<<]] "The current time is: " [[function-operator,<<]] hour [[function-operator,<<]] ':'
              [[function-operator,<<]] [[namespace-name,std]]::[[function,setw]](2) [[function-operator,<<]] [[namespace-name,std]]::[[function,setfill]]('0') [[function-operator,<<]] m.[[function,count]]() [[function-operator,<<]] ':'
              [[function-operator,<<]] [[namespace-name,std]]::[[function,setw]](2) [[function-operator,<<]] [[namespace-name,std]]::[[function,setfill]]('0') [[function-operator,<<]] s.[[function,count]]()
              [[function-operator,<<]] ' ' [[function-operator,<<]] suffix [[function-operator,<<]] '\n';
    
    
    // Determine the orthonormal basis for the given forward vector (assuming (0, 1, 0) is up)
    [[namespace-name,math]]::[[class-name,Vector3]] up = [[namespace-name,math]]::[[class-name,Vector3]]::[[member-variable,up]];
    [[namespace-name,math]]::[[class-name,Vector3]] forward = [[namespace-name,math]]::[[function,normalize]]([[namespace-name,math]]::[[function,Vector3]](0.75f, 0.12f, 3.49f)); // Arbitrary
    [[namespace-name,math]]::[[class-name,Vector3]] right = [[namespace-name,math]]::[[function,cross]](forward, up);
    
    str [[function-operator,=]] [[namespace-name,utility]]::[[function,concat]]("The cross product of vectors ", up, " and ", forward, " is ", right);
    [[namespace-name,std]]::[[class-name,cout]] [[function-operator,<<]] str [[function-operator,<<]] '\n';
    
    
    [[keyword,using]] [[class-name,Color]] = [[namespace-name,math]]::[[class-name,Vector3]];
    [[class-name,Color]] [[plain,color]](253, 164, 15);

    str [[function-operator,=]] [[namespace-name,utility]]::[[function,concat]]("My favorite color is: ", color);
    [[namespace-name,std]]::[[class-name,cout]] [[function-operator,<<]] str [[function-operator,<<]] '\n';
    
    
    [[keyword,return]] 0;
}
```
