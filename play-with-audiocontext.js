const AudioContex = window.AudioContext || window.webkitAudioContext;
if (!AudioContex) {
    const errorText = "Your browser isn't compatible with AudioContext..";
    window.alert(errorText);
    throw new Error(errorText);
}

let audioCtx = new AudioContex();
let allLines = [];

let noMove = false;
const canvasElem = document.getElementById('canvas');
canvasElem.height = window.innerHeight;
canvasElem.width = window.innerWidth;
window.resize = function() {
    canvasElem.height = window.innerHeight;
    canvasElem.width = window.innerWidth;
}
const canvasContext = canvasElem.getContext('2d');

let nodeList = [];

function createNode(name, nodeSettings, inputs, outputs, audioNode) {
    // Body
    const nodeId = nodeList.push({htmlNode: document.createElement('div')}) - 1;
    nodeList[nodeId].htmlNode.id = nodeId;
    nodeList[nodeId].htmlNode.classList.add('node');
    nodeList[nodeId].htmlNode.innerHTML = "<b>"+name+"</b><hr>"
    nodeList[nodeId].audioNode = audioNode;

    // Drag
    nodeList[nodeId].htmlNode.onmousedown = function(e) {
        if (noMove)
            return;
        e.preventDefault();
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = function() {
            document.onmouseup = null;
            document.onmousemove = null;
        };
        document.onmousemove = function(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            nodeList[nodeId].htmlNode.style.top = (nodeList[nodeId].htmlNode.offsetTop - pos2) + "px";
            nodeList[nodeId].htmlNode.style.left = (nodeList[nodeId].htmlNode.offsetLeft - pos1) + "px";
            nodeList[nodeId].htmlNode.style.right = "auto";
            allLines.forEach(elem => {
                if (!elem) return;
                if (elem.input == nodeId) {
                    elem.coords.x2 -= pos1;
                    elem.coords.y2 -= pos2;
                } else if (elem.output == nodeId) {
                    elem.coords.x1 -= pos1;
                    elem.coords.y1 -= pos2;
                }
            });
            drawLines();
        };
    };

    // Close Button
    let close = document.createElement('div');
    close.classList.add('close');
    close.innerText = "X";
    close.title = "Delete this node";
    close.onclick = function(e) {
        deleteNode(nodeId);
    };
    nodeList[nodeId].htmlNode.appendChild(close);

    // Inputs
    if (inputs == 1 || inputs == 2) {
        let input = document.createElement('div');
        input.classList.add('input');

        let inputDot = document.createElement('div');
        inputDot.classList.add('i-dot');
        inputDot.title = "link input"
        input.appendChild(inputDot);

        let inputImg = document.createElement('span');
        inputImg.innerText = "→";
        input.appendChild(inputImg);

        let inputSelect = document.createElement('span');
        inputSelect.classList.add('select');
        inputSelect.innerText = "x";
        inputDot.onmouseenter = function() {
            if (noMove)
                inputSelect.style.display = "block";
        }
        inputDot.onmouseleave = function() {
            inputSelect.style.display = "none";
        }
        inputDot.appendChild(inputSelect);

        nodeList[nodeId].htmlNode.appendChild(input);
    }

    // Outputs
    if (outputs == 1 || outputs == 2) {
        let output = document.createElement('div');
        output.classList.add('output');

        let outputImg = document.createElement('span');
        outputImg.innerText = "→";
        output.appendChild(outputImg);

        let outputDot = document.createElement('span');
        outputDot.classList.add('o-dot');
        outputDot.title = "link output";
        output.appendChild(outputDot);

        let outputSelect = document.createElement('span');
        outputSelect.classList.add('select');
        outputSelect.innerText = "x";
        outputDot.onmouseenter = function() {
            if (!noMove)
                outputSelect.style.display = "block";
        }
        outputDot.onmouseleave = function() {
            outputSelect.style.display = "none";
        }
        outputSelect.onmousedown = function(e) {
            e.preventDefault();
            noMove = true;
            const x1 = e.clientX - canvasElem.offsetLeft;
            const y1 = e.clientY - canvasElem.offsetTop;
            const lineId = allLines.push({
                coords: {x1: x1, y1: y1},
                output: nodeId
            }) - 1;
            document.onmousemove = function(e) {
                e.preventDefault();
                const x2 = e.clientX - canvasElem.offsetLeft;
                const y2 = e.clientY - canvasElem.offsetTop;
                allLines[lineId].coords.x2 = x2;
                allLines[lineId].coords.y2 = y2;
                drawLines();
            };
            document.onmouseup = function(e) {
                e.preventDefault();
                document.onmouseup = null;
                document.onmousemove = null;
                const pointedElem = document.elementFromPoint(e.clientX, e.clientY);
                if (pointedElem.classList.contains("select") && pointedElem.parentElement.classList.contains('i-dot') && pointedElem.parentElement.parentElement.parentElement.id != nodeId) {
                    allLines[lineId].input = pointedElem.parentElement.parentElement.parentElement.id;
                    if (nodeList[nodeId].audioNode && nodeList[allLines[lineId].input].audioNode)
                        nodeList[nodeId].audioNode.connect(nodeList[allLines[lineId].input].audioNode);
                } else {
                    allLines[lineId] = null;
                }
                drawLines();
                noMove = false;
            };
        };
        outputDot.appendChild(outputSelect);

        nodeList[nodeId].htmlNode.appendChild(output);
    }

    // Settings
    nodeSettings.forEach(element => {
        switch (element.type) {
            case "label":
                let label = document.createElement('div');
                label.innerText = element.name;

                element.func(label);

                nodeList[nodeId].htmlNode.appendChild(label);
                break;
            case "button":
                let button = document.createElement('button');
                button.innerText = element.name;

                element.func(button);

                nodeList[nodeId].htmlNode.appendChild(button);
                break;
            case "number":
                let numberDiv = document.createElement('div');
                let number = document.createElement('input');
                number.type = "number";
                number.min = element.min;
                number.max = element.max;
                number.value = element.actual;
                let numberMe = false;
                number.onmouseenter = function() {
                    if (!noMove) {
                        numberMe = true;
                        noMove = true;
                    }
                };
                number.onmouseleave = function() {
                    if (numberMe) {
                        noMove = false;
                        numberMe = false;
                    }
                }

                element.func(number);

                numberDiv.appendChild(number);
                let numberSubSpan = document.createElement('span');
                numberSubSpan.innerText = element.sub;
                numberDiv.appendChild(numberSubSpan);
                nodeList[nodeId].htmlNode.appendChild(numberDiv);
                break;
            case "slider":
                let sliderDiv = document.createElement('div');

                let slider = document.createElement('input');
                slider.type = "range";

                slider.min = element.min;
                slider.max = element.max;
                slider.value = element.actual;
                let sliderMe = false;
                slider.onmouseenter = function() {
                    if (!noMove) {
                        sliderMe = true;
                        noMove = true;
                    }
                };
                slider.onmouseleave = function() {
                    if (sliderMe) {
                        noMove = false;
                        sliderMe = false;
                    }
                }

                element.func(slider);

                sliderDiv.appendChild(slider);
                nodeList[nodeId].htmlNode.appendChild(sliderDiv);
                break;
            case "choice":
                let choicesDiv = document.createElement('div');
                const choiceId = Math.random();
                let radios = [];
                element.choices.forEach(ch => {
                    let choiceDiv = document.createElement('div');
                    let choice = document.createElement('input');
                    choice.type = 'radio';
                    choice.id = ch;
                    choice.name = choiceId;
                    choice.value = ch;
                    choiceDiv.appendChild(radios[radios.push(choice)-1]);
                    let labelChoice = document.createElement('label');
                    labelChoice.htmlFor = ch;
                    labelChoice.innerText = ch;
                    choiceDiv.appendChild(labelChoice);
                    choicesDiv.appendChild(choiceDiv);
                });
                choicesDiv.firstChild.firstChild.checked = true;
                element.func(radios);

                nodeList[nodeId].htmlNode.appendChild(choicesDiv);
                break;
            case "player":
                let playerFullDiv = document.createElement('div');
                let playerDiv = document.createElement('div');
                playerDiv.appendChild(element.player);
                playerFullDiv.appendChild(playerDiv);
                switch(element.canPlay) {
                    case "audio":
                        let audioDiv = document.createElement('div');
                        let audioInput = document.createElement("input");
                        audioInput.type = "file";
                        audioInput.accept = "audio/*";
                        audioInput.onchange = function() {
                            element.player.src = URL.createObjectURL(this.files[0]);
                        };
                        audioDiv.appendChild(audioInput);
                        playerFullDiv.appendChild(audioDiv);
                        break;
                    case "video":
                        let videoDiv = document.createElement('div');
                        let videoInput = document.createElement("input");
                        videoInput.type = "file";
                        videoInput.accept = "video/*";
                        videoInput.onchange = function() {
                            element.player.src = URL.createObjectURL(this.files[0]);
                        };
                        videoDiv.appendChild(videoInput);
                        playerFullDiv.appendChild(videoDiv);
                        break;
                }
                nodeList[nodeId].htmlNode.appendChild(playerFullDiv);
                break;
        }
    });

    document.body.appendChild(nodeList[nodeId].htmlNode);
    return nodeId;
}

function deleteNode(nodeId) {
    nodeList[nodeId].htmlNode.remove();
    if (nodeList[nodeId].audioNode) {
        nodeList[nodeId].audioNode.disconnect();
    }
    allLines.forEach((elem, index) => {
        if (elem) {
            if (elem.input == nodeId) {
                allLines[index] = null;
                if (elem.output) {
                    if (nodeList[elem.output].audioNode)
                        nodeList[elem.output].audioNode.disconnect(nodeList[nodeId].audioNode);
                }
            } else if (elem.output == nodeId) {
                allLines[index] = null;
            }
        }
    });
    nodeList[nodeId] = null;
    drawLines();
}

function reset() {
    nodeList.forEach(function(node, index) {
        if (node && index != 0) {
            deleteNode(index);
        }
    });
    nodeList = [];
    allLines = [];
}

function drawLines() {
    canvasContext.clearRect(0, 0, canvasElem.width, canvasElem.height);
    canvasContext.beginPath();
    if (dark) {
        canvasContext.fillStyle = "white";
        canvasContext.strokeStyle = "white";
    } else {
        canvasContext.fillStyle = "black";
        canvasContext.strokeStyle = "black";
    }
    allLines.forEach(e => {
        if (e && e.coords.y2) {
            canvasContext.moveTo(e.coords.x1, e.coords.y1);
            canvasContext.lineTo(e.coords.x2, e.coords.y2);
        }
    });
    canvasContext.stroke();
}

// Create Destination
const destinationNodeId = createNode("AudioContext Destination", [], 2);
nodeList[destinationNodeId].htmlNode.style.top = "20px";
nodeList[destinationNodeId].htmlNode.style.right = "20px";
nodeList[destinationNodeId].htmlNode.style.left = "auto";
nodeList[destinationNodeId].htmlNode.childNodes.forEach(child => {
    if (child.classList.contains('close')) {
        child.remove();
        return;
    }
});
nodeList[destinationNodeId].audioNode = audioCtx.destination;


/////////////////////////////////////////////////////
///////////////// Buttons functions /////////////////
/////////////////////////////////////////////////////

let dark = false;
function darkMode() {
    if (dark) {
        document.body.style.setProperty("--text-color", "black");
        document.body.style.setProperty("--border-color", "black");
        document.body.style.setProperty("--bg-color", "white");
        dark = false;
        document.getElementById('darkButton').innerText = "Black";
    } else {
        document.body.style.setProperty("--text-color", "white");
        document.body.style.setProperty("--border-color", "white");
        document.body.style.setProperty("--bg-color", "black");
        dark = true;
        document.getElementById('darkButton').innerText = "White";
    }
    drawLines();
}

function createGainNode() {
    let gain = audioCtx.createGain();
    let sliderInput = null;
    let numberInput = null;
    createNode("Gain", [
        {
            type: "label",
            name: "gain",
            func: function(label) {}
        },
        {
            type: "number",
            min: 0,
            max: 150,
            actual: 100,
            sub: "%",
            func: function(number) {
                numberInput = number;
                numberInput.onchange = function() {
                    gain.gain.value = this.value/100;
                    sliderInput.value = this.value;
                };
            }
        },
        {
            type: "slider",
            min: 0,
            max: 150,
            actual: 100,
            func: function(slider) {
                sliderInput = slider;
                sliderInput.oninput = function() {
                    gain.gain.value = this.value/100;
                    numberInput.value = this.value;
                };
            }
        }
    ], 2, 2, gain);
}

function createOscillatorNode() {
    let oscillator = audioCtx.createOscillator();
    let sliderInput = null;
    let numberInput = null;
    let detuneNumberInput = null;
    let detuneSliderInput = null;
    createNode("Oscillator", [
        {
            type: "label",
            name: "frequency",
            func: function(label) {}
        },
        {
            type: "number",
            min: 1,
            max: 20000,
            actual: 440,
            sub: "Hz",
            func: function(number) {
                numberInput = number;
                numberInput.onchange = function() {
                    oscillator.frequency.value = this.value;
                    sliderInput.value = this.value;
                };
            }
        },
        {
            type: "slider",
            min: 1,
            max: 20000,
            actual: 440,
            func: function(slider) {
                sliderInput = slider;
                sliderInput.oninput = function() {
                    numberInput.value = this.value;
                    oscillator.frequency.value = this.value;
                };
            }
        },
        {
            type: "label",
            name: "detune",
            func: function(label) {}
        },
        {
            type: "number",
            min: -200,
            max: 200,
            actual: 0,
            sub: "cents",
            func: function(number) {
                detuneNumberInput = number;
                detuneNumberInput.onchange = function() {
                    oscillator.detune.value = this.value;
                    detuneSliderInput.value = this.value;
                };
            }
        },
        {
            type: "slider",
            min: -200,
            max: 200,
            actual: 0,
            func: function(slider) {
                detuneSliderInput = slider;
                detuneSliderInput.oninput = function() {
                    detuneNumberInput.value = this.value;
                    oscillator.detune.value = this.value;
                };
            }
        },
        {
            type: "label",
            name: "type",
            func: function(label) {}
        },
        {
            type: "choice",
            choices: [
                "sine",
                "square",
                "sawtooth",
                "triangle"
            ],
            func: function(choices) {
                let prev = null;
                choices.forEach(radio => {
                    radio.onchange = function() {
                        if (this != prev) {
                            prev = this;
                            oscillator.type = this.value;
                        }
                    };
                });
            }
        },
        {
            type: "label",
            name: "---------------",
            func: function(label) {}
        },
        {
            type: "button",
            name: "start",
            func: function(button) {
                let started = false;
                button.onclick = function() {
                    if (started) {
                        oscillator.stop();
                        button.innerText = "start";
                        started = false;
                    } else {
                        oscillator.start();
                        button.innerText = "stop";
                        started = true;
                    }
                }
            }
        }
    ], 0, 1, oscillator);
}

function createStereoPannerNode() {
    let stereoPanner = audioCtx.createStereoPanner();
    let numberInput = null;
    let sliderInput = null;
    createNode("Stereo Panner", [
        {
            type: "label",
            name: "pan",
            func: function(label) {}
        },
        {
            type: "number",
            min: -100,
            max: 100,
            actual: 0,
            sub: "",
            func: function(number) {
                numberInput = number;
                numberInput.onchange = function() {
                    stereoPanner.pan.value = this.value/100;
                    sliderInput.value = this.value;
                };
            }
        },
        {
            type: "slider",
            min: -100,
            max: 100,
            actual: 0,
            func: function(slider) {
                sliderInput = slider;
                sliderInput.oninput = function() {
                    stereoPanner.pan.value = this.value/100;
                    numberInput.value = this.value;
                };
            }
        },
    ], 2, 2, stereoPanner);
}

function createMediaElementAudioSourceNode() {
    let audio = new Audio();
    audio.controls = true;
    let mediaElementAudioSource = audioCtx.createMediaElementSource(audio);
    createNode("Media Element Source (audio)", [
        {
            type: "player",
            player: audio,
            canPlay: "audio"
        }
    ], 0, 2, mediaElementAudioSource);
}

function createMediaElementVideoSourceNode() {
    let video = document.createElement('video');
    video.controls = true;
    let mediaElementVideoSource = audioCtx.createMediaElementSource(video);
    createNode("Media Element Source (video)", [
        {
            type: "player",
            player: video,
            canPlay: "video"
        }
    ], 0, 2, mediaElementVideoSource);
}

function createConstantSourceNode() {
    let constantSource = audioCtx.createConstantSource();
    let sliderInput = null;
    let numberInput = null;
    createNode("Constant Source", [
        {
            type: "label",
            name: "offset",
            func: function(label) {}
        },
        {
            type: "number",
            min: 0,
            max: 100,
            actual: 100,
            sub: "",
            func: function(number) {
                numberInput = number;
                numberInput.onchange = function() {
                    constantSource.offset.value = this.value/100;
                    sliderInput.value = this.value;
                };
            }
        },
        {
            type: "slider",
            min: 0,
            max: 100,
            actual: 100,
            func: function(slider) {
                sliderInput = slider;
                sliderInput.oninput = function() {
                    constantSource.offset.value = this.value/100;
                    numberInput.value = this.value;
                };
            }
        },
        {
            type: "button",
            name: "start",
            func: function(button) {
                let started = false;
                button.onclick = function() {
                    if (started) {
                        constantSource.stop();
                        button.innerText = "start";
                        started = false;
                    } else {
                        constantSource.start();
                        button.innerText = "stop";
                        started = true;
                    }
                }
            }
        }
    ], 0, 1, constantSource);
}
