(function(){
var n=5;
function loadPart(i){
  return fetch("app.p"+i+".b64").then(function(r){return r.text();});
}
function b64ToU8(s){
  var bin=atob(s); var u=new Uint8Array(bin.length);
  for(var i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i);
  return u;
}
Promise.all(Array.from({length:n},function(_,i){return loadPart(i);})).then(function(parts){
  var b64=parts.join("");
  return new Response(new Blob([b64ToU8(b64)]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
}).then(function(buf){
  var code=new TextDecoder().decode(buf);
  var s=document.createElement("script");
  s.text=code;
  document.body.appendChild(s);
}).catch(function(e){
  console.error(e);
  alert("خطا در بارگذاری برنامه");
});
})();
