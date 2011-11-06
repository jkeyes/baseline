javascript:(function(){
  if (window.baseliner) {
    baseliner.toggle();
  } else {
    var _baseliner=document.createElement('script');
    _baseliner.type='text/javascript';
    _baseliner.src='https://github.com/downloads/jkeyes/baseline/baseliner-latest.min.js';
    document.getElementsByTagName('head')[0].appendChild(_baseliner);
    var loadFunction = function() {
      baseliner = new Baseliner();
      baseliner.toggle();
    };
    _baseliner.onload = loadFunction;
    _baseliner.onreadystatechange = loadFunction;
  }
})();