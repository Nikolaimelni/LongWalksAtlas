// Inline script for "/": it runs while the HTML is still parsing, so the visitor goes
// straight to their language without a language list flashing first. Order: a choice
// made earlier in the switcher, then the browser's languages, then English. Kept in
// plain ES5-ish JS because it is inlined as a string, outside the bundle.
export function redirectScript(codes: readonly string[]): string {
	return `(function(codes){
function pick(){
try{var s=localStorage.getItem("lang");if(codes.indexOf(s)>=0)return s}catch(e){}
var wanted=navigator.languages||[navigator.language];
for(var i=0;i<wanted.length;i++){
try{var w=new Intl.Locale(wanted[i]).maximize();
for(var j=0;j<codes.length;j++){var o=new Intl.Locale(codes[j]).maximize();
if(o.language===w.language&&o.script===w.script)return codes[j]}}catch(e){}}
return "en"}
location.replace("/"+pick()+"/"+location.search+location.hash)
})(${JSON.stringify(codes)})`;
}
