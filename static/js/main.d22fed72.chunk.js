(this.webpackJsonpwebsite=this.webpackJsonpwebsite||[]).push([[0],{101:function(e,t,n){},124:function(e,t,n){},125:function(e,t,n){},126:function(e,t,n){},127:function(e,t,n){},128:function(e,t,n){},129:function(e,t,n){},130:function(e,t,n){"use strict";n.r(t);var c=n(3),r=n.n(c),a=n(76),s=n.n(a),i=(n(92),n(18)),o=n(48),l=n(35),j=n(39),u=n(65),b=n.n(u),h=(n(94),n(83)),d=n(8),m=n(28),p=(n(95),n(2));function f(){var e=Object(d.g)(),t=Object(c.useState)(!1),n=Object(m.a)(t,2),a=n[0],s=n[1],i=Object(c.useRef)(),o=Object(c.useRef)();Object(c.useEffect)((function(){return document.addEventListener("mousedown",l),function(){document.removeEventListener("mousedown",l)}}),[]);var l=function(e){o.current.contains(e.target)||i.current.contains(e.target)||s(!1)};return Object(p.jsxs)(r.a.Fragment,{children:[Object(p.jsxs)("div",{className:"header",children:[Object(p.jsx)("p",{className:"name",onClick:function(t){t.preventDefault(),e.push("/projects")},children:"Seva Netrebchenko"}),Object(p.jsx)("button",{className:"button",children:Object(p.jsx)("i",{className:a?"fas fa-times icon expanded":"fas fa-bars icon collapsed",ref:i,onClick:function(){return s(!a)}})}),Object(p.jsx)("div",{className:"header navbar-desktop",children:Object(p.jsx)(O,{})})]}),Object(p.jsx)("div",{className:"header navbar-mobile",ref:o,children:a?Object(p.jsx)(O,{}):Object(p.jsx)(p.Fragment,{})}),a?Object(p.jsx)("div",{className:"separator"}):Object(p.jsx)(p.Fragment,{})]})}function O(){var e=Object(d.g)();return Object(p.jsxs)(r.a.Fragment,{children:[Object(p.jsx)("p",{className:"navbar-element",onClick:function(t){t.preventDefault(),e.push("/projects")},children:"Projects"}),Object(p.jsx)("p",{className:"navbar-element",onClick:function(t){t.preventDefault(),e.push("/blog")},children:"Blog"}),Object(p.jsx)("p",{className:"navbar-element",onClick:function(t){t.preventDefault(),e.push("/resume")},children:"Resume"}),Object(p.jsx)("p",{className:"navbar-element",onClick:function(e){e.preventDefault(),window.location.href="https://github.com/sevanetrebchenko/"},children:"GitHub"}),Object(p.jsx)("p",{className:"navbar-element",onClick:function(e){e.preventDefault(),window.location.href="https://www.linkedin.com/in/sevanetrebchenko/"},children:"LinkedIn"})]})}n(101);function g(){var e=function(e){e.preventDefault(),window.location.href="https://drive.google.com/file/d/1kquGDhURf46yFYBPrqXLWGi622AQMdEj/view?usp=sharing"};return Object(p.jsxs)("div",{className:"resume",children:[Object(p.jsx)("img",{src:"/resume/SevaNetrebchenko_Resume.svg",alt:"2021 Resume"}),Object(p.jsx)("button",{className:"download",onClick:e,children:"Download"})]})}var v=[{url:"hybrid-rendering-engine",title:"Hybrid Rendering Engine",abstract:"A deep dive into Deferred Rendering in OpenGL, Hierarchical Spatial Partitioning, and the Gilbert\u2013Johnson\u2013Keerthi (GJK) Algorithm for 3D collision detection",image:"/projects/hybrid-rendering-engine/cover.png",path:"hybrid-rendering-engine/hybrid-rendering-engine.md"}],x=n(84),k=n(85),N=n(86);n(71);function w(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=e.path,n=Object(c.useState)(""),r=Object(m.a)(n,2),a=r[0],s=r[1],i=new Request(t,{method:"GET",mode:"same-origin",cache:"reload",credentials:"same-origin",headers:{Accept:"text/plain","Content-Type":"text/plain"}}),o=function(){fetch(i).then((function(e){if(!e.ok){if(404===e.status)return"File not found.";throw new Error("fetch() response was not ok")}return e.text()})).then((function(e){s(e)}))};return Object(c.useEffect)((function(){o()})),Object(p.jsx)("div",{className:"center",children:Object(p.jsx)(x.a,{remarkPlugins:[k.a],rehypePlugins:[N.a],children:a})})}function C(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=e.project;return Object(p.jsx)("div",{children:Object(p.jsx)(w,{path:"/projects/"+t.path})})}var y=[{url:"spark-ecs-part-3",title:"Spark's ECS Architecture - Part 3: Systems",day:"20",month:"October",year:"2021",path:"spark/ecs-systems.md"},{url:"spark-ecs-part-2",title:"Spark's ECS Architecture - Part 2: Components",day:"17",month:"October",year:"2021",path:"spark/ecs-components.md"},{url:"spark-ecs-part-1",title:"Spark's ECS Architecture - Part 1: Entities",day:"14",month:"October",year:"2021",path:"spark/ecs-entities.md"},{url:"spark-ecs",title:"Spark's ECS Architecture - An Overview",day:"13",month:"October",year:"2021",path:"spark/ecs-overview.md"},{url:"hello-world",title:"Hello, World!",day:"08",month:"October",year:"2021",path:"website.md"}];function P(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=e.content,n=e.FormatContent;return Object(p.jsx)(r.a.Fragment,{children:t.map((function(e,t){return n(e,t)}))})}n(124);function F(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=e.items,n=e.numItemsPerPage,a=e.FormatContent,s=Object(c.useState)([]),i=Object(m.a)(s,2),o=i[0],l=i[1],j=Object(c.useState)(1),u=Object(m.a)(j,2),b=u[0],h=u[1],d=Object(c.useState)(n),f=Object(m.a)(d,1),O=f[0];Object(c.useEffect)((function(){l(t)}),[t]);var g=b*O,v=g-O,x=o.slice(v,g),k=function(e){0===e&&(e=1);var t=Math.ceil(o.length/O);e===t+1&&(e=t),h(e)};return Object(p.jsxs)(r.a.Fragment,{children:[Object(p.jsx)(P,{content:x,FormatContent:a}),Object(p.jsx)(S,{postsPerPage:O,totalNumPosts:o.length,currentPage:b,ChangePage:k})]})}function S(){for(var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=e.postsPerPage,n=e.totalNumPosts,c=e.currentPage,r=e.ChangePage,a=[],s=1;s<=Math.ceil(n/t);++s)a.push(s);return Object(p.jsx)("div",{className:"center pagination-container",children:a.map((function(e){return Object(p.jsx)("li",{className:"list-element",onClick:function(){return r(e)},children:a.length>1?Object(p.jsx)("button",{className:e===c?"pagination-element current":"pagination-element",children:e}):Object(p.jsx)(p.Fragment,{})},e)}))})}n(125);function D(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=e.posts,n=function(e,t){var n=Object(d.g)();return Object(p.jsx)(r.a.Fragment,{children:Object(p.jsxs)("div",{className:"blog-post-entry",children:[Object(p.jsx)("p",{className:"blog-post-entry-title",onClick:function(t){t.preventDefault(),n.push("/blog/"+e.url)},children:e.title}),Object(p.jsxs)("p",{className:"blog-post-entry-description",children:[e.month," ",e.day,", ",e.year]})]})},t)};return Object(p.jsx)(r.a.Fragment,{children:Object(p.jsxs)("div",{className:"blog-post-container",children:[Object(p.jsx)("p",{}),Object(p.jsx)(F,{items:t,numItemsPerPage:5,FormatContent:n})]})})}function E(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=e.post;return Object(p.jsx)(w,{path:"/blog/"+t.path})}n(126),n(127),n(128);function A(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=e.items,n=function(e,t){var n=Object(d.g)();return Object(p.jsx)(r.a.Fragment,{children:Object(p.jsxs)("div",{className:"project-entry",onClick:function(t){t.preventDefault(),n.push("/projects/"+e.url)},children:[Object(p.jsx)("img",{className:"project-entry-image",src:e.image,alt:""}),Object(p.jsxs)("div",{className:"project-entry-text",children:[Object(p.jsx)("h3",{children:e.title}),Object(p.jsx)("p",{children:e.abstract})]})]})},t)};return Object(p.jsx)("div",{className:"project-container",children:Object(p.jsx)(F,{items:t,numItemsPerPage:3,FormatContent:n})})}n(129);function R(){return Object(p.jsxs)(r.a.Fragment,{children:[Object(p.jsxs)("div",{className:"footer",children:[Object(p.jsx)("button",{className:"footer-button",children:Object(p.jsx)("i",{className:"fas fa-envelope footer-icon",onClick:function(e){e.preventDefault(),window.location="mailto:seva.netrebchenko@gmail.com"}})}),Object(p.jsx)("button",{className:"footer-button",children:Object(p.jsx)("i",{className:"fab fa-github footer-brand-icon",onClick:function(e){e.preventDefault(),window.location.href="https://github.com/sevanetrebchenko/"}})}),Object(p.jsx)("button",{className:"footer-button",children:Object(p.jsx)("i",{className:"fab fa-linkedin footer-brand-icon",onClick:function(e){e.preventDefault(),window.location.href="https://www.linkedin.com/in/sevanetrebchenko/"}})}),Object(p.jsx)("button",{className:"footer-button",children:Object(p.jsx)("i",{className:"fab fa-twitter footer-brand-icon",onClick:function(e){e.preventDefault(),window.location.href="https://twitter.com/netrebchenko/"}})})]}),Object(p.jsx)("p",{className:"copyright",children:"Copyright \xa9 2021 Seva Netrebchenko. All rights reserved."})]})}var G=function(e){Object(l.a)(n,e);var t=Object(j.a)(n);function n(e){var c;return Object(i.a)(this,n),(c=t.call(this,e)).state={limit:5,offset:0,cars:["Audi","Alfa Romeo","BMW","Citroen","Dacia","Ford","Mercedes","Peugeot","Porsche","VW"]},c}return Object(o.a)(n,[{key:"render",value:function(){return Object(p.jsx)("div",{children:Object(p.jsx)(h.a,{children:Object(p.jsxs)("div",{className:"global",children:[Object(p.jsx)(f,{}),Object(p.jsxs)(d.d,{children:[Object(p.jsx)(d.b,{path:"/blog/:url",component:function(){var e=Object(d.h)().params.url,t=b.a.find(y,(function(t){return t.url===e}));return Object(p.jsx)(E,{post:t})}}),Object(p.jsxs)(d.b,{path:"/blog",children:[Object(p.jsx)("p",{className:"page-title",children:"Blog"}),Object(p.jsx)(D,{posts:y})]}),Object(p.jsx)(d.b,{path:"/projects/:url",component:function(){var e=Object(d.h)().params.url,t=b.a.find(v,(function(t){return t.url===e}));return Object(p.jsx)(C,{project:t})}}),Object(p.jsxs)(d.b,{path:"/projects",children:[Object(p.jsx)("p",{className:"page-title",children:"Projects"}),Object(p.jsx)(A,{items:v})]}),Object(p.jsx)(d.b,{path:"/resume",children:Object(p.jsx)(g,{})}),Object(p.jsx)(d.a,{from:"/",to:"/projects"})]}),Object(p.jsx)(R,{})]})})})}}]),n}(r.a.Component),L=function(e){e&&e instanceof Function&&n.e(3).then(n.bind(null,143)).then((function(t){var n=t.getCLS,c=t.getFID,r=t.getFCP,a=t.getLCP,s=t.getTTFB;n(e),c(e),r(e),a(e),s(e)}))};s.a.render(Object(p.jsx)(r.a.StrictMode,{children:Object(p.jsx)(G,{})}),document.getElementById("root")),L()},71:function(e,t,n){},92:function(e,t,n){},94:function(e,t,n){},95:function(e,t,n){}},[[130,1,2]]]);
//# sourceMappingURL=main.d22fed72.chunk.js.map