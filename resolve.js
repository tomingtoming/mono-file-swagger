#!/usr/bin/env node

'use strict';

const YAML = require('js-yaml');
const fs = require('fs');
const jp = require('jsonpath');

const program = require('commander');

program
    .version('0.0.1')
    .option('-o --output-format [output]',
        'output format. Choices are "json" and "yaml"',
        'json')
    .option('-s --split-format [split]',
        'split format. Specify comma separated JSONPath',
        '$.paths.*,$.components.schemas.*')
    .usage('[options] <yaml file> <target directory>')
    .parse(process.argv);

if (program.outputFormat !== 'json' && program.outputFormat !== 'yaml') {
    console.error(program.help());
    process.exit(1);
}

const file = program.args[0];

if (!fs.existsSync(file)) {
    console.error('File does not exist. (' + file + ')');
    process.exit(1);
}

const directory = program.args[1];

if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
}

const root = YAML.safeLoad(fs.readFileSync(file).toString());
const jsonPaths = program.splitFormat.split(",");

function resolve(root, jsonPaths) {
    jsonPaths.forEach(jsonPath => {
        jp.paths(root, jsonPath).forEach(pathArray => {
            const path = jp.stringify(pathArray);
            const withSlash = pathArray.some((elem) => elem.includes('/'));
            const refKey = path
                .replace(/\./g, '/')
                .replace(/[{}\[\]"]/g, '')
                .replace('$', '.')
                .replace(/$/, withSlash ? '/index.yaml' : '.yaml');
            const refObj = jp.value(root, path);
            jp.value(root, path, {"$ref": refKey});
        });
    });
    return root;
}

const index = resolve(root, jsonPaths);
if (program.outputFormat === 'yaml') {
    fs.writeFileSync(directory + '/index.yaml', YAML.safeDump(index));
} else if (program.outputFormat === 'json') {
    fs.writeFileSync(directory + '/index.yaml', JSON.stringify(index, null, 2));
}
