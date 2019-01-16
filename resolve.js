#!/usr/bin/env node

'use strict';

var YAML = require('js-yaml');
var fs = require('fs');
var jp = require('jsonpath');

var program = require('commander');

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

var file = program.args[0];

if (!fs.existsSync(file)) {
  console.error('File does not exist. ('+file+')');
  process.exit(1);
}

var directory = program.args[1];

if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
}

var root = YAML.safeLoad(fs.readFileSync(file).toString());
var jsonPaths = program.splitFormat.split(",");


var a = (root, jsonPaths) => {
    return root;
};

var index = a(root, jsonPaths);
if (program.outputFormat === 'yaml') {
  fs.writeFileSync(directory + '/index.yaml', YAML.safeDump(index));
} else if (program.outputFormat === 'json') {
  fs.writeFileSync(directory + '/index.yaml', JSON.stringify(index, null, 2));
}
