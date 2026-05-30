const { execSync } = require('child_process');
try {
  const result = execSync('npm run build', { encoding: 'utf-8', stdio: 'pipe' });
  console.log("BUILD SUCCESSFUL");
} catch (error) {
  console.log("BUILD FAILED");
  console.log(error.stdout);
  console.log(error.stderr);
}
