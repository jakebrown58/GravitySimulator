GravitySimulator
================

## Demo

See a live example on JS Fiddle:  http://jsfiddle.net/uSJbm/15/

## About

This was heavily inspired by PlayfulJS - you should check it out - it's a lot of fun.

This is a simulator that has basic gravity equations.  It's configured with realistic mass and distnace values for our solar system, which I got from wikipedia.

It also has a bunch of random celestial bodies, like comets and asteriods, and a cloud of space junk around Jupiter.

## Instructions

Download the repo locally however you like - and open up particles.html in a browser.  
It doesn't require a server or any libraries.


## Keyboard Actions

Spacebar - toggles 'tracing' on or off.  with this on, you can make some awesome spyrographs.
* click - does a special action.  default is 'focus' where it'll center the view on the nearest thing to what you clicked.  there are some other good ones - explore to find out.
* 'm'  - changes what clicking does.  Try out 'rocket', or 'destroy'.  Default is follow.
* '<' and '>' - zoom in and out. 
* 'z' / 'x' - speed up or slow down the simulation.
* 'h' - returns the viewport to the home zoom level centered on the sun.
* 'f' - shifts which celestial body is fixed as the center of the view. 
* 'c' - gives you some metadata, like the size of your viewport, the time per tick, and how long it's been running.





There are more, but those are the big ones.....

