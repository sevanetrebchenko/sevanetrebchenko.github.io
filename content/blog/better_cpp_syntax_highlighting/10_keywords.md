
The final piece of the annotation puzzle are language keywords.
While it's possible to detect keywords by adding specific AST visitors, like `VisitIfStmt` for `if` or `VisitWhileStmt` for `while` statements, this approach quickly becomes tedious due to the sheer number of keywords (and subsequently visitors) this would require to implement.
A simpler, more reliable approach is to classify keywords at the tokenization stage.

## Approach 1: Using the `Lexer`
When tokenizing the source file before AST traversal, we can check each token against a list of known C++ keywords and annotate any matches with the `keyword` tag:
```cpp title:{tokenizer.cpp} line-numbers:{enabled}
[[keyword,void]] [[class-name,Tokenizer]]::[[function,tokenize]]() {
    // ...    
    [[keyword,static]] [[keyword,const]] [[namespace-name,std]]::[[class-name,unordered_set]]<[[namespace-name,std]]::[[class-name,string]]> keywords = {
        "alignas",
        "alignof",
        "and",
        "and_eq",
        "asm",
        "auto",
        // ...
    };
    
    // Tokenize with raw lexer
    [[namespace-name,clang]]::[[class-name,Lexer]] lexer { ... };
    [[namespace-name,clang]]::[[class-name,Token]] [[plain,token]];
    [[keyword,while]] ([[keyword,true]]) {
        lexer.[[function,LexFromRawLexer]](token);
        [[keyword,if]] (token.[[function,is]]([[namespace-name,clang]]::[[namespace-name,tok]]::[[enum-value,eof]])) {
            [[keyword,break]];
        }
        
        [[namespace-name,clang]]::[[class-name,SourceLocation]] location = token.[[function,getLocation]]();
        [[namespace-name,std]]::[[class-name,string]] spelling = [[namespace-name,clang]]::[[class-name,Lexer]]::[[function,getSpelling]](token, source_manager, options);
        [[keyword,unsigned]] line = source_manager.[[function,getSpellingLineNumber]](location);
        [[keyword,unsigned]] column = source_manager.[[function,getSpellingColumnNumber]](location);
        [[keyword,bool]] is_keyword = keywords.[[function,contains]](spelling);
        
        [[member-variable,m_tokens]].[[function,emplace_back]](spelling, line, column, is_keyword);
    }
}
```
`LexFromRawLexer()` keeps tokens in preprocessor directives unmodified.
After processing the AST, all tokens identified as keywords are annotated with the `keyword` tag:
```cpp line-numbers:{enabled} title:{consumer.cpp}
[[keyword,void]] [[class-name,Consumer]]::[[function,visit_keywords]]() {
    [[keyword,for]] ([[keyword,auto]] it [[binary-operator,=]] [[member-variable,m_tokenizer]]->[[function,begin]](); it [[binary-operator,!=]] [[member-variable,m_tokenizer]]->[[function,end]](); [[function-operator,++]]it) {
        [[keyword,const]] [[class-name,Token]]& token = [[function-operator,*]]it;
        [[keyword,if]] (token.[[member-variable,is_keyword]]) {
            [[member-variable,m_annotator]]->[[function,insert_annotation]]("keyword", token.[[member-variable,line]], token.[[member-variable,column]], token.[[member-variable,spelling]].[[function,length]]());
        }
    }
}
```
The `visit_keywords()` function is called at the end of `HandleTranslationUnit()`.
This method is simple, fast, and extensible: supporting C++ keywords from new standards would simply mean adding any missing keywords to this list.

## Approach 2: Using `libclang`

`libclang` is the official C interface to Clang.
Unlike Clang's C++ API, which is more powerful but volatile across versions, `libclang` offers a stable - though simplified - way to interact with the Clang AST.
While it doesn't expose all the richness of Clang's internals, it provides more than enough functionality for tasks like annotating language keywords.

### Initial setup

The setup process with `libclang` mirrors the process of setting up a `ASTFrontendAction`.
First, we create an index, which represents a set of translation units that could be compiled or linked together:
```cpp
[[class-name,CXIndex]] index = [[function,clang_createIndex]](0, 0);
```
Next, we load the translation unit for the file we're processing using `clang_createTranslationUnitFromSourceFile()`:
```cpp
[[namespace-name,std]]::[[class-name,vector]]<[[keyword,const]] [[keyword,char]]*> compilation_flags { ... };
[[class-name,CXTranslationUnit]] translation_unit = [[function,clang_createTranslationUnitFromSourceFile]](
    index,
    filepath.[[function,c_str]](),
    compilation_flags.[[function,size]](),
    compilation_flags.[[function,data]](),
    0,
    [[keyword,nullptr]]);
```
The `CXTranslationUnit` holds the parsed AST.
From here, we are ready to start traversing.

### Traversing the AST

The AST consists of a set of *cursors*, which represent elements in the source code.
Cursors are the `libclang` equivalent of AST nodes in the C++ API.

We start by retrieving the root cursor for the translation unit and recursively visiting its children:
```cpp
[[namespace-name,std]]::[[class-name,stack]]<[[class-name,CXCursor]]> cursors;
cursors.[[function,push]]([[function,clang_getTranslationUnitCursor]](translation_unit));

[[keyword,while]] ([[unary-operator,!]]cursors.[[function,empty]]()) {
    [[class-name,CXCursor]] cursor = cursors.[[function,top]]();
    cursors.[[function,pop]]();
    
    // Visitor logic goes here
    // ...

    // Visit children
    [[function,clang_visitChildren]](cursor, []([[class-name,CXCursor]] child, [[class-name,CXCursor]] /* parent */, [[class-name,CXClientData]] user_data) -> [[enum-name,CXChildVisitResult]] {
        (([[namespace-name,std]]::[[class-name,stack]]<[[class-name,CXCursor]]>*) user_data)->[[function,push]](child);
        [[keyword,return]] [[enum-value,CXChildVisit_Continue]];
    }, &cursors);
}
```

The `libclang` API defines various `CXCursorKind` values for identifying different cursor types.
While this list isn’t as exhaustive as the C++ API, it's enough to get a high-level overview of the AST structure.

Before inserting any annotations, we filter for only those cursors that originate from the file we are annotating.
This is equivalent to `isInMainFile()` check from the C++ API:
```cpp
[[class-name,CXSourceLocation]] location = [[function,clang_getCursorLocation]](cursor);

[[class-name,CXFile]] file;
[[function,clang_getSpellingLocation]](location, &file, nullptr, [[keyword,nullptr]], [[keyword,nullptr]]);

[[class-name,CXString]] filename = [[function,clang_getFileName]](file);
[[keyword,const]] [[keyword,char]]* file = [[function,clang_getCString]](filename);

[[keyword,if]] ([[function,strcmp]](file, filepath) [[binary-operator,==]] 0) {
    // Cursor is part of "main" file
    // ...
}

// Cleanup
[[function,clang_disposeString]](file);
```

### Annotating keywords

To annotate keywords, we tokenize the source range of each cursor and tag any token of kind `CXToken_Keyword` as a `keyword`:
```cpp
[[class-name,CXSourceRange]] extent = [[function,clang_getCursorExtent]](cursor);
[[keyword,unsigned]] num_tokens;
[[class-name,CXToken]]* tokens;

[[function,clang_tokenize]](translation_unit, extent, &tokens, &num_tokens);

[[keyword,for]] ([[keyword,unsigned]] i [[binary-operator,=]] 0; i [[binary-operator,<]] num_tokens; [[unary-operator,++]]i) {
    [[keyword,const]] [[class-name,CXToken]]& token = tokens[[operator,[]]i[[operator,]]];
    [[class-name,CXTokenKind]] kind = [[function,clang_getTokenKind]](token);

    [[keyword,if]] (kind [[binary-operator,==]] [[enum-value,CXToken_Keyword]]) {
        [[class-name,CXString]] spelling = [[function,clang_getTokenSpelling]](translation_unit, token);
        
        [[class-name,CXSourceLocation]] location = [[function,clang_getTokenLocation]](translation_unit, token);
        [[keyword,unsigned]] line, column;
        [[function,clang_getSpellingLocation]](location, &file, &line, &column, [[keyword,nullptr]]);
        
        [[member-variable,m_annotator]]->[[function,insert_annotation]]("keyword", line, column, [[function,strlen]]([[function,clang_getCString]](spelling)));
        
        [[function,clang_disposeString]](spelling);
    }
}

[[function,clang_disposeTokens]](translation_unit, tokens, num_tokens);
```

`clang_tokenize()` returns all tokens within the cursor's extent.
We retrieve the location at which to annotate keywords using the `CXSourceLocation` of the token.

Note that, as with many C-style APIs, resources like strings and token buffers must be explicitly freed after use.

### Cleanup
Once we've finished annotating, the translation unit and index are also cleaned up.
```cpp
[[function,clang_disposeTranslationUnit]](translation_unit);
[[function,clang_disposeIndex]](index);
```

## Styling

This section would not be complete without the definitions for the `keyword` CSS style:
```css
.language-cpp .keyword {
    color: rgb(206, 136, 70);
}
```

---

Fun fact: This project originally started using `libclang`.
At the time, I wasn’t fully aware of how limited its introspection capabilities were compared to Clang’s full C++ API.
Once I began running into roadblocks - missing AST nodes, incomplete type information, and limited traversal flexibility - I decided to migrate the project to the C++ API.
That said, `libclang` still has its place.
For lightweight tooling tasks, it's hard to beat in terms of simplicity and ease of use.

Of course, switching to the C++ API came with a much steeper learning curve.
Setting up the project and understanding how the API exposes information took time, but once things clicked, it became fun to experiment and see what worked.
One of the biggest challenges early on was figuring out how to access the specific symbols I wanted to annotate.
That led to the creation of core helper utilities like the `Tokenizer`, which helped bridge the gaps in the raw AST traversal and introduced common annotation patterns that we used across the majority of visitors.
The amount of information Clang exposes is really exciting, and I constantly found myself coming up with ideas for mini tools I could integrate into my other projects.
Even now, this project only scratches the surface of what Clang’s AST offers, which speaks volumes about the depth and richness of the tooling available.
I encourage you to try messing around with the API yourself!
There's something in there for everyone.

After a long journey, it's finally time to bring everything together!
Below is the fully annotated version of the example from the very first post in this series:
```cpp show-lines:{30}
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
        { [[namespace-name,std]]::[[function,begin]](container) } -> [[namespace-name,std]]::[[concept,input_or_output_iterator]];
        { [[namespace-name,std]]::[[function,end]](container) } -> [[namespace-name,std]]::[[concept,sentinel_for]]<[[keyword,decltype]]([[namespace-name,std]]::[[function,begin]](container))>;
    
        // 2. container iterator must support equality comparison and be incrementable
        { [[namespace-name,std]]::[[function,begin]](container) } -> [[namespace-name,std]]::[[concept,incrementable]];
    
        // 3. container iterator must be dereferenceable
        { [[unary-operator,*]][[namespace-name,std]]::[[function,begin]](container) } -> [[namespace-name,std]]::[[concept,same_as]]<[[class-name,typename T]]::value_type&>;
        
        // Optional checks for other common container properties
        // { container.empty() } -> std::convertible_to<bool>;
        // { container.size() } -> std::convertible_to<std::size_t>;
        // { container.clear() };
    };
    
    [[keyword,template]] <[[concept,Container]] [[class-name,C]]>
    [[nodiscard]] [[namespace-name,std]]::[[class-name,string]] [[function,to_string]]([[keyword,const]] [[class-name,C]]& container) {
        [[namespace-name,std]]::[[class-name,stringstream]] [[plain,ss]];
        ss [[function-operator,<<]] "[ ";
        
        [[keyword,typename]] [[class-name,C]]::[[class-name,const_iterator]] end = [[namespace-name,std]]::[[function,end]](container);
        [[keyword,for]] ([[keyword,typename]] [[class-name,C]]::[[class-name,const_iterator]] iter = [[namespace-name,std]]::[[function,begin]](container); iter [[binary-operator,!=]] end; [[unary-operator,++]]iter) {
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
        [[keyword,return]] names[[operator,[]][[keyword,static_cast]]<[[namespace-name,std]]::[[class-name,underlying_type]]<[[enum-name,Month]]>::[[class-name,type]]>(month) [[binary-operator,-]] 1[[operator,]]];
    }
    
}

[[keyword,namespace]] [[namespace-name,math]] {

    [[keyword,struct]] [[class-name,Vector3]] {
        // Constants
        [[keyword,static]] [[keyword,const]] [[class-name,Vector3]] [[member-variable,zero]];
        [[keyword,static]] [[keyword,const]] [[class-name,Vector3]] [[member-variable,up]];
        [[keyword,static]] [[keyword,const]] [[class-name,Vector3]] [[member-variable,forward]];
    
        [[function,Vector3]]() : [[member-variable,x]](0.0f), [[member-variable,y]](0.0f), [[member-variable,z]](0.0f) {
        }
    
        [[function,Vector3]]([[keyword,float]] value) : [[member-variable,x]](value), [[member-variable,y]](value), [[member-variable,z]](value) {
        }
    
        [[function,Vector3]]([[keyword,float]] x, [[keyword,float]] y, [[keyword,float]] z) : [[member-variable,x]](x), [[member-variable,y]](y), [[member-variable,z]](z) {
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
            [[keyword,return]] [[keyword,const_cast]]<[[class-name,Vector3]]*>([[keyword,this]])->[[member-variable,operator[]]](index);
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
    suffix [[function-operator,=]] hour [[binary-operator,>=]] 12 [[binary-operator,?]] "PM" [[binary-operator,:]] "AM";
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

There's also something satisfying about seeing the raw annotated code.
It's a great way to appreciate how all the visitors work together behind the scenes:
```text show-lines:{30}
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
        { [[namespace-name,std]]::[[function,begin]](container) } -> [[namespace-name,std]]::[[concept,input_or_output_iterator]];
        { [[namespace-name,std]]::[[function,end]](container) } -> [[namespace-name,std]]::[[concept,sentinel_for]]<[[keyword,decltype]]([[namespace-name,std]]::[[function,begin]](container))>;
    
        // 2. container iterator must support equality comparison and be incrementable
        { [[namespace-name,std]]::[[function,begin]](container) } -> [[namespace-name,std]]::[[concept,incrementable]];
    
        // 3. container iterator must be dereferenceable
        { [[unary-operator,*]][[namespace-name,std]]::[[function,begin]](container) } -> [[namespace-name,std]]::[[concept,same_as]]<[[class-name,typename T]]::value_type&>;
        
        // Optional checks for other common container properties
        // { container.empty() } -> std::convertible_to<bool>;
        // { container.size() } -> std::convertible_to<std::size_t>;
        // { container.clear() };
    };
    
    [[keyword,template]] <[[concept,Container]] [[class-name,C]]>
    [[nodiscard]] [[namespace-name,std]]::[[class-name,string]] [[function,to_string]]([[keyword,const]] [[class-name,C]]& container) {
        [[namespace-name,std]]::[[class-name,stringstream]] [[plain,ss]];
        ss [[function-operator,<<]] "[ ";
        
        [[keyword,typename]] [[class-name,C]]::[[class-name,const_iterator]] end = [[namespace-name,std]]::[[function,end]](container);
        [[keyword,for]] ([[keyword,typename]] [[class-name,C]]::[[class-name,const_iterator]] iter = [[namespace-name,std]]::[[function,begin]](container); iter [[binary-operator,!=]] end; [[unary-operator,++]]iter) {
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
        [[keyword,return]] names[[operator,[]][[keyword,static_cast]]<[[namespace-name,std]]::[[class-name,underlying_type]]<[[enum-name,Month]]>::[[class-name,type]]>(month) [[binary-operator,-]] 1[[operator,]]];
    }
    
}

[[keyword,namespace]] [[namespace-name,math]] {

    [[keyword,struct]] [[class-name,Vector3]] {
        // Constants
        [[keyword,static]] [[keyword,const]] [[class-name,Vector3]] [[member-variable,zero]];
        [[keyword,static]] [[keyword,const]] [[class-name,Vector3]] [[member-variable,up]];
        [[keyword,static]] [[keyword,const]] [[class-name,Vector3]] [[member-variable,forward]];
    
        [[function,Vector3]]() : [[member-variable,x]](0.0f), [[member-variable,y]](0.0f), [[member-variable,z]](0.0f) {
        }
    
        [[function,Vector3]]([[keyword,float]] value) : [[member-variable,x]](value), [[member-variable,y]](value), [[member-variable,z]](value) {
        }
    
        [[function,Vector3]]([[keyword,float]] x, [[keyword,float]] y, [[keyword,float]] z) : [[member-variable,x]](x), [[member-variable,y]](y), [[member-variable,z]](z) {
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
            [[keyword,return]] [[keyword,const_cast]]<[[class-name,Vector3]]*>([[keyword,this]])->[[member-variable,operator[]]](index);
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
    suffix [[function-operator,=]] hour [[binary-operator,>=]] 12 [[binary-operator,?]] "PM" [[binary-operator,:]] "AM";
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

That's all for this project!
As mentioned in one of the earlier posts, this project remains an eternal work in progress.
I tried to cover visitors for as many different language features as I could find, but I'm sure I missed some.
If any additions fit nicely, I'll update the posts accordingly.
If not, the full project source is available [here](https://github.com/sevanetrebchenko/syntax-highlighter) for you to explore and extend.

It’s also entirely possible (read: likely) that future Clang releases will render some of these approaches obsolete or overly complicated.
Or they'll break entirely.

Maybe the real visitors were the friends we made along the way.
Until next time!
