// interface IFormatInstruction {
//     type: "I",
//     rs: number,
//     rt: number,
//     immediate: number,
// }

// interface RFormatInstruction {
//     type: "R",
//     rs: number,
//     rt: number,
//     rd: number,
// }

// type Instruction = IFormatInstruction | RFormatInstruction;
const registerNames = ['zero', 'at', 'v0', 'v1', 'a0', 'a1', 'a2', 'a3', 't0', 't1', 't2', 't3', 't4', 't5', 't6', 't7', 's0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 't8', 't9', 'k0', 'k1', 'gp', 'sp', 'fp', 'ra'];

export interface Instruction {
    raw_instruction: string,
    inputRegisters: Array<number>
    outputRegister: number | null
}

function registerToNumber(rawRegister: string): number {
    for (let i = 0; i < registerNames.length; i++) {
        if (rawRegister.toLowerCase().startsWith(registerNames[i])) {
            return i;
        }
    }

    return parseInt(rawRegister);
}

export function parseInstructions(text_instructions: string[]): Instruction[] {
    let instructionList: Instruction[] = [];

    for (let line of text_instructions) {
        let splitLine = line.split("$");
        let registerCount = splitLine.length - 1;

        let instruction: Instruction;
        switch (registerCount) {
            case 2: // I-Format
                if (splitLine[0] === "sw ") { // Special store word case
                    instruction = {
                        raw_instruction: line,
                        inputRegisters: [registerToNumber(splitLine[1]), registerToNumber(splitLine[2])], // depends on rt and rs
                        outputRegister: null
                    }
                } else {
                    instruction = {
                        raw_instruction: line,
                        inputRegisters: [registerToNumber(splitLine[2])], // rs
                        outputRegister: registerToNumber(splitLine[1]) // rt
                    }
                }
                break;
            case 3: // R-Format
                instruction = {
                    raw_instruction: line,
                    inputRegisters: [registerToNumber(splitLine[2]), registerToNumber(splitLine[3])], // rs and rt
                    outputRegister: registerToNumber(splitLine[1]) // rd
                }
                break;
            default:
                throw new Error(`Instruction "${line}" invalid.`);
        }

        instructionList.push(instruction);
    }

    return instructionList;
}