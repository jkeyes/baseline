javascript:(function(){
  var _grid_height = 10;
  if (window.baseliner) {
    baseliner.toggle();
  } else {
    var _already_loaded = document.getElementById('baseliner-script');
    if (_already_loaded) {
      return;
    };
    var _baseliner=document.createElement('script');
    _baseliner.id='baseliner-script';
    _baseliner.type='text/javascript';
    _baseliner.src='http://files.keyes.ie/things/baseliner/baseliner-latest.min.js';
    document.getElementsByTagName('body')[0].appendChild(_baseliner);
    var loadFunction = function(evt) {
      if (window.baseliner) {
        return;
      };
      baseliner = new Baseliner(_grid_height);
      baseliner.toggle();
    };
    _baseliner.onreadystatechange = loadFunction;
    _baseliner.onload = loadFunction;
  };
})();