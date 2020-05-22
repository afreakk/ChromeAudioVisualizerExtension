# AudioVisualizer
♬♫♪◖(●。●)◗♪♫♬ put on some music and turn your browsing session into a party! ┐(・。・┐) ♪  
by pressing the av icon or default hotkey: 'Ctrl+Q'  
install from the [Chrome webstore](https://chrome.google.com/webstore/detail/audiovisualizer/bojhikphaecldnbdekplmadjkflgbkfh)  
or git clone & [install the unpacked extension](http://superuser.com/a/247654)  
if you want to contribute, contact me: laderud(a-t)hotmail.com, for an explanation of the code :)

To create your own scene from scratch, copy js/scenes/genericScene.js, to js/scenes/yourSceneName.js, search for and replace "GenericScene" with scene name of your chosing. Also set this.name = 'YourSceneName' where it says SpectrumAnalyziz. (this is the displayed name).    
You also need to add the JavaScript file to scriptsToInject.js in the AV.scripts.scenes array.   
Then do you own thing inside the update method, (all scenes within the AudioScenes namespace will automatically get picked up by SceneManager, so you should see it in the extension scene dropdown list) g.ctx is the canvas context, and g.byteFrequency is the spectrum data you can use to move thing around the scene.

If you want to use WebGL, look at worldScene.js for inspiration, (the simple SpinningCube scene).   
When done, I can merge your scene into the extension :)

### Credits to [jberg](https://github.com/jberg) for [butterchurn](https://github.com/jberg/butterchurn) (milkdrop scenes)
