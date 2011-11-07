/**
 * A function to overlay a dynamically created baseline grid
 * on a webpage.
 *
 * @version 0.9.5
 * @author John Keyes <john@keyes.ie>
 * @copyright Copyright (c) 2011, John Keyes
 * @link https://github.com/jkeyes/baseline
 * @license http://jkeyes.mit-license.org/
 *
 */

/*** Start PNGlib ***/

/**
* A handy class to calculate color values.
*
* @version 1.0
* @author Robert Eisele <robert@xarg.org>
* @copyright Copyright (c) 2010, Robert Eisele
* @link http://www.xarg.org/2010/03/generate-client-side-png-files-using-javascript/
* @license http://www.opensource.org/licenses/bsd-license.php BSD License
*
*/

(function() {

	// helper functions for that ctx
	function write(buffer, offs) {
		for (var i = 2; i < arguments.length; i++) {
			for (var j = 0; j < arguments[i].length; j++) {
				buffer[offs++] = arguments[i].charAt(j);
			}
		}
	}

	function byte2(w) {
		return String.fromCharCode((w >> 8) & 255, w & 255);
	}

	function byte4(w) {
		return String.fromCharCode((w >> 24) & 255, (w >> 16) & 255, (w >> 8) & 255, w & 255);
	}

	function byte2lsb(w) {
		return String.fromCharCode(w & 255, (w >> 8) & 255);
	}

	window.PNGlib = function(width,height,depth) {

		this.width   = width;
		this.height  = height;
		this.depth   = depth;

		// pixel data and row filter identifier size
		this.pix_size = height * (width + 1);

		// deflate header, pix_size, block headers, adler32 checksum
		this.data_size = 2 + this.pix_size + 5 * Math.floor((0xfffe + this.pix_size) / 0xffff) + 4;

		// offsets and sizes of Png chunks
		this.ihdr_offs = 0;									// IHDR offset and size
		this.ihdr_size = 4 + 4 + 13 + 4;
		this.plte_offs = this.ihdr_offs + this.ihdr_size;	// PLTE offset and size
		this.plte_size = 4 + 4 + 3 * depth + 4;
		this.trns_offs = this.plte_offs + this.plte_size;	// tRNS offset and size
		this.trns_size = 4 + 4 + depth + 4;
		this.idat_offs = this.trns_offs + this.trns_size;	// IDAT offset and size
		this.idat_size = 4 + 4 + this.data_size + 4;
		this.iend_offs = this.idat_offs + this.idat_size;	// IEND offset and size
		this.iend_size = 4 + 4 + 4;
		this.buffer_size  = this.iend_offs + this.iend_size;	// total PNG size

		this.buffer  = new Array();
		this.palette = new Object();
		this.pindex  = 0;

		var _crc32 = new Array();

		// initialize buffer with zero bytes
		for (var i = 0; i < this.buffer_size; i++) {
			this.buffer[i] = "\x00";
		}

		// initialize non-zero elements
		write(this.buffer, this.ihdr_offs, byte4(this.ihdr_size - 12), 'IHDR', byte4(width), byte4(height), "\x08\x03");
		write(this.buffer, this.plte_offs, byte4(this.plte_size - 12), 'PLTE');
		write(this.buffer, this.trns_offs, byte4(this.trns_size - 12), 'tRNS');
		write(this.buffer, this.idat_offs, byte4(this.idat_size - 12), 'IDAT');
		write(this.buffer, this.iend_offs, byte4(this.iend_size - 12), 'IEND');

		// initialize deflate header
		var header = ((8 + (7 << 4)) << 8) | (3 << 6);
		header+= 31 - (header % 31);

		write(this.buffer, this.idat_offs + 8, byte2(header));

		// initialize deflate block headers
		for (var i = 0; (i << 16) - 1 < this.pix_size; i++) {
			var size, bits;
			if (i + 0xffff < this.pix_size) {
				size = 0xffff;
				bits = "\x00";
			} else {
				size = this.pix_size - (i << 16) - i;
				bits = "\x01";
			}
			write(this.buffer, this.idat_offs + 8 + 2 + (i << 16) + (i << 2), bits, byte2lsb(size), byte2lsb(~size));
		}

		/* Create crc32 lookup table */
		for (var i = 0; i < 256; i++) {
			var c = i;
			for (var j = 0; j < 8; j++) {
				if (c & 1) {
					c = -306674912 ^ ((c >> 1) & 0x7fffffff);
				} else {
					c = (c >> 1) & 0x7fffffff;
				}
			}
			_crc32[i] = c;
		}

		// compute the index into a png for a given pixel
		this.index = function(x,y) {
			var i = y * (this.width + 1) + x + 1;
			var j = this.idat_offs + 8 + 2 + 5 * Math.floor((i / 0xffff) + 1) + i;
			return j;
		}

		// convert a color and build up the palette
		this.color = function(red, green, blue, alpha) {

			alpha = alpha >= 0 ? alpha : 255;
			var color = (((((alpha << 8) | red) << 8) | green) << 8) | blue;

			if (typeof this.palette[color] == "undefined") {
				if (this.pindex == this.depth) return "\x00";

				var ndx = this.plte_offs + 8 + 3 * this.pindex;

				this.buffer[ndx + 0] = String.fromCharCode(red);
				this.buffer[ndx + 1] = String.fromCharCode(green);
				this.buffer[ndx + 2] = String.fromCharCode(blue);
				this.buffer[this.trns_offs+8+this.pindex] = String.fromCharCode(alpha);

				this.palette[color] = String.fromCharCode(this.pindex++);
			}
			return this.palette[color];
		}

		// output a PNG string, Base64 encoded
		this.getBase64 = function() {

			var s = this.getDump();

			var ch = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
			var c1, c2, c3, e1, e2, e3, e4;
			var l = s.length;
			var i = 0;
			var r = "";

			do {
				c1 = s.charCodeAt(i);
				e1 = c1 >> 2;
				c2 = s.charCodeAt(i+1);
				e2 = ((c1 & 3) << 4) | (c2 >> 4);
				c3 = s.charCodeAt(i+2);
				if (l < i+2) { e3 = 64; } else { e3 = ((c2 & 0xf) << 2) | (c3 >> 6); }
				if (l < i+3) { e4 = 64; } else { e4 = c3 & 0x3f; }
				r+= ch.charAt(e1) + ch.charAt(e2) + ch.charAt(e3) + ch.charAt(e4);
			} while ((i+= 3) < l);
			return r;
		}

		// output a PNG string
		this.getDump = function() {

			// compute adler32 of output pixels + row filter bytes
			var BASE = 65521; /* largest prime smaller than 65536 */
			var NMAX = 5552;  /* NMAX is the largest n such that 255n(n+1)/2 + (n+1)(BASE-1) <= 2^32-1 */
			var s1 = 1;
			var s2 = 0;
			var n = NMAX;

			for (var y = 0; y < this.height; y++) {
				for (var x = -1; x < this.width; x++) {
					s1+= this.buffer[this.index(x, y)].charCodeAt(0);
					s2+= s1;
					if ((n-= 1) == 0) {
						s1%= BASE;
						s2%= BASE;
						n = NMAX;
					}
				}
			}
			s1%= BASE;
			s2%= BASE;
			write(this.buffer, this.idat_offs + this.idat_size - 8, byte4((s2 << 16) | s1));

			// compute crc32 of the PNG chunks
			function crc32(png, offs, size) {
				var crc = -1;
				for (var i = 4; i < size-4; i += 1) {
					crc = _crc32[(crc ^ png[offs+i].charCodeAt(0)) & 0xff] ^ ((crc >> 8) & 0x00ffffff);
				}
				write(png, offs+size-4, byte4(crc ^ -1));
			}

			crc32(this.buffer, this.ihdr_offs, this.ihdr_size);
			crc32(this.buffer, this.plte_offs, this.plte_size);
			crc32(this.buffer, this.trns_offs, this.trns_size);
			crc32(this.buffer, this.idat_offs, this.idat_size);
			crc32(this.buffer, this.iend_offs, this.iend_size);

			// convert PNG to string
			return "\211PNG\r\n\032\n"+this.buffer.join('');
		}
	}

})();

/*** End PNGlib ***/

var merge = function(src, dest) {
  for (prop in src) { 
    if (prop in dest) { continue; }
    dest[prop] = src[prop];
  }
}

/* From: http://www.javascripter.net/faq/browserw.htm */
var windowDimensions = function() {
  var winW = 630, winH = 460;
  if (document.body && document.body.offsetWidth) {
    winW = document.body.offsetWidth;
    winH = document.body.offsetHeight;
  }
  if (document.compatMode=='CSS1Compat' &&
    document.documentElement &&
    document.documentElement.offsetWidth ) {
      winW = document.documentElement.offsetWidth;
      winH = document.documentElement.offsetHeight;
  }
  if (window.innerWidth && window.innerHeight) {
    winW = window.innerWidth;
    winH = window.innerHeight;
  }

  return [winW, winH];
}

/* From jQuery: dimensions.js */
function getDimenson(elem, name) {
    return Math.max(
				elem.documentElement["client" + name],
				elem.body["scroll" + name], elem.documentElement["scroll" + name],
				elem.body["offset" + name], elem.documentElement["offset" + name]
			);
}

/**
 * Baseliner.
 */

var Baseliner = function(options) {
  var defaults = {
    'gridColor': [255, 0, 0, 64],
    'gridHeight': 10
  }
  if (options == null) {
    options = {};
  } else {
    var optint = parseInt(options);
    if (optint != 0 && !isNaN(optint) ) {
      options = { 'gridHeight': optint };
    }
  }
  merge(defaults, options);
  this.opts = options;
  
  var baseliner = this;
  this.overlay_id = 'baseline-overlay'
  this.overlay = null;
  this.gridHeight = this.opts.gridHeight;
  this.showText = document.createTextNode("Show Baseline");
  this.hideText = document.createTextNode("Hide Baseline");

  this.resize = function() {
    if (!this.overlay) return;

    width = windowDimensions()[0]; //(window, "Width");
    height = getDimenson(document, "Height");
    
    this.overlay.style.width = width + "px";
    this.overlay.style.height = height + "px";
  }
  this.create = function() {
    if (!this.overlay) {
      overlay = new PNGlib(1, this.gridHeight, 256);
      overlay.color(0, 0, 0, 0);
      overlay.buffer[overlay.index(0, this.gridHeight - 1)] = overlay.color.apply(overlay, this.opts.gridColor);
      base64_overlay ='data:image/png;base64,' + overlay.getBase64();
      this.overlay = document.createElement('div');
      this.overlay.id = this.overlay_id;
      document.body.appendChild(this.overlay);
      this.overlay.style.backgroundImage = 'url(' + base64_overlay + ')';
      this.overlay.style.position = 'absolute';
      this.overlay.style.top = '0px';
      this.overlay.style.left = '0px';
      this.overlay.style.zIndex = '9998';
      this.resize()
    }
  }
  this.toggle = function(forced) {
    if (!this.overlay) { 
      this.create();
    }
    if (forced || this.overlay.style.display != 'block') {
      if (this.showText.parentNode) {
        this.overlay_it.replaceChild(this.hideText, this.showText);
      }
      this.overlay.style.display = 'block';
    } else {
      if (this.hideText.parentNode) {
        this.overlay_it.replaceChild(this.showText, this.hideText);
      }
      this.overlay.style.display = 'none';
    }
  }
  this.refresh = function(value) {
    var value = parseInt(value);
    if (value == 0 || isNaN(value)) {
      this.value = baseliner.gridHeight;
      baseliner.grid_size.style.backgroundColor = "red";
      baseliner.grid_size.style.color = "white";
      return;
    }
    baseliner.grid_size.style.backgroundColor = "white";
    baseliner.grid_size.style.color = "black";
    if (baseliner.overlay) {
      document.body.removeChild(baseliner.overlay);
      baseliner.overlay = null;
    }
    baseliner.gridHeight = value;
    baseliner.toggle(true);
  }

  init = function() {
    switch(baseliner.opts.gridColor) {
      case 'green':
        baseliner.opts.gridColor = [0, 0xFF, 0, 255]; break;
      case 'blue':
        baseliner.opts.gridColor = [0, 0, 0xFF, 255]; break;
      case 'red':
        baseliner.opts.gridColor = [0xFF, 0, 0, 255]; break;
      case 'grey':
      case 'gray':
        baseliner.opts.gridColor = [0, 0, 0, 64]; break;
    }

    var overlay_it = document.createElement('a');
    overlay_it.setAttribute('href', '');
    overlay_it.style.color = '#EEE';
    overlay_it.style.marginRight = '12px';
    overlay_it.appendChild(baseliner.showText);
    
    overlay_it.onclick = function(evt) {
      if (!evt) var evt = window.event;
      baseliner.toggle();
	    evt.cancelBubble = true;
	    if (evt.stopPropagation) {
	      evt.stopPropagation();
	      evt.preventDefault();
	    }
	    return false;
    }
    baseliner.overlay_it = overlay_it;
    
    var grid_size = document.createElement('input');
    grid_size.setAttribute('size', '3');
    grid_size.setAttribute('value', '' + baseliner.gridHeight);
    grid_size.setAttribute('type', 'number');
    grid_size.style.textAlign = 'center';
    grid_size.style.border = '1px solid #CCC';
    grid_size.style.padding = '3px';
    baseliner.grid_size = grid_size;
    
    var action = document.createElement('div');
    action.id = 'overlay-it';
    action.style.display = 'block';
    action.style.width = '200px';
    action.style.position = 'fixed';
    action.style.left = '50%';
    action.style.bottom = '-1px';
    action.style.margin = '0 0 0 -100px';
    action.style.padding = '10px 0';
    action.style.fontFamily = 'Arial, sans-serif';
    action.style.fontSize = '12px';
    action.style.fontWeight = 'bold';
    action.style.textAlign = 'center';
    action.style.backgroundColor = '#333';
    action.style.color = '#EEE';
    action.style.zIndex = '9999';
    
    action.appendChild(overlay_it);
    action.appendChild(grid_size);
    document.body.appendChild(action);
    
    grid_size.onchange = function() {
      baseliner.refresh(this.value);
    }
    var timer;
    grid_size.onkeyup = function() {
      window.clearTimeout(timer);
      timer = window.setTimeout(function() { baseliner.refresh(grid_size.value); }, 400);
    }

    document.body.appendChild(action);
    window.onresize = function() {
      baseliner.resize();
    };
    document.onkeyup = function(event) {
        var keyCode;

        if (window.event) {
          keyCode = event.keyCode;
        } else if (event.which) {
          keyCode = event.which;
        }

        if (keyCode == 27) {
          baseliner.toggle();
        }
      };
  }
  init();
}

