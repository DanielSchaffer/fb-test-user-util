var args = process.argv.splice(2);
var options = {};

for (var i = 0; i < args.length; i += 2) {
    options[args[i]] = args.length >= i + 2 ? args[i + 1] : undefined;
}

try {
    require('./testUserUtil').run(options);
} catch (ex) {
    console.error('error:', ex, ex.stack);
}