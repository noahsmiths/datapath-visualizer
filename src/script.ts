import { parseInstructions, Instruction } from "./util/InstructionParser";

const instructionInput = document.getElementById("instructions") as HTMLTextAreaElement;
const loadInstructionsButton = document.getElementById("load-instructions-btn");
const runSingleClockCycleButton = document.getElementById("run-single-clock-cycle-btn");

loadInstructionsButton?.addEventListener("click", loadInstructions);
runSingleClockCycleButton?.addEventListener("click", () => {
    runSingleClockCycle();
    updateDisplay();
});

interface StageState {
    instruction: Instruction,
    color: string | null
}

const hazardCount: Array<number> = new Array(32).fill(0);
let instructionList: Array<Instruction> = [];
const dataPathState: Array<StageState | null> = new Array(5).fill(null);

function loadInstructions() {
    try {
        let splitInputList = instructionInput.value.split("\n").map(el => el.trim()).filter(el => el !== "");
        let parsedInstructionList = parseInstructions(splitInputList);
        instructionList = parsedInstructionList;
    } catch (err) {
        alert(err);
        console.error(err);
    }
}

const NOP: Instruction = {
    raw_instruction: "NOP",
    inputRegisters: [],
    outputRegister: null
}

function runSingleClockCycle() {
    let registerToFree = dataPathState[4]?.instruction.outputRegister;

    // Memory -> Writeback
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
            if (dataPathState[1].instruction.outputRegister) {
                hazardCount[dataPathState[1].instruction.outputRegister] += 1;
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

    if (Number.isInteger(registerToFree)) {
        hazardCount[registerToFree as number] -= 1;
    }
}

let availableColors = ["red", "blue", "green", "orange", "purple"];
let colorIndex = -1;
function getColor() {
    colorIndex = (colorIndex + 1) % availableColors.length;
    return availableColors[colorIndex];
}

function updateDisplay() {
    for (let i = 0; i < dataPathState.length; i++) {
        const state = dataPathState[i];
        const color = state?.color || "unset";
        const text = state?.instruction.raw_instruction || "";

        (document.getElementById(`${i}-text`) as HTMLElement).innerText = text;
        (document.getElementById(`${i}-text`) as HTMLElement).style.color = color;
        (document.getElementById(`${i}-highlight`) as HTMLElement).style.backgroundColor = color;
    }
}