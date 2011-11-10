# Using Baseliner

Create a baseliner:

    <script src="http://files.keyes.ie/baseliner-latest.min.js"></script>
    <script>
    window.onload = function() {
        baseliner = new Baseliner();
    }
    </script>

The default grid is 10 pixels high. To change this pass a height parameter:

    baseliner = new Baseliner(12);
    
The default grid color is grey. This can be changed too.

    baseliner = new Baseliner({ gridHeight: 12, gridColor: 'red' });
    
There are four supported color names: red, green, blue, black. Further customization is available by using an array to represent an rgb value:

    baseliner = new Baseliner({ gridColor: [255,60,60] });
    
If you'd like the grid to blend into the page you can customize the opacity of the overlay by specifying a percentage value:

    baseliner = new Baseliner({ gridOpacity: 50 });
    
Another way to make the grid blend into a design, is to specify the spacing between the grid pixels. This will create dotted lines instead of solid ones.

    baseliner = new Baseliner({ gridSpace: 5 });
    
The maximum spacing is 10 pixels.
