import{c as t,d as s,b as a,n as o,e,f as n,i,g as r,h as p,j as c,l,m as h,w as u,a as m}from"./chunk.118b48cb.js";function d(t){var s,a,d,f,g,b,j=t.post.metadata.title,v=t.post.html;return document.title=s=t.post.metadata.title,{c(){a=o(),d=e("h1"),f=n(j),g=o(),b=e("div"),this.h()},l(t){a=i(t,"\n\n"),d=r(t,"H1",{},!1);var s=p(d);f=i(s,j),s.forEach(c),g=i(t,"\n\n"),b=r(t,"DIV",{class:!0},!1),p(b).forEach(c),this.h()},h(){b.className="content svelte-gnxal1"},m(t,s){l(t,a,s),l(t,d,s),h(d,f),l(t,g,s),l(t,b,s),b.innerHTML=v},p(t,a){t.post&&s!==(s=a.post.metadata.title)&&(document.title=s),t.post&&j!==(j=a.post.metadata.title)&&u(f,j),t.post&&v!==(v=a.post.html)&&(b.innerHTML=v)},i:m,o:m,d(t){t&&(c(a),c(d),c(g),c(b))}}}async function f({params:t,query:s}){const a=await this.fetch(`blog/${t.slug}.json`),o=await a.json();if(200===a.status)return{post:o};this.error(a.status,o.message)}function g(t,s,a){let{post:o}=s;return t.$set=(t=>{"post"in t&&a("post",o=t.post)}),{post:o}}export default class extends t{constructor(t){super(),s(this,t,g,d,a,["post"])}}export{f as preload};
//# sourceMappingURL=chunk.dfe13e19.js.map
