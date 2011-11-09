# Using Baseliner

## Bookmarklet

Add this <a href="javascript:(function(){var _grid_height=10;if(window.baseliner){baseliner.toggle();}else{var _already_loaded=document.getElementById('baseliner-script');if(_already_loaded){return;};var _baseliner=document.createElement('script');_baseliner.id='baseliner-script';_baseliner.type='text/javascript';_baseliner.src='http://files.keyes.ie/baseliner-latest.min.js';document.getElementsByTagName('body')[0].appendChild(_baseliner);var loadFunction=function(evt){if(window.baseliner){return;};baseliner=new Baseliner(_grid_height);baseliner.toggle();};_baseliner.onreadystatechange=loadFunction;_baseliner.onload=loadFunction;};})();">bookmarklet</a> to use Baseliner on any webpage.

## Super-short Example
    <script src="baseliner.js"></script>
    <script>
    window.onload = function() {
        baseliner = new Baseliner(8);
    }
    </script>

This will add the [Baseliner](https://github.com/jkeyes/baseline/blob/master/baseliner/baseliner.js) widget to your page:

![Show Baseline](https://github.com/jkeyes/baseline/raw/master/baseliner/img/example_show.png)

If you click on Show Baseline an 8px baseline grid overlay is displayed:

![Hide Baseline](https://github.com/jkeyes/baseline/raw/master/baseliner/img/example_hide.png)

You can customize the size of the grid too:

![16px Baseline](https://github.com/jkeyes/baseline/raw/master/baseliner/img/example_16px.png)

## Configuration Options

Two configuration options are supported:

* `gridColor` — an RBGA array (`[255, 0, 0, 255]` for red) or a color string (`red`, `blue`, `green` or `grey`/`gray`). If this option is not set, it defaults to a highly transparent red.
* `gridHeight` — the height of the baseline grid. If it is not set, it defaults to 10 pixels.

## Some more examples

    // a black grid, 20 pixels high
    baseliner = new Baseliner({'gridColor': [0, 0, 0, 255], 'gridHeight': 20 });
    // a red grid, 10 pixels high
    baseliner = new Baseliner({'gridColor': 'red'});
    // a very faint grey grid, 8 pixels high
