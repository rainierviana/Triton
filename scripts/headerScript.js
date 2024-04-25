window.onscroll = function() {fixedTopNavigation()};

var header = document.getElementById("fixedTopNavigation");
var sticky = header.offsetTop;

function fixedTopNavigation() {
  if (window.pageYOffset > sticky) {
    header.classList.add("sticky");
  } else {
    header.classList.remove("sticky");
  }
}