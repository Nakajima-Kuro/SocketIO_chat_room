class AudioElement{
    constructor(src, isLoop){
        this.audioElement = document.createElement('audio');
        this.audioElement.setAttribute('src', src);
        if(isLoop == true){
            this.audioElement.addEventListener('ended', function() {
                this.play();
            }, false);
        }
    }
    play(){
        this.audioElement.play();
    }
    pause(){
        this.audioElement.pause();
    }
    restart(){
        this.audioElement.currentTime = 0;
    }
    stop(){
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
    }
}

//Message Notification
var messageNoti = new AudioElement('assets/sounds/message_noti.ogg')

//Get call ringing
var getCallRing = new AudioElement('assets/sounds/getcall.ogg', true)

//Calling
var callingSound = new AudioElement('assets/sounds/calling.ogg', true)

//Hang up
var hangupSound = new AudioElement('assets/sounds/silience.ogg', true)