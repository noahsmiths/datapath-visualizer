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

export interface Instruction {
    raw_instruction: string,
    inputRegisters: Array<number>
    outputRegister: number | null
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
                        inputRegisters: [parseInt(splitLine[1]), parseInt(splitLine[2])], // depends on both rs and rt
                        outputRegister: null
                    }
                } else {
                    instruction = {
                        raw_instruction: line,
                        inputRegisters: [parseInt(splitLine[2])], // rs
                        outputRegister: parseInt(splitLine[1]) // rt
                    }
                }
                break;
            case 3: // R-Format
                instruction = {
                    raw_instruction: line,
                    inputRegisters: [parseInt(splitLine[2]), parseInt(splitLine[3])], // rs and rt
                    outputRegister: parseInt(splitLine[1]) // rd
                }
                break;
            default:
                throw new Error(`Instruction "${line}" invalid.`);
        }

        instructionList.push(instruction);
    }

    return instructionList;
}