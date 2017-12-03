# AudioVisualizer
♬♫♪◖(●。●)◗♪♫♬ put on some music and turn your browsing session into a party! ┐(・。・┐) ♪  
by pressing the av icon or default-hotkey: 'ctrl+q'  
install from [chrome webstore](https://chrome.google.com/webstore/detail/audiovisualizer/bojhikphaecldnbdekplmadjkflgbkfh)  
or download zip & [install unpacked extension](http://superuser.com/a/247654)  
if you want to contribute, contact me: laderud(a-t)hotmail.com, for code explanation :)

* works on any website.
* choose among several scenes.
* share custom scenes using import and export scene. 

* toggle settings to get different effects.
  (drawmode, transparentbackground etc.)

* play around with scene settings to fundamentally change any scene.
  (scenes look pretty boring with default settings)

* save custom scene settings as stand-alone scenes.
 

note: this extension contains flickering effects.   

hotkeys: 
* ctrl+q - toggle visualizer on/off. 
* alt+q - open options. 

tips:
* under scene settings, hover mouse over the value you want to change, then drag mouse up/down while holding down left mouse button to increase/decrease value.

* example custom scene to import:  
https://gist.githubusercontent.com/afreakk/0ed8de8a7c0ff596854235f4347c6a26/raw/a10f5a44666629df06fab5365b6ae8aad2fd41e5/customscenes

* set latencyhint to interactive, it will make the spectrum analyzis more precise, but might trigger a bug where you get choppy sound.
in that case, set it back to 'playback'.



patch notes:   

5.2
- added option: 'latencyhint', default value is set to: 'playback'.
earlier we always used 'interactive', but that caused choppy sound on some browser versions.  
'playback' option is less precise than 'interactive', so if you dont have any choppy-issues with 'interactive', you should run 'interactive' :).

5.1
- added procedural-terrain scene !
5   
- added import and export custom scene, now you can share your scene with others!
4.500.1.5   
- webgl scenes added back.. seems chome has fixed it?   
4.500.1.4
- webgl scenes removed, chrome+contentscript+webgl,- somethings not working right.

4.500.1.3
- startupscene now working + optimization.

4.500.1
- drawmode should now work without transparentmode. (transparentmode will always be active in the background while drawmode is enabled(so the scene doesnt redraw its background))

4.500
- performance improvement, found a bug in code that resized the canvas each frame. drawmode is back and working (except for in opengl scenes: spinningcube, sinusmode and madness)
canvas is no longer following scrolling. 

4.420.9
- madness scene added :o

4.420.8
- stability and performance update and removed drawmode(was not working with newer chrome).

4.420.7.2
- canvas width will no longer make a vertical scrollbar, and canvas will now be locked to scroll height. (can make it an option, if anyone actually liked being able to scroll away from the canvas)

4.420.7
- new icon! :)

4.420.5-6
- new feature: drawmode (located under settings) for cool effects (does not work on hexagon, spinningcube or sinuscolormix)
- save scene bugfix

4.420.1-4
- bugfixes (context offset ++) new forked-scene (painscene from wormscene)
- added full-screen setting.

4.420
- two new scenes(dotsandlines and particlecircle), better options and options experience and general code improvements(hopefully).

4.20
- major bugfix regarding spectrum data, so everything is much better now.
  revamped some scenes, added webgl support and addeed 2 new webgl scenes.

3.52042
- fftsize added to options

3.420
- fleshed out options

2.43
- stability etc

2.41
- improved gui/options and errorhandling

2.37
- categorized gui + new scene "swipe"

2.36
- custom example included, changed some scenes(some earlier saves may break)

2.35:
- now you can save and load custom scenes, and view/delete them in extension options.
