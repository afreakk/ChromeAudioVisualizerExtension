# AudioVisualizer
♬♫♪◖(●。●)◗♪♫♬ put on some music and turn your browsing session into a party! ┐(・。・┐) ♪  
by pressing the av icon or default-hotkey: 'ctrl+q'  
install from [chrome webstore](https://chrome.google.com/webstore/detail/audiovisualizer/bojhikphaecldnbdekplmadjkflgbkfh)  
or download zip & [install unpacked extension](http://superuser.com/a/247654)  
if you want to contribute, contact me: laderud(a-t)hotmail.com, for code explanation :)

To create your own scene from scratch, just copy js/scenes/genericScene.js, to js/scenes/yourSceneName.js, and search and replace GenericScene with scene name of ur chosing. Also set this.name = 'YourSceneName' where it says SpectrumAnalyziz. (this is the display name).    
Then just do you own thing inside update method, (all scenes within AudioScenes namespace will automatically get picked up by SceneManager so you should see it in the extension scene dropdown list) g.ctx is the canvas context, and g.byteFrequency is the spectrum data you can use to move thing around the scene.

If you want to use webgl, you can look at worldScene.js, (that is the simple SpinningCube scene).   
When your done, I can merge ur scene into the extension :)
