import png
from django.http import HttpResponse
from operator import truediv

def _color(color):
    if color < 0:
        color = 0
    elif color > 255:
        color = 255
    return color

def overlay(request):
    height = int(request.GET.get('height', 10))
    if height > 500:
        height = 500
    r = _color(int(request.GET.get('r', 255)))
    g = _color(int(request.GET.get('g', 0)))
    b = _color(int(request.GET.get('b', 0)))
    a = _color(int(request.GET.get('a', 255)))

    s = ['1']
    for i in range(height - 1):
        s.insert(0, '0')

    palette = [ (0,0,0,0), (r,g,b,a) ]

    response = HttpResponse(mimetype="image/png")
    w = png.Writer(1, height, palette=palette, bitdepth=1)
    w.write(response, s)
    return response
