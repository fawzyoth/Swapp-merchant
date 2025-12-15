import{R as C,u as fe,r as P,s as T,j as r}from"./index-ByG6RqwF.js";import{M as X,a as $,P as pe,X as xe}from"./MerchantLayout-CNLtqHQt.js";import{A as ge}from"./alert-circle-DGz-r6nu.js";import{c as be}from"./store-BWwWvJXL.js";import{C as we}from"./check-circle-ZzgtH91B.js";import{C as ve}from"./clock-CuIahUSk.js";import{S as Ne}from"./search-gagLju3n.js";import{F as ye}from"./filter-C-pGpbYc.js";import{E as Ee}from"./eye-CM_rm1cd.js";/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const W=be("FileText",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]]);var Ce=Object.defineProperty,U=Object.getOwnPropertySymbols,Z=Object.prototype.hasOwnProperty,J=Object.prototype.propertyIsEnumerable,K=(m,l,n)=>l in m?Ce(m,l,{enumerable:!0,configurable:!0,writable:!0,value:n}):m[l]=n,Q=(m,l)=>{for(var n in l||(l={}))Z.call(l,n)&&K(m,n,l[n]);if(U)for(var n of U(l))J.call(l,n)&&K(m,n,l[n]);return m},H=(m,l)=>{var n={};for(var h in m)Z.call(m,h)&&l.indexOf(h)<0&&(n[h]=m[h]);if(m!=null&&U)for(var h of U(m))l.indexOf(h)<0&&J.call(m,h)&&(n[h]=m[h]);return n};/**
 * @license QR Code generator library (TypeScript)
 * Copyright (c) Project Nayuki.
 * SPDX-License-Identifier: MIT
 */var _;(m=>{const l=class b{constructor(t,e,s,a){if(this.version=t,this.errorCorrectionLevel=e,this.modules=[],this.isFunction=[],t<b.MIN_VERSION||t>b.MAX_VERSION)throw new RangeError("Version value out of range");if(a<-1||a>7)throw new RangeError("Mask value out of range");this.size=t*4+17;let o=[];for(let i=0;i<this.size;i++)o.push(!1);for(let i=0;i<this.size;i++)this.modules.push(o.slice()),this.isFunction.push(o.slice());this.drawFunctionPatterns();const d=this.addEccAndInterleave(s);if(this.drawCodewords(d),a==-1){let i=1e9;for(let x=0;x<8;x++){this.applyMask(x),this.drawFormatBits(x);const p=this.getPenaltyScore();p<i&&(a=x,i=p),this.applyMask(x)}}g(0<=a&&a<=7),this.mask=a,this.applyMask(a),this.drawFormatBits(a),this.isFunction=[]}static encodeText(t,e){const s=m.QrSegment.makeSegments(t);return b.encodeSegments(s,e)}static encodeBinary(t,e){const s=m.QrSegment.makeBytes(t);return b.encodeSegments([s],e)}static encodeSegments(t,e,s=1,a=40,o=-1,d=!0){if(!(b.MIN_VERSION<=s&&s<=a&&a<=b.MAX_VERSION)||o<-1||o>7)throw new RangeError("Invalid value");let i,x;for(i=s;;i++){const u=b.getNumDataCodewords(i,e)*8,N=E.getTotalBits(t,i);if(N<=u){x=N;break}if(i>=a)throw new RangeError("Data too long")}for(const u of[b.Ecc.MEDIUM,b.Ecc.QUARTILE,b.Ecc.HIGH])d&&x<=b.getNumDataCodewords(i,u)*8&&(e=u);let p=[];for(const u of t){n(u.mode.modeBits,4,p),n(u.numChars,u.mode.numCharCountBits(i),p);for(const N of u.getData())p.push(N)}g(p.length==x);const R=b.getNumDataCodewords(i,e)*8;g(p.length<=R),n(0,Math.min(4,R-p.length),p),n(0,(8-p.length%8)%8,p),g(p.length%8==0);for(let u=236;p.length<R;u^=253)n(u,8,p);let v=[];for(;v.length*8<p.length;)v.push(0);return p.forEach((u,N)=>v[N>>>3]|=u<<7-(N&7)),new b(i,e,v,o)}getModule(t,e){return 0<=t&&t<this.size&&0<=e&&e<this.size&&this.modules[e][t]}getModules(){return this.modules}drawFunctionPatterns(){for(let s=0;s<this.size;s++)this.setFunctionModule(6,s,s%2==0),this.setFunctionModule(s,6,s%2==0);this.drawFinderPattern(3,3),this.drawFinderPattern(this.size-4,3),this.drawFinderPattern(3,this.size-4);const t=this.getAlignmentPatternPositions(),e=t.length;for(let s=0;s<e;s++)for(let a=0;a<e;a++)s==0&&a==0||s==0&&a==e-1||s==e-1&&a==0||this.drawAlignmentPattern(t[s],t[a]);this.drawFormatBits(0),this.drawVersion()}drawFormatBits(t){const e=this.errorCorrectionLevel.formatBits<<3|t;let s=e;for(let o=0;o<10;o++)s=s<<1^(s>>>9)*1335;const a=(e<<10|s)^21522;g(a>>>15==0);for(let o=0;o<=5;o++)this.setFunctionModule(8,o,h(a,o));this.setFunctionModule(8,7,h(a,6)),this.setFunctionModule(8,8,h(a,7)),this.setFunctionModule(7,8,h(a,8));for(let o=9;o<15;o++)this.setFunctionModule(14-o,8,h(a,o));for(let o=0;o<8;o++)this.setFunctionModule(this.size-1-o,8,h(a,o));for(let o=8;o<15;o++)this.setFunctionModule(8,this.size-15+o,h(a,o));this.setFunctionModule(8,this.size-8,!0)}drawVersion(){if(this.version<7)return;let t=this.version;for(let s=0;s<12;s++)t=t<<1^(t>>>11)*7973;const e=this.version<<12|t;g(e>>>18==0);for(let s=0;s<18;s++){const a=h(e,s),o=this.size-11+s%3,d=Math.floor(s/3);this.setFunctionModule(o,d,a),this.setFunctionModule(d,o,a)}}drawFinderPattern(t,e){for(let s=-4;s<=4;s++)for(let a=-4;a<=4;a++){const o=Math.max(Math.abs(a),Math.abs(s)),d=t+a,i=e+s;0<=d&&d<this.size&&0<=i&&i<this.size&&this.setFunctionModule(d,i,o!=2&&o!=4)}}drawAlignmentPattern(t,e){for(let s=-2;s<=2;s++)for(let a=-2;a<=2;a++)this.setFunctionModule(t+a,e+s,Math.max(Math.abs(a),Math.abs(s))!=1)}setFunctionModule(t,e,s){this.modules[e][t]=s,this.isFunction[e][t]=!0}addEccAndInterleave(t){const e=this.version,s=this.errorCorrectionLevel;if(t.length!=b.getNumDataCodewords(e,s))throw new RangeError("Invalid argument");const a=b.NUM_ERROR_CORRECTION_BLOCKS[s.ordinal][e],o=b.ECC_CODEWORDS_PER_BLOCK[s.ordinal][e],d=Math.floor(b.getNumRawDataModules(e)/8),i=a-d%a,x=Math.floor(d/a);let p=[];const R=b.reedSolomonComputeDivisor(o);for(let u=0,N=0;u<a;u++){let A=t.slice(N,N+x-o+(u<i?0:1));N+=A.length;const D=b.reedSolomonComputeRemainder(A,R);u<i&&A.push(0),p.push(A.concat(D))}let v=[];for(let u=0;u<p[0].length;u++)p.forEach((N,A)=>{(u!=x-o||A>=i)&&v.push(N[u])});return g(v.length==d),v}drawCodewords(t){if(t.length!=Math.floor(b.getNumRawDataModules(this.version)/8))throw new RangeError("Invalid argument");let e=0;for(let s=this.size-1;s>=1;s-=2){s==6&&(s=5);for(let a=0;a<this.size;a++)for(let o=0;o<2;o++){const d=s-o,x=(s+1&2)==0?this.size-1-a:a;!this.isFunction[x][d]&&e<t.length*8&&(this.modules[x][d]=h(t[e>>>3],7-(e&7)),e++)}}g(e==t.length*8)}applyMask(t){if(t<0||t>7)throw new RangeError("Mask value out of range");for(let e=0;e<this.size;e++)for(let s=0;s<this.size;s++){let a;switch(t){case 0:a=(s+e)%2==0;break;case 1:a=e%2==0;break;case 2:a=s%3==0;break;case 3:a=(s+e)%3==0;break;case 4:a=(Math.floor(s/3)+Math.floor(e/2))%2==0;break;case 5:a=s*e%2+s*e%3==0;break;case 6:a=(s*e%2+s*e%3)%2==0;break;case 7:a=((s+e)%2+s*e%3)%2==0;break;default:throw new Error("Unreachable")}!this.isFunction[e][s]&&a&&(this.modules[e][s]=!this.modules[e][s])}}getPenaltyScore(){let t=0;for(let o=0;o<this.size;o++){let d=!1,i=0,x=[0,0,0,0,0,0,0];for(let p=0;p<this.size;p++)this.modules[o][p]==d?(i++,i==5?t+=b.PENALTY_N1:i>5&&t++):(this.finderPenaltyAddHistory(i,x),d||(t+=this.finderPenaltyCountPatterns(x)*b.PENALTY_N3),d=this.modules[o][p],i=1);t+=this.finderPenaltyTerminateAndCount(d,i,x)*b.PENALTY_N3}for(let o=0;o<this.size;o++){let d=!1,i=0,x=[0,0,0,0,0,0,0];for(let p=0;p<this.size;p++)this.modules[p][o]==d?(i++,i==5?t+=b.PENALTY_N1:i>5&&t++):(this.finderPenaltyAddHistory(i,x),d||(t+=this.finderPenaltyCountPatterns(x)*b.PENALTY_N3),d=this.modules[p][o],i=1);t+=this.finderPenaltyTerminateAndCount(d,i,x)*b.PENALTY_N3}for(let o=0;o<this.size-1;o++)for(let d=0;d<this.size-1;d++){const i=this.modules[o][d];i==this.modules[o][d+1]&&i==this.modules[o+1][d]&&i==this.modules[o+1][d+1]&&(t+=b.PENALTY_N2)}let e=0;for(const o of this.modules)e=o.reduce((d,i)=>d+(i?1:0),e);const s=this.size*this.size,a=Math.ceil(Math.abs(e*20-s*10)/s)-1;return g(0<=a&&a<=9),t+=a*b.PENALTY_N4,g(0<=t&&t<=2568888),t}getAlignmentPatternPositions(){if(this.version==1)return[];{const t=Math.floor(this.version/7)+2,e=this.version==32?26:Math.ceil((this.version*4+4)/(t*2-2))*2;let s=[6];for(let a=this.size-7;s.length<t;a-=e)s.splice(1,0,a);return s}}static getNumRawDataModules(t){if(t<b.MIN_VERSION||t>b.MAX_VERSION)throw new RangeError("Version number out of range");let e=(16*t+128)*t+64;if(t>=2){const s=Math.floor(t/7)+2;e-=(25*s-10)*s-55,t>=7&&(e-=36)}return g(208<=e&&e<=29648),e}static getNumDataCodewords(t,e){return Math.floor(b.getNumRawDataModules(t)/8)-b.ECC_CODEWORDS_PER_BLOCK[e.ordinal][t]*b.NUM_ERROR_CORRECTION_BLOCKS[e.ordinal][t]}static reedSolomonComputeDivisor(t){if(t<1||t>255)throw new RangeError("Degree out of range");let e=[];for(let a=0;a<t-1;a++)e.push(0);e.push(1);let s=1;for(let a=0;a<t;a++){for(let o=0;o<e.length;o++)e[o]=b.reedSolomonMultiply(e[o],s),o+1<e.length&&(e[o]^=e[o+1]);s=b.reedSolomonMultiply(s,2)}return e}static reedSolomonComputeRemainder(t,e){let s=e.map(a=>0);for(const a of t){const o=a^s.shift();s.push(0),e.forEach((d,i)=>s[i]^=b.reedSolomonMultiply(d,o))}return s}static reedSolomonMultiply(t,e){if(t>>>8||e>>>8)throw new RangeError("Byte out of range");let s=0;for(let a=7;a>=0;a--)s=s<<1^(s>>>7)*285,s^=(e>>>a&1)*t;return g(s>>>8==0),s}finderPenaltyCountPatterns(t){const e=t[1];g(e<=this.size*3);const s=e>0&&t[2]==e&&t[3]==e*3&&t[4]==e&&t[5]==e;return(s&&t[0]>=e*4&&t[6]>=e?1:0)+(s&&t[6]>=e*4&&t[0]>=e?1:0)}finderPenaltyTerminateAndCount(t,e,s){return t&&(this.finderPenaltyAddHistory(e,s),e=0),e+=this.size,this.finderPenaltyAddHistory(e,s),this.finderPenaltyCountPatterns(s)}finderPenaltyAddHistory(t,e){e[0]==0&&(t+=this.size),e.pop(),e.unshift(t)}};l.MIN_VERSION=1,l.MAX_VERSION=40,l.PENALTY_N1=3,l.PENALTY_N2=3,l.PENALTY_N3=40,l.PENALTY_N4=10,l.ECC_CODEWORDS_PER_BLOCK=[[-1,7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],[-1,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28],[-1,13,22,18,26,18,24,18,22,20,24,28,26,24,20,30,24,28,28,26,30,28,30,30,30,30,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],[-1,17,28,22,16,22,28,26,26,24,28,24,28,22,24,24,30,28,28,26,28,30,24,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30]],l.NUM_ERROR_CORRECTION_BLOCKS=[[-1,1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25],[-1,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49],[-1,1,1,2,2,4,4,6,6,8,8,8,10,12,16,12,17,16,18,21,20,23,23,25,27,29,34,34,35,38,40,43,45,48,51,53,56,59,62,65,68],[-1,1,1,2,4,4,4,5,6,8,8,11,11,16,16,18,16,19,21,25,25,25,34,30,32,35,37,40,42,45,48,51,54,57,60,63,66,70,74,77,81]],m.QrCode=l;function n(w,t,e){if(t<0||t>31||w>>>t)throw new RangeError("Value out of range");for(let s=t-1;s>=0;s--)e.push(w>>>s&1)}function h(w,t){return(w>>>t&1)!=0}function g(w){if(!w)throw new Error("Assertion error")}const f=class y{constructor(t,e,s){if(this.mode=t,this.numChars=e,this.bitData=s,e<0)throw new RangeError("Invalid argument");this.bitData=s.slice()}static makeBytes(t){let e=[];for(const s of t)n(s,8,e);return new y(y.Mode.BYTE,t.length,e)}static makeNumeric(t){if(!y.isNumeric(t))throw new RangeError("String contains non-numeric characters");let e=[];for(let s=0;s<t.length;){const a=Math.min(t.length-s,3);n(parseInt(t.substring(s,s+a),10),a*3+1,e),s+=a}return new y(y.Mode.NUMERIC,t.length,e)}static makeAlphanumeric(t){if(!y.isAlphanumeric(t))throw new RangeError("String contains unencodable characters in alphanumeric mode");let e=[],s;for(s=0;s+2<=t.length;s+=2){let a=y.ALPHANUMERIC_CHARSET.indexOf(t.charAt(s))*45;a+=y.ALPHANUMERIC_CHARSET.indexOf(t.charAt(s+1)),n(a,11,e)}return s<t.length&&n(y.ALPHANUMERIC_CHARSET.indexOf(t.charAt(s)),6,e),new y(y.Mode.ALPHANUMERIC,t.length,e)}static makeSegments(t){return t==""?[]:y.isNumeric(t)?[y.makeNumeric(t)]:y.isAlphanumeric(t)?[y.makeAlphanumeric(t)]:[y.makeBytes(y.toUtf8ByteArray(t))]}static makeEci(t){let e=[];if(t<0)throw new RangeError("ECI assignment value out of range");if(t<128)n(t,8,e);else if(t<16384)n(2,2,e),n(t,14,e);else if(t<1e6)n(6,3,e),n(t,21,e);else throw new RangeError("ECI assignment value out of range");return new y(y.Mode.ECI,0,e)}static isNumeric(t){return y.NUMERIC_REGEX.test(t)}static isAlphanumeric(t){return y.ALPHANUMERIC_REGEX.test(t)}getData(){return this.bitData.slice()}static getTotalBits(t,e){let s=0;for(const a of t){const o=a.mode.numCharCountBits(e);if(a.numChars>=1<<o)return 1/0;s+=4+o+a.bitData.length}return s}static toUtf8ByteArray(t){t=encodeURI(t);let e=[];for(let s=0;s<t.length;s++)t.charAt(s)!="%"?e.push(t.charCodeAt(s)):(e.push(parseInt(t.substring(s+1,s+3),16)),s+=2);return e}};f.NUMERIC_REGEX=/^[0-9]*$/,f.ALPHANUMERIC_REGEX=/^[A-Z0-9 $%*+.\/:-]*$/,f.ALPHANUMERIC_CHARSET="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";let E=f;m.QrSegment=f})(_||(_={}));(m=>{(l=>{const n=class{constructor(g,f){this.ordinal=g,this.formatBits=f}};n.LOW=new n(0,1),n.MEDIUM=new n(1,0),n.QUARTILE=new n(2,3),n.HIGH=new n(3,2),l.Ecc=n})(m.QrCode||(m.QrCode={}))})(_||(_={}));(m=>{(l=>{const n=class{constructor(g,f){this.modeBits=g,this.numBitsCharCount=f}numCharCountBits(g){return this.numBitsCharCount[Math.floor((g+7)/17)]}};n.NUMERIC=new n(1,[10,12,14]),n.ALPHANUMERIC=new n(2,[9,11,13]),n.BYTE=new n(4,[8,16,16]),n.KANJI=new n(8,[8,10,12]),n.ECI=new n(7,[0,0,0]),l.Mode=n})(m.QrSegment||(m.QrSegment={}))})(_||(_={}));var O=_;/**
 * @license qrcode.react
 * Copyright (c) Paul O'Shannessy
 * SPDX-License-Identifier: ISC
 */var je={L:O.QrCode.Ecc.LOW,M:O.QrCode.Ecc.MEDIUM,Q:O.QrCode.Ecc.QUARTILE,H:O.QrCode.Ecc.HIGH},ee=128,te="L",se="#FFFFFF",re="#000000",ae=!1,oe=1,Me=4,Re=0,Ae=.1;function ne(m,l=0){const n=[];return m.forEach(function(h,g){let f=null;h.forEach(function(E,w){if(!E&&f!==null){n.push(`M${f+l} ${g+l}h${w-f}v1H${f+l}z`),f=null;return}if(w===h.length-1){if(!E)return;f===null?n.push(`M${w+l},${g+l} h1v1H${w+l}z`):n.push(`M${f+l},${g+l} h${w+1-f}v1H${f+l}z`);return}E&&f===null&&(f=w)})}),n.join("")}function ie(m,l){return m.slice().map((n,h)=>h<l.y||h>=l.y+l.h?n:n.map((g,f)=>f<l.x||f>=l.x+l.w?g:!1))}function Se(m,l,n,h){if(h==null)return null;const g=m.length+n*2,f=Math.floor(l*Ae),E=g/l,w=(h.width||f)*E,t=(h.height||f)*E,e=h.x==null?m.length/2-w/2:h.x*E,s=h.y==null?m.length/2-t/2:h.y*E,a=h.opacity==null?1:h.opacity;let o=null;if(h.excavate){let i=Math.floor(e),x=Math.floor(s),p=Math.ceil(w+e-i),R=Math.ceil(t+s-x);o={x:i,y:x,w:p,h:R}}const d=h.crossOrigin;return{x:e,y:s,h:t,w,excavation:o,opacity:a,crossOrigin:d}}function Pe(m,l){return l!=null?Math.max(Math.floor(l),0):m?Me:Re}function le({value:m,level:l,minVersion:n,includeMargin:h,marginSize:g,imageSettings:f,size:E,boostLevel:w}){let t=C.useMemo(()=>{const i=(Array.isArray(m)?m:[m]).reduce((x,p)=>(x.push(...O.QrSegment.makeSegments(p)),x),[]);return O.QrCode.encodeSegments(i,je[l],n,void 0,void 0,w)},[m,l,n,w]);const{cells:e,margin:s,numCells:a,calculatedImageSettings:o}=C.useMemo(()=>{let d=t.getModules();const i=Pe(h,g),x=d.length+i*2,p=Se(d,E,i,f);return{cells:d,margin:i,numCells:x,calculatedImageSettings:p}},[t,E,f,h,g]);return{qrcode:t,margin:s,cells:e,numCells:a,calculatedImageSettings:o}}var Ie=function(){try{new Path2D().addPath(new Path2D)}catch{return!1}return!0}(),ke=C.forwardRef(function(l,n){const h=l,{value:g,size:f=ee,level:E=te,bgColor:w=se,fgColor:t=re,includeMargin:e=ae,minVersion:s=oe,boostLevel:a,marginSize:o,imageSettings:d}=h,x=H(h,["value","size","level","bgColor","fgColor","includeMargin","minVersion","boostLevel","marginSize","imageSettings"]),{style:p}=x,R=H(x,["style"]),v=d==null?void 0:d.src,u=C.useRef(null),N=C.useRef(null),A=C.useCallback(M=>{u.current=M,typeof n=="function"?n(M):n&&(n.current=M)},[n]),[D,B]=C.useState(!1),{margin:k,cells:L,numCells:z,calculatedImageSettings:c}=le({value:g,level:E,minVersion:s,boostLevel:a,includeMargin:e,marginSize:o,imageSettings:d,size:f});C.useEffect(()=>{if(u.current!=null){const M=u.current,S=M.getContext("2d");if(!S)return;let G=L;const F=N.current,V=c!=null&&F!==null&&F.complete&&F.naturalHeight!==0&&F.naturalWidth!==0;V&&c.excavation!=null&&(G=ie(L,c.excavation));const Y=window.devicePixelRatio||1;M.height=M.width=f*Y;const q=f/z*Y;S.scale(q,q),S.fillStyle=w,S.fillRect(0,0,z,z),S.fillStyle=t,Ie?S.fill(new Path2D(ne(G,k))):L.forEach(function(de,ue){de.forEach(function(he,me){he&&S.fillRect(me+k,ue+k,1,1)})}),c&&(S.globalAlpha=c.opacity),V&&S.drawImage(F,c.x+k,c.y+k,c.w,c.h)}}),C.useEffect(()=>{B(!1)},[v]);const j=Q({height:f,width:f},p);let I=null;return v!=null&&(I=C.createElement("img",{src:v,key:v,style:{display:"none"},onLoad:()=>{B(!0)},ref:N,crossOrigin:c==null?void 0:c.crossOrigin})),C.createElement(C.Fragment,null,C.createElement("canvas",Q({style:j,height:f,width:f,ref:A,role:"img"},R)),I)});ke.displayName="QRCodeCanvas";var ce=C.forwardRef(function(l,n){const h=l,{value:g,size:f=ee,level:E=te,bgColor:w=se,fgColor:t=re,includeMargin:e=ae,minVersion:s=oe,boostLevel:a,title:o,marginSize:d,imageSettings:i}=h,x=H(h,["value","size","level","bgColor","fgColor","includeMargin","minVersion","boostLevel","title","marginSize","imageSettings"]),{margin:p,cells:R,numCells:v,calculatedImageSettings:u}=le({value:g,level:E,minVersion:s,boostLevel:a,includeMargin:e,marginSize:d,imageSettings:i,size:f});let N=R,A=null;i!=null&&u!=null&&(u.excavation!=null&&(N=ie(R,u.excavation)),A=C.createElement("image",{href:i.src,height:u.h,width:u.w,x:u.x+p,y:u.y+p,preserveAspectRatio:"none",opacity:u.opacity,crossOrigin:u.crossOrigin}));const D=ne(N,p);return C.createElement("svg",Q({height:f,width:f,viewBox:`0 0 ${v} ${v}`,ref:n,role:"img"},x),!!o&&C.createElement("title",null,o),C.createElement("path",{fill:w,d:`M0,0 h${v}v${v}H0z`,shapeRendering:"crispEdges"}),C.createElement("path",{fill:t,d:D,shapeRendering:"crispEdges"}),A)});ce.displayName="QRCodeSVG";const Le=()=>{const m=Date.now().toString(36).toUpperCase(),l=Math.random().toString(36).substring(2,6).toUpperCase();return`BDX-${m}-${l}`};function Ge(){const m=fe(),[l,n]=P.useState(!0),[h,g]=P.useState(!1),[f,E]=P.useState(10),[w,t]=P.useState([]),[e,s]=P.useState(null),[a,o]=P.useState(""),[d,i]=P.useState("all"),[x,p]=P.useState(""),[R,v]=P.useState(""),[u,N]=P.useState(null);P.useEffect(()=>{A()},[]);const A=async()=>{try{const{data:{session:c}}=await T.auth.getSession();if(!c){m("/merchant/login");return}const{data:j}=await T.from("merchants").select("*").eq("email",c.user.email).maybeSingle();j&&(s(j),o(j.id),await D(j.id))}catch(c){console.error("Error fetching data:",c),v("Erreur lors du chargement")}finally{n(!1)}},D=async c=>{const{data:j}=await T.from("merchant_bordereaux").select("*").eq("merchant_id",c).order("created_at",{ascending:!1});t(j||[])},B=async()=>{if(!(e!=null&&e.id)){v("Erreur: Marchand non trouve. Veuillez vous reconnecter.");return}if(f<1||f>100){v("La quantite doit etre entre 1 et 100");return}g(!0),v("");try{const c=[];for(let M=0;M<f;M++)c.push({merchant_id:e.id,bordereau_code:Le(),status:"available",printed_at:new Date().toISOString()});const{data:j,error:I}=await T.from("merchant_bordereaux").insert(c).select();if(I)throw I;await D(e.id),j&&k(j)}catch(c){console.error("Error generating bordereaux:",c),v(`Erreur: ${(c==null?void 0:c.message)||(c==null?void 0:c.details)||JSON.stringify(c)}`)}finally{g(!1)}},k=c=>{const j=window.open("","","height=900,width=800");if(!j)return;const I=c.map(M=>{const S=`https://fawzyoth.github.io/Swapp-app/#/client/exchange/new?bordereau=${M.bordereau_code}`;return`
        <div class="bordereau">
          <div class="header">
            ${e!=null&&e.logo_base64?`<img src="${e.logo_base64}" alt="Logo" class="logo" />`:'<div class="logo-placeholder">LOGO</div>'}
            <div class="title-section">
              <h1>SWAPP - Bordereau d'Echange</h1>
              <p class="business-name">${(e==null?void 0:e.business_name)||(e==null?void 0:e.name)||"E-Commercant"}</p>
            </div>
          </div>

          <div class="codes-section">
            <div class="qr-box">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(S)}" alt="QR Code" />
              <p class="readable-code">${M.bordereau_code}</p>
              <p class="code-label">Scanner pour initier l'echange</p>
            </div>

            <div class="barcode-box">
              <img src="https://barcodeapi.org/api/128/${M.bordereau_code}" alt="Barcode" class="barcode-img" />
              <p class="barcode-text">${M.bordereau_code}</p>
              <p class="code-label">Code Livreur</p>
            </div>
          </div>

          <div class="contact-section">
            <p><strong>Contact:</strong> ${(e==null?void 0:e.phone)||""}</p>
            <p><strong>Adresse:</strong> ${(e==null?void 0:e.business_address)||""} ${(e==null?void 0:e.business_city)||""} ${(e==null?void 0:e.business_postal_code)||""}</p>
          </div>

          <div class="instructions-fr">
            <h3>Instructions</h3>
            <ol>
              <li>Scannez le QR code pour demarrer l'echange</li>
              <li>Suivez les etapes sur votre telephone</li>
              <li>Preparez le produit a retourner</li>
              <li>Le livreur scannera le code-barres lors de la collecte</li>
            </ol>
          </div>

          <div class="instructions-ar">
            <h3>التعليمات</h3>
            <ol>
              <li>امسح رمز QR لبدء عملية التبديل</li>
              <li>اتبع الخطوات على هاتفك</li>
              <li>جهّز المنتج للإرجاع</li>
              <li>سيقوم المندوب بمسح الباركود عند الاستلام</li>
            </ol>
          </div>

          <div class="footer">
            <p>SWAPP - Plateforme d'echange de produits | ${M.bordereau_code}</p>
          </div>
        </div>
      `}).join('<div class="page-break"></div>');j.document.write(`
      <html>
      <head>
        <title>Bordereaux - ${c.length} exemplaires</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; }

          .bordereau {
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            border: 2px solid #0369a1;
            border-radius: 10px;
          }

          .header {
            display: flex;
            align-items: center;
            gap: 20px;
            border-bottom: 2px solid #0369a1;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }

          .logo {
            width: 80px;
            height: 80px;
            object-fit: contain;
          }

          .logo-placeholder {
            width: 80px;
            height: 80px;
            background: #f0f9ff;
            border: 2px dashed #0369a1;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: #0369a1;
            border-radius: 8px;
          }

          .title-section h1 {
            font-size: 18px;
            color: #0369a1;
          }

          .business-name {
            font-size: 14px;
            color: #64748b;
            margin-top: 5px;
          }

          .codes-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }

          .qr-box, .barcode-box {
            text-align: center;
            padding: 15px;
            border-radius: 10px;
          }

          .qr-box {
            background: #dbeafe;
            border: 2px solid #3b82f6;
          }

          .qr-box img {
            width: 150px;
            height: 150px;
          }

          .readable-code {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            font-weight: bold;
            letter-spacing: 1px;
            margin-top: 8px;
            color: #1d4ed8;
            background: white;
            padding: 4px 8px;
            border-radius: 4px;
          }

          .barcode-box {
            background: #fef3c7;
            border: 2px solid #f59e0b;
          }

          .barcode-img {
            width: 180px;
            height: 70px;
            object-fit: contain;
            background: white;
            padding: 8px;
            border-radius: 6px;
          }

          .barcode-text {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            font-weight: bold;
            letter-spacing: 2px;
            margin-top: 10px;
          }

          .code-label {
            font-size: 11px;
            color: #64748b;
            margin-top: 8px;
          }

          .contact-section {
            background: #f8fafc;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 15px;
            font-size: 12px;
          }

          .contact-section p {
            margin: 4px 0;
          }

          .instructions-fr {
            background: #ecfdf5;
            border: 1px solid #10b981;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 10px;
          }

          .instructions-fr h3 {
            font-size: 12px;
            color: #047857;
            margin-bottom: 8px;
          }

          .instructions-fr ol {
            margin-left: 18px;
            font-size: 11px;
            color: #065f46;
          }

          .instructions-fr ol li {
            margin: 4px 0;
          }

          .instructions-ar {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 15px;
            direction: rtl;
            text-align: right;
          }

          .instructions-ar h3 {
            font-size: 14px;
            color: #b45309;
            margin-bottom: 8px;
          }

          .instructions-ar ol {
            margin-right: 18px;
            font-size: 12px;
            color: #92400e;
          }

          .instructions-ar ol li {
            margin: 6px 0;
          }

          .footer {
            text-align: center;
            font-size: 10px;
            color: #64748b;
            padding-top: 10px;
            border-top: 1px dashed #cbd5e1;
          }

          .page-break {
            page-break-after: always;
          }

          @media print {
            body { padding: 0; }
            .bordereau { border: 1px solid #ccc; margin: 10px auto; }
            .page-break { page-break-after: always; }
          }
        </style>
      </head>
      <body>
        ${I}
      </body>
      </html>
    `),j.document.close(),setTimeout(()=>{j.print()},500)},L=w.filter(c=>{const j=d==="all"||c.status===d,I=c.bordereau_code.toLowerCase().includes(x.toLowerCase());return j&&I}),z={total:w.length,available:w.filter(c=>c.status==="available").length,assigned:w.filter(c=>c.status==="assigned").length,used:w.filter(c=>c.status==="used").length};return l?r.jsx(X,{children:r.jsx("div",{className:"flex items-center justify-center h-96",children:r.jsx("div",{className:"animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"})})}):r.jsx(X,{children:r.jsxs("div",{className:"max-w-6xl mx-auto",children:[r.jsxs("div",{className:"mb-8",children:[r.jsxs("h1",{className:"text-3xl font-bold text-slate-900 flex items-center gap-3",children:[r.jsx($,{className:"w-8 h-8 text-sky-600"}),"Imprimer des Bordereaux"]}),r.jsx("p",{className:"text-slate-600 mt-2",children:"Generez et imprimez des bordereaux pre-configures avec QR code et code-barres uniques"})]}),R&&r.jsxs("div",{className:"mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3",children:[r.jsx(ge,{className:"w-5 h-5 text-red-600"}),r.jsx("span",{className:"text-red-800",children:R})]}),r.jsxs("div",{className:"grid grid-cols-2 md:grid-cols-4 gap-4 mb-8",children:[r.jsx("div",{className:"bg-white rounded-xl shadow-sm border border-slate-200 p-4",children:r.jsxs("div",{className:"flex items-center gap-3",children:[r.jsx("div",{className:"p-2 bg-slate-100 rounded-lg",children:r.jsx(W,{className:"w-5 h-5 text-slate-600"})}),r.jsxs("div",{children:[r.jsx("p",{className:"text-2xl font-bold text-slate-900",children:z.total}),r.jsx("p",{className:"text-sm text-slate-600",children:"Total"})]})]})}),r.jsx("div",{className:"bg-white rounded-xl shadow-sm border border-slate-200 p-4",children:r.jsxs("div",{className:"flex items-center gap-3",children:[r.jsx("div",{className:"p-2 bg-emerald-100 rounded-lg",children:r.jsx(we,{className:"w-5 h-5 text-emerald-600"})}),r.jsxs("div",{children:[r.jsx("p",{className:"text-2xl font-bold text-emerald-600",children:z.available}),r.jsx("p",{className:"text-sm text-slate-600",children:"Disponibles"})]})]})}),r.jsx("div",{className:"bg-white rounded-xl shadow-sm border border-slate-200 p-4",children:r.jsxs("div",{className:"flex items-center gap-3",children:[r.jsx("div",{className:"p-2 bg-amber-100 rounded-lg",children:r.jsx(ve,{className:"w-5 h-5 text-amber-600"})}),r.jsxs("div",{children:[r.jsx("p",{className:"text-2xl font-bold text-amber-600",children:z.assigned}),r.jsx("p",{className:"text-sm text-slate-600",children:"Assignes"})]})]})}),r.jsx("div",{className:"bg-white rounded-xl shadow-sm border border-slate-200 p-4",children:r.jsxs("div",{className:"flex items-center gap-3",children:[r.jsx("div",{className:"p-2 bg-sky-100 rounded-lg",children:r.jsx(pe,{className:"w-5 h-5 text-sky-600"})}),r.jsxs("div",{children:[r.jsx("p",{className:"text-2xl font-bold text-sky-600",children:z.used}),r.jsx("p",{className:"text-sm text-slate-600",children:"Utilises"})]})]})})]}),r.jsxs("div",{className:"bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8",children:[r.jsx("h2",{className:"text-lg font-semibold text-slate-900 mb-4",children:"Generer de nouveaux bordereaux"}),r.jsxs("div",{className:"flex flex-wrap items-end gap-4",children:[r.jsxs("div",{children:[r.jsx("label",{className:"block text-sm font-medium text-slate-700 mb-1",children:"Quantite"}),r.jsx("input",{type:"number",min:"1",max:"100",value:f,onChange:c=>E(parseInt(c.target.value)||1),className:"w-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"})]}),r.jsx("button",{onClick:B,disabled:h,className:"flex items-center gap-2 px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",children:h?r.jsxs(r.Fragment,{children:[r.jsx("div",{className:"animate-spin rounded-full h-5 w-5 border-b-2 border-white"}),"Generation..."]}):r.jsxs(r.Fragment,{children:[r.jsx($,{className:"w-5 h-5"}),"Generer et Imprimer"]})})]}),r.jsx("p",{className:"text-sm text-slate-500 mt-3",children:"Chaque bordereau aura un QR code et un code-barres uniques lies ensemble"})]}),r.jsxs("div",{className:"bg-white rounded-xl shadow-sm border border-slate-200 p-6",children:[r.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-4 mb-6",children:[r.jsx("h2",{className:"text-lg font-semibold text-slate-900",children:"Historique des bordereaux"}),r.jsxs("div",{className:"flex flex-wrap items-center gap-3",children:[r.jsxs("div",{className:"relative",children:[r.jsx(Ne,{className:"w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"}),r.jsx("input",{type:"text",placeholder:"Rechercher...",value:x,onChange:c=>p(c.target.value),className:"pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"})]}),r.jsxs("div",{className:"flex items-center gap-2",children:[r.jsx(ye,{className:"w-4 h-4 text-slate-400"}),r.jsxs("select",{value:d,onChange:c=>i(c.target.value),className:"px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500",children:[r.jsx("option",{value:"all",children:"Tous"}),r.jsx("option",{value:"available",children:"Disponibles"}),r.jsx("option",{value:"assigned",children:"Assignes"}),r.jsx("option",{value:"used",children:"Utilises"})]})]})]})]}),L.length===0?r.jsxs("div",{className:"text-center py-12",children:[r.jsx(W,{className:"w-16 h-16 text-slate-300 mx-auto mb-4"}),r.jsx("p",{className:"text-slate-600",children:"Aucun bordereau trouve"}),r.jsx("p",{className:"text-sm text-slate-500 mt-1",children:"Generez vos premiers bordereaux pour commencer"})]}):r.jsxs("div",{className:"overflow-x-auto",children:[r.jsxs("table",{className:"w-full",children:[r.jsx("thead",{children:r.jsxs("tr",{className:"border-b border-slate-200",children:[r.jsx("th",{className:"text-left py-3 px-4 font-semibold text-slate-700",children:"Code"}),r.jsx("th",{className:"text-left py-3 px-4 font-semibold text-slate-700",children:"Statut"}),r.jsx("th",{className:"text-left py-3 px-4 font-semibold text-slate-700",children:"Date creation"}),r.jsx("th",{className:"text-center py-3 px-4 font-semibold text-slate-700",children:"Actions"})]})}),r.jsx("tbody",{children:L.slice(0,50).map(c=>r.jsxs("tr",{className:"border-b border-slate-100 hover:bg-slate-50",children:[r.jsx("td",{className:"py-3 px-4",children:r.jsx("code",{className:"font-mono text-sm bg-slate-100 px-2 py-1 rounded",children:c.bordereau_code})}),r.jsx("td",{className:"py-3 px-4",children:r.jsx("span",{className:`px-3 py-1 rounded-full text-xs font-medium ${c.status==="available"?"bg-emerald-100 text-emerald-700":c.status==="assigned"?"bg-amber-100 text-amber-700":"bg-sky-100 text-sky-700"}`,children:c.status==="available"?"Disponible":c.status==="assigned"?"Assigne":"Utilise"})}),r.jsx("td",{className:"py-3 px-4 text-sm text-slate-600",children:new Date(c.created_at).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"})}),r.jsx("td",{className:"py-3 px-4 text-center",children:r.jsx("button",{onClick:()=>N(c),className:"p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors",title:"Voir les details",children:r.jsx(Ee,{className:"w-5 h-5"})})})]},c.id))})]}),L.length>50&&r.jsxs("p",{className:"text-center text-sm text-slate-500 py-4",children:["Affichage des 50 premiers sur ",L.length]})]})]}),u&&r.jsx("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4",children:r.jsxs("div",{className:"bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto",children:[r.jsxs("div",{className:"flex items-center justify-between p-4 border-b border-slate-200",children:[r.jsx("h3",{className:"text-lg font-semibold text-slate-900",children:"Détails du Bordereau"}),r.jsx("button",{onClick:()=>N(null),className:"p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors",children:r.jsx(xe,{className:"w-5 h-5"})})]}),r.jsxs("div",{className:"p-6",children:[r.jsxs("div",{className:"text-center mb-6",children:[r.jsx("p",{className:"text-sm text-slate-600 mb-2",children:"Code du bordereau"}),r.jsx("code",{className:"text-2xl font-mono font-bold bg-slate-100 px-4 py-2 rounded-lg",children:u.bordereau_code})]}),r.jsx("div",{className:"flex justify-center mb-6",children:r.jsxs("div",{className:"bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center",children:[r.jsx(ce,{value:`https://fawzyoth.github.io/Swapp-app/#/client/exchange/new?bordereau=${u.bordereau_code}`,size:180,level:"M"}),r.jsx("p",{className:"text-sm text-blue-700 mt-3 font-medium",children:"Scanner pour initier l'échange"}),r.jsx("p",{className:"text-xs text-slate-500 mt-1 break-all",children:u.bordereau_code})]})}),r.jsxs("div",{className:"flex items-center justify-center gap-2 mb-6",children:[r.jsx("span",{className:"text-sm text-slate-600",children:"Statut:"}),r.jsx("span",{className:`px-3 py-1 rounded-full text-sm font-medium ${u.status==="available"?"bg-emerald-100 text-emerald-700":u.status==="assigned"?"bg-amber-100 text-amber-700":"bg-sky-100 text-sky-700"}`,children:u.status==="available"?"Disponible":u.status==="assigned"?"Assigné":"Utilisé"})]}),r.jsxs("div",{className:"bg-slate-50 rounded-lg p-4 text-sm space-y-2",children:[r.jsxs("div",{className:"flex justify-between",children:[r.jsx("span",{className:"text-slate-600",children:"Créé le:"}),r.jsx("span",{className:"font-medium",children:new Date(u.created_at).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"})})]}),u.printed_at&&r.jsxs("div",{className:"flex justify-between",children:[r.jsx("span",{className:"text-slate-600",children:"Imprimé le:"}),r.jsx("span",{className:"font-medium",children:new Date(u.printed_at).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})})]}),u.assigned_at&&r.jsxs("div",{className:"flex justify-between",children:[r.jsx("span",{className:"text-slate-600",children:"Assigné le:"}),r.jsx("span",{className:"font-medium",children:new Date(u.assigned_at).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})})]})]}),r.jsxs("button",{onClick:()=>{k([u]),N(null)},className:"w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors",children:[r.jsx($,{className:"w-5 h-5"}),"Imprimer ce bordereau"]})]})]})})]})})}export{Ge as default};
