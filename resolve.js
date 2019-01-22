#!/usr/bin/env node

'use strict';

const YAML = require('js-yaml');
const path = require('path');
const fs = require('fs');
const jp = require('jsonpath');

const program = require('commander');

program
    .version('1.0.1')
    .option('-o --output-format [output]',
        'output format. Choices are "json" and "yaml"',
        'json')
    .option('-s --split-format [split]',
        'split format. Specify comma separated JSONPath',
        '$.paths.*,$.components.schemas.*')
    .usage('[options] <yaml file> <target file>')
    .parse(process.argv);

if (program.outputFormat !== 'json' && program.outputFormat !== 'yaml') {
    console.error(program.help());
    process.exit(1);
}

const inputFile = program.args[0];
const outputFile = program.args[1];

if (!fs.existsSync(inputFile)) {
    console.error('File does not exist. (' + inputFile + ')');
    process.exit(1);
}

const root = YAML.safeLoad(fs.readFileSync(inputFile).toString());
const jsonPaths = program.splitFormat.split(",");

function mkdirp(dir) {
    if (!fs.existsSync(dir)) {
        if (path.basename(dir) === '.') {
            dir = path.dirname(dir);
        }
        mkdirp(path.dirname(dir));
        fs.mkdirSync(dir);
    }
}

function output(targetPath, object, outputFormat) {
    mkdirp(path.dirname(targetPath))
    if (outputFormat === 'yaml') {
        fs.writeFileSync(targetPath, YAML.safeDump(object));
    } else if (outputFormat === 'json') {
        fs.writeFileSync(targetPath, JSON.stringify(object, null, 2));
    }
}

jsonPaths.forEach(jsonPath => {
    jp.paths(root, jsonPath).forEach(pathArray => {
        const pathString = jp.stringify(pathArray);
        const pathContainsSlash = pathArray.some((elem) => elem.includes('/'));
        const refPath = pathString
            .replace(/\./g, '/')
            .replace(/[{}\[\]"]/g, '')
            .replace('$', '.')
            .replace(/$/, pathContainsSlash ? '/index.yaml' : '.yaml');
        const refObj = jp.value(root, pathString);
        const exactRefPath = outputFile + '/' + refPath;
        output(path.dirname(outputFile) + '/' + refPath, refObj, program.outputFormat);
        jp.value(root, pathString, {"$ref": refPath});
    });
});

output(outputFile, root, program.outputFormat);
