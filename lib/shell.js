var shellJs = {}

shellJs.init = function (display, afterExit, userCommands, noClear, exitShortcut) {
  shellJs.display = display;
  shellJs.width = display.width;
  shellJs.height = display.height;
  shellJs.halfWidth = shellJs.width * 0.5;
  shellJs.halfHeight = shellJs.height * 0.5;
  shellJs.txtOffset = 50;
  shellJs.lineHeight = 10;
  shellJs.buffer = "";
  
  shellJs.ctx = display.getContext('2d');
  display.focus();
  shellJs.eventListener = display;
  shellJs.eventListener.addEventListener('keydown', shellJs.onKeyDown);
  shellJs.render();
  shellJs.afterExit = afterExit;
  shellJs.shouldRender = true;
  shellJs.noClear = noClear || false;
  shellJs.userCommands = userCommands;

  shellJs.commands = shellJs.reservedCommands.slice(0); // start with a copy of the default commands
  shellJs.exitShortcut = exitShortcut || { keyCode: 27, displayText: "ESC key" };
  shellJs.commands.push(
    {command: shellJs.exitShortcut.displayText, description: "immediate exit", fn: shellJs.onExit});

  if(shellJs.userCommands)
    shellJs.commands = shellJs.commands.concat(shellJs.userCommands);
};

shellJs.render = function() {
  shellJs.ctx.clearRect(0, 10, shellJs.width, 60);
  shellJs.ctx.beginPath();
  shellJs.ctx.strokeStyle = "#00FF00";
  shellJs.ctx.fillStyle = shellJs.ctx.strokeStyle;
  shellJs.ctx.fill();
  shellJs.appendLine(shellJs.cmdPrompt + shellJs.buffer + "_");
  shellJs.ctx.stroke();        
}

shellJs.onKeyDown = function(e) {
  var prop = true;
  var code = e.keyCode;

  //console.log(code);

  if (code === 13) {    // enter
    shellJs.prev.push(shellJs.buffer);
    shellJs.prevInx = shellJs.prev.length;
    shellJs.processCommand();
    shellJs.buffer = "";
  } else if (code === 16) { // shift
    // nothing - dump it
  } else if (code === 38) { // up
    shellJs.prevInx = shellJs.prevInx === 0 ? 0 : shellJs.prevInx - 1;
    shellJs.buffer = shellJs.prev[shellJs.prevInx];
  } else if (code === shellJs.exitShortcut.keyCode) { // ` or ~
    shellJs.onExit();
  } else if (code === 8) { // backspace
    shellJs.buffer = shellJs.buffer.substr(0, shellJs.buffer.length - 1);
    prop = false;
  } else {
    shellJs.buffer += String.fromCharCode(code);
  }

  if(shellJs.shouldRender) {
    shellJs.render();
  }

  if(!prop) {
    e.preventDefault();
    return false;
  }
}

shellJs.processCommand = function() {
  var x = 0,
    found = false,
    splat = shellJs.buffer.toLowerCase().split(' '),
    args = splat.length > 0 ? splat.slice(1, splat.length) : null;

  if(!shellJs.noClear) {
    shellJs.clearScreen();
  }
  if(splat.length > 0) {
    for(x = 0; x < shellJs.commands.length; x++) {
      if(splat[0] === shellJs.commands[x].command.toLowerCase() ) {
        shellJs.commands[x].fn.apply(this, args);
        return;
      }
    }
  }


  shellJs.ctx.fillText("Unknown command ... try typing HELP", 10, 100);
}

shellJs.appendLine = function(txt) {
  shellJs.ctx.fillText(txt, 10, shellJs.txtOffset);
};

shellJs.clearScreen = function() {
  shellJs.ctx.clearRect(0, 10, shellJs.width, shellJs.height);
}

shellJs.onHelpCommand = function() {
  var startY = 100,
    x,
    txt;

  for(x = 0; x < shellJs.commands.length; x++) {
    txt = shellJs.commands[x].command.toUpperCase() + " :  " + shellJs.commands[x].description;
    shellJs.ctx.fillText(txt, 10, startY + x * 10);
  }
}

var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
var ARGUMENT_NAMES = /([^\s,]+)/g;

// shellJs.onArgsCommand = function() {
//   //cmdP.ctx.fillText("HELP", 10, 100);
//   var startY = 100,
//     x,
//     txt;

//   for(x = 0; x < cmdP.commands.length; x++) {
//     txt = cmdP.commands[x].command.toUpperCase() + " :  " + cmdP.commands[x].description;
// //+ " ... arguments: " + getParamNames(cmdP.commands[x].fn) + " ... body: " + cmdP.commands[x].fn.toString()          
//     cmdP.ctx.fillText(txt, 10, startY + x * 10);
//   }
// }

shellJs.getParamNames = function(func) {
  var fnStr = func.toString().replace(STRIP_COMMENTS, '');
  var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
  if(result === null)
     result = [];
  return result;
}      


shellJs.onClearCommand = function() {
  shellJs.clearScreen();
}

shellJs.onExit = function() {
  shellJs.shouldRender = false;
  shellJs.buffer = "";
  shellJs.eventListener.removeEventListener('keydown', shellJs.onKeyDown);
  if(!shellJs.noClear) {
    shellJs.clearScreen();
  }
  
  shellJs.afterExit();
}


shellJs.reservedCommands = [
  {command: "help", description: "find out commands", fn: shellJs.onHelpCommand},
  {command: "clear", description: "clear the screen", fn: shellJs.onClearCommand},
  {command: "exit", description: "exit command mode", fn: shellJs.onExit}
];

shellJs.display;
shellJs.cmdPrompt = "> ";
shellJs.prevInx = 0;
shellJs.prev = [];
shellJs.buffer = "";
shellJs.shouldRender = true;

