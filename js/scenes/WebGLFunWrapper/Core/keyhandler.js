//-------------------------------------KeyManager--Begin------------
function KeyManager()
{
    this.Left=new Boolean();
    this.Right=new Boolean();
    this.Up=new Boolean();
    this.Down=new Boolean();
    this.Q=new Boolean();
    this.E=new Boolean();
    this.SPACE=new Boolean();
    this.init = function()
    {
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));

        this.Left=false;
        this.Right=false;
        this.Up=false;
        this.Down=false;
        this.Q=false;
        this.E=false;
        this.SPACE=false;
    };
    this.onKeyUp = function(event)
    {
        if(event.keyCode == 37||event.keyCode == 65) 
            this.Left=false;
        else if(event.keyCode == 39||event.keyCode == 68) 
            this.Right=false;
        else if(event.keyCode == 38||event.keyCode == 87)
            this.Up=false;
        else if(event.keyCode == 40||event.keyCode == 83)
            this.Down=false;
        else if(event.keyCode == 81)
            this.Q=false;
        else if(event.keyCode == 69)
            this.E=false;
        else if(event.keyCode == 32)
            this.SPACE=false;
    };
    this.onKeyDown = function(event)
    {    
        if(event.keyCode == 37||event.keyCode == 65) 
            this.Left=true;
        else if(event.keyCode == 39||event.keyCode == 68) 
            this.Right=true;
        else if(event.keyCode == 38||event.keyCode == 87)
            this.Up=true;
        else if(event.keyCode == 40||event.keyCode == 83)
            this.Down=true;
        else if(event.keyCode == 81)
            this.Q=true;
        else if(event.keyCode == 69)
            this.E=true;
        else if(event.keyCode == 32)
            this.SPACE=true;
    };
}
var key = null;
function initControllManager(dok)
{
};
//-------------------------------------KeyManager--End------------
