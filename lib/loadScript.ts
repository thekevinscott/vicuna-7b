export function loadScript(url: string) {
  const scriptEle = document.createElement("script");
  scriptEle.setAttribute("src", url);
  scriptEle.setAttribute("type", "text/javascript");
  document.body.appendChild(scriptEle);
}
