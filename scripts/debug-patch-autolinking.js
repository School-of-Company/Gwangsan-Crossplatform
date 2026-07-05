const fs = require('fs');

const file =
  'node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-plugin/src/main/kotlin/expo/modules/plugin/ExpoAutolinkingPlugin.kt';

let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'val watchedDirectoriesSerialized = project.findProperty("expo.inlineModules.watchedDirectories") ?: emptyList<String>()',
  [
    'val watchedDirectoriesRaw = project.findProperty("expo.inlineModules.watchedDirectories")',
    '    println("===DEBUG_RAW_CLASS===")',
    '    println(watchedDirectoriesRaw?.javaClass?.name)',
    '    println("===DEBUG_RAW_VALUE_START===")',
    '    println(watchedDirectoriesRaw)',
    '    println("===DEBUG_RAW_VALUE_END===")',
    '    val watchedDirectoriesSerialized = watchedDirectoriesRaw ?: emptyList<String>()',
  ].join('\n')
);

content = content.replace(
  'spec.workingDir(nodeWorkingDir)',
  'spec.workingDir(nodeWorkingDir)\n        spec.isIgnoreExitValue = true'
);

content = content.replace(
  '}.standardOutput.asText.get()',
  [
    '}.let { r ->',
    '        println("===DEBUG_STDERR_START===")',
    '        println(r.standardError.asText.get())',
    '        println("===DEBUG_STDERR_END===")',
    '    }',
  ].join('\n')
);

fs.writeFileSync(file, content);
console.log('--- patched file ---');
console.log(content);
