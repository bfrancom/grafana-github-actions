"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUpdater = void 0;
const fs_1 = __importDefault(require("fs"));
const lodash_1 = require("lodash");
const utils_1 = require("../common/utils");
const semver_1 = __importDefault(require("semver"));
class FileUpdater {
    constructor() {
        this.lines = [];
    }
    loadFile(filePath) {
        if (!fs_1.default.existsSync(filePath)) {
            throw new Error(`File not found ${filePath}`);
        }
        const fileContent = require('fs').readFileSync(filePath, 'utf-8');
        this.lines = utils_1.splitStringIntoLines(fileContent);
    }
    getLines() {
        return this.lines;
    }
    update({ version, content }) {
        const startMarker = new RegExp(`\<\!-- (.*) START`);
        const endMarker = new RegExp(`\<\!-- ${lodash_1.escapeRegExp(version)} END`);
        let startIndex = 0;
        let endIndex = 0;
        for (let lineIdx = 0; lineIdx < this.lines.length; lineIdx++) {
            const line = this.lines[lineIdx];
            const startMatches = startMarker.exec(line);
            if (startMatches) {
                if (startMatches[1] === version) {
                    startIndex = lineIdx + 1;
                }
                // check if our version is greater than are current position
                else if (semver_1.default.gt(version, startMatches[1])) {
                    startIndex = Math.max(lineIdx - 1, 0);
                    endIndex = Math.max(lineIdx - 1, 0);
                    break;
                }
            }
            if (endMarker.test(line)) {
                endIndex = lineIdx - 1;
                break;
            }
        }
        const newLines = utils_1.splitStringIntoLines(content);
        if (endIndex === startIndex) {
            // Insert new lines
            this.lines.splice(startIndex, 0, ...['', `<!-- ${version} START -->`, '', ...newLines, '', `<!-- ${version} END -->`]);
        }
        else {
            // remove the lines between the markers and add the updates lines
            this.lines.splice(startIndex, endIndex - startIndex, '', ...newLines);
        }
    }
    getContent() {
        return this.lines.join('\r\n');
    }
}
exports.FileUpdater = FileUpdater;
//# sourceMappingURL=FileUpdater.js.map