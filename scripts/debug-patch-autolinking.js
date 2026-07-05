const fs = require('fs');

const file =
  'node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-plugin/src/main/kotlin/expo/modules/plugin/ExpoAutolinkingPlugin.kt';

let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'spec.workingDir(nodeWorkingDir)',
  'spec.workingDir(nodeWorkingDir)\n        spec.isIgnoreExitValue = true'
);

content = content.replace(
  '}.standardOutput.asText.get()',
  [
    '}.let { r ->',
    '        println("===DEBUG_STDOUT_START===")',
    '        println(r.standardOutput.asText.get())',
    '        println("===DEBUG_STDOUT_END===")',
    '        println("===DEBUG_STDERR_START===")',
    '        println(r.standardError.asText.get())',
    '        println("===DEBUG_STDERR_END===")',
    '        println("===DEBUG_EXITVALUE===")',
    '        println(r.result.get().exitValue)',
    '    }',
  ].join('\n')
);

fs.writeFileSync(file, content);
console.log('--- patched file ---');
console.log(content);
