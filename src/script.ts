import { parseInstructions, Instruction } from "./util/InstructionParser";
import DatapathNoHazards from "./assets/datapath.png";
import DatapathWithHazards from "./assets/datapath_hazards.png";

const instructionInput = document.getElementById("instructions") as HTMLTextAreaElement;
const loadInstructionsButton = document.getElementById("load-instructions-btn");
const runSingleClockCycleButton = document.getElementById("run-single-clock-cycle-btn");
const toggleViewButton = document.getElementById("toggle-view-btn");
const toggleForwardingButton = document.getElementById("toggle-forwarding-btn");
const forwardingStatus = document.getElementById("forwarding-status") as HTMLElement;
const diagramBody = document.getElementById("diagram-body") as HTMLElement;
const diagramCountHeader = document.getElementById("diagram-count") as HTMLElement;
const diagramHeaderDefault = document.getElementById("diagram-header-default-template") as HTMLTemplateElement;
const pipelineContainer = document.getElementById("pipeline-container");
const diagramContainer = document.getElementById("diagram-container");

const datapathImage = document.getElementById("datapath-image") as HTMLImageElement;
const fetchStage = document.getElementById("fetch-stage") as HTMLElement;
const decodeStage = document.getElementById("decode-stage") as HTMLElement;
const executeStage = document.getElementById("execute-stage") as HTMLElement;
const memoryStage = document.getElementById("memory-stage") as HTMLElement;
const writebackStage = document.getElementById("writeback-stage") as HTMLElement;

loadInstructionsButton?.addEventListener("click", loadInstructions);
runSingleClockCycleButton?.addEventListener("click", () => {
    runSingleClockCycle();
    updateDisplay();
});
toggleViewButton?.addEventListener("click", () => {
    if (pipelineContainer?.classList.contains("hidden")) {
        pipelineContainer?.classList.remove("hidden");
        diagramContainer?.classList.add("hidden");
    } else {
        pipelineContainer?.classList.add("hidden");
        diagramContainer?.classList.remove("hidden");
    }
});
toggleForwardingButton?.addEventListener("click", () => {
    forwardingEnabled = !forwardingEnabled;
    forwardingStatus.innerText = forwardingEnabled ? "On" : "Off";

    if (forwardingEnabled) {
        datapathImage.src = DatapathWithHazards;

        fetchStage.style.left = "0%";
        fetchStage.style.width = "16.3%";
        decodeStage.style.left = "18.55%";
        decodeStage.style.width = "26.6%";
        executeStage.style.left = "47.4%";
        executeStage.style.width = "18.3%";
        memoryStage.style.left = "67.9%";
        memoryStage.style.width = "11.3%";
        writebackStage.style.left = "81.5%";
        writebackStage.style.width = "18.5%";
    } else {
        datapathImage.src = DatapathNoHazards;

        fetchStage.style.left = "0%";
        fetchStage.style.width = "23.7%";
        decodeStage.style.left = "26.7%";
        decodeStage.style.width = "16%";
        executeStage.style.left = "45.7%";
        executeStage.style.width = "13.8%";
        memoryStage.style.left = "62.6%";
        memoryStage.style.width = "15.1%";
        writebackStage.style.left = "80.75%";
        writebackStage.style.width = "19.25%";
    }
});

interface StageState {
    instruction: Instruction,
    color: string | null
}

let hazardCount: Array<number> = new Array(32).fill(0);
let instructionList: Array<Instruction> = [];
let dataPathState: Array<StageState | null> = new Array(5).fill(null);
const stageLabelMap = ["F", "D", "X", "M", "W"];

let instructionsProcessed = 0;
let cycleCount = 0;

let forwardingEnabled = false;

function loadInstructions() {
    try {
        let splitInputList = instructionInput.value.toLowerCase().split("\n").map(el => el.trim()).filter(el => el !== "");
        let parsedInstructionList = parseInstructions(splitInputList);
        instructionList = parsedInstructionList;
        hazardCount = new Array(32).fill(0);
        dataPathState = new Array(5).fill(null);
        instructionsProcessed = 0;
        cycleCount = 0;

        initializePipeline();
        initializeDiagram();

        alert("Program loaded!");
    } catch (err) {
        alert(err);
        console.error(err);
    }
}

function initializePipeline() {
    for (let i = 0; i < dataPathState.length; i++) {
        (document.getElementById(`${i}-text`) as HTMLElement).innerText = "";
        (document.getElementById(`${i}-text`) as HTMLElement).style.color = "unset";
        (document.getElementById(`${i}-highlight`) as HTMLElement).style.backgroundColor = "unset";
    }
}

function initializeDiagram() {
    diagramCountHeader.innerHTML = "";
    for (let child of diagramHeaderDefault.content.children) {
        diagramCountHeader.appendChild(child.cloneNode(true));
    }

    diagramBody.innerHTML = "";

    for (let i = 0; i < instructionList.length; i++) {
        let parent = document.createElement("tr");
        // parent.id = `${i}-row`;

        let instructionText = document.createElement("th");
        instructionText.innerText = instructionList[i].raw_instruction;

        parent.appendChild(instructionText);
        diagramBody?.appendChild(parent);
    }
}

const NOP: Instruction = {
    raw_instruction: "NOP",
    inputRegisters: [],
    outputRegister: null
}

function runSingleClockCycle() {
    let registerToFree = dataPathState[4]?.instruction.outputRegister;

    if (dataPathState[4] !== null && dataPathState[4].instruction !== NOP) {
        instructionsProcessed++;
    }

    // Clear Writeback Hazard
    if (Number.isInteger(dataPathState[4]?.instruction.outputRegister)) {
        hazardCount[dataPathState[4]?.instruction.outputRegister as number] -= 1;
    }

    // Memory -> Writeback
    if (forwardingEnabled && Number.isInteger(dataPathState[3]?.instruction.outputRegister)) {
        hazardCount[dataPathState[3]?.instruction.outputRegister as number] -= 1;
    }

    dataPathState[4] = dataPathState[3];

    // Execute -> Memory
    dataPathState[3] = dataPathState[2];

    if (dataPathState[1] !== null) {
        let includesInputHazards: boolean = dataPathState[1].instruction.inputRegisters.reduce((prev, el) => prev || (hazardCount[el] > 0), false);

        if (includesInputHazards) {
            dataPathState[2] = {
                instruction: NOP,
                color: null
            };
        } else {
            if (forwardingEnabled) {
                if (dataPathState[1].instruction.raw_instruction.startsWith("lw ")) {
                    hazardCount[dataPathState[1].instruction.outputRegister as number] += 1;
                }
            } else {
                if (dataPathState[1].instruction.outputRegister) {
                    hazardCount[dataPathState[1].instruction.outputRegister] += 1;
                }
            }

            dataPathState[2] = dataPathState[1];
            dataPathState[1] = dataPathState[0];
            dataPathState[0] = instructionList.length > 0 ? { instruction: instructionList.shift() as Instruction, color: getColor() } : null;
        }
    } else {
        dataPathState[2] = dataPathState[1];
        dataPathState[1] = dataPathState[0];
        dataPathState[0] = instructionList.length > 0 ? { instruction: instructionList.shift() as Instruction, color: getColor() } : null;
    }

    // if (!forwardingEnabled && Number.isInteger(registerToFree)) {
    //     hazardCount[registerToFree as number] -= 1;
    // }

    if (dataPathState.filter(el => el !== null).length > 0) {
        cycleCount++;
        console.log(cycleCount);
    } else {
        alert("Running complete");
    }
}

let availableColors = ["red", "blue", "green", "orange", "purple"];
let colorIndex = -1;
function getColor() {
    colorIndex = (colorIndex + 1) % availableColors.length;
    return availableColors[colorIndex];
}

function updateDisplay() {
    // Update colors on datapath
    for (let i = 0; i < dataPathState.length; i++) {
        const state = dataPathState[i];
        const color = state?.color || "unset";
        const text = state?.instruction.raw_instruction || "";

        (document.getElementById(`${i}-text`) as HTMLElement).innerText = text;
        (document.getElementById(`${i}-text`) as HTMLElement).style.color = color;
        (document.getElementById(`${i}-highlight`) as HTMLElement).style.backgroundColor = color;
    }

    if (diagramCountHeader.children.length - 2 < cycleCount) {
        let nextCount = document.createElement("th");
        nextCount.className = "w-12";
        nextCount.innerText = cycleCount.toString();

        console.log(diagramCountHeader.lastChild);

        diagramCountHeader.insertBefore(nextCount, diagramCountHeader.children[diagramCountHeader.children.length - 1]);
    }

    // Update Pipeline Diagram
    for (let i = 0; i < diagramBody.children.length; i++) {
        let cell = document.createElement("td");
        diagramBody.children[i].appendChild(cell);
    }

    let offset = instructionsProcessed;
    for (let i = dataPathState.length - 1; i >= 0; i--) {
        if (dataPathState[i] !== null && dataPathState[i]?.instruction !== NOP) {
            let cell = diagramBody.children[offset].lastChild as HTMLElement;
            cell.innerText = stageLabelMap[i];

            offset++;
        }
    }
}